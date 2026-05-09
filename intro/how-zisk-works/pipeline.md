---
id: pipeline
sidebar_position: 2
title: The pipeline
description: A six-stage tour of how a Rust program becomes a
  verified ZisK proof, at an overview level.
---

# The pipeline

This is the first stop on the *How ZisK works* tour. Before
opening up any individual stage, this page lays out the whole
flow from the developer's point of view: the six commands, the
six artifacts, and the order they happen in.

A ZisK proving run goes through **six developer-visible stages**.
Each addresses a distinct concern; the CLI and the SDK both
expose them explicitly, so you can drive them one at a time or
fold them into a single call.

![Six-stage pipeline: compile → setup → execute → prove → wrap → verify](/diagrams/svgs/01-pipeline.svg)

This page walks each stage at an overview level.

For the chronological walkthrough of all six stages, see
[Lifecycle of a proof](./proof-lifecycle).

For the per-AIR (Algebraic Intermediate Representation, the
constraint shape each chip uses) STARK internals and exact
CLI/SDK surface, see
[Deep understanding → The proving pipeline](/intro/deep/pipeline).

## 1. Compile

Build the guest program from Rust to a **RISC-V ELF binary**
(an executable file in the standard format Linux uses for native
binaries; the prover will load and execute it inside the zkVM).

The ZisK Rust toolchain is the standard one with a few
customised linker scripts; everything you'd expect from `cargo`
works.

```bash
cargo-zisk build --release
```

The output sits at
`target/elf/riscv64ima-zisk-zkvm-elf/release/<crate>` (where
`<crate>` is your guest crate name, e.g. `hello-world-guest`)
and is the exact program the prover will run.

## 2. Setup

Compute the **proving key** for the compiled binary: a bundle
of cached data the prover needs to produce proofs of *this
specific* program.

It also produces the matching **program verification key**, the
per-binary ROM commitment that verifiers later use to confirm a
proof was generated for that exact program.

```bash
cargo-zisk program-setup
```

This is a one-time cost per binary. The same keys are reused
across every subsequent proving run, no matter what input you
give.

Internally, setup hashes the program code into a fingerprint
(so a verifier can confirm a proof was produced for the exact
binary they expect) and pre-computes some lookup tables the
prover will need.

If the program uses
[precompiles](./components#precompiles-briefly) and you intend
to prove with hints, setup also prepares the hint-compatible
variant of the proving artifacts.

## 3. Execute

Run the guest in an emulator **without producing a proof**.
Useful as a sanity check before paying for proving:

```bash
cargo-zisk execute -i <input-file>
```

Same logic runs, same outputs are committed, but no arithmetic
proof is generated. Catches logic bugs quickly before you pay the
cost of proving.

## 4. Prove

Generate the actual proof. This is the only expensive stage:

```bash
cargo-zisk prove -i <input-file>
```

Internally, proving is a multi-step pipeline (emulation, witness
generation, per-chip STARKs, aggregation, root proof).

At an overview level, the takeaway is just "this is the stage
that turns the execution trace into a proof, and it can be
parallelised."

## 5. Wrap (optional)

The default proof is a **STARK**: a kind of zero-knowledge
proof that doesn't need a trusted ceremony to set up. STARKs are
fast to generate but large to send around. If you need a
different shape of proof, wrap it:

| Output              | Use when                                            | Flag        |
| ------------------- | --------------------------------------------------- | ----------- |
| **STARK**           | Local verification, internal pipelines (default).   | *(none)*    |
| **Minimal STARK**   | Smaller off-chain proof artifact.                   | `--minimal` |
| **PLONK**           | On-chain verification by an EVM Solidity contract.  | `--plonk`   |

The PLONK variant wraps the STARK in a SNARK that an EVM
contract can verify cheaply on-chain. Without the wrap, the
STARK output stands as the proof.

## 6. Verify

Check the proof against its embedded program verification key and
public values:

```bash
cargo-zisk verify -p proofs/proof.bin
```

Verification is **fast and constant**, independent of how
expensive the original computation was. A proof of a million
instructions verifies in roughly the same time as a proof of a
thousand.

A complete verification has three parts that are easy to mix up:

1. The proof is valid (this is what the command above checks).
2. The guest program is the one you expected (compare its
   program verification key against an audited one).
3. The committed public values match what your application
   requires (read them back, assert).

A proof of a valid but irrelevant computation is still useless.
Applications must check (3) explicitly.

## Where this picks up

The next page, [Host & guest](./host-and-guest), zooms into what
actually runs inside the zkVM during the *Execute* and *Prove*
stages: the two-process model, the input streams, the public
outputs, and the trust boundary between them.
