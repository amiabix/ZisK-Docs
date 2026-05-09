---
id: intro
sidebar_position: 1
title: ZisK documentation
description: Welcome to the ZisK documentation. A guided portal
  organised by depth, from a one-paragraph introduction to the
  full deeper mechanics.
---

# Welcome to ZisK

ZisK is a STARK-based zero-knowledge virtual machine (zkVM)
that executes programs compiled from standard instruction set
architectures and produces succinct, transparent proofs of
their correct execution.

ZisK targets the RISC-V ISA, allowing developers to write
ordinary Rust and C-style programs and build them through the
ZisK toolchain.

This documentation section is organised **by reading depth**.
Pick the section that matches what you are trying to do.

---

## 1. [Introduction](./introduction/overview)

A general-audience introduction to ZisK. What it is, why it
exists, what kind of artefact a ZisK proof is, and the design
principles that shape the system.

Read this first if:

- You are new to ZisK and want a quick orientation.
- You are evaluating whether ZisK fits your use case.
- You want the *why* before the *how*.

Pages:

- **[What is ZisK](./introduction/overview):** mental model,
  proof properties, trust model, and what ZisK is *not*.
- **[Background](./introduction/background):** the problem
  ZisK solves and where it sits in the zkVM landscape.
- **[Why ZisK](./introduction/why-zisk):** the design
  principles that distinguish ZisK from other zkVMs.

---

## 2. [How ZisK works](./how-zisk-works/overview)

A guided tour of the complete ZisK pipeline at an **overview
level**. It is meant for someone who wants to understand all
the pieces and how they communicate, without going into formal
definitions or deep mechanics.

Read this if:

- You can read a ZisK guest program but you want to understand
  what happens behind the scenes when you run `cargo-zisk
  prove`.
- You are going to operate or integrate ZisK and you need a
  clear picture of the moving parts.
- You want enough understanding to read the deep section
  selectively.

Pages:

- **[Overview](./how-zisk-works/overview):** the bird's-eye
  view, with the whole pipeline in one diagram.
- **[The pipeline](./how-zisk-works/pipeline):** the six
  developer-facing stages.
- **[Host & guest](./how-zisk-works/host-and-guest):** what
  runs inside the zkVM, and what stays outside.
- **[Components](./how-zisk-works/components):** the chips
  inside the prover and the buses they use.
- **[Scaling](./how-zisk-works/scaling):** how a long program
  gets proved when no single proof can hold it.

---

## 3. [Deep understanding](./deep/isa)

The full deeper mechanics.

This section covers formal definitions, exact constraint
shapes, the address map, the opcode catalogue, and the full
LtHash construction. Each topic gets its own page and goes as
deep as the design itself.

Read this if:

- You are contributing to ZisK or auditing it.
- You are integrating ZisK at a level that requires precise
  knowledge of the proof system internals.
- You read [How ZisK works](./how-zisk-works/overview) and now
  want the maths.

Pages:

- **[The ISA](./deep/isa):** the contract, covering execution
  environment, state, instruction format, and opcode
  catalogue.
- **[The processor](./deep/processor):** the implementation,
  covering the four ZisK registers, source/store modes,
  transpilation, and address map.
- **[Arithmetization](./deep/arithmetization):** how an
  execution becomes a constraint system. Covers AIRs,
  interactions, arguments, and LogUp.
- **[Chips](./deep/chips):** every chip with its proof
  obligations and bus interactions.
- **[Continuations](./deep/continuations):** trace splitting,
  the Continuation Bus, and the genesis and terminus anchors.
- **[Recursion & aggregation](./deep/recursion):** the
  aggregation tree, LtHash, and root verification.
- **[The proving pipeline](./deep/pipeline):** the full
  developer pipeline with the per-AIR STARK internals.
- **[Limits](./deep/limits):** hard upper bounds with
  real-world utilisation.

---

## And then?

When you are ready to start building, the rest of the
documentation has you covered:

- **[Writing programs](/developer/writing-programs/first-guest):**
  build your first guest program.
- **[Proving programs](/developer/proving-programs/first-proof):**
  drive the proving pipeline end to end.
- **[Operating the prover](/prover/intro):** operator-side
  topics such as emulator backends and distributed proving.
- **[References](/references/intro):** full API reference for the
  `zisk-sdk` crate, the `ziskos` guest crate, and the
  `cargo-zisk` CLI.
