---
id: limits
sidebar_position: 9
title: Limits
description: Hard upper bounds on input size, ROM/RAM use, trace
  size, execution length, and physical-memory requirements, with
  real-world utilisation as a yardstick.
---

# Limits

Every system has limits. ZisK can prove a lot, but it cannot prove
*infinite* computations on *infinite* hardware. This page lists the
hard upper bounds the current design imposes, and shows what
fraction of each limit a real workload actually consumes.

For the vast majority of use cases the current limits are more than
enough. You only need this page if your program is unusually large,
its execution is unusually long, or your hardware is constrained.

The "real workload" reference throughout is **Ethereum-block
validation**: a guest program that validates a single Ethereum block
end-to-end. It is one of the heaviest workloads ZisK is currently
used for, so it gives a good sense of the headroom available.

## Summary table

| Resource                         | Limit            | ETH block validator | Headroom |
| -------------------------------- | ---------------- | -------------------- | -------- |
| **Input size**                   | < 1 GB           | 20 MB                | ~98 %    |
| **ROM size** (program code)      | 127 MB           | 4 MB                 | ~97 %    |
| **RAM size** (heap + stack)      | 511.75 MB        | 256 MB               | ~50 %    |
| **Trace size** (memory ops)      | 32 GB            | 7 GB                 | ~78 %    |
| **Max steps**                    | 2³⁶ (≈ 64 G)     | 2 G                  | ~97 %    |
| **Program length** (instructions)| 2²² (≈ 4 M)      | 600 k                | ~86 %    |
| **Physical memory (Assembly)**   | ≥ 64 GB          | n/a                  | n/a      |
| **Physical memory (Rust)**       | ≥ 32 GB          | n/a                  | n/a      |
| **Memory count & plan slots**    | 6 GB             | < 2 GB               | ~67 %    |

The rest of the page explains where each limit comes from and what
it would take to raise it.

## Input size

The maximum size of the binary input handed to the guest.

The Assembly emulator receives input via a **shared-memory** region
that supports zero-copy access. The shared region is 1 GB; some of
that is consumed by per-chunk header overhead, so the practical
input limit is *just under* 1 GB.

A typical Ethereum-block validation needs **15–20 MB** of input,
about **2 %** of the limit.

Raising the limit would require modifying the PIL, reserving more
virtual address space for the assembly binary, and consuming more
physical memory.

A planned alternative is **input streaming**: the same shared region
operated as a ring buffer, supporting unbounded input streams at the
cost of giving up the zero-copy property. See
[Input streaming](/developer/proving-programs/io-advanced) for the
SDK side of this story.

## ROM size

The maximum size of the program code plus its constant data, i.e.
the program ROM as laid out in the address map.

The ROM Data region is allocated at
`[0x8000_0000, 0x8800_0000)` (**128 MB total**). About 1 MB at the
end (`0x87F0_0000`+) is reserved for the software float library
(used only when the F/D extensions are present), leaving an
effective **127 MB** for user program code.

An Ethereum client typically uses **4 MB**, about **3 %** of the
effective limit.

Raising the limit requires PIL modifications, more virtual address
space for the assembly binary, and more physical memory.

## RAM size

The maximum size of the program's mutable RAM (heap + stack).

ZisK's writable-RAM region is `[0xA000_0000, 0xC000_0000)`
(512 MB total) split as follows:

| Region            | Address range                       | Size    |
| ----------------- | ----------------------------------- | ------- |
| **System region** | `[0xA000_0000, 0xA001_0000)`        | 64 KB. RISC-V GPRs at the start, plus UART/CSR registers. |
| **Output data**   | `[0xA001_0000, 0xA003_0000)`        | 128 KB. Public outputs.                                   |
| **Program memory** | `[0xA003_0000, 0xC000_0000)`       | ~511.75 MB. Heap + stack. (A small tail near `0xBFFF_0000` is reserved by the float library.) |

The effective program-RAM limit is **~511.75 MB**.

A heavy Ethereum block can consume up to **256 MB**, about **50 %**
of the limit.

Note that the Ethereum guest uses a memory manager that *does not
free memory* (a deliberate trade-off for execution speed). Switching
to a freeing allocator would lower the RAM usage at the cost of
some performance.

Raising the limit requires PIL modifications, more virtual address
space, and more physical memory.

## Trace size

The maximum size of the *minimal trace*, the memory-operations
trace generated during execution.

The trace occupies the address range `0xD000_0000` to
`0x08_CFFF_FFFF`, leaving up to **32 GB** of trace space.

An Ethereum-block validation typically takes up to **7 GB**,
about **22 %** of the limit.

Raising the trace size in the current architecture requires more
physical memory (since the assembly binary reserves the trace
region at link time) but does *not* require PIL changes. It
could in principle be configurable at compile time.

## Max steps

The maximum number of execution steps in a single proof.

Currently capped at **2³⁶ ≈ 68.7 G steps** by the PIL configuration.

An Ethereum block typically takes up to **2 G steps**, about
**3 %** of the limit.

Raising this requires PIL configuration changes.

## Program length

The maximum number of *distinct* instructions in the program (not
the total number of instructions executed).

Currently **2²² ≈ 4 M instructions**, set by the PIL configuration.

An Ethereum client uses about **600 k instructions**, about **14 %**
of the limit.

Raising this requires either increasing the ROM AIR length or
adding inner continuations for the ROM AIR. Either path requires
PIL changes and a fresh ZisK setup.

## Physical memory (Assembly emulator)

The minimum physical memory the prover needs to run the Assembly
emulator: currently **≥ 64 GB**, dominated by the virtual memory
the assembly binary reserves at link time (the 32 GB trace shared
region plus headroom).

## Physical memory (Rust emulator)

The minimum physical memory required for the Rust emulator
(`ziskemu`): currently **≥ 32 GB**.

If you need to operate ZisK on hardware below the Assembly limit,
the Rust emulator with the `-l` / `--emulator` flag is the path:
slower, but with the smaller memory footprint.

## Memory count & plan slots

A separate cap on the slots used during the memory count-and-plan
phase: currently **6 GB**.

An Ethereum client uses up to **2 GB**, about **33 %** of the
limit.

If a run exceeds it, the prover surfaces a clear error message:

```text
ERROR: MemCounter: no free slots left for this thread.
Increase MAX_SLOT_GB in state-machines/mem-cpp/cpp/mem_config.hpp
and recompile zisk.
```

The fix is a one-line change in `state-machines/mem-cpp/cpp/mem_config.hpp`
followed by a recompile.

## When the defaults aren't enough

Most of these limits exist because the assembly binary reserves
virtual address space at link time, which the OS only honours below
the available physical memory. Raising any of them therefore tends
to require:

1. A PIL (Polynomial Intermediate Language, the constraint
   description language ZisK circuits are written in) change to
   permit the larger circuit dimension.
2. A new ZisK setup (because the program verification key and proving
   artifacts reflect the PIL).
3. More physical memory on the prover host.

If you find yourself bumping into one of these limits, please open
an issue describing the workload. The right fix usually depends
on which limit is binding and what the workload actually needs.

## Where this picks up

Limits closes the deep section. With the constraints understood,
you have the full picture of what ZisK supports and where its
ceilings sit.

To start building, head to
[Writing programs](/developer/writing-programs/first-guest)
or [Proving programs](/developer/proving-programs/first-proof).
