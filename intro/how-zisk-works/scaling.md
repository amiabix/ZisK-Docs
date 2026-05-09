---
id: scaling
sidebar_position: 5
title: Scaling
description: How a long ZisK program gets proved when no single
  proof can hold it. Per-chip trace splitting plus a recursive
  aggregation tree.
---

# Scaling

A single proof can only cover a trace of fixed height. Real
programs (an Ethereum block, a large state-transition batch) run
for *billions* of steps, vastly more than fits in one proof.

So ZisK has to break the work into pieces, prove the pieces
independently, and fold them all back into a single proof at
the end.

This page covers how the breaking-and-folding works at an
overview level. The split side is per-chip trace splitting; the
fold side is the recursive aggregation tree. A small extra
trick keeps a shared challenge consistent across independent
provers.

The deep mechanics of trace splitting and the Continuation Bus
live on
[Deep understanding → Continuations](/intro/deep/continuations).

The aggregation tree and the LtHash construction live on
[Deep understanding → Recursion](/intro/deep/recursion).

## The two halves: split + recombine

Scaling has two halves, and ZisK does both:

1. **Split the work.** Take the long execution and partition it
   into many short, independently-provable segments.
2. **Recombine the proofs.** Fold all the per-segment proofs
   into a single root proof that attests to the whole execution.

Both halves matter. The first lets the prover handle programs of
any size. The second keeps the verifier's life cheap: the
verifier still gets one proof, not a million.

## Half 1: trace splitting

The trick ZisK uses to split is **per-chip, not per-segment**.

The classical approach (used by other zkVMs) is **checkpointed
continuations**: run for *N* steps, halt, save the state, prove,
resume.

Every chip in every segment is padded to its full height
*N*, even if the chip did almost nothing in that segment. For a
multi-chip system this padding compounds badly.

ZisK runs the program **to completion in one pass**, then splits
**each chip's trace independently**. Chips that did little
produce short traces; chips that did a lot produce long ones.

Each chip's trace is partitioned into segments of *that chip's*
fixed height. Padding is limited to the last segment of each
chip. Every earlier segment is filled to capacity.

```text
Main:    █████ █████ █████ █████ █████ ██·     ← only last segment padded
Memory:  ████ ████ ██·                          (much shorter trace)
Keccak:  █·                                     (one short segment)
```

