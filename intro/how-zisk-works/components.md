---
id: components
sidebar_position: 4
title: Components
description: The chips inside the ZisK prover at a high level.
  What they do, how they talk to each other, why precompiles
  matter.
---

# Components

The prover does not produce one giant proof of a single CPU.
It produces a **collection of small proofs**, one per *chip*,
that get combined later. Each chip is specialised for one
class of operations and proves only its own slice of the
work.

This page covers what the chips are, why ZisK is built this
way, and how the chips talk to each other. The two worked
examples at the end trace one instruction through the chip
mesh end to end.

The deep mechanics (constraint shapes, exact bus messages, proof
obligations per chip) live in
[Deep understanding → Chips](/intro/deep/chips).

## Why split the prover into chips at all?

Think of it as the difference between a Swiss-army knife and a
toolbox.

- **One giant circuit** that handles every RISC-V operation is a
  Swiss-army knife: single object, but every blade pays the cost
  of the entire knife being thick. The constraints for memory
  reads have to coexist with the constraints for cryptographic
  hashing, and they all run sequentially.

- **A collection of specialised chips** is a toolbox: each tool
  is shaped for one job and is as small as that job allows. The
  hash chip doesn't pay the cost of the memory chip; the memory
  chip doesn't pay the cost of the hash chip. And the toolbox can
  be carried by multiple people in parallel.

ZisK takes the toolbox approach. The chips together cover the
full ZisK ISA, but each chip can be designed, optimised, proved,
and aggregated independently.

## The chips, at a glance

![Chips at a glance: Main dispatches to ROM, Base Operations, Precompiles, MemAlign; specialists feed Tables and Memory](/diagrams/svgs/06-chips-at-glance.svg)

| Chip | What it does |
|---|---|
| **Main** | The execution spine. One row per instruction. Reads instructions from the ROM, resolves operands, dispatches to specialised chips, writes results. |
| **Memory** | Tracks every read and write to memory, in any order they happen, and proves they're consistent (every read returns the most recent write). |
| **MemAlign** | Decomposes sub-word and unaligned memory accesses into the aligned 8-byte operations the Memory chip wants. |
| **Base Operations** | Bitwise logic, comparisons, shifts, integer multiply/divide: the boring-but-frequent operations. |
| **Precompiles** | SHA-256, Keccak-256, secp256k1 ECDSA, BN254/BLS12-381 pairings, modular exponentiation, bulk DMA: operations whose cost would be prohibitive if implemented as base operations. |
| **Tables** | Lookup tables and frequent-operation caches that the other chips consult. |

The Main chip is the conductor. Everything else is a specialist
that the Main chip dispatches to.

### MemAlign briefly

MemAlign is a small processor with eight byte-wide registers. It executes one of four fixed
subprograms depending on the requested access:

1. **Read within one word:** one aligned read, extract bytes.
2. **Write within one word:** one aligned read, patch bytes,
   one aligned write.
3. **Read spanning two words:** two aligned reads, combine.
4. **Write spanning two words:** two aligned reads, patch
   bytes in each, two aligned writes.

Every memory access on the Memory Bus is therefore an aligned
8-byte operation, regardless of how the guest issued it.

## How chips talk to each other

Chips don't share memory or registers. They're separate
arithmetic objects.

They communicate through **buses**: shared channels where one
chip emits a message and another receives the same message, and
the proof system enforces that every send matches a receive.

The five buses ZisK uses:

| Bus | What flows on it |
|---|---|
| **Operation Bus** | "Run this operation": Main sends `add(a, b)` or `keccak(input)`, the relevant chip receives it and returns the result. |
| **ROM Bus** | "What's the instruction at this address?": Main sends a program counter, the ROM chip returns the instruction. |
| **Memory Bus** | "Read/write this address at this time": every chip that touches memory submits its access; the Memory chip checks they're consistent. |
| **Continuation Bus** | "What was the state at the end of the previous segment?": used for chips that span multiple segments (covered on the next page). |
| **Table Buses** | Per-table lookup queries from the operation chips into their lookup tables. |

The high-level guarantee is called **bus balancing**, but the
idea is simple: *every message put on a bus has to be picked up
exactly once, with the same content.*

Nothing sent goes unreceived; nothing received was never sent.
This single rule is what ties the independent chip proofs
together into one consistent argument.

Constraint values live in the Goldilocks prime field
(*p* = 2⁶⁴ − 2³² + 1). Some derived values, including LogUp
partial sums, live in the cubic extension
𝕂 = 𝔽[X]/(X³ − X − 1) for soundness.

