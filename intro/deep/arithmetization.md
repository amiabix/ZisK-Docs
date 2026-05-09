---
id: arithmetization
sidebar_position: 3
title: Arithmetization
description: How a ZisK execution becomes a constraint system.
  AIRs, AIR values, interactions, arguments, bus balancing,
  and the LogUp reduction.
---

# Arithmetization

The previous page described what ZisK programs *are*. This page is
about how the prover turns a program execution into something it
can **prove**: a system of polynomial constraints whose satisfying
assignment is the execution itself.

ZisK's frontend is built on a generalisation of the **AIR**
framework (Algebraic Intermediate Representation), extended with
**AIR values** (per-instance scalars), and combined with the
**LogUp** lookup argument that lets independent AIRs talk to each
other through shared **buses**.

That sounds abstract. The job of this page is to make each piece
concrete enough that the chip system on the next page is just an
application of the rules laid down here.

## The two layers of a proving system

Most proving systems split cleanly into two layers:

| Layer        | Responsibility                                                            |
| ------------ | ------------------------------------------------------------------------- |
| **Frontend** | Express the computation as a structured mathematical object, typically a system of polynomial constraints over a finite field. |
| **Backend**  | Take that object and produce a proof of its satisfiability. |

The frontend is what this page is about. The backend (Goldilocks
STARKs via PIL2 / `proofman`) is what the
[Continuations](./continuations) and
[Recursion & aggregation](./recursion) pages cover.

The two layers are decoupled by design: a single frontend can
target different backends, and improvements to either don't
require redesigning the other.

ZisK's frontend has a handful of design goals:

- **Separation of concerns:** each AIR can be designed,
  implemented, and tested independently.
- **Composability:** AIRs can be reused across different
  computations or combined in different configurations.
- **Scalability:** different AIRs can have different sizes, so
  resources are allocated based on actual usage rather than
  worst-case sizing.
- **Backend independence:** the arithmetization can be paired with
  any compatible proof system.

## AIRs

An **Algebraic Intermediate Representation** describes a
computation as a matrix of values plus a set of polynomial
constraints that must hold at every row.

![Trace matrix T ∈ 𝔽^(N × W): N rows × W columns of field elements, each row representing one execution step of the circuit](/diagrams/svgs/64-trace-matrix.svg)

Constraints are polynomials over the column values **at the
current row and at a few rows ahead** (the *depth* of the
constraint), evaluated row by row. Every constraint must evaluate
to **zero** at every row of the trace.

ZisK works over the **Goldilocks** prime field with extension
𝕂 = 𝔽[X]/(X³ − X − 1) for cryptographic challenges. It uses a
slightly extended AIR definition that adds **AIR values**:
per-instance scalars that are not indexed by row.

AIR values are how global constants like program commitments,
public outputs, and aggregation roots become first-class citizens
of the constraint system rather than being awkwardly encoded as
per-row data.

### Formal definition

For the math-inclined, the formal definition:

> An **AIR** of width *W*, depth *D*, and *V* values is a set of
> polynomials
>
> ```text
> 𝒜 = { C_i }_{i ∈ I} ⊂ F[X_1^(0), …, X_W^(0), …, X_1^(D), …, X_W^(D), Y_1, …, Y_V]
> ```
>
> A **witness** for *𝒜* is a pair (T, a) where T ∈ F^(N×W) (with *N* a power of two) is the *trace matrix* and a ∈ F^V are the *AIR values*. The variable X_j^(k) at row *r* evaluates to T_j(r+k); the variable Y_j evaluates to the same scalar a_j at every row.
>
> The witness *satisfies* *𝒜* if every constraint evaluates to zero at every row, with row indices taken modulo *N*.

In words: a constraint can reference any column at the current row
or up to *D* rows ahead, plus any of the *V* per-instance scalars.
*N* is a power of two because the backend uses a low-degree-test
that operates over a multiplicative subgroup whose size must
divide a power of two.

### Trace columns and their lifecycle

Not every column has the same lifecycle. ZisK distinguishes three
kinds:

