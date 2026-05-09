---
id: proving-backends
sidebar_position: 8
title: Proving backends and executors
description: How a guest program turns into a proof at the level of
  process and machine. The two backends (Embedded and Remote), the
  two executors (Rust and Assembly), how the assembly executor
  communicates with its host, and what each combination requires.
---

# Proving backends and executors

The previous page walked through the six developer-visible stages
of a proving run: compile, setup, execute, prove, verify, and the
optional Plonk wrap. Each stage has a clear input and a clear
output, but it does not say much about *where* the work runs or
*how* the host machine carries it out.

This page fills in that picture. There are two top-level **backends**
through which the SDK and CLI dispatch proving work: an in-process
backend and a network backend that delegates to a coordinator. Both
ultimately rely on an **executor** that runs the guest's RV64IMA
code on some host machine and records the trace the prover
consumes. Two executors are shipped: a portable Rust interpreter
and a hand-tuned x86-64 assembly emulator.

The set of choices that an SDK caller or a CLI user makes ends up
shaping a chain that looks like this:

![Diagram: ELF, then Embedded vs Remote backend, then Rust vs Assembly executor, then STARK prover with optional Plonk wrap, ending in a verifiable proof.](/diagrams/svgs/61-proving-backends-overview.svg)

Both backends produce byte-identical proofs for the same input.
The split exists because some teams prove locally on a single host
while others prove on a cluster of remote workers, and both
patterns need to be expressible without changing the guest, the
SDK calls, or the verifier.

## The two backends

A backend is the boundary between the application code that asks
for a proof and the machine that produces it. ZisK ships two of
them, and the choice is made when the prover client is built.

### Embedded

`ProverClient::embedded()` returns a builder that, after
`.build()`, gives back an `EmbeddedClient`. Every pipeline
operation it offers (upload, setup, execute, prove, wrap, and the
debug-only verify-constraints) runs in the same process as the
host program. There is no network, no coordinator, no worker
pool: the SDK calls the executor, the executor records the trace,
and the proving backend turns that trace into a proof, all inline.

This is the natural shape for development, CI, and any deployment
where one host has enough capacity to prove on its own. Because
everything runs in-process, the backend inherits the host's memory
and platform constraints, and it can offer one operation that the
network backend cannot: `verify_constraints`. That call runs the
AIR constraints against a freshly generated witness without
producing a proof, and it lives behind an extension trait that is
only implemented for `EmbeddedClient`. Importing the trait on a
`RemoteClient` is a compile-time error.

Inside the embedded backend, two further choices configure how
proving runs. The first is the **executor**, covered in the next
section. The second is the **compute device**, either CPU or GPU,
selected with `.gpu()` on the builder. The two choices are
independent.

### Remote

`ProverClient::remote(url)` returns a builder that, after
`.build()`, opens a gRPC channel to the URL and gives back a
`RemoteClient`. Every operation is dispatched as an RPC; the
coordinator on the other end accepts the job, schedules it across
the worker fleet, and streams progress events back over the same
channel.

A coordinator is the stateful core of a Remote deployment. It
listens on two gRPC ports: one for SDK clients (default `7000`)
and one for workers (default `50051`). It owns the job table, the
program cache, and the in-flight aggregation state, and there is
exactly one of it per cluster. Workers, in contrast, are
stateless across jobs. Each worker connects outbound to the
coordinator on startup, advertises its compute capacity, and
accepts work assignments.

When a Remote prove call arrives, the coordinator selects workers
proportional to their advertised capacity and assigns each a
**partition** of the total compute. Workers compute independently
on their partitions through the three coordinated phases that the
v0.17 `JobPhase` enum defines:

1. **Contributions.** Each worker computes the partial challenges
   for its partition.
2. **Prove.** Each worker generates the partial STARK proofs for
   its partition.
3. **Aggregate.** A designated worker combines all partial proofs
   into the final proof using the recursive aggregation tree.

