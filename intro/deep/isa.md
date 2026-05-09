---
id: isa
sidebar_position: 1
title: The ISA
description: The ZisK instruction set. Execution environment,
  state, instruction format, phantom instructions, execution model,
  and opcode catalogue.
---

# The ISA

The ZisK instruction set architecture (ZisK ISA) specifies the
**computational model that ZisK proves correct**: the execution
environment, the machine state, the instruction format, and the
full set of operations.

Because the ZisK ISA is a *virtual* ISA (not targeting any
physical hardware) its design can prioritise properties that
simplify zero-knowledge proof generation rather than properties
that suit a particular microarchitecture.

The ISA is shaped by two design goals:

1. **Compatibility** with RISC-V, so that programs written in
   standard languages can be built through a familiar Rust/C-style
   workflow for the ZisK target.
2. **Efficiency** for proving: operations that would be expensive
   to constrain step-by-step in the main execution circuit
   (elliptic-curve arithmetic, hash functions, bulk memory
   transfers) are exposed as **precompile instructions**, each
   handled by a dedicated, optimised sub-circuit (see
   [Chips](./chips)).

This page focuses on the **contract**: what programs are allowed
to do and what the proof system attests to. The implementation
(the four ZisK registers, the source/store modes, transpilation
from RISC-V, the address map) lives on the next page,
[The processor](./processor).

## Compatibility with RISC-V

ZisK targets the RISC-V ISA, specifically **RV64IMA** as the
baseline. That gives us:

- **64-bit registers and operations** (better proving performance
  than 32-bit).
- **32-bit instruction encoding** for the base extensions.
- The three core extensions:
  - **I:** base integer instructions
  - **M:** integer multiplication and division
  - **A:** atomic memory instructions