| Kind       | Determined…                  | Visible to verifier? | Typical use                              |
| ---------- | ---------------------------- | -------------------- | ---------------------------------------- |
| **Fixed**  | At setup time                | Yes (part of the AIR's description) | Lookup tables, instruction encodings.    |
| **Cached** | Per program (not per input)  | No (committed once, reused across all proofs of that program) | The transpiled ROM instruction trace.    |
| **Witness**| Per execution                | No (committed per proof) | Register values, memory accesses, intermediate results. |

This split is what lets the proving system avoid redundant work
and be precise about what the verifier learns:

- A **fixed** column is the same for every program execution
  *anywhere*. There is no point in committing it again per proof.
- A **cached** column depends on the program (its ELF) but not on
  the inputs. Committed once at setup, reused across all proofs.
- A **witness** column carries the *specific* execution and gets
  freshly committed every time.

When an AIR has fixed columns, the trace height *N* is also fixed
at setup.

## Interactions and buses

A single AIR is **self-contained**: its constraints can only
reference columns within its own trace. They cannot reach over to
another AIR's columns.

But realistic computations cross AIR boundaries constantly:

- The CPU fetches an instruction from the ROM AIR.
- The CPU reads a value the Memory AIR wrote.
- A hash precompile receives inputs from the Main AIR and returns
  a result.
- A base-operation chip queries a lookup table chip.

To express these relationships without merging every AIR into one
giant monolithic constraint system, ZisK introduces
**interactions**: row-level messages that one AIR sends and
another receives, mediated by a shared channel called a **bus**.

### Formal definition of an interaction

Each interaction is a tuple `(b, m, e)`:

| Component         | What it is                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| **`b`**           | The **bus identifier**: a fixed field element selecting which bus the interaction is on.                              |
| **`m`**           | The **multiplicity polynomial**: at each row, evaluates to a signed integer indicating *how many times* this row sends the message (positive) or receives it (negative). |
| **`e = (e_1, …, e_ℓ)`** | The **message polynomials**: at each row, the ℓ values being communicated.                                       |

Both `m` and `e_j` are polynomials over the same variables as the
AIR's constraints, so they can depend on the trace and on AIR
values.

![Diagram: row r:  e(r) = (5, 17, 'add') m(r) = +1 · row r':  e(r') = (5, 17, 'add') m(r') = -1](/diagrams/svgs/35-arithmetization-1.svg)

### Bus balancing

The unified consistency condition is **bus balancing**: across all
AIRs and all rows of every AIR, the signed sum of
`m(r) · e(r)` on each bus must be zero. Equivalently, every
message sent on a bus is received exactly once with matching
content; gaps, duplications, and reorderings all surface as a
non-zero sum.

> A bus *b* is **balanced** if
> ```text
> Σᵢ Σ_{(b,m,e) ∈ 𝒾_i} Σ_{r=0}^{N_i-1}  m(r) · e(r)  =  0
> ```
> where *i* ranges over all AIRs in the circuit and `𝒾_i` is the set of interactions on AIR *i*.

Bus balancing is the single condition that underlies every
cross-AIR argument in ZisK: lookups, permutations, table queries,
instruction dispatches, memory consistency. They are all just
different patterns of "send this, receive that, multiplicity
matters."

## Arguments

Interactions define the *communication structure*; **arguments**
specify the *semantic relationship* being enforced. An argument is
realised as a pair of interactions on a shared bus (one AIR
sending with positive multiplicity, another receiving with
negative multiplicity) chosen so that bus balancing becomes
equivalent to the desired relationship.

ZisK uses three argument types:

### Permutation argument

Asserts that two sequences of values are **permutations of each
other**: same elements with the same multiplicities, possibly in
different order.

```text
{ e_i(r) : r ∈ rows of A_i with selector s_i(r) ≠ 0 }
                          =
{ e_j(r) : r ∈ rows of A_j with selector s_j(r) ≠ 0 }   (as multisets)
```

Used when data is *reorganised but not modified*. The Memory
chip's sorted access log is a permutation argument applied to the
unsorted accesses submitted by other chips.

### Lookup argument

Asserts that **every element of a query sequence appears in a
table sequence**, without requiring the sequences to have the same
length or the same multiplicities.

```text
For every row r with s_query(r) ≠ 0,
   there exists r' with s_table(r') ≠ 0
   and e_query(r) = e_table(r').
```

Used for range checks, table-driven computations, and verifying
that values belong to a predefined set. "This byte is in `[0,
255]`" is a lookup into a 256-entry table; "this opcode is one of
the valid opcodes" is a lookup into the ROM table.

### Copy argument

Asserts that **designated cells across different parts of a
witness hold equal values**. Given equivalence classes
`{C_1, …, C_t}` of cells, every cell in the same class must hold
the same value.

Used to enforce consistency between AIRs (or between rows within
the same AIR) that share intermediate values. For example,
ensuring that the output of an ALU operation matches the value
written to a register, or wiring patterns where multiple cells
must agree. Implemented as a permutation argument on the cells
within each equivalence class.

## The LogUp reduction

Checking bus balancing naïvely means iterating over every row of
every AIR, summing messages, and verifying the totals. That
defeats the whole point of succinct proofs: it would force the
verifier to re-process the entire witness.

ZisK uses **LogUp** to reduce bus balancing to a small set of
polynomial constraints that the backend can verify in time
independent of the trace size.

### The two key tricks

LogUp boils down to two ideas applied in sequence:

**1. Compress every multi-element message into one field element.**
Use a verifier-supplied challenge γ to fold the message vector
`e(r) = (e_1(r), …, e_ℓ(r))` into a single value:

```text
ê(r) = b + γ¹·e_1(r) + γ²·e_2(r) + ⋯ + γ^ℓ·e_ℓ(r)
```

The bus identifier *b* is included to prevent cancellation across
different buses.

**2. Reduce multiset equality to a rational identity.** With
another challenge α, two multisets *S* and *R* are equal if and
only if

```text
∑_{s ∈ S}  1/(α + s)   =   ∑_{r ∈ R}  1/(α + r)
```

Because the prover commits to its witness *before* α is sampled,
they can't construct values that satisfy this identity by
accident.

### From identity to per-AIR partial sums

Each AIR maintains an extra **partial-sum column** *S_i* defined
by the recurrence:

```text
S_i(1)   =   ∑_{(b,m,e) ∈ 𝒾_i}  m(1) / (α + ê(1))

S_i(r)   =   S_i(r-1) + ∑_{(b,m,e) ∈ 𝒾_i}  m(r) / (α + ê(r))
```

The final value `s_i = S_i(N_i)` is AIR *i*'s total signed
contribution to the bus. Global bus balancing reduces to one
scalar equation:

```text
∑ᵢ  s_i  =  0
```

Each AIR proof exposes its own `s_i` as a public output. The
aggregation step (covered on
[Recursion & aggregation](./recursion)) sums them and
verifies the equation at the root.

![Diagram: AIR i: local constraints + LogUp partial sum · s_i  ∈ K · Σᵢ s_i](/diagrams/svgs/36-arithmetization-2.svg)

The key property: each AIR proves *only its own local constraints
plus the running partial sum*. The cross-AIR consistency check is
a single arithmetic equality at the very end of the pipeline.

## Circuits

A **circuit** ties everything together: a collection of AIRs each
paired with its set of interactions.

> A **circuit** is a collection of pairs `{(𝒜_i, 𝒾_i)}_{i=1}^k`, where each `𝒜_i` is an AIR and each `𝒾_i` is a set of interactions. Each AIR has its own witness `(T_i, a_i)` with `T_i ∈ F^(N_i × W_i)`; different AIRs may have different trace heights *N_i*.

A **bus** is the channel that connects all interactions sharing
the same identifier *b*. The set of all bus identifiers in a
circuit is `𝓑 = { b : ∃ i, (b, m, e) ∈ 𝒾_i }`.

A circuit is **satisfied** by its witnesses if:

1. **Local satisfaction:** each witness `(T_i, a_i)` satisfies
   its corresponding AIR `𝒜_i` (every constraint evaluates to zero
   at every row).
2. **Global bus balancing:** every bus `b ∈ 𝓑` is balanced
   (`Σᵢ Σ_r m(r) · e(r) = 0` on each bus).

Local satisfaction is verified independently per AIR. Global bus
balancing is enforced by the aggregation step at the end of the
proving pipeline.

## The five system buses

ZisK uses five named buses for its cross-chip plumbing:

| Bus                  | What flows on it                                       | Used by                                        |
| -------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| **Operation Bus**    | `(op, a, b, c, flag, extra)`: a delegated operation.   | Main to Base Operations / Precompiles.         |
| **ROM Bus**          | `(pc, a_imm, b_imm, op, …)`: an instruction at `pc`.   | Main reads from the ROM chip.                  |
| **Memory Bus**       | `(op_mem, addr, t_mem, width, data)`: memory access.   | Anyone that touches memory; Memory chip checks consistency. |
| **Continuation Bus** | Per-chip state across segment boundaries.              | Chips with persistent state (Main, Memory, …). |
| **Table Buses**      | Per-table lookup queries.                              | Instruction executors to their lookup tables.  |

Each bus has its own message schema. The chip system on the
[next page](./chips) is mostly the application of these five
plumbing patterns to the concrete components ZisK ships.

## How an instruction is proven

To make this concrete, here is the path of one instruction
(`x5 = x1 + x2`) through the bus system:

![Diagram: Main chip (row r) · ROM chip · Memory chip · Arith chip · 1](/diagrams/svgs/37-arithmetization-3.svg)

The Main chip records one row, but four bus interactions take
place (ROM, Memory twice, Operation). Each chip proves only its
own slice of the work. Bus balancing, checked globally at the
root, guarantees that every message Main *sent* matches every
message the relevant chip *received*.

## Where this picks up

You now have the vocabulary the rest of the documentation builds
on:

- AIRs, their trace matrices, and AIR values.
- Fixed / cached / witness columns.
- Interactions `(b, m, e)`, signed multiplicities, bus balancing.
- Permutation, lookup, and copy arguments.
- LogUp turning balancing into a polynomial-degree argument with
  per-AIR partial sums.
- Circuits as collections of AIRs + interactions, and what makes a
  circuit satisfied.

The next two pages translate this vocabulary into concrete
hardware:

- **[Chips](./chips):** the actual instruction executors and
  table AIRs that make up the ZisK circuit.
- **[Continuations](./continuations):** how ZisK turns one
  unbounded execution into independently-provable per-chip
  segments.
- **[Recursion & aggregation](./recursion):** how those segment
  proofs are folded into a single root proof.