![Bus message between chips: Main (sender, row r) emits (5, 17, add); Arith (receiver, row r') picks it up](/diagrams/svgs/07-bus-message.svg)

If the Main chip sends 100 `add` operations and the Arith chip
only receives 99, the rule is violated and the proof is
rejected.

If the Main chip says "memory at address 0xA000 contains 42" but
the Memory chip never agreed to that, same thing: the proof is
rejected.

The proving system checks this rule **once at the very end**,
across all chips and all messages, with a single arithmetic
equality.

That's how independent chip proofs end up being globally
consistent without anyone having to coordinate locally.

## Precompiles, briefly

The chip you'll think about most as a developer is the
**precompile** family.

Real workloads spend most of their cost in a small set of
cryptographic primitives: hash functions for state roots, ECDSA
for signatures, pairings for proof verification, modular
exponentiation for RSA-style schemes.

ZisK exposes these as native instructions, each backed by its
own chip:

- **Cryptographic hash functions:** committing to large data and computing state roots.
- **Elliptic-curve arithmetic:** ECDSA recovery and verification, pairing-based protocols.
- **Bulk memory transfers:** moving large buffers between memory regions in one operation.

The full catalogue of available precompile opcodes lives in
[Precompile reference](/references/zisk-os/precompiles).

From your code, calling a precompile looks like calling a normal
Rust function.

Behind the scenes the transpiler maps the call to a ZisK
precompile opcode, the Main chip dispatches to the relevant
precompile chip, and that chip's proof obligation is exactly the
operation's intrinsic cost.

That cost is not the cost of doing SHA-256 in RISC-V
instructions row by row.

This is the single biggest performance lever for a guest program:
**use precompiles where you can, write loops in Rust where you
can't.**

## What happens when one instruction runs

So far this page introduced the chips and the buses. The
two examples below trace one instruction through that mesh
end to end. The first is a plain RISC-V `add`. The second
is a SHA-256 call, which delegates to a precompile chip and
shows how dispatch differs.

### Example 1: `x5 = x1 + x2` (a plain add)

This is a normal RISC-V `add` instruction. Here's what happens
chip by chip when the prover encounters it:

![Plain `add` instruction (sequence): Main fetches instruction from ROM, reads x1 and x2 from Memory, dispatches add(17, 42) to Arith, writes result to x5](/diagrams/svgs/08-add-instruction-sequence.svg)

What happened in one Main-chip row:

| Bus | Direction | Message |
|---|---|---|
| ROM Bus | Main → ROM | "fetch instruction at this pc" |
| Memory Bus | Main → Memory | "read x1" → returns 17 |
| Memory Bus | Main → Memory | "read x2" → returns 42 |
| Operation Bus | Main → Arith | "add(17, 42)" → returns (59, 0) |
| Memory Bus | Main → Memory | "write x5 = 59" |

Five bus messages from one row of one chip.

**Each message** is constrained.

The ROM chip will later prove that the instruction it returned
really was at that pc.

The Memory chip will later prove that the values it returned
really were the most recent writes; the Arith chip will later
prove that 17 + 42 really equals 59.

The Main chip itself doesn't have to verify any of this locally.
It just records that it sent these messages.

Bus balancing, checked globally at the root proof, guarantees
that every message was received by the right chip with the
right content.

### Example 2: `Sha256::digest(buf)` (a precompile call)

A SHA-256 call looks completely different. From the guest's Rust
code it's just a function call, but the transpiler maps it to a
ZisK precompile opcode. When that opcode runs:

![SHA-256 precompile call (sequence): Main dispatches sha256 over Op Bus, SHA-256 chip reads input from memory, runs compression rounds, writes digest, signals done](/diagrams/svgs/09-sha256-precompile-sequence.svg)

Two things make this different from the add:

1. **The Main chip doesn't do the work.** It just dispatches over
   the Operation Bus and waits for "done." The SHA-256 chip is
   the one running the compression rounds, the one that proves
   the result.
2. **The precompile reads and writes memory directly.** Instead
   of receiving its input as 64-bit operands on the Op Bus, it
   reads the input bytes from memory and writes the digest back
   to memory, all over the Memory Bus.

The Main chip records this as a small handful of phantom instructions
(parameter passing + call + result retrieval). The actual proof
obligation ("given this input, that digest is correct") sits
entirely in the SHA-256 chip.

This is why precompiles are the single biggest performance lever
for a guest program.

A Rust loop computing SHA-256 from scratch would generate
thousands of Main-chip rows, thousands of Operation Bus
dispatches to the Arith and Binary chips, thousands of memory
accesses.

The precompile reduces all of that to one opcode plus the
SHA-256 chip's own (much tighter) constraint system.

## The big mental shift from a CPU

If you're used to thinking about CPUs, the move to thinking about
ZisK is roughly:

| CPU model | ZisK model |
|---|---|
| One processor runs one instruction at a time. | Many chips run in parallel, each on its own slice of the trace. |
| Memory is a black box (cache + DRAM). | Memory is a chip whose every read/write is in the proof. |
| Cryptographic primitives are subroutines (slow). | Cryptographic primitives are native instructions (fast in proving). |
| Programs run sequentially. | Programs run sequentially in the *guest*, but proving that execution is parallel. |

The next page, [Scaling](./scaling), covers what happens when a
single proof can't hold all the work. It explains how a long
program is split across many segment-proofs and then folded back
into one.

For the deep mechanics of each chip (the constraint shapes, the
exact bus messages, the precompile catalog) see
[Deep understanding → Chips](/intro/deep/chips).

## Where this picks up

You now know what the chips are and how they coordinate.

The next page, [Scaling](./scaling), covers what happens when
the program is too big for a single per-chip trace: trace
splitting on the way down, an aggregation tree on the way
back up.
