---
id: continuations
sidebar_position: 5
title: Continuations
description: How ZisK proves unbounded executions by splitting each
  chip's trace into independently provable segments, with
  cross-segment state carried by the Continuation Bus.
---

# Continuations

A single proof covers a trace of fixed height. Real programs run
for an a priori unbounded number of steps, so a single proof
cannot certify an arbitrary execution. **Continuations** are how a
zkVM extends beyond that bound: split execution into
independently-provable chunks and chain them back together.

The companion mechanism, **recursion**, which combines those
per-segment proofs into a single argument, gets its own page,
[Recursion & aggregation](./recursion). This page is just about
the splitting story.

## The unbounded-execution problem

Picture an execution of a million instructions. A single AIR can
prove at most some fixed *N* rows, say 2²² (about 4 million) for
the Main chip. Even one program run can exceed *N* on some chip; a
production workload certainly will.

The zkVM has to break the execution into chunks small enough to
prove individually, then chain the chunks back together. Doing this
naively is the source of most of the inefficiency in classical
zkVMs.

## The standard approach: checkpointed continuations

Most zkVMs use **checkpointed continuations**:

1. Run the program for *N* steps.
2. Halt and save the machine state (the *checkpoint*).
3. Generate a proof for those *N* steps.
4. Resume from the checkpoint, run for another *N* steps, prove,
   resume, …

Each segment proof certifies one *N*-step block, and consecutive
proofs are chained by having each segment verify the preceding
checkpoint as part of its own public inputs.

The cost is **padding**. A segment that uses *k* < *N* rows on some
chip still has to pad that chip to *N* rows. Those padded rows
satisfy the constraints (they are dummy entries) but they still
enter the polynomial commitment and the constraint evaluation.

In a multi-chip system this compounds:

- Different chips are utilised very differently in any given
  segment: Memory might be busy, Keccak might do nothing.
- Yet *every* chip is padded to its full height in *every* segment.
- The wasted work scales with (number of chips) × (number of
  segments).

For chip-rich systems with sparse precompile usage (exactly the
workloads ZisK targets) this is a significant overhead.

### A cryptographic alternative: jagged PCS

A solution at the cryptographic layer is the **Jagged Polynomial
Commitment Scheme**: commit to the full computation trace as a
single polynomial over a *jagged* matrix (each column can have a
different height) and let the verifier emulate access to the
individual per-chip polynomials. The prover then pays cost
proportional to the actual trace area rather than the padded one.

The Jagged PCS is, however, inherently multilinear: it is built on
multilinear polynomial commitments and only fits proving systems
whose arithmetization is multilinear-based. ZisK addresses the
same problem at the **system-design layer** instead. Same
end-effect (per-chip trace area, not padded area), without tying
the solution to a specific class of proving system.

### Visualising the padding cost

Suppose a program runs for three segments. The Main chip is busy
in every segment; the Memory chip is moderately busy; the Keccak
chip only fires in segment 1; the Poseidon chip only fires in
segment 2. Under checkpointing, **every** chip in **every**
segment is padded to its full height *N*:

```text
Segment 0         Segment 1         Segment 2
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Main ████   │   │ Main ████   │   │ Main ████   │   ← used (real work)
│ Main ····   │   │ Main ····   │   │ Main ····   │   ← padded (waste)
│ Mem  ███    │   │ Mem  ███    │   │ Mem  ██     │
│ Mem  ·····  │   │ Mem  ·····  │   │ Mem  ······ │
│ Kec  ······ │   │ Kec  ██     │   │ Kec  ······ │   ← padded entire segment
│ Kec  ······ │   │ Kec  ····   │   │ Kec  ······ │
│ Pos  ······ │   │ Pos  ······ │   │ Pos  ██     │
│ Pos  ······ │   │ Pos  ······ │   │ Pos  ····   │
└─────────────┘   └─────────────┘   └─────────────┘
```

Every padded row still enters the polynomial commitment and gets
its constraints evaluated. The wasted work is the union of all the
`·`s.

## ZisK's approach: trace splitting

ZisK decouples segmentation from execution. Instead of running for
*N* steps, halting, and proving, the program runs *to completion in
a single pass*, producing the full execution trace. Then:

