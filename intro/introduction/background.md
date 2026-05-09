---
id: background
sidebar_position: 2
title: Background
description: The problem ZisK solves, and where it sits in the
  zkVM landscape.
---

# Background

This page assumes you have read [What is ZisK](./overview).

Zero-knowledge proofs are powerful but historically painful to
use. zkVMs are the response. ZisK is one specific point in
that design space, shaped by trade-offs every zkVM designer
must make.

## A short history of zero-knowledge proofs

Zero-knowledge proofs as a *cryptographic* concept go back to the
1980s, but they only became *practical* relatively recently. The
shift came in three waves, each one expanding the range of things a
ZK proof could plausibly be used for.

### SNARKs and the proving-system bloom

The first practical wave was the rise of **SNARKs** (Succinct
Non-interactive ARguments of Knowledge): proof systems whose
proofs are short, fast to verify, and produced without requiring
any back-and-forth between prover and verifier. Frameworks like
Groth16 and PLONK made it tractable to express small circuits and
generate proofs for them on commodity hardware.

The catch was a **trusted setup**: SNARK schemes typically require
a one-time ceremony whose secret randomness must be honestly
discarded. If anyone retains it, they can forge proofs. The setup
is per-circuit (or, with universal schemes, per-curve), and getting
its security right is a non-trivial operational concern.

### STARKs and the post-quantum turn

The next wave was **STARKs** (Scalable Transparent ARguments of
Knowledge): proof systems built on collision-resistant hash
functions and polynomial commitments rather than elliptic-curve
pairings. The trade-off is larger proofs, but two things are gained:

- **No trusted setup.** A STARK's parameters are public; there's no
  ceremony whose output you have to trust.
- **Post-quantum security.** The underlying assumptions
  (collision-resistant hashing, low-degree testing) are believed to
  remain hard against quantum adversaries.

STARKs made it possible to prove much larger computations and to
operate proving systems without an ongoing trust burden, at the
cost of producing larger proofs, which then motivated the third
wave.

### Recursion and aggregation

The third wave was the realization that a verifier is itself a
computation, and so a proof of a verifier *running* is itself a
proof. **Recursive proof systems** turn this into a tool: many
small proofs can be combined into one, and one proof system's
output can be re-proved in another (smaller, faster-to-verify)
proof system.

This is what made the practical pattern of "prove with a STARK,
wrap with a SNARK for on-chain verification" possible, and what
makes proving systems horizontally scalable, since independent
proofs can be aggregated up a tree.

ZisK uses all three layers: STARKs over the Goldilocks prime field
for the per-segment proofs, recursion for aggregating them, and
optional PLONK wrapping for on-chain verification.

### Why zkVMs are now plausible

With these primitives in hand, the cost of proving a
general-purpose computation dropped enough that the question
shifted from "can we prove a circuit at all?" to "can we prove an
*arbitrary program* fast enough to be useful?" That is exactly the
problem zkVMs answer.

## From circuits to zkVMs

The first generation of zero-knowledge systems asked developers to
express their computation as an **arithmetic circuit**, a flat
graph of additions and multiplications over a finite field. Tools
like Circom and Halo2 made this practical, and the resulting circuits
could be hand-tuned for tight constraint counts and freely paired
with different proof backends.

The cost was the developer model. Every new computation needed a
custom circuit, custom security review, and ongoing maintenance.
There was no incremental compilation, no library reuse in the
usual sense, no familiar testing tools. Building a ZK application
looked nothing like building any other kind of software.

**Zero-knowledge virtual machines** changed that. The idea is to
build *one* general-purpose circuit, a circuit that verifies the
correct execution of programs targeting a known instruction set
architecture, and then let developers write ordinary programs in
ordinary languages. The circuit proves "this program ran correctly
on this input"; the developer never writes a constraint.

That moves all the engineering effort from "write a new circuit per
application" to "write one general circuit, once, and it lets
the proving system be reused across millions of programs".

The trade-off is precision: a circuit hand-tuned for a single task
will always have fewer constraints than a general-purpose circuit
running that same task as a program. zkVM design is, in large
part, the work of recovering as much of that precision as possible
without giving up the developer experience.

## The two flavours of zkVM

zkVMs sit on a spectrum between developer experience and proving
efficiency.

### ZK-native ISAs

Some zkVMs (Cairo, Valida) define instruction sets whose semantics
align naturally with finite-field arithmetic. The constraint
representation is compact because the operations were chosen to be
cheap to constrain in the first place.

The downside is that developers have to adopt a new programming
model: new compilers, new toolchains, new debuggers, new
libraries. Mainstream Rust or C/C++ code does not run on a Cairo
machine without significant porting effort.

### Standard ISAs

