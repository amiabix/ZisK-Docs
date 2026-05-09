---
id: proof-lifecycle
sidebar_position: 6
title: Lifecycle of a proof
description: A step-by-step walkthrough of one complete proving
  run. What happens between "you call cargo-zisk prove" and
  "you have a verified proof", in chronological order.
---

# Lifecycle of a proof

The previous pages introduced the moving parts of ZisK one at a
time: the [pipeline stages](./pipeline), the
[host/guest split](./host-and-guest), the
[chips](./components), and how things [scale](./scaling).

This page ties them together. We follow **one specific proving
run** from start to finish, in chronological order, and show what
happens at each moment: which process is running, which chip is
busy, which message is on which bus.

## The example we'll trace

A tiny guest program: read a string from the input, hash it with
SHA-256, commit the digest as a public output. Roughly the same
"hello world" from the [What is ZisK](/intro/introduction/overview)
page.

```rust
fn main() {
    let input: String = io::read();
    let digest = Sha256::digest(input.as_bytes());
    io::commit_slice(&digest);
}
```

Three things happen inside the guest:

1. Read the input.
2. Compute SHA-256 (a precompile call, not a Rust loop).
3. Commit the digest.

That's the *guest*'s job. The host's job is everything around it:
build the binary, set up the prover, supply `"Hello Zisk"` as
input, ask for a proof, verify it.

Let's walk through what happens, in order.

---

## Phase 0: Compile (one-time, before everything)

You run:

```bash
cargo-zisk build --release
```

The customised Rust toolchain produces a RISC-V ELF at
`target/elf/riscv64ima-zisk-zkvm-elf/release/hash-guest`. This file
is what every other phase will reference.

You only do this once per change to the guest source. Until you
edit the guest, nothing in this phase needs to repeat.

---

## Phase 1: Setup (one-time, per ELF)

The first time anything proves *this specific ELF*, the prover
needs to compute a **proving key** for it. You can do this
explicitly:

```bash
cargo-zisk program-setup
```

or skip it. The first prove call will run setup automatically.

What setup actually does, step by step:

![Phase 1 · Setup (sequence): cargo-zisk loads ELF, transpiler walks RISC-V and emits ZisK instructions into ROM, setup engine commits ROM and computes fixed AIR columns, returns proving key + program verification key](/diagrams/svgs/12-setup-sequence.svg)

The output is a pair of keys:

| Key | What it's for |
|---|---|
| **Proving key** | Used by the prover. Big, lives on disk near the prover. |
| **Program verification key** | Used by anyone verifying a proof of this ELF. Small commitment derived from the program ROM during setup. Included with the proof so the verifier can check which program is being verified. |

These keys depend on the ELF, **not** on the input. The same keys
work for any input you'll ever prove.

---

## Phase 2: Execute (optional sanity check)

Before paying for proving, you can run the guest in the emulator
without producing any proof:

```bash
cargo-zisk execute -i input.bin
```

Here `input.bin` is a `ZiskStdin`-formatted file containing the
framed `"Hello Zisk"` value. This runs the same logic the prover
would, prints any `println!` output, and surfaces logic errors fast.
It skips proof generation. It takes seconds where proving would take
minutes.

Two emulators are available: a fast Assembly emulator (the default
CLI path on Linux, RAM-hungry) and a slower Rust emulator
(`ziskemu`, lighter on memory). The current CLI forces the Rust
emulator on macOS.

For developer-facing work the difference doesn't matter much.
The point is just to confirm the program does what you expect.

---

## Phase 3: Prove

This is the only expensive stage. You run:

```bash
cargo-zisk prove -i input.bin
```

A lot happens in the next few seconds-to-minutes. The prover
runs through six internal sub-stages, in order: emulation,
witness planning, trace generation, per-chip-segment proving,
aggregation, and the root proof. The diagram below shows the
flow at a glance, then each sub-stage gets its own walkthrough.

![Phase 3 · Prove sub-stages: 3a Emulation → 3b Witness planning → 3c Trace generation → 3d Per-chip-segment proving → 3e Aggregation → 3f Root proof](/diagrams/svgs/13-prove-substages.svg)

### Phase 3a: Emulation