1. **Each chip records only the rows for the operations it
   handled.** The Memory chip records only memory accesses, Keccak
   only hash operations, and so on. Chips that are rarely invoked
   produce short traces; chips that are heavily used produce long
   ones.
2. **The prover partitions each chip's trace independently into
   fixed-height segments.** Padding is limited to the *final*
   segment of each chip; every earlier segment is filled to
   capacity.

The effect is the same as a Jagged Polynomial Commitment Scheme,
but at the system-design layer rather than the cryptographic
layer, so it does not constrain the choice of proving system.

The same workload, visualised the ZisK way (each chip's *own*
trace is independently chopped into segments of *its own* height):

```text
Main:    ┌─────┬─────┬─────┬─────┬─────┬──┐
         │█████│█████│█████│█████│█████│██·│   only last segment padded
         └─────┴─────┴─────┴─────┴─────┴──┘

Memory:  ┌────┬────┬───┐
         │████│████│██·│                       (much shorter trace)
         └────┴────┴───┘

Keccak:  ┌──┐
         │█·│                                  (one short segment)
         └──┘

Poseidon: ┌──┐
          │█·│                                  (one short segment)
          └──┘
```

Every chip's work is concentrated in *its own* trace; chips that
do little produce short traces; padding shrinks to a single
partial slice per chip. The wasted work drops from "(chips ×
segments)" to "(chips × 1 partial)."

The numbers ZisK targets in practice:

- Default segment height: **2²² steps** per chip.
- Maximum segments per chip: **2¹⁴**.
- Resulting maximum program size: **2³⁶ steps**.

## The two open problems

Trace splitting eliminates most padding, but it introduces two
problems that have to be solved elsewhere.

### Cross-chip consistency

In the standard checkpointed approach, the chips' shared values are
checked locally inside one monolithic proof of the entire trace.
With trace splitting, each chip's segments are proved independently,
so there is no monolithic proof in which to check the shared values.

This problem is solved at the recursive aggregation layer. See
**[Recursion and aggregation](./recursion)** for the recombination step.

### Cross-segment state

For chips whose computation is self-contained per segment (most
base-operation chips), nothing connects consecutive segment
instances; they are independent.

For chips with persistent state (Main, Memory, some precompiles),
consecutive segment instances must agree on the chip state at their
shared boundary. Otherwise a segment could pretend the previous
segment ended in a different state than it really did.

This is what continuations, in the classical sense, solve. ZisK
solves it with the **Continuation Bus**.

## The Continuation Bus

The Continuation Bus carries cross-segment state for each chip that
needs it.

- Each segment instance **sends its final state** as a message on
  the bus.
- The next segment instance **receives the matching initial state**
  from the bus.
- Bus balancing, the same global sum-check used for cross-AIR
  consistency, guarantees the chain is globally consistent: every
  sent message is received exactly once with matching content. Gaps,
  duplications, and reorderings are all ruled out.

The state payload is chip-specific. The Main chip carries the
program counter of the first instruction in the next segment plus
the last *c*-register value. The Memory chip carries the last
accessed address and timestamp, preserving the global chronological
ordering of memory accesses across boundaries. Each chip with state
defines its own Continuation Bus with the appropriate payload.

Two anchors fix the chain at its endpoints:

- The **genesis** anchor injects the initial state assumed by the
  first segment instance (boot program counter, zero register, etc.).
- The **terminus** anchor receives the final handoff and checks that
  execution ended at the designated end program counter.

A global check ensures each anchor fires exactly once, ruling out
invalid segment chaining.

![Diagram: genesis · Segment 0 · Segment 1 · … · Segment n](/diagrams/svgs/42-continuations-1.svg)

Each segment receives the previous segment's final state and emits
its own. Bus balancing makes every link in the chain a global
constraint: a missing link, a duplicate link, or a state mismatch
all surface as a non-zero partial sum at the root.

## Where this picks up

You now know how ZisK turns one unbounded execution into a
collection of bounded, independently-provable per-chip segments
without paying the multi-chip padding tax. What remains is the
other half of the story: how those per-chip segment proofs get
recombined into a single argument for the full run, with shared
challenges that work even though the segments are proved
independently.

That is the subject of the next page,
[Recursion & aggregation](./recursion).