Three optional extensions are supported to accommodate compilers
beyond Rust (C, C#, Go, etc.):

| Extension | What it adds                          | Trade-off in ZisK                                                                                          |
| --------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **F**     | Single-precision floating-point.       | Implemented via a software float library; float operations are very expensive to constrain. Use sparingly. |
| **D**     | Double-precision floating-point.       | Same as F: software emulation, slow.                                                                       |
| **C**     | Compressed (16-bit) instructions.      | Useful for hardware-RISC-V code locality. ZisK does not consume RISC-V code directly, so almost no impact on proving. |

Precompile calls (SHA-256, Keccak-256, secp256k1 operations, and the
rest) are expressed by the guest runtime through a ZisK syscall/CSR
calling convention. The transpiler recognises that convention and maps
it to the matching ZisK precompile opcode. From the guest's
perspective, calling a precompile looks like calling any other Rust
function.

## Execution environment

Programs in ZisK are executed inside a **virtual machine** (VM).
The VM is a *state machine*: execution proceeds as a sequence of
discrete steps, each step transforming the current **guest state**
(registers, memory, program counter) according to one instruction.

The VM is itself hosted on a physical machine (the **host**)
which maintains data outside the guest. The ZisK runtime provides
specific interfaces through which the guest can read host-supplied
input and write committed public output.

![Host / VM split: host state (input + hint streams) flows into deterministic ZisK VM; guest may request inputs/hints back from host](/diagrams/svgs/41-isa-1.svg)

This host/guest split is central to ZisK's trust model. The guest
runs in a fully deterministic, sandboxed environment: every value
it operates on is either derived from the program ROM, loaded from
memory, or explicitly received from the host through a typed
channel. The host can supply two kinds of values:

- **Execution input:** values serialized into `ZiskStdin` and
  copied into the Input Data region as the guest reads them. These
  bytes are private witness data unless the guest explicitly commits
  them, or a statement about them, as public output.
- **Hints:** non-deterministic helper data used by hint-enabled
  precompile and witness-generation flows. The guest may act on a
  hint-backed value, but **must verify any property it relies on**.
  The proof system treats hints as unconstrained. *A hint that is
  never verified proves nothing.*

Both streams are untrusted until the guest verifies them.

The key property of this model is that **everything the guest
touches is constrained by the VM's arithmetization**:

- Registers are mapped into memory, so the memory consistency
  argument covers both uniformly.
- Program code is validated by the ROM Bus on every fetch.
- Public outputs become explicit proof data.

The host state, by contrast, lies outside the proof system and is
trusted by convention. That is what makes the "verify before you
trust a hint" rule load-bearing.

## State

The VM execution state is everything that changes from one step to
the next. It is divided into the **guest state** (manipulated by
the program) and the **host state** (maintained externally and
supplied before or during execution).

| Component        | Symbol           | Mutable? | Held by |
| ---------------- | ---------------- | -------- | ------- |
| Program ROM      | (program code + ROM data) | No  | guest   |
| Program counter  | `pc_t`           | Yes      | guest   |
| Data memory      | `mem_t[]`        | Yes      | guest   |
| Public outputs   | `out_t[]`        | Yes (append-only) | guest |
| Input stream     | `in[]`           | No (consumed) | host/prover |
| Hint source      | `hint[]`         | No (consumed) | host/prover |

Formally, the guest state at step *t* is

```text
S_t = (pc_t, mem_t[], out_t[])
```

and the host-supplied data is `H = (in[], hint[])`.

### Program ROM

A ZisK program consists of two parts:

- **Program code:** maps 32-bit instruction addresses to ZisK
  instructions. Loaded into the VM before execution begins.
- **ROM data:** an immutable data segment holding program
  constants (string literals, lookup tables, static data embedded
  in the binary).

Both are determined entirely by the program binary: identical
across every execution of that program, regardless of the inputs
provided. Once the program is fixed, neither code nor ROM data can
change. No instruction can modify them and they play no role in
the per-step state transitions.

This is the classical **Harvard architecture**: code and data
live in distinct address spaces and are governed by different
access rules.

The two parts are committed and validated by **distinct
mechanisms**:

| Part            | Validation                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| **Program code** | Committed during setup into a program verification key/ROM commitment included with the proof. The Main chip queries this committed table on every instruction fetch via the ROM Bus. No instruction can be substituted without invalidating the commitment. |
| **ROM data**    | Treated as a region of *immutable memory*. Written once at initialisation; thereafter only reads are permitted. The immutability is enforced by the arithmetization, not by the ISA: from the program's view, reads from ROM data are indistinguishable from reads from writable RAM. |

### Public outputs

The guest can explicitly expose values as public outputs. They are
written internally by a dedicated public-output instruction and
become part of the proof's public data: what the verifier sees and
can assert against.

### Input stream and hint source

The host-side proving flow can provide two input sources:

- **Input stream:** a `ZiskStdin` queue consumed by guest reads.
  The verifier does not see the contents unless the guest commits
  them or a derived statement.
- **Hint source:** non-deterministic helper data supplied to
  hint-enabled proving flows. The proof system treats hints as
  unconstrained; the guest or precompile constraints must verify any
  property relied on before acting on a hint.

Both streams are consumed by copying data into guest memory via
explicit instructions (e.g. `dma_inputcpy` for the input stream).
Any value received from the host is **untrusted until the guest
has verified it**.

The high-level address map (where the Input data region, ROM Data
region, and writable RAM live) is on the
[processor page](./processor#the-address-map).

## Instruction format

Every ZisK instruction is specified by:

- An **opcode** determining the operation to perform.
- A **source for `a`** specifying how to obtain the first input
  operand.
- A **source for `b`** specifying how to obtain the second input
  operand.
- A **store for `c`** specifying where to write the result.

Each instruction performs an operation over two input operands,
producing an output and a flag:

```text
(c, flag) = op(a, b)
```

where `a, b, c ∈ [0, 2^64)` and `flag ∈ {0, 1}`. In essence, each
instruction is a single execution step that transforms two 64-bit
inputs into a 64-bit output and a boolean flag. The full opcode
catalogue lives in
[`zisk_ops.rs`](https://github.com/0xPolygonHermez/zisk/blob/main/core/src/zisk_ops.rs)
and is summarised by category at the [bottom of this page](#opcode-catalogue-by-category).

The concrete machinery that implements this shape (the four
ZisK registers `a`, `b`, `c`, `flag`, and the source/store modes
that wire them to memory and to the 32 RISC-V registers) is
described on the [next page](./processor#the-four-zisk-registers).

### The program counter

The program counter `pc` is a special-purpose register that stores
the address of the instruction currently being executed. After
every instruction it advances; three rules cover every
control-flow case:

| Rule                                              | When                                   |
| ------------------------------------------------- | -------------------------------------- |
| `pc ← c + offset`                                 | Jumps through a register (the `c` value carries the target). |
| `pc ← pc + taken_offset`                          | Conditional branch when `flag == 1`.   |
| `pc ← pc + not_taken_offset`                      | Conditional branch when `flag == 0`.   |

Because the offsets are constants encoded in the instruction, the
constraint system can model any control-flow pattern with the same
fixed row shape.

## Phantom instructions

The opcode determines the operation performed by the instruction.
Most instructions correspond to a single provable opcode and
generate a proof obligation for that operation. Some, however, are
**phantom instructions**: they leave the guest state unchanged
(acting as no-ops from the VM's perspective) but may trigger side
effects in the host state (such as advancing the input or hint
streams or emitting debug information).

Phantom instructions appear in the main execution trace but carry
no proof obligation of their own. Two notable cases:

- **Helper dispatch:** phantom instructions can implement host-helper
  and precompile-adjacent calling conventions (passing parameters,
  triggering the call, retrieving results). What gets *proven* is the
  checked computation or relation, not the bookkeeping instructions in
  the Main trace.
- **Halting:** the `halt` instruction terminates the emulator
  immediately with an error condition. Its opcode cannot appear in
  a valid execution trace. If it is ever reached, proof generation
  fails. It is present in the ISA as a sentinel for invalid or
  unreachable code paths.

## Execution model

The execution model defines how the VM transitions between states,
what constitutes a valid execution, and how the prover commits to
the result.

### Initial state

Execution begins at the entry point with an empty output buffer
and memory initialised from the program binary:

```text
S_0 = (pc_0, mem_0[], [])
```

where `mem_0[]` reflects the pre-loaded ROM data and input data,
with all writable memory otherwise zeroed.

Specifically:

- The ROM Data region is populated with program constants from the
  binary.
- The Input Data region is loaded from the execution input stream.
- All registers (memory-mapped at the start of the System region)
  are set to zero.
- All other writable memory is zeroed.

### Transition function

At each step, the VM fetches the instruction at the current
program counter from the committed ROM, executes it, and advances
the guest state. The host supplies input and hint values
`H = (in[], hint[])` on demand. The single-step transition is

```text
S_{t+1} = Step(S_t, H)
```

where `Step` is fully determined by the ZisK ISA: it decodes the
instruction at `pc_t`, evaluates the operation, updates
`mem_{t+1}[]` and `out_{t+1}[]`, and sets `pc_{t+1}` according to
the instruction's control-flow semantics.

### Terminal condition

A *T*-step execution is **successful** if every transition is
valid and the final program counter reaches a designated exit
address.

Execution **fails** if any step violates the ISA's invariants:

- An invalid opcode is encountered.
- An out-of-bounds memory access is performed.
- The `halt` instruction is reached.
- The program counter fails to reach the exit address at the end
  of execution.

A failed execution cannot be proved.

## Opcode catalogue (by category)

The full opcode catalogue lives in
[`zisk_ops.rs`](https://github.com/0xPolygonHermez/zisk/blob/main/core/src/zisk_ops.rs).
At a glance, instructions are grouped into these categories:

| Category         | Examples                                                                                            | Handled by                              |
| ---------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Internal**     | `flag`, `copyb`, `halt`                                                                             | Main chip directly.                     |
| **Fcall**        | `fcall_param`, `fcall`, `fcall_get`: host-helper calls used for flows such as input readiness and hint-backed helpers. | Phantom in Main; any relied-on result must be checked by guest logic or a precompile. |
| **Pubout**       | `pubout`: emit a public output.                                                                     | Main chip; Output data region.          |
| **Binary** (64-bit + 32-bit `_w` variants) | `add`, `sub`, `and`, `or`, `xor`, `lt`/`ltu`, `eq`, `min`/`max`, …          | Binary chip.                            |
| **BinaryEx**     | `sll`, `srl`, `sra`, `signextend_*` (and 32-bit variants).                                         | Binary-extended chip.                   |
| **ArithAm32**    | `mul`, `mulh`, `mulu`, `div`, `rem` (and 32-bit variants).                                          | Arith chip.                             |
| **ArithA32**     | 32-bit `divu_w`, `remu_w`, `div_w`, `rem_w`.                                                        | Arith chip.                             |
| **DMA**          | `dma_memcpy`, `dma_memcmp`, `dma_inputcpy`, `dma_xmemcpy`, `dma_xmemcmp`, `dma_xmemset` (and internals). | DMA precompile.                  |
| **BigInt**       | `add256`.                                                                                           | BigInt precompile.                      |
| **ArithEq**      | `arith256`, `arith256_mod`, `secp256k1_*`, `secp256r1_*`, `bn254_curve_*`, `bn254_complex_*`.       | 256-bit arithmetic precompile.          |
| **ArithEq384**   | `arith384_mod`, `bls12_381_curve_*`, `bls12_381_complex_*`.                                         | 384-bit arithmetic precompile.          |
| **Keccak**       | `keccak`.                                                                                           | Keccak precompile.                      |
| **Sha256**       | `sha256` (one compression).                                                                         | SHA-256 precompile.                     |
| **Blake2**       | `blake2` (one round of BLAKE2b compression).                                                        | BLAKE2 precompile.                      |
| **Poseidon2**    | `poseidon2`.                                                                                        | Poseidon2 precompile (ZK-friendly hash). |

Each precompile instruction is implemented by an independent chip
(see [Chips](./chips)). Adding a new precompile means defining a
new chip and a new opcode group; existing categories are not
touched.

## Hard limits

The ISA is bounded: there is a maximum input size, a maximum ROM
size, a maximum program length, and so on. The full table,
including how much of each limit a real Ethereum block validator
actually consumes, is on the [Limits](./limits) page.

## Where this picks up

You now know what a ZisK program *is* in contract terms: an
input-plus-hints host model, a committed ROM split into code and data,
a four-register `(c, flag) = op(a, b)` instruction shape, an
explicit execution model, and a catalogued opcode set.

The next page, [The processor](./processor), describes how that
contract is implemented for proving: the four ZisK registers, the
source/store modes, the `copyb` instruction, transpilation from
RISC-V, and the address map.