Other zkVMs target a mainstream ISA: RISC-V in every case to date.
Programs are compiled through a RISC-V-capable toolchain, so the
developer keeps the familiar language, package, and library model.

The downside is that a general-purpose register machine is
*expensive* to constrain step by step. Operations that look trivial
in hardware (integer division, bitwise logic, unaligned memory
loads) translate into many polynomial constraints, and a naive
implementation pays for that on every instruction.

The interesting design problem for a standard-ISA zkVM is therefore
*how to keep proving fast despite using a general-purpose ISA*.
Different systems make different choices.

## What every zkVM has to choose

Beyond the ISA-flavour question, every zkVM design makes five other
decisions that shape its performance profile and its developer
experience.

### Proof system

The choice between SNARKs, STARKs, or a hybrid affects nearly
everything downstream:

- **Pure SNARK:** small proofs, on-chain-friendly, but a trusted
  setup is required and the underlying pairings are not
  post-quantum.
- **Pure STARK:** no trusted setup, post-quantum, but proofs are
  larger and on-chain verification is more expensive.
- **STARK + SNARK wrap:** STARKs do the heavy lifting, with an
  optional final SNARK wrap for on-chain verification. ZisK falls
  in this category.

### Field

Every proof system operates over some finite field. The choice
balances arithmetic efficiency against soundness:

- **Large prime fields:** match cryptographic primitive needs but
  are slower for general arithmetic.
- **Small "STARK-friendly" fields** like Goldilocks
  (*p* = 2⁶⁴ − 2³² + 1), Mersenne, or BabyBear: fit native
  64-bit (or 32-bit) operations, dramatically faster on commodity
  CPUs, with extension fields used to recover soundness.

ZisK uses Goldilocks, which maps cleanly onto 64-bit RISC-V
arithmetic.

### Continuation strategy

A single proof can only cover a fixed-height trace, so any zkVM
that proves long programs has to split the execution into
segments. Two broad approaches:

- **Checkpointed continuations:** run for *N* steps, halt, save
  the state, prove, resume. Simple but introduces padding overhead
  in every chip in every segment.
- **Trace splitting:** run the whole program first, then partition
  each chip's trace independently into segments. Eliminates most
  padding but introduces cross-chip and cross-segment consistency
  problems that have to be solved at the recursion layer.

ZisK uses trace splitting; the
[Continuations](/intro/deep/continuations) page (in the *Deep
understanding* section) explains why that's a meaningful
difference.

### Precompile model

Cryptographic primitives (hash functions, ECDSA, pairings) are
expensive to express as plain RISC-V instructions but appear
constantly in real workloads. zkVMs differ in how they expose
"native" implementations:

- **No precompiles:** every primitive runs as RISC-V code, simple
  but slow.
- **Fixed precompile set:** a small built-in catalog, fast for
  what's there but inflexible.
- **Extensible precompiles:** adding a new precompile is a
  well-defined operation, often as simple as adding a new chip
  with the right interface. ZisK falls here.

### Witness-acceleration model

Beyond constraint representation, the prover has to *fill in* the
witness. Some primitives can be accelerated by feeding the prover
**hints** (non-deterministic data the guest can verify but does
not have to compute). Whether and how a zkVM exposes this is its
own design axis, and a major source of proving-time savings for
precompile-heavy programs.

## Where ZisK fits

ZisK is in the standard-ISA camp. Programs are written in Rust,
compiled to RV64IMA by the ZisK Rust toolchain, and converted to
ZisK instructions at load time by a static transpiler. From the
developer's point of view, the language, package model, and normal
Rust testing workflow remain familiar.

What changes is what happens behind that ELF. Rather than constrain
a general-purpose CPU step-by-step, ZisK uses a **modular
architecture**: the proof is split across many small specialized
sub-circuits ("chips"), each optimized for one class of operations,
and stitched together by a bus-based consistency argument.

In terms of the design axes above, ZisK's specific position is:

- **ISA:** standard (RV64IMA), with optional F/D/C extension support.
- **Proof system:** STARK over Goldilocks, with optional PLONK
  wrap for EVM verification.
- **Continuation strategy:** trace splitting, not checkpointing.
- **Precompile model:** extensible, with a growing catalog of
  blockchain-relevant primitives (SHA-256, Keccak-256, BLAKE2b,
  secp256k1 / r1, BN254, BLS12-381, modexp, KZG, DMA).
- **Witness acceleration:** hints, with first-class SDK support and
  hint-aware setup.
- **Scaling model:** per-chip parallelism plus distributed proving
  via a coordinator/worker architecture.

## Where this picks up

Background covered the problem ZisK solves and where it sits
in the zkVM landscape.

The next page, [Why ZisK](./why-zisk), walks through the design
principles that fall out of these choices.
