---
id: chips
sidebar_position: 4
title: Chips
description: The concrete components of the ZisK circuit (Main,
  Memory, Base Operations, Precompiles, Tables) and the dependency
  graph that wires them together.
---

# Chips

The previous page described the **rules** for organising a proving
system: AIRs, AIR values, trace columns, buses, bus balancing.
This page describes the **components** that follow those rules in
ZisK: the concrete chips that make up the circuit.

A **chip** is a single AIR plus the methods that generate its
trace. Chips fall into two categories:

| Category                | What it does                                                      |
| ----------------------- | ----------------------------------------------------------------- |
| **Instruction executor** | Owns the execution logic for a subset of the ZisK ISA. Each instruction is handled by exactly one executor (an executor may handle multiple related instructions). |
| **Table**               | Provides auxiliary functionality (lookup tables, range checks, cached results) shared by multiple executors. |

Adding a new operation to ZisK means adding a new chip and wiring
it to the appropriate buses. Existing chips are not modified.

## The chip dependency graph

Most chips don't operate in isolation. Instruction executors
delegate parts of their computation to other chips, which in turn
query lookup tables, which …

Two example dependency chains illustrate the pattern. On the left,
an arithmetic operation flows from Main through a sub-executor
into its table. On the right, a Keccak precompile reads inputs
from memory and queries its own tables.

![Diagram: Main · Arith · Arith Tables · Binary · Binary Tables](/diagrams/svgs/29-chips-1.svg)

Each chip proves only its own local constraints. Bus balancing,
checked globally at the root, composes the local arguments into
one consistent global proof. Adding a new precompile means adding
a new branch to one of these trees; existing branches stay
untouched.

## The Main chip

**Main** is the central execution spine. Each row of its trace
corresponds to one instruction step, and the trace materialises
the full execution transcript.

Every row goes through the same four phases:

![Diagram: 1. Instruction fetch read inst at pc via ROM Bus · 2. Operand resolution compute a, b via Memory Bus · 3. Operation dispatch simple: here complex: Op Bus · 4. State update write c to dest via Memory Bus](/diagrams/svgs/30-chips-2.svg)

1. **Instruction fetch:** the Main chip reads the instruction at
   the current program counter from the program ROM via the ROM
   Bus.
2. **Operand resolution:** the values of `a` and `b` are computed
   from their source modes (immediate, memory, RISC-V register,
   indirect, …). Memory reads go through the Memory Bus.
3. **Operation dispatch:** operations simple enough to constrain
   directly (no-ops, jumps, control flow) execute in the Main chip.
   Everything else is *delegated* over the Operation Bus to a
   specialized chip.
4. **State update:** the result `c` is written to its destination
   (RISC-V register, memory, or discarded) via the Memory Bus or
   directly in the Main trace.

Because every row has the same shape, the Main AIR has one fixed
constraint set covering every instruction in the ISA. Per-row
columns encode which source modes, which operation, and which
store mode this particular row uses.

### Timestamps

The arithmetization itself doesn't represent time, but program
execution is inherently sequential. ZisK encodes time at two
granularities:

- A **main step** `t` indexes one full instruction execution by the
  Main chip. Rows in the Main trace are strictly increasing in `t`.
- Each main step is subdivided into **four memory steps:**
  `t_mem = 4 · t + s` for `s ∈ {0, 1, 2, 3}`.

The four memory steps give the operand-resolution reads, the
result write, and any precompile-driven memory accesses unique
slots in the global access ordering. Slots 0 and 1 are reserved
for reads, 2 and 3 for writes.

## The Memory chip

**Memory** centralises all memory access verification. Every chip
that touches memory (Main, precompiles, MemAlign) submits its
operations to the Memory Bus. The Memory chip collects them and
proves they are globally consistent.

The trick is sorting. The Memory chip's trace is the union of all
memory operations, **sorted by address, then by timestamp within
the same address**:

```text
sorted memory access log
─────────────────────────────────────────────────────────────
addr=0xA000_0008  t_mem=12  WRITE  data=...
addr=0xA000_0008  t_mem=20  READ   data=...   ← must equal t=12 write
addr=0xA000_0008  t_mem=44  WRITE  data=...
addr=0xA000_0010  t_mem=8   WRITE  data=...   ← address jump (must be strictly greater)
addr=0xA000_0010  t_mem=16  READ   data=...   ← must equal t=8 write
...
```

Two adjacent-row constraints are enough to enforce global
correctness:

1. **Within the same address**, timestamps must be strictly
   increasing, and every read returns the most recent write's data.