Each `█` represents a full segment of that chip's trace
(filled to the chip's segment height). Each `·` represents
padding rows added only to the final segment of each chip.
The Memory chip and the Keccak precompile chip have
fewer rows of work than the Main chip in this run, so they
produce shorter traces overall.

The chip-rich workloads that suffered most from padding under
checkpointing get the biggest win.

### Cross-segment state: the Continuation Bus

A **bus** in ZisK is a shared channel where one chip emits a
message and another chip receives it. The proof system enforces
that every send matches a receive. The full bus model lives on
the [Components](./components) page; this section only needs
the Continuation Bus, which carries state from one segment to
the next.

Some chips (Main, Memory, certain precompiles) carry state across
segment boundaries (the program counter, the last memory
timestamp, etc.).

The **Continuation Bus** carries that state from one segment to
the next: each segment sends its final state, and the next
segment receives the matching initial state.

Bus balancing makes any gap or mismatch surface as a non-zero
sum at the root.

Two anchors fix the chain:

![Continuation Bus chain: genesis → Segment 0 → Segment 1 → … → Segment n → terminus, each carrying (pc, c) state](/diagrams/svgs/10-continuation-bus-chain.svg)

## Half 2: the aggregation tree

Once you've got many independent per-segment proofs, you need to
fold them into one.

ZisK does this with a **binary aggregation tree** that is built
**opportunistically**: as soon as two child proofs are ready, an
aggregation node combines them.

Branches that finish early are folded immediately while others
are still running.

![Aggregation tree: leaves L1-L4 fold into A1, A2 aggregations, then into Root proof](/diagrams/svgs/11-aggregation-tree.svg)

Three node types:

- **Leaf nodes:** the raw per-segment proofs.
- **Compressor nodes:** sit directly above leaves and convert
  each leaf proof into a recursion-friendly format.
- **Aggregation nodes:** verify two child proofs and combine
  them into one.

The topmost aggregation node is the **root**. It runs the
final consistency checks.

That property ("fold as soon as two are ready") is what makes
the prover scale **horizontally**.

Distributed workers can generate leaf proofs in parallel; the
coordinator stitches them upward as they arrive, with no global
synchronisation step.

## The shared-challenge trick (in plain language)

There's one subtlety hidden in the picture above. STARK proofs
need a *shared random challenge* that all the segment proofs
agree on. Otherwise the per-segment results don't combine into
a single coherent statement.

Normally that challenge is derived from the prover's commitments
in a strict order, like a chain of hashes. That's fine when one
prover does everything. With **many** independent segment
provers, though, you'd either have to:

- Hash all the commitments **in order**, which forces the
  segment provers to serialise (killing the parallelism the
  whole architecture was built around), *or*
- Let each segment derive its own challenge, which makes the
  per-segment results uncombinable.

ZisK avoids both by using a **special hash function** that has
an unusual property: combining its outputs is *order-independent*.

Each segment computes its piece of the challenge in isolation,
and the aggregation tree adds the pieces together as it climbs.
Whatever order the pieces arrive in, the same final value comes
out at the top.

The shared challenge is broadcast to every leaf prover up front.

The aggregation tree's job at the root is to confirm that the
broadcast matches the value the tree actually built up. That's
how everyone knows the challenge wasn't picked maliciously.

The function is **LtHash**, a lattice-based multiset hash
function [Tea25].

Its homomorphism over multiset union means partial accumulators
from any subset of provers can be merged later into the full
accumulator with no order constraints.

For the full construction (security reducing to the SIS lattice
problem), see
[Deep understanding → Recursion](/intro/deep/recursion).

## Putting numbers on it

The values below are engineering choices. They are not fixed
properties of the design and may change between releases.

Abstract diagrams are easier to internalise with concrete sizes.
Here's roughly what the splitting and aggregation produce for two
very different workloads:

| Workload                        | Steps        | Approx. Main segments | Approx. Memory segments | Tree depth |
| ------------------------------- | ------------ | --------------------- | ----------------------- | ---------- |
| Tiny "Hello world" SHA-256      | ~100         | 1 (mostly empty)      | 1 (mostly empty)        | 1–2        |
| Single Ethereum block validator | ~2 G         | hundreds              | hundreds                | ~10–12     |
| Theoretical maximum             | 2³⁶ ≈ 64 G   | up to 2¹⁴ = 16,384    | up to 2¹⁴ = 16,384      | ~14        |

**Tree depth** is the number of levels in the binary aggregation
tree, roughly log₂ of the number of leaf proofs.

Each Main-chip segment caps at **2²² steps** (~4 M instructions),
so the count of Main segments is roughly *(total steps ÷ 4 M)*.

Memory and the precompile chips have similarly fixed segment
heights but they're sized to those chips' typical work patterns.
A chip that does almost nothing in a workload still produces just
one (small) segment, not one per Main segment.

A real Ethereum-block validation produces something on the order
of a few hundred per-chip segments and a binary aggregation tree
of roughly 10–12 levels. That tree sits comfortably below the
ceiling. The design has substantial headroom (see
[Limits](/intro/deep/limits) for the full table).

## What the verifier sees

After all this, the verifier gets one proof. Verifying it is fast
and constant-time. It doesn't matter how many segments,
aggregation nodes, or chips were involved.

![Collapse hierarchy: billions of guest steps → many per-chip segments → many per-segment STARK proofs → recursive aggregation tree → one root proof → verified in milliseconds](/diagrams/svgs/54-collapse-hierarchy.svg)

The complexity collapses on the verifier side. That asymmetry
between prover work and verifier work is the whole point.

## Where this picks up

That's the overview of the entire ZisK pipeline at the level
needed to follow what happens behind a `cargo-zisk prove` call.

For the formal definitions, the constraint shapes, the LtHash
construction, the address map, the opcode catalogue, and
everything else, head into
[Deep understanding](/intro/deep/isa).
