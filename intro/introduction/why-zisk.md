---
id: why-zisk
sidebar_position: 3
title: Why ZisK
description: The design principles that distinguish ZisK from
  other RISC-V zkVMs.
---

# Why ZisK

This page assumes you have read [Background](./background).

ZisK's design choices distinguish it from other RISC-V zkVMs.
Each principle below names one such choice and the concrete
property it produces.

## Extensibility as the central motivation

The principle that drives the rest of the design is
**extensibility**.

Application domains such as blockchain execution environments
rely on a specific, known set of expensive primitives:
elliptic-curve operations, hash functions, and bulk memory
transfers.

A zkVM designed for these domains should support those
primitives natively, with proof cost tight to the operation's
intrinsic complexity rather than to the cost of expressing it
in a general-purpose ISA.

ZisK is structured so that such optimised components can be
added as **self-contained modules** without modifying the rest
of the system. The proving cost is not locked to whatever set
of operations the designers chose on day one.

Every other principle on this page is an instance, or a
consequence, of this one.

Building on STARKs further ensures this is achieved without a
trusted setup and with post-quantum security.

## Performance through modularity

Rather than one monolithic circuit covering every RISC-V
operation, ZisK decomposes the proof into many small
constraint systems called "chips". Each chip is specialised
for a class of operations.

![Diagram: Monolithic zkVM · one big circuit covers every instruction proven sequentially · ZisK · Main · Base Ops](/diagrams/svgs/51-why-zisk-1.svg)

Each chip proves only its own local constraints. Consistency
between chips is enforced by a **bus-balancing** argument that
reduces to a single global sum-check at the very end.

Each chip can be designed and optimised independently. The
whole pipeline scales horizontally. Every chip proof, and
every segment of every chip, runs in parallel.

In practice, this turns proving from one big sequential job
into many small jobs that finish at their own pace and combine
when they are done.

## Native precompiles

Real workloads concentrate cost in a small set of cryptographic
primitives. The same handful of hash functions, signature
schemes, and pairings appear in almost every blockchain
workload.

ZisK exposes these as **precompile instructions**:

- **Cryptographic hash functions:** committing to large data blobs and computing state roots.
- **Elliptic-curve arithmetic:** signature recovery, verification, and pairing-based protocols.
- **Bulk memory transfers:** moving large buffers between memory regions in one operation.

Each precompile is a self-contained chip whose constraints are
tight to the operation's intrinsic complexity, not to the cost
of expressing that operation in RISC-V instructions.

From the guest's perspective, a precompile call is just a
function call. The transpiler maps it to the right ZisK
opcode.

Concretely, the same SHA-256 hash:

![Precompile comparison: in RISC-V instructions, a SHA-256 hash block runs through Main + Base Operation chips with thousands of constraints; as a precompile, it lands as a single row in the SHA-256 chip with same proof coverage and far fewer constraints](/diagrams/svgs/53-precompile-comparison.svg)

Adding a new precompile requires defining a new chip and
wiring it to the appropriate buses, with no changes to the
existing chips. The zkVM's expressiveness grows as the
ecosystem's cryptographic needs grow.

## Hint-accelerated witness generation

The **witness** is the full set of intermediate values the
prover needs to fill in to produce a proof. For a program that
hashes a million bytes, the witness includes every internal
state of every hash compression step. Generating the witness
is one of the most expensive parts of proving.

The host can supply **hints**: non-deterministic values that
the guest may consume but the proof system treats as
unconstrained.

A hint that is never verified proves nothing. For primitives
the guest can cheaply verify, and most cryptographic
precompiles fall into this category, hints let the prover skip
the most expensive part of witness generation.

The witness shortcut, schematically:

![Hints comparison: without hints, prover does full computation then derives witness (both expensive); with hints, host pre-computes the witness off-line and prover only verifies with a cheap check](/diagrams/svgs/52-hints-comparison.svg)

A worked example: ECDSA signature recovery on secp256k1
inverts a group-element exponentiation. Inverting is
expensive. Verifying that a candidate exponent produces the
target group element is a single curve multiplication.

The host computes the exponent off-line and supplies it as a
hint. The precompile chip then just checks the relation.