A worker is itself a thin wrapper around an executor. The
distributed crate exposes `Worker<Emu>` and `Worker<Asm>`
typestates; each worker process is started in one mode and runs
that mode for its lifetime. So the executor split that the
embedded backend exposes directly is also present in remote
proving, just one layer down: the choice belongs to whoever runs
the worker host.

## The two executors

An executor runs the guest's RV64IMA code on some host machine
and produces the trace that the proving backend consumes. ZisK
ships two of them. They produce identical traces for the same
input, but they reach that result by very different paths: one
interprets every instruction in safe Rust, the other runs
hand-tuned x86 assembly in a forked subprocess. Both Embedded and
Remote rely on this split; the Embedded backend exposes the
choice directly, and a Remote worker is launched in one mode for
its lifetime.

The architectural differences between the two are summarised
below. The sections that follow fill in each one.

| Dimension      | Rust emulator                       | Assembly emulator                                    |
|----------------|-------------------------------------|------------------------------------------------------|
| Source         | `emulator/` (`Emu` struct)          | `emulator-asm/` plus `asm-runner/`                    |
| Language       | Safe Rust                            | x86-64 assembly with a thin C/C++ shell               |
| Process model  | In-process (same as host)            | Forked subprocess                                     |
| Inner loop     | Decode, dispatch, handler            | Native x86 instructions, no per-instruction decode    |
| Memory model   | Demand-paged (kernel manages)        | `mlock`ed (pinned in physical RAM)                    |
| Memory floor   | About 32 GB                          | About 64 GB                                           |
| Platform       | Any Rust target                      | Linux x86_64 only                                     |
| CLI default    | macOS, ARM, Windows                  | Linux x86_64                                          |
| SDK default    | Yes                                  | Opt-in via `.assembly()` on the embedded builder       |

### Rust emulator

The Rust emulator centres on a single struct, `Emu`. It owns the
program counter, the register file (memory-mapped at
`0xA000_0000`), the data memory regions, and a reference to the
loaded `ZiskRom`. Per execution step it fetches the instruction
at the current PC, decodes the opcode and the source and store
modes, resolves the operands `a` and `b`, dispatches to the
operation handler that produces `(c, flag)`, and updates the
destination according to the store mode before advancing the PC.
Every step records an `EmuTrace` row, and the downstream
`executor` crate folds those rows into per-chip traces that the
proving backend turns into witness columns.

The whole emulator runs in normal demand-paged memory. Pages can
swap, the kernel manages residency, and the floor for a typical
workload sits around 32 GB of physical RAM. This is the right
shape for laptops and dev machines, where the operating system is
actively juggling other processes and any single tenant cannot
reasonably claim a fixed slice of memory.

### Assembly emulator

The Assembly emulator is structurally different in two ways.
First, it is not a Rust binary that happens to be optimised: the
inner execution loop is hand-written x86-64 assembly. Second, it
does not run in the host process. The host forks a child, and
the child runs the assembly binary as its program. The Rust side
of the crate (`asm-runner/`) exposes three runner variants, each
of which shares the same architecture but splits the work
differently.

| Runner            | Role                                                                                                      |
|-------------------|-----------------------------------------------------------------------------------------------------------|
| `AsmRunnerMO`     | **Main-Only.** Single-process emulation; produces only the main execution trace. Simplest, cheapest.       |
| `AsmRunnerMT`     | **Multi-Trace.** Parallelises per-chip trace collection across worker threads inside the ASM binary.        |
| `AsmRunnerRH`     | **Rec-Hints.** Records hints for precompile-heavy guests so the prover can skip expensive witness work.    |

The choice between them is driven by what the proving backend
needs from this run. For ordinary prove calls, the embedded
backend selects the appropriate runner automatically.

Assembly pages are `mlock`ed into physical RAM. Nothing is
swapped out, nothing demand-paged, and the floor sits around
64 GB of physical RAM. The reason is in the section on memory
below. Because the binary itself is x86-64 assembly, there is no
portable form. On macOS, ARM, Windows, or any non-x86_64 Linux,
the `asm-runner` crate compiles to stubs (per the `#[cfg]` gates
in `asm-runner/src/lib.rs`) and the surrounding code falls back
to the Rust emulator automatically.