2. **At every address change**, the new address must be strictly
   greater than the previous one, so no address can appear in two
   non-consecutive blocks, ruling out replays.

Region access policies (the read/write rules from the
[Processor page](./processor#region-access-policies)) become additional
constraints applied to specific address ranges:

- **Mutable RAM:** any address can be written at any timestamp;
  reads return the last write; reads to never-written addresses
  return zero.
- **Immutable regions** (program ROM, ROM data): exactly one write
  per address, which must be its first access; all later accesses
  are reads returning the same value.
- **Free-input regions** (input data): no writes, all
  reads return the host-supplied value, multiple reads of the same
  address at the same step are allowed (a property exploited by
  precompiles that need to re-read input data during a single
  operation).

A separate **silent-write prohibition** applies to writes: every
write must produce a message on the Memory Bus, ensuring no memory
modification can happen outside the scope of the consistency
argument. There is no way for a chip to mutate memory without the
Memory chip seeing it.

### MemAlign: sub-word and unaligned access

The Memory chip only handles **aligned 8-byte** operations. RISC-V
guests, of course, do plenty of sub-word and unaligned reads and
writes (1, 2, or 4 bytes; arbitrary alignment).

A separate **MemAlign** chip is responsible for decomposing those
into one or two aligned 8-byte operations.

![Diagram: Memory user · Memory · Memory user · MemAlign · MemAlign ROM](/diagrams/svgs/31-chips-3.svg)

Internally, MemAlign is modelled as a small processor with eight
byte-wide registers that hold one aligned 8-byte word, plus its
own ROM (a tiny lookup table) that executes one of four fixed
sub-programs depending on the access pattern:

| Case                                | Aligned ops issued | What MemAlign does                                                                          |
| ----------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| **Read within one word**            | 1 read             | Load the surrounding 8-byte word into its registers, extract the requested bytes, return.   |
| **Write within one word**           | 1 read + 1 write   | Read the surrounding word, patch the target bytes, write the modified word back.            |
| **Read spanning two words**         | 2 reads            | Read both surrounding words, combine the relevant bytes from each, return the assembled value. |
| **Write spanning two words**        | 2 reads + 2 writes | Read both surrounding words, patch the relevant bytes in each, write both modified words back. |

Whatever the access pattern, only aligned 8-byte operations ever
hit the Memory Bus. The Memory chip's constraints stay simple, and
MemAlign concentrates the alignment complexity in one place,
behind a small fixed set of constraints.

## Base Operations

The **Base Operations** chips prove the base instruction set
delegated from Main over the Operation Bus:

- Bitwise logic (AND, OR, XOR, NOT, …)
- Comparisons (less-than, equal, …)
- Shifts (left, right, arithmetic, logical)
- Sign extensions
- Integer multiplication and division

These chips are the simplest kind of executor:

- **No Memory Bus interaction.** Inputs and outputs flow entirely
  through the Operation Bus.
- **No continuation state.** Each segment is self-contained.
- **One row per delegated operation.** Compact and parallel-friendly.

That makes them the easiest chips to reason about and the cheapest
to scale across many segments.

## Precompiles

**Precompiles** handle classes of operations whose decomposition
into base operations would be inefficient: elliptic-curve
arithmetic, hash functions, bulk memory transfers. Each precompile
is an independent executor chip with the full proof obligation for
its operation.

Three things distinguish a precompile from a base-operation chip:

| Aspect             | Base Operations           | Precompiles                                                  |
| ------------------ | ------------------------- | ------------------------------------------------------------ |
| **Inputs/outputs** | Op Bus operands (64-bit). | Read inputs and write outputs directly via the Memory Bus.   |
| **Trace shape**    | One row per call.         | Many internal rows, sized to the operation's intrinsic complexity. |
| **State**          | None across segments.     | Some precompiles (e.g. DMA) carry continuation state.        |

### The calling convention

At the ISA level, invoking a precompile follows a calling
convention: the caller issues a sequence of parameter-passing
instructions, a call instruction, and result-retrieval
instructions. These appear in the Main trace as phantom
instructions that set up and tear down the call but carry no proof
obligation themselves: what gets proven is the precompile's own
internal computation.

![Diagram: Main trace · Precompile chip (many internal rows) · Memory](/diagrams/svgs/32-chips-4.svg)

### The current precompile catalog

The precompile set targets blockchain-relevant primitives. The
full opcode list lives in
[`zisk_ops.rs`](https://github.com/0xPolygonHermez/zisk/blob/main/core/src/zisk_ops.rs);
at a glance:

| Class                       | Primitives                                                                        | Opcode group     |
| --------------------------- | --------------------------------------------------------------------------------- | ---------------- |
| **Hash functions**          | `sha256`, `keccak`, `blake2`, `poseidon2`                                         | Sha256, Keccak, Blake2, Poseidon2 |
| **Elliptic curve, secp256k1 / r1** | `secp256k1_add`, `secp256k1_dbl`, `secp256r1_add`, `secp256r1_dbl`         | ArithEq          |
| **Elliptic curve, BN254**   | `bn254_curve_add`, `bn254_curve_dbl`, `bn254_complex_add` / `_sub` / `_mul`       | ArithEq          |
| **Elliptic curve, BLS12-381** | `bls12_381_curve_add`, `bls12_381_curve_dbl`, `bls12_381_complex_add` / `_sub` / `_mul` | ArithEq384 |
| **Big-integer arithmetic**  | `add256`, `arith256`, `arith256_mod`, `arith384_mod`                              | BigInt, ArithEq, ArithEq384 |
| **Bulk memory transfer**    | `dma_memcpy`, `dma_memcmp`, `dma_inputcpy`, `dma_xmemcpy`, `dma_xmemcmp`, `dma_xmemset` | DMA        |

Two things worth pointing out:

- **Poseidon2** is the ZK-friendly hash used by the recursive
  aggregation layer (covered on
  [Recursion & aggregation](./recursion)). It is also
  available to user programs.
- **DMA** precompiles are not cryptographic. They are bulk
  memory operations (copy, compare, fill, copy-from-input)
  whose decomposition into individual loads/stores would be
  extremely expensive to constrain row by row.

Adding a new precompile is a well-defined operation: define a new
AIR with the operation's constraints, wire it to the Operation
Bus and (if needed) the Memory Bus, and define a continuation bus
for cross-segment state if the precompile carries any. No existing
chip changes.

## Tables and frequent-operation caches

**Table chips** provide shared lookup functionality. They are
queried by instruction executors via the Table Buses and serve
patterns like:

- Range checks ("this value fits in 32 bits").
- Operation truth tables ("AND of these two bytes is X").
- Cached transformations ("the byte representation of this `u64`
  is …").

### Frequent-operation caches

Across a typical program execution, only a small fraction of all
possible inputs to a base-operation chip actually appear, and
those that do appear tend to repeat. ZisK exploits this with
**frequent-operation caches**: results for the most commonly
queried input pairs are precomputed once at setup time and stored
as fixed binary files.

![Diagram: Query: AND(0x42, 0x7f) · Resolve from cache row · Constraint check via lookup table](/diagrams/svgs/33-chips-5.svg)

At proof time, sub-chips resolve queries from the cache when they
hit, and fall back to constraint checking for the rest. For
typical workloads the hit rate is high enough to substantially
reduce witness size and proving time.

## Putting it together

![Diagram: Main · Base Operations Arith, Binary, Shift, ... · Precompiles SHA, Keccak, secp256k1, ... · MemAlign · Memory](/diagrams/svgs/34-chips-6.svg)

The Main chip is the central spine. The Memory chip is the central
sink for everything memory-related. Base Operations and Precompiles
are dispatched from Main over the Operation Bus and consult tables
and (for precompiles) memory directly. MemAlign sits between the
sub-word callers and the Memory chip's aligned interface.

## What this layered design buys

The chip architecture is what makes the rest of ZisK's properties
possible:

- **Per-chip parallelism:** each chip's trace is built and proved
  independently, so the prover can scale horizontally (covered on
  [Continuations](./continuations) and
  [Recursion & aggregation](./recursion)).
- **Tight precompile cost:** adding a precompile means adding a
  chip whose constraints are tight to the operation's intrinsic
  complexity, without modifying the rest of the system.
- **Trace splitting:** because each chip records only its own
  rows, the prover can partition each chip's trace independently
  and eliminate most padding.
- **Backend independence:** the AIR/bus frontend can in principle
  be paired with any compatible proof system; ZisK currently uses
  STARKs over Goldilocks via PIL2 / `proofman`.

## Where this picks up

You now have the full picture of ZisK's static structure: the ISA
([the contract](./isa)), the processor that implements it
([the implementation](./processor)), how computation is expressed
as AIRs and buses ([arithmetization](./arithmetization)), and the
concrete chips on this page.

What's missing is *time*: how an unbounded execution gets broken
into proofs that can fit in fixed-height AIRs and then be
recombined. That's the subject of the next two pages:
[Continuations](./continuations) (the splitting) and
[Recursion & aggregation](./recursion) (the recombination).