For precompile-heavy programs, this is the single largest
source of proving-time savings.

The [Hints reference](/references/zisk-sdk/hints) explains the
API. The
[Advanced input management](/developer/proving-programs/io-advanced)
guide shows it in context.

## Trace splitting eliminates padding

A single proof covers a trace of fixed height, so any zkVM
that proves long executions has to split them into segments.

The standard approach is **checkpointed continuations**. The
machine runs for *N* steps, halts, saves the state, generates
a proof, and then resumes.

The cost is **padding**. Every chip in every segment that did
less than *N* rows of work must be padded with dummy rows that
still enter the polynomial commitment.

In a system with many chips, most of which are rarely active
in any given segment, this compounds into a large overhead.

ZisK uses **trace splitting** instead:

1. The program runs to completion in a single pass.
2. Each chip records only the rows for the operations it
   handled.
3. The prover then partitions *each chip's* trace
   independently into fixed-height segments.

Padding is limited to the *final* segment of each chip. Every
earlier segment fills to capacity. Programs with rare
precompile calls or sparse memory access get the biggest win.

This is equivalent in effect to a Jagged Polynomial Commitment
Scheme, but at the system-design layer rather than the
cryptographic layer. It does not constrain the choice of
proving system.

## Parallel by construction

Trace splitting plus the recursive aggregation tree mean every
proof on every chip can run in parallel and be combined as it
completes.

The aggregation tree is **opportunistically built**. As soon
as two child proofs are ready, an aggregation node combines
them. Branches that finish early do not wait for slower
branches.

The same property lets the prover scale across multiple worker
machines. The coordinator hands segments to workers, workers
report finished proofs back, and the tree grows from the
leaves up without any global synchronisation step.

## Parallel challenge derivation with LtHash

Most proof systems use the Fiat-Shamir transform to derive
challenges from the prover's transcript. With independent
segment provers, that becomes a problem.

Either you serialise challenge derivation, which kills the
parallelism above, or you give every segment its own
challenge, which makes the partial sums incommensurable.

ZisK uses **LtHash**, a lattice-based multiset hash function.
Its defining property is **homomorphism over multiset union**:
any subset of provers can compute their partial accumulator
independently, and the results combine by addition.

```text
LtHash({com₁, com₂})  +  LtHash({com₃, com₄})
                  =  LtHash({com₁, com₂, com₃, com₄})
```

Partial accumulators from any subset of provers can be merged
later into the full accumulator with no order constraints. The
shared challenge is broadcast to every leaf prover as a public
input.

The aggregation tree verifies at the root that the broadcast
challenge matches what the tree actually accumulated. Security
reduces to the Short Integer Solution (SIS) lattice problem,
which is post-quantum hard.

## No trusted setup, post-quantum security

ZisK proofs are STARKs over the Goldilocks prime field
(*p* = 2⁶⁴ − 2³² + 1), with FRI for low-degree testing.

STARKs require **no trusted setup**. There is no per-program
ceremony whose output you have to trust. The underlying
assumptions, namely collision-resistant hash functions plus
SIS, remain hard against quantum adversaries.

The only optional non-STARK step is the final PLONK wrap. It
is used when the proof has to be verified on an EVM chain.
Even then, the STARK output is what is being attested.

## Standard developer workflow

Programs are Rust. They are built through the ZisK Rust
toolchain and can still be debugged and tested with familiar Rust
tools. The ZisK guest runtime (`ziskos` plus `zisklib`) is a thin
library.

Calling a precompile is an ordinary function call that the
guest runtime lowers to a ZisK syscall/CSR convention which the
transpiler maps to a ZisK precompile opcode.

The build pipeline is `cargo-zisk build`. The proving pipeline
is `cargo-zisk prove`, or the `zisk-sdk` Rust crate when
proving is part of a larger application.

Nothing about writing or testing a guest program looks
unfamiliar to a Rust developer. The complexity of
zero-knowledge proofs lives entirely behind the SDK.

## Where this picks up

The principles above explain why ZisK looks the way it does.

The next section, [How ZisK works](/intro/how-zisk-works/overview),
opens up the system at an overview level. It covers the
pipeline, the host/guest model, the chips, and how the prover
scales.