### Why Assembly is faster

Three effects compound to produce a 3 to 10 times speedup on
representative workloads. The first is that there is no
interpreter overhead. The Rust path pays a decode, a dispatch, a
Rust bounds check, and a match arm on the opcode for every single
guest instruction. The Assembly path executes the corresponding
x86 instruction more or less directly: a guest `add` becomes a
host `add`, a guest `xor` becomes a host `xor`, with no Rust
frame between them.

The second is that the Assembly emulator's inner loop is small
enough to fit comfortably in the host's L1 instruction cache. The
handful of dispatch branches it does have are taken millions of
times per second, so the host's branch predictor stays warm. This
is exactly the regime where modern CPUs are at their most
efficient.

The third is that guest data memory is one large mmap region.
Loads and stores are direct pointer dereferences from the
assembly side; there is no Rust slice abstraction, no bounds
check on every access, no method call. The speedup is widest for
compute-heavy guests with long arithmetic loops or heavy memory
traffic, and narrower for guests where the prover work itself
(rather than the emulator) is the bottleneck. Precompile-heavy
guests in particular often see smaller relative gains, which is
why the `RH` runner exists.

## How the Assembly emulator talks to the host

Because the Assembly emulator runs in a forked child process,
the host and the child have to communicate. The crate uses two
POSIX primitives that both processes can attach to: shared
memory and named semaphores. The Rust emulator runs in the same
process and needs neither, so this section is Assembly-specific.

Shared memory is provided by POSIX SHM regions that both sides
`mmap` by name. The regions persist for the lifetime of the
runner and are removed on cleanup. There are four of them, each
with a clear ownership pattern.

| Region            | Purpose                                                                                              |
|-------------------|------------------------------------------------------------------------------------------------------|
| Inputs region     | Host writes the `ZiskStdin` payload here before signalling start.                                     |
| Outputs region    | Child writes public outputs and exit status here when the run is done.                                |
| Hints region      | For `AsmRunnerRH`, host streams hints in; child reads them on demand.                                  |
| Control region    | Small struct: program counter, exit code, error flags, run statistics.                                |

Named semaphores (via the `named-sem` crate) provide the barrier
signalling that the two sides use to coordinate. The host signals
"inputs ready"; the child signals "done"; each side `sem_wait`s
on the next event it cares about.

```text
inputs_ready  : host  → child   "input region populated, you can start"
outputs_ready : child → host    "intermediate output available"
done          : child → host    "execution complete, reap me"
```

The lifecycle of one prove call ties shared memory and
semaphores together. The host first calls `fork()`, and the
child `exec`s the precompiled Assembly binary. Both sides then
open the named semaphores and `mmap` the SHM regions by name.
The host writes the `ZiskStdin` payload into the inputs region
and `sem_post`s `inputs_ready`. The child wakes, runs the guest
to completion in tight assembly, writes its outputs into the
outputs region, and `sem_post`s `done`. The host wakes in turn,
reads the outputs, hands them and the trace to the proving
backend, and reaps the child.

All of this is Linux x86_64 specific. POSIX SHM and named
semaphores in this exact flavour are not the standard fabric on
macOS or Windows, and the assembly binary itself is a Linux ELF.
Neither half ports cleanly.

![Diagram: top panel shows host process and forked ASM child sharing four shared-memory regions and three named semaphores; bottom panel sequences one prove call through fork, input handshake, guest execution in isolation, output handshake, and proof return.](/diagrams/svgs/62-proving-backends-asm-ipc.svg)

## Memory and platform

The 32 GB and 64 GB floors of the two executors are not
arbitrary; they fall out of how each one uses memory. The Rust
emulator runs in demand-paged memory. The kernel can swap unused
regions out, page in regions on access, and rebalance residency
under pressure. A 32 GB working set is fine, and the kernel
handles the rest.