The prover runs the guest in the emulator, just like Phase 2
did, but this time it **records everything**.

Every instruction fetched, every memory access, every register
update, every precompile call: all logged into an in-memory
execution trace.

![Phase 3a · Emulation (sequence): emulator drives guest one instruction per step, guest records each fetch / operand / result / memory access into the execution log; SHA-256 calls are recorded as precompile invocations](/diagrams/svgs/14-emulation-sequence.svg)

For our SHA-256 example, the log might contain something like:

```
step 0:  fetch boot instruction
step 1:  ...
step 47: fetch dma_inputcpy        ← reads input from input data region
step 48: ...
step 90: fetch sha256              ← precompile call
step 91: fetch pubout              ← commit the digest
step 92: halt at exit address
```

The `dma_inputcpy` and `pubout` lines are precompile calls,
not regular RISC-V instructions. They show up in the log as
single ZisK opcodes that the corresponding precompile chip
will later prove.

The emulator also tells the rest of the pipeline **how much work
each chip needs to do**: how many memory accesses, how many
arithmetic operations, how many SHA-256 calls. That count drives
the next sub-stage.

### Phase 3b: Witness planning

Now that the prover knows how much work each chip will do, it
plans the **AIR instance sizes**: how many rows the Main chip
needs, how many the Memory chip needs, how many the SHA-256
precompile chip needs.

It also splits each chip's trace into **segments** of the chip's
fixed height (typically 2²² rows).

For a tiny program like ours, each chip might end up with one
short segment. For an Ethereum block validator, the Main chip
might end up with many segments, the Memory chip with several,
and rare precompiles with one each.

```text
Tiny program (our example):
  Main:         1 short segment (~100 rows)
  Memory:       1 short segment (a few hundred memory ops)
  SHA-256:      1 short segment (1 hash)
  Base ops:     1 short segment

Ethereum block (for contrast):
  Main:         hundreds of segments, mostly full
  Memory:       hundreds of segments, mostly full
  Keccak:       tens of segments
  secp256k1:    tens of segments
```

Memory is then allocated for the trace matrices and the prover
moves on.

### Phase 3c: Trace generation

The execution log gets *materialised* into trace matrices, one
per chip, one per segment. Each chip has dedicated witness
generators that fill in their own columns based on the log:

![Phase 3c · Trace generation (fan-out): execution log feeds Main, Memory, SHA-256, Base ops witness generators in parallel, each producing its own trace matrix](/diagrams/svgs/15-trace-generation.svg)

This step runs **in parallel** across chips: the Main witness
generator doesn't need to wait for the Memory witness generator.

Bus messages flowing between chips during the original execution
are recorded once and read by every chip that participates in
each message.

By the end of this sub-stage, every chip in every segment has its
trace matrix fully populated with field-element values. Now we
can prove them.

### Phase 3d: Per-chip-segment proving

This is the heaviest sub-stage. Each filled trace (every chip,
every segment) gets turned into a **STARK** (a kind of
zero-knowledge proof).

They're produced by the proving engine under the hood; the
developer never has to touch it directly.

What a single per-segment proof looks like, at a sketch level:

![Phase 3d · Per-segment proving (sequence): prover fills trace columns, commits to trace, receives shared random challenges, computes consistency contribution, commits, proves constraints, answers spot-checks; per-segment proof ready](/diagrams/svgs/16-per-segment-proving-sequence.svg)

The output is one proof per chip per segment. They're
**independent**. No segment has to wait for any other. On a
multi-core machine they run in parallel; on a distributed prover
they go to different worker machines.

Each per-segment proof exposes three values in its public
data, which the next sub-stage uses:

- **Own public outputs oᵢ:** values the AIR explicitly
  commits, such as program outputs that must be visible to the
  final verifier.
- **LogUp partial sum sᵢ:** this segment's signed contribution
  to bus balancing. The global check is `Σsᵢ = 0`.
- **LtHash challenge contribution cᵢ:** this segment's
  additive share of the shared challenge `α`.

The aggregation tree propagates `oᵢ` upward and accumulates
`sᵢ` and `cᵢ`. The root checks the sums.

### Phase 3e: Aggregation

The aggregation tree starts building **as soon as two leaf proofs
are ready**. It doesn't wait for everything. Branches that finish
early get folded immediately while slower ones are still
producing.

