---
id: processor
sidebar_position: 2
title: The processor & transpilation
description: How the ZisK ISA is implemented for proving. The four
  ZisK registers, source/store modes, transpilation from RISC-V,
  and the address map.
---

# The processor & transpilation

The previous page described what a ZisK program *is*: an RV64IMA
ELF compiled by the ZisK Rust toolchain, executing a
`(c, flag) = op(a, b)` instruction shape against host-supplied
input and optional hint-backed helper data.

This page describes how that contract is **implemented** for the
proving system: the four ZisK registers, the source/store modes
that wire them to memory and to RISC-V registers, the `copyb`
instruction, the RISC-V to ZisK transpiler, and the concrete
address map.

The bridge between Rust source and a proven execution looks like
this:

![Diagram: Rust crate · RISC-V ELF (RV64IMA) · ZisK ROM (transpiled at load) · Emulator + prover](/diagrams/svgs/20-processor-1.svg)

The ELF is what gets persisted on disk. Everything to the right of
the transpiler arrow is recomputed every time the program is
loaded; transpilation is fast enough that caching is not worth
the operational complexity.

## The four ZisK registers

The most distinctive piece of the ZisK processor model is its
register file. Where RISC-V has **32 general-purpose 64-bit
registers** (`x0` through `x31`), the ZisK processor exposes only
**four 64-bit registers** with fixed roles:

| Register | Role                                |
| -------- | ----------------------------------- |
| `a`      | First operand of the operation.     |
| `b`      | Second operand of the operation.    |
| `c`      | Result of the operation.            |
| `flag`   | One-bit auxiliary result (0 or 1).  |