The Assembly emulator runs over `mlock`ed pages. The pages it
touches are pinned into physical RAM and cannot be swapped or
evicted. There are two reasons for this. First, the hot inner
loop touches guest memory at random offsets driven by the guest's
behaviour. A page fault during the loop costs thousands of cycles
and stalls the branch predictor on the way back; across millions
of instructions, even a small fault rate destroys the speedup.
Second, the Assembly code does no syscalls during execution, so
it cannot tolerate the kernel transparently faulting a page in
mid-loop.

Pinning the pages eliminates both problems but raises the floor.
Operationally, the Assembly emulator wants around 64 GB of
*actually free* RAM (not committed by other processes) at the
time the prover starts. Below that, the runner either fails to
`mlock` or thrashes badly. The CLI's `-u` flag (`--unlock-mapped-memory`)
unlocks the SHM ranges as a partial mitigation: it gives some
pages back at a small cost in throughput. If the host does not
have the headroom, the Rust emulator is the right answer. The
proof is identical, only proving time changes.

The platform restriction follows the same logic. Because the
inner loop is hand-written x86 assembly, the binary has no
portable form. macOS, ARM, Windows, and any non-x86_64 Linux fall
through to the Rust emulator at compile time, and there is no
plan to ship platform-specific assembly variants. Remote proving
sidesteps this for end users: a developer on macOS can still
drive a coordinator-and-worker cluster running Linux x86_64
hosts.

## Picking a backend and an executor

The CLI and the SDK each pick defaults, and the defaults differ
because they target different audiences. `cargo-zisk` assumes the
local host. It picks the Embedded backend implicitly, and then
chooses an executor: Assembly on Linux x86_64, Rust everywhere
else. Two flags override that choice.

| Flag                            | Effect                                                                                       |
|---------------------------------|----------------------------------------------------------------------------------------------|
| `-l` / `--emulator`             | Force the Rust emulator. Useful for debugging or when the ASM memory floor is not met.         |
| `-u` / `--unlock-mapped-memory` | Run the Assembly emulator without `mlock`ing SHM ranges. Slower but saves memory.              |

The CLI does not currently expose Remote proving; for cluster
proving, drive the SDK directly. The SDK exposes both backends
explicitly, and the choice is made when the client is built:

```rust
// Embedded, Rust emulator (SDK default)
let client = ProverClient::embedded().build()?;

// Embedded, Assembly emulator (Linux x86_64 only)
let client = ProverClient::embedded().assembly().build()?;

// Remote, dispatching to a coordinator over gRPC
let client = ProverClient::remote("http://coordinator:7000").build()?;
```

The SDK chose the Rust emulator as the embedded default because
it has no view of the caller's available RAM, deployment shape,
or platform. A program written against the SDK can run on a
developer laptop today and a 64 GB Linux server tomorrow with
zero source changes; only the chain on the builder needs to flip.
`ProverClient` itself is a singleton: the second call to either
factory in the same process panics, so wrap the resulting client
in an `Arc` if multiple tasks need to share it.

macOS is uniformly served by the Rust emulator on Embedded, and
there is no Assembly path on Darwin. Remote proving works fine
from macOS because the heavy work runs on the cluster's Linux
x86_64 hosts.

## Where this picks up

You now have the full picture of how a proof gets generated, both
in process and across a cluster, and which executor sits
underneath in each case. Next steps depend on what you are doing
next:

- **Drive proving from Rust:** start with
  [Choosing a prover client](/developer/proving-programs/prover-client),
  which surfaces these same choices at the SDK level.
- **Set up a Linux host for Assembly proving:** see
  [Install on Linux](/developer/getting-started/install-linux) for
  the toolchain and the system requirements.
- **Develop on macOS:** see
  [Install on macOS](/developer/getting-started/install-macos),
  which routes everything through the Rust emulator on Embedded.
- **Operate a coordinator and worker fleet:** the prover section
  starts with
  [Understanding distributed proving](/prover/getting-started/understanding-distributed-proving)
  and continues through architecture, deployment, and monitoring.