![Phase 3e · Aggregation (sequence): leaves report ready to coordinator as soon as each finishes; coordinator opportunistically aggregates pairs (L1+L2), (L3+L4), then combines the two sub-proofs](/diagrams/svgs/17-aggregation-sequence.svg)

The aggregation tree has three node types:

- **Leaf nodes:** the raw per-segment proofs.
- **Compressor nodes:** sit directly above leaves and convert
  each leaf proof into a recursion-friendly format with the
  same public outputs.
- **Aggregation nodes:** combine two compressed proofs into
  one by verifying both children and summing their `sᵢ` and
  `cᵢ`.

The topmost aggregation node is the **root**. It runs the two
final checks (`Σsᵢ = 0` and the challenge consistency) using
the accumulated public outputs.

Each aggregation node verifies its two child proofs and
produces a new combined proof for the level above. As it does
that, it also adds together the two small numbers each child
exposed:

- The two **`sᵢ` partial sums** add together.
- The two **`cᵢ` challenge contributions** add together.

Once everything has been folded into a single combined proof,
the tree is done.

### Phase 3f: Root proof

The root node of the aggregation tree finalises everything by
running **two simple arithmetic checks**:

| Check | What it confirms |
|---|---|
| The total consistency contribution sums to zero. | Every bus message that was sent by some chip really was received by exactly one other chip, with matching content, across all chips, all segments. |
| The total challenge contribution matches the broadcast challenge. | The random challenge that every segment used was derived honestly from all the trace commitments. Nobody picked it to make the proof go through. |

Both checks are just adding numbers and comparing. No traces
to inspect, no constraints to re-evaluate.

If both pass, the **root proof** is the final proof. The whole
proving run is over.

---

## Phase 4: Wrap (optional)

If the proof needs to be verified on an EVM chain, wrap it in a
SNARK that the contract can verify cheaply.

```bash
# default: STARK, no wrap
cargo-zisk prove -i input.bin

# PLONK SNARK, constant-size, EVM-verifiable
cargo-zisk prove -i input.bin --plonk
```

Wrapping is one more layer of recursion. A verifier circuit
checks the underlying STARK, then is itself wrapped in a SNARK.

---

## Phase 5: Verify

You receive a proof file. To verify it locally:

```bash
cargo-zisk verify -p proofs/proof.bin
```

What `verify` actually checks:

![Phase 5 · Verify (sequence): verifier loads proof + public values + program verification key, re-derives the shared challenge, checks consistency total is zero, checks challenge total, verifies root STARK (or PLONK); Ok if all checks pass](/diagrams/svgs/18-verify-sequence.svg)

Verification is **constant-time**: it takes the same time whether
the original proof covered a thousand-step program or a
billion-step program. That's the whole point of succinctness.

A complete verification has three things to confirm. See
[Host & guest → Inputs from the host](./host-and-guest#inputs-from-the-host)
for the trust-model context.

---

## Putting it all together

The whole lifecycle, end to end:

![Whole lifecycle, end-to-end: Phase 0 Compile → Phase 1 Setup → Phase 2 Execute → Phase 3 Prove (3a Emulation → 3b Witness planning → 3c Trace generation → 3d Per-chip-segment proving → 3e Aggregation → 3f Root proof) → Phase 4 Wrap (optional) → Phase 5 Verify](/diagrams/svgs/19-whole-lifecycle.svg)

The asymmetry the whole design is built around shows up here:

- The **prover** does Phase 3, which dominates wall-clock time.
- The **verifier** does Phase 5, which is fast and constant.

Everything ZisK does (the chip-based architecture, trace
splitting, the aggregation tree, LtHash, the precompiles)
serves to make Phase 3 feasible for real-world programs while
keeping Phase 5 cheap.

## Where this picks up

You've now seen the whole pipeline play out, step by step. From
here:

- For the **maths and the precise constraint shapes**, jump to
  [Deep understanding](/intro/deep/isa).
- To **build a guest program**, see
  [Your first guest program](/developer/writing-programs/first-guest).
- To **operate the prover** (emulator backends, distributed
  proving), see [Operating the prover](/prover/intro).