The 32 RISC-V registers are still there. They are
**memory-mapped** at fixed RAM addresses (more on that in
[The address map](#the-address-map) below), at the start of the
System region following the RISC-V ABI. Register `x0` is hardwired
to zero. The four ZisK registers act as a thin wrapper: each
instruction reads its operands *into* `a` and `b` from somewhere
(immediate, memory, RISC-V register, …), runs the operation, and
writes the result from `c` (and `flag`) to somewhere.

![Diagram: immediate · 32 general-purpose registers x0…x31 · memory · immediate · a, b operand registers](/diagrams/svgs/21-processor-2.svg)

Or, equivalently, drawn the same way as the RISC-V picture but
with the four ZisK registers wrapping the 32 RISC-V ones:

![Diagram: immediate · a, b ZisK registers · memory · RISC-V registers · c, flag ZisK registers](/diagrams/svgs/22-processor-3.svg)

Why this redesign? Because fixing the operand layout to
`(c, flag) = op(a, b)` collapses every instruction to the same row
shape in the proving trace. One uniform constraint system covers
every instruction, instead of one per RISC-V opcode. The cost is a
few extra "source" and "store" modes to express where `a`, `b`,
and `c` come from and go to: a small price for the simplification
it brings to the proving system.

A side benefit: the ZisK processor isn't tied to RISC-V
specifically. The same model could host a different front-end ISA
in the future just by writing a new transpiler.

## Source and store modes

Each instruction encodes how its operands are obtained and where
its result is written. These modes are the bridge between the four
ZisK registers and everything else (immediates, memory, RISC-V
registers).

### Source for `a`

| Mode    | Description                                                  |
| ------- | ------------------------------------------------------------ |
| `IMM`   | Immediate: a constant baked into the instruction.            |
| `MEM`   | Read from a fixed memory address.                            |
| `REG`   | Read from a RISC-V register at a fixed index.                |
| `C`     | Reuse the `c` value produced by the previous instruction.    |
| `STEP`  | The current execution step counter (only for `a`).           |

### Source for `b`

Same as for `a`, except `STEP` is not available and a new mode is:

| Mode    | Description                                                                 |
| ------- | --------------------------------------------------------------------------- |
| `IND`   | Indirect: read from `mem[a + offset]`, with width 1, 2, 4, or 8 bytes.      |

### Store for `c`

| Mode    | Description                                                                 |
| ------- | --------------------------------------------------------------------------- |
| `MEM`   | Write to a fixed memory address.                                            |
| `REG`   | Write to a RISC-V register at a fixed index.                                |
| `IND`   | Indirect: write to `mem[a + offset]`, with width 1, 2, 4, or 8 bytes.       |
| `NONE`  | Discard the result.                                                         |

### Per-instruction dataflow

The full per-instruction dataflow looks like this:

![Diagram: source a (IMM / MEM / REG / C / STEP) · a · source b (IMM / MEM / REG / C / IND) · b · (c, flag) = op(a, b)](/diagrams/svgs/23-processor-4.svg)

Every row in the Main chip's trace materialises one of these
steps, with the source/store modes and the operation opcode all
encoded as fixed columns of the row.

### One step in pseudocode

The whole emulation loop, ignoring the prover side, is just:

```text
pc = ROM_ENTRY                              // 0x0000_1000
for step in 0 .. max_step
    inst   = rom.get_inst(pc)               // fetch from committed ROM
    a      = source(inst.source_a)          // resolve operand a
    b      = source(inst.source_b)          // resolve operand b
    c, flag = inst.op(a, b)                 // run the operation
    store(inst.store_c, c)                  // write the result
    if inst.end:                            // terminal instruction?
        break
    pc = inst.set_pc(flag)                  // compute next pc
```

That single loop is what the Main chip's trace materialises, one
row per iteration. Every `source(...)`, `op(...)`, and
`store(...)` call corresponds to a *constraint* on the row, which
is exactly what the proving system enforces.

### The full source/store dataflow

The diagram above is a simplified view. Spelled out with every
source mode, every store mode, and the next-pc rules, the
per-step dataflow looks like this:

![Diagram: a · b · c · flag · step](/diagrams/svgs/24-processor-5.svg)

The whole picture: 32 general-purpose RISC-V registers transformed
into 4 specific-purpose ZisK registers, with very similar
operations, but a layout much more friendly to the constraint
system.

## The `copyb` instruction

A useful idiom: when the only goal is to move a value from one
place to another (say, from memory into a RISC-V register), ZisK
provides a `copyb` instruction that simply does `c = b`. Combined
with the source/store modes above, `copyb` makes any kind of
load/store expressible without inflating the operation set.

For example, to load a value from memory into a specific RISC-V
register:

1. Set source `b = MEM(addr)`.
2. Run `copyb` so that `c = b`.
3. Set store `c = REG(idx)`.

The whole load is one ZisK instruction.

## Transpilation

Transpilation from RISC-V to ZisK happens at load time and is fast
enough to do every time the ELF is used. The transpiler reads the
ELF, walks each RISC-V instruction, and emits the matching ZisK
instruction(s) into a ROM keyed by their ZisK address.

The translation is straightforward:

1. Load the RISC-V ELF and extract code and data sections.
2. For each RISC-V instruction, emit the corresponding ZisK
   instruction(s). Most RV64IM instructions map to a single ZisK
   instruction; a few multi-step RISC-V idioms expand to short
   sequences.
3. Precompile calls, emitted through ZisK's syscall/CSR convention
   by the guest runtime, map to the matching ZisK precompile opcode.
4. Load the resulting ZisK instruction stream into the program ROM.

### The alignment problem

RISC-V and ZisK have different instruction sizes:

- **RV64IMA instructions** are 32 bits long and 32-bit aligned.
- **C-extension instructions** are 16 bits long and 16-bit aligned.
- **ZisK instructions** are 8-bit aligned (no fixed length).

Most RV64IMA instructions transpile to a single ZisK instruction
sharing the same ROM address. Atomic instructions are the
exception: they require 2, 3, or even 4 ZisK instructions, which
the transpiler packs into the contiguous non-32-bit-aligned
addresses that the RISC-V layout would otherwise leave empty.

![Diagram: I (32 bits) · M (32 bits) · ZisK (8b) ·   · ZisK (8b)](/diagrams/svgs/25-processor-6.svg)

For the atomic case, the transpiler uses the gaps:

![Diagram: A: atomic (32 bits, 4 ZisK insts) · ZisK · ZisK · ZisK · ZisK](/diagrams/svgs/26-processor-7.svg)

C-extension instructions can mix freely with 32-bit instructions
and are typically 16-bit aligned. Most C instructions map to a
single ZisK instruction; a few need two.

### A worked transpilation example

To make this concrete, suppose a RISC-V binary contains the
following instructions, starting at byte address 0:

![Diagram](/diagrams/svgs/27-processor-8.svg)

After transpilation into ZisK ROM, the same byte range looks like
this:

![Diagram](/diagrams/svgs/28-processor-9.svg)

ZisK instructions don't actually have a fixed bit length; they
are drawn as 8 bits here only because their addresses are 8-bit
aligned. The interesting bit is what happens at byte 64: the
complex `A` (atomic) instruction expands into **three** ZisK
instructions packed into the addresses RISC-V would otherwise
leave empty (72, 80) inside its 32-bit slot. The complex C
instruction at byte 144 expands into two ZisK instructions packed
into the 16-bit C slot.

## The address map

ZisK uses a 32-bit byte address space, split into regions with
distinct access policies:

| Region                      | Address range                       | Size   | Semantics                                          |
| --------------------------- | ----------------------------------- | ------ | -------------------------------------------------- |
| **Input data**              | `[0x4000_0000, 0x8000_0000)`        | 1 GB   | Written once at initialisation, read-only thereafter. |
| **ROM data**                | `[0x8000_0000, 0x8800_0000)`        | 128 MB | Program constants, read-only.                      |
| **System region**           | `[0xA000_0000, 0xA001_0000)`        | 64 KB  | Memory-mapped registers (32 RISC-V GPRs at the start), UART, CSR registers. |
| **Output data**             | `[0xA001_0000, 0xA003_0000)`        | 128 KB | Public outputs written during execution.            |
| **Program memory**          | `[0xA003_0000, 0xC000_0000)`        | ~512 MB | General-purpose read/write RAM (heap + stack).     |

The reserved output-memory region is larger than the public-output
surface exposed by the current runtime. `ziskos::io::commit()` and
`commit_slice()` write into 64 public 32-bit slots, so normal guest
public output is capped at 256 bytes.

![ZisK address map: input data (1 GB) at 0x4000_0000, ROM data (128 MB) at 0x8000_0000, unmapped gap, system region (64 KB) at 0xA000_0000, output data (128 KB) at 0xA001_0000, program memory (~512 MB) at 0xA003_0000 up to 0xC000_0000](/diagrams/svgs/63-address-map.svg)

The 32 RISC-V general-purpose registers `x_0, …, x_31` are
memory-mapped at the start of the System region (`0xA000_0000`),
each occupying 8 bytes, following the RISC-V ABI. Register `x_0`
is hardwired to zero. Because registers live in the same address
space as data memory, the **memory-consistency argument covers
both uniformly**: no separate register file needs to be
constrained.

### Region access policies

Each region's access policy is enforced by the proving system:

| Region                      | Access policy                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| **Program code** (in ROM)   | Read-only via the ROM Bus. Hashed into a commitment at setup time.                                  |
| **ROM data**                | Immutable. Written once at init, read-only thereafter. Enforced by the arithmetization, not the ISA. |
| **Mutable RAM** (system + program memory) | Full read/write through the Memory Bus.                                              |
| **Output data**             | Append-only via the dedicated public-output instruction (`pubout`).                                 |
| **Input data**              | Free-input region. Multiple reads of the same address at the same step are allowed.                 |

The native unit of memory access is an aligned **8-byte word**.
Sub-word and unaligned accesses are decomposed by a dedicated
**MemAlign** chip (covered on the [Chips](./chips) page) into one
or two aligned 8-byte operations before they hit the Memory Bus.

## Where this picks up

You now have the implementation picture: how the ISA's
`(c, flag) = op(a, b)` shape becomes one fixed row layout via the
four ZisK registers and the source/store modes, how RISC-V code
gets transpiled into ZisK ROM, and where every byte of memory
lives.

The next page, [Arithmetization](./arithmetization), explains how
that execution is turned into a constraint system the prover can
prove.
