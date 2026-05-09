---
id: recursion
sidebar_position: 6
title: Recursion & aggregation
description: How ZisK combines independent per-segment STARK proofs
  into a single root proof. The aggregation tree, the LtHash
  shared-challenge construction, and the root verification checks.
---

# Recursion & aggregation

The previous page, [Continuations](./continuations), split each
chip's execution trace into independently-provable segments and
chained the cross-segment state with the **Continuation Bus**.
After that step, every segment of every chip has its own proof,
but those proofs are independent and their cross-chip claims have
not yet been reconciled.

This page is about the second half of the story: how the
independently-generated per-segment proofs are folded into a
**single, globally consistent argument** for the full execution.
Two things still need to happen, and both reduce to arithmetic on
values propagated up an aggregation tree:

1. **Cross-chip bus balancing:** the partial sums recording
   cross-chip interactions (defined on the
   [Arithmetization](./arithmetization) page) must cancel to zero
   when combined across all segments and all chips.
2. **Challenge correctness:** every segment proof was produced
   under the same shared challenge α, and α has to have been
   derived honestly from all the commitments.

The mechanism is **recursive proof aggregation**.

## Recursive proofs in one paragraph

A proof system is *recursive* when it can verify the validity of
another proof as part of its own computation. The verifier is
itself a computation (it reads a proof and performs arithmetic
checks) so the verifier can be expressed as polynomial
constraints and proved. Wrapping the verifier circuit in a proof
yields a *recursive proof*: a succinct argument that attests to
the correctness of an underlying proof. Iterating this lets you
fold many proofs into one constant-size argument.

Recursion serves two purposes in ZisK:

| Purpose                | What it does                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Proof aggregation**  | Combine many independent proofs into a single argument that attests to the validity of all of them at once. |
| **Proof compression**  | Convert a proof generated with one system (e.g. STARK, fast to generate, large) into a proof in another system better suited for a different context (e.g. PLONK, small, EVM-friendly to verify). |

The aggregation tree below uses both: the inner levels aggregate,
and the optional final wrap (Minimal STARK or PLONK) compresses.

## The aggregation tree

ZisK's aggregation tree has three node types and a fixed binary
arity:

- **Leaf nodes** are the raw segment proofs. Each leaf takes the
  shared challenge α as a public input and exposes three public
  values: its own outputs *oᵢ*, its partial LogUp sum *sᵢ*, and
  its LtHash challenge contribution *cᵢ*.
- **Compressor nodes** sit directly above the leaves. Each
  compressor takes a single leaf proof and converts it into a
  format that the recursive aggregation circuit can verify
  efficiently.
- **Aggregation nodes** verify two child proofs and accumulate
  both the LogUp partial sums and the LtHash contributions. They
  produce a new compressed proof for the next level up. The root
  is the topmost aggregation node.

The tree is **opportunistically built and unbalanced**:
aggregation nodes are created as soon as two child proofs are
ready. A branch that finishes early is folded immediately while
others are still running. The shape of the tree reflects timing,
not a fixed structure decided in advance.

That property is what lets the prover scale: distributed workers
generate leaf proofs in parallel, and the coordinator stitches
them upward as they arrive.

![Diagram: α (broadcast challenge) · Leaf (o₁, s₁, c₁) · Compressor · Leaf (o₂, s₂, c₂) · Compressor](/diagrams/svgs/40-recursion-1.svg)

Each level passes two scalar accumulators upward: the LogUp
partial sum *s* and the LtHash challenge contribution *c*. The
root reads both and runs the two arithmetic checks below.

## LtHash and the shared challenge

There is a subtlety in how the shared challenge α is derived.

The classical Fiat-Shamir transform ties each challenge to a
single prover's transcript. With independent segment provers, that
becomes a problem. The two naïve fixes both fail:

| Naïve approach              | Why it fails                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Sequential hashing**      | `α = H(…H(H(com₁, com₂), com₃)…, com_k)`: order-dependent and serialised. Kills the parallelism.     |
| **Per-segment challenges**  | Each segment derives its own challenge from its own commitment. Now the partial sums are incommensurable; the global balancing equation `Σ s_i = 0` becomes meaningless. |

ZisK's solution is **LtHash**, a lattice-based multiset hash
function. Its defining property is that it is **homomorphic over
multiset union**:

```text
LtHash(S ∪ T) = LtHash(S) + LtHash(T)
```

Because the group operation is commutative, the accumulated value
is **independent of the order in which commitments are
processed**. Any subset of provers can compute their partial
accumulator independently, and the partial accumulators combine by
ordinary addition.

### The construction

Each prover *P_i* runs a two-step embedding:

1. **Hash the commitment.** `c_i = H(com_i)`: a small, ordinary
   collision-resistant hash.
2. **Embed into a long pseudorandom vector.**
   `v_i = v_i(c_i) ∈ Z_p^n`: derived from `c_i` by iterative
   hashing into an *n*-element vector over `Z_p`.

The global accumulator is just the component-wise sum of these
vectors:

```text
acc = Σ_i v_i  ∈  Z_p^n
```

The shared challenge α is read off from `acc`. Because addition in
`Z_p^n` is commutative, the result is the same regardless of the
order in which provers contribute their `v_i`.

![Challenge broadcast check: prover P₁ contributes com₁ → c₁ → v₁ as partial sum into aggregator (v₁ + v₂, also fed by P₂'s subtree); aggregator flows to root which computes acc = Σ vᵢ, derives α from acc, and checks α matches the broadcast α](/diagrams/svgs/65-challenge-broadcast-check.svg)

### How the verifier knows α was honest

Correctness of α has to be verified. Otherwise a malicious
prover could substitute any α to make the partial sums balance
artificially. Because LtHash is homomorphic, this verification is
embedded directly into the aggregation tree:

- Each node carries a **partial LtHash accumulator** over the
  commitments in its subtree alongside its partial LogUp sum.
- A parent node combines child accumulators by addition.
- At the root, the fully accumulated value is checked against the
  α that was broadcast to all leaf provers as a public input.

If α was honestly derived from the full commitment set, the
broadcast α and the root-accumulated α agree.

### Security

Security (the guarantee that no two distinct multisets of
commitments can yield the same `acc`) reduces to the **Short
Integer Solution (SIS)** lattice problem, which is believed to
remain hard even against quantum adversaries.

## Root verification

At the root of the aggregation tree, two arithmetic checks
complete the proof:

- **Bus balancing:** the accumulated LogUp sum across all chips
  and all segments must be zero (∑ *sᵢ* = 0). This is the global
  cross-chip consistency condition.
- **Challenge correctness:** the accumulated LtHash vector
  reconstructs the broadcast α. This guarantees the challenge was
  honestly derived from the full set of commitments and not
  adversarially chosen.

Both checks reduce to public-output arithmetic; the root verifier
never has to inspect any individual chip trace.

## Putting it together

Three ideas, working in concert:

| Mechanism             | What it does                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Trace splitting**   | Eliminates most padding by partitioning each chip's trace independently into fixed-height segments. (See [Continuations](./continuations).)                          |
| **Continuation Bus**  | Preserves cross-segment state for chips with persistent state (Main, Memory, etc.). (See [Continuations](./continuations#the-continuation-bus).) |
| **Aggregation tree**  | Combines per-segment proofs into one root proof, enforcing global cross-chip bus balancing.                                              |
| **LtHash**            | Makes the shared LogUp challenge α work without serialising the prover.                                                                  |

The next page, [The proving pipeline](./pipeline), zooms back out
to the developer-facing view: the six stages (compile, setup,
execute, prove, wrap, verify) and how each maps to a CLI command
or an SDK call.

## Where this picks up

Recursion ties the per-segment proofs back into a single root
proof and closes the two open problems left by trace splitting.

The next page, [The proving pipeline](./pipeline), walks the
full developer pipeline with the per-AIR STARK internals.
