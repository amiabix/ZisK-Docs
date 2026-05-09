---
id: overview
sidebar_position: 1
title: Overview
description: A bird's-eye view of how a Rust program becomes a
  ZisK proof, with the rest of the section breaking each piece
  down at an approachable level.
---

# Overview

This section walks the whole ZisK pipeline at an overview
level, without the formal definitions or the deep mechanics.

Each page links to the
[Deep understanding](/intro/deep/isa) section for the details
when you want them.

## The whole picture in one diagram

From source code to verified proof, here's everything that
happens:

![Whole picture: source → ELF → proving key, host → guest → trace, per-segment STARK proofs → aggregation tree → root proof → verifier](/diagrams/svgs/02-overview-whole-picture.svg)

A reader who knows just the high-level shape of this diagram can
follow conversations about ZisK, read a host program, and reason
about what kind of computation it can prove.

A reader who wants
to know *how* each arrow works in detail goes into the
[Deep understanding](/intro/deep/isa) section.

## ZisK from the outside in

This section pins down what a ZisK system looks like end to end. It is the chain of artifacts that takes a Rust program from source code to a proof.

### The toolchain

ZisK ships its own Rust toolchain. It is essentially the standard
Rust toolchain with a small set of customisations, most notably
the ROM and RAM address ranges the linker uses for ZisK's address
space. You invoke it through `cargo-zisk build --release` from any
ordinary Rust project. The output is an ELF file under
`target/elf/riscv64ima-zisk-zkvm-elf/release/<program>`.

That ELF is an **RV64IMA** binary: 64-bit registers and operations,
32-bit instruction encoding, plus the standard I (base integer), M
(multiply/divide), and A (atomic) extensions. ZisK additionally
accepts the F/D (floating-point, via a software library, slow)
and C (compressed, no proving impact) extensions to accommodate
compilers beyond Rust.

![Toolchain: Rust program → RISC-V ELF → ZisK ROM → trace + STARK proofs](/diagrams/svgs/03-overview-toolchain.svg)

### Standard ISA at the contract, custom machine underneath

The ELF format and the RV64IMA instruction semantics are inherited
from RISC-V, which is optimized for execution on physical silicon.
ZisK reuses that contract so the standard Rust toolchain produces
binaries that load directly. The machine that actually runs those
instructions, however, is structured around the requirements of a
STARK proving trace, not a CPU pipeline.

The biggest single difference is in the register model. RISC-V has
**32 general-purpose 64-bit registers** that any instruction can
freely use as operands or destinations. ZisK has **four**:
`a`, `b`, `c`, `flag`. Every instruction has the rigid shape
`(c, flag) = op(a, b)`. The 32 RISC-V registers themselves live
memory-mapped at the start of ZisK's RAM, and ZisK adds a few
"source" and "store" modes (read/write a RISC-V register, indirect
through `a + offset`, etc.) so any RISC-V access pattern can be
expressed.

The point of that change is to make every row of the proving
trace look identical in shape, which simplifies the constraint
system. The four-register model, the source/store modes, the
`copyb` shim that bridges the two register conventions, and the
address-map regions are documented on the
[ISA](/intro/deep/isa) and
[processor](/intro/deep/processor) pages in the *Deep
understanding* section.

### Two ways to run a guest

A compiled ELF can be executed in two different emulators that
produce identical results but trade speed against memory footprint:

- **Assembly emulator:** generated per-program, runs on shared
  memory locked into physical RAM. It is the default path for the
  CLI on Linux and is the fast path for large proofs, with a 64 GB
  physical-memory floor.
- **Rust emulator (`ziskemu`):** interpreted, slower, and uses
  far less memory (32 GB floor). Useful for debugging,
  profiling, or constrained hardware.

`cargo-zisk` picks the Assembly emulator by default on Linux. The
`-l` flag switches to the Rust emulator and `-u` unlocks the
Assembly emulator's shared memory at some cost to speed. On macOS,
the current CLI forces the Rust emulator because the Assembly
executor is not supported there. In the Rust SDK, the embedded
client defaults to the Emulator executor unless you explicitly
select `ExecutorKind::Assembly`.

## What's on each page in this section

The four pages that follow take one slice of the diagram each:

| Page | Covers |
|---|---|
| **[The pipeline](./pipeline)** | The six developer-facing stages: compile, setup, execute, prove, wrap, verify. What each does, what command runs it. |
| **[Host & guest](./host-and-guest)** | The VM model: what runs inside the zkVM (the guest), what runs outside (the host), what flows between them (inputs, hints, public outputs). |
| **[Components](./components)** | What's inside the prover at a high level: the Main chip, the Memory chip, the precompile chips, and the buses they use to talk to each other. |
| **[Scaling](./scaling)** | How a long program gets proved when no single proof can hold it: per-chip trace splitting plus a recursive aggregation tree. |
| **[Lifecycle of a proof](./proof-lifecycle)** | The full proving run end to end, in chronological order. Compile, setup, execute, prove (with sub-stages), wrap, verify. |

Together these answer the four questions someone usually asks
when they meet ZisK for the first time:

- "What do I run as a developer?" → **The pipeline**.
- "What does my code see, and what stays outside?" → **Host & guest**.
- "What's actually inside the prover?" → **Components**.
- "How does this work for programs that take billions of steps?"
  → **Scaling**.
- "What does one full proving run look like end to end?" → **Lifecycle of a proof**.

## What this section deliberately leaves out

To keep the overview readable, these pages skip:

- The formal definitions behind the proving system (the
  arithmetic constraint framework, the lookup arguments, and so
  on).
- The four-register `(c, flag) = op(a, b)` instruction shape that
  ZisK uses internally.
- The exact mechanics of the lattice-based hash that lets
  segments share a common challenge.
- The address-map ranges, the full opcode catalogue, and
  operator-side flags.

All of that lives in
[Deep understanding](/intro/deep/isa): same material, with the
maths and the precise definitions back in. The two sections are
designed to be read in either order.

## Where this picks up

The next page, [The pipeline](./pipeline), walks the six
developer-facing stages of a proving run end to end. From
there each subsequent page opens up one slice of the system
in turn.
