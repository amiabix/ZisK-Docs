# OLD Structure + Whitepaper Content Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the OLD docs structure and narrative pacing for the intro + how-zisk-works sections while preserving all whitepaper-aligned factual corrections from the prior pass.

**Architecture:** Edit-only project on Docusaurus MDX/MD files. Use OLD as the structural template for each page (`/Users/abix/Downloads/zisk-docs-OLD/`). Layer in 16 whitepaper corrections surgically. Strip NEW-version structural impositions (Step framings, numbered sections, dependency lists). Add toolchain content from OLD background to how-zisk-works/overview.md per the spec decision.

**Tech Stack:** Docusaurus, Markdown/MDX, Mermaid, plain text. Tools: Edit, Write, Read, Bash (grep/awk/diff), browser at localhost:3000.

**Source of truth for facts:** ZisK Whitepaper. **Reference for structure:** `/Users/abix/Downloads/zisk-docs-OLD/`. **No inline whitepaper citations in prose.**

**Repository state:** Not a git repo. Skip commits. Verification = grep + awk + hot-reload tail.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `intro/intro.md` | Portal landing | Light pass: ensure no "advanced mechanics" artificial phrasing. |
| `intro/introduction/overview.md` | What ZisK is | Verify OLD-aligned (already aligned in prior pass). |
| `intro/introduction/background.md` | Problem framing | **Major restore from OLD.** All 5 sections back. Drop OLD's 6th "ZisK from outside in" (moves to overview). |
| `intro/introduction/why-zisk.md` | Design principles | Drop NEW's `## 1. ... ## 9.` numbering + dependency list. Restore OLD-style clean section names. Keep "Extensibility" as new lead. |
| `intro/how-zisk-works/overview.md` | Section landing | **Add** "ZisK from the outside in" content (toolchain + RV-vs-ZK + two emulators) from OLD background. |
| `intro/how-zisk-works/pipeline.md` | 6-stage pipeline | Verify OLD-aligned (already aligned in prior pass). |
| `intro/how-zisk-works/host-and-guest.md` | Two-process model | Verify OLD-aligned with wp corrections preserved. |
| `intro/how-zisk-works/components.md` | Chips + buses | Drop NEW's `Step 1-4` framing. Restore OLD-style section names. |
| `intro/how-zisk-works/scaling.md` | Trace splitting + aggregation | Drop NEW's "3-step framing" at top. Restore "Putting numbers on it" with caveat. |
| `intro/how-zisk-works/proof-lifecycle.md` | End-to-end run | Verify OLD-aligned with wp corrections preserved. |

**Reference files (read-only, do not modify):**
- `/Users/abix/Downloads/zisk-docs-OLD/intro/introduction/background.md` — structural template for background restore.
- `/Users/abix/Downloads/zisk-docs-OLD/intro/introduction/why-zisk.md` — section-name reference for why-zisk.
- `/Users/abix/Downloads/zisk-docs-OLD/intro/how-zisk-works/components.md` — section-name reference for components.
- `/Users/abix/Downloads/zisk-docs-OLD/intro/how-zisk-works/scaling.md` — structural reference for scaling restore including "Putting numbers on it" section content.

**Spec reference:** `docs/superpowers/specs/2026-04-30-old-structure-wp-content-restore-design.md`

---

## Whitepaper corrections to preserve (16 items)

These were applied in the prior pass and **must survive** the OLD restore. Each task verifies the relevant subset.

1. 3 precompile categories (Cryptographic hash functions / Elliptic-curve arithmetic / Bulk memory transfers). No algorithm enumeration.
2. 3 aggregation tree node types (Leaf, Compressor, Aggregation; root as topmost position).
3. Leaf exposes 3 public values (oᵢ, sᵢ, cᵢ).
4. Trust model split (system level "trusted by convention" + proof level "unconstrained until verified").
5. Both streams untrusted until guest verifies.
6. Memory regions named per Table 1 (Input Data, ROM Data, System, Output data, Program memory).
7. Guest entry-point snippet includes `#![no_main]` + `ziskos::entrypoint!(main)`.
8. Goldilocks prime field + extension 𝕂 = 𝔽[X]/(X³ − X − 1).
9. MemAlign 4 fixed subprograms.
10. "Phantom instructions" wording (no "phantom rows").
11. LtHash homomorphism + SIS-hard.
12. "Public-output instruction" wording in prose (no `pubout` engineering name in prose; backticked usage in code samples allowed).
13. "Output data" region name (not "Output").
14. Drop "Minimal STARK" from intro pages (intro + how-zisk-works only; developer/proving-programs out of scope).
15. Drop "SilentSig" brand attribution.
16. Drop all "whitepaper §X.Y" citations from prose.

---

## Global verification commands (use after every task)

```bash
# Em-dash check (must return zero hits)
grep -nP "—" <FILE>

# Paragraph length check
awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^\| / && !/^- / && !/^[0-9]\. / && !/^    / && !/^fn / && !/^use / && !/^#!/ && !/^ziskos::/ && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' <FILE>

# Whitepaper-mention check
grep -n "whitepaper" <FILE>

# Hot-reload status
tail -3 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

**Style rules applied uniformly:**
1. No em-dashes (`—`). Replace with `.`, `,`, `:`, or `()`.
2. Paragraph cap 240 chars for prose paragraphs.
3. Bold-label bullets: `**Label:** detail.`
4. No "whitepaper" mentions in prose.
5. Whitepaper Title Case for entities listed in spec.

---

## Task 1: Restore background.md from OLD

**Files:**
- Reference: `/Users/abix/Downloads/zisk-docs-OLD/intro/introduction/background.md`
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/background.md`

**Goal:** Take OLD background.md as the base. Drop OLD's final "ZisK from the outside in" section (moves to how-zisk-works/overview.md in Task 3). Keep all 5 preceding OLD sections. Apply style discipline (no em-dashes, 240 cap, no whitepaper mentions, colon bullets).

- [ ] **Step 1: Read OLD background.md fully**

```bash
cat /Users/abix/Downloads/zisk-docs-OLD/intro/introduction/background.md
```

Note the section order:
1. `## A short history of zero-knowledge proofs` with subsections SNARKs, STARKs, Recursion and aggregation, Why zkVMs are now plausible.
2. `## From circuits to zkVMs`
3. `## The two flavours of zkVM` with subsections ZK-native ISAs, Standard ISAs.
4. `## What every zkVM has to choose` with subsections Proof system, Field, Continuation strategy, Precompile model, Witness-acceleration model.
5. `## Where ZisK fits`
6. `## ZisK from the outside in` ← **drop this**, moves to how-zisk-works/overview.md.

- [ ] **Step 2: Read current background.md**

```bash
cat /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/background.md
```

Note current "Step 1-4" framing to be removed.

- [ ] **Step 3: Write the restored background.md**

Use the Write tool. Take OLD content sections 1-5 verbatim, applying style discipline:
- Strip every em-dash (`—`) in prose. Replace with `.`, `,`, `:`, or `()`.
- Split any prose paragraph over 240 chars at sentence boundaries.
- Convert any `**Label** —` bullets to `**Label:**`.
- Remove any "whitepaper" mention.
- Drop OLD's section 6 ("ZisK from the outside in") entirely.
- Keep frontmatter id/sidebar_position/title/description.

The frontmatter should be:

```yaml
---
id: background
sidebar_position: 2
title: Background
description: The problem ZisK solves, and where it sits in the
  zkVM landscape.
---
```

The page H1 stays `# Background`.

- [ ] **Step 4: Verify no em-dashes, no whitepaper mentions, no over-240 prose**

```bash
grep -nP "—" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/background.md
```

Expected: zero hits.

```bash
grep -n "whitepaper" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/background.md
```

Expected: zero hits.

```bash
awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^\| / && !/^- / && !/^[0-9]\. / && !/^    / && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/background.md
```

Expected: zero hits.

- [ ] **Step 5: Verify section names match OLD (excluding section 6)**

```bash
grep -E "^##|^###" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/background.md
```

Expected output:
```
## A short history of zero-knowledge proofs
### SNARKs and the proving-system bloom
### STARKs and the post-quantum turn
### Recursion and aggregation
### Why zkVMs are now plausible
## From circuits to zkVMs
## The two flavours of zkVM
### ZK-native ISAs
### Standard ISAs
## What every zkVM has to choose
### Proof system
### Field
### Continuation strategy
### Precompile model
### Witness-acceleration model
## Where ZisK fits
```

- [ ] **Step 6: Verify NEW Step framing absent**

```bash
grep -n "## Step [0-9]:" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/background.md
```

Expected: zero hits.

- [ ] **Step 7: Hot-reload verify**

```bash
tail -3 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

Expected: latest line shows compiled successfully.

- [ ] **Step 8: Visual scan**

Open `http://localhost:3000/intro/introduction/background` in browser. Read top to bottom. Confirm OLD-style narrative flow restored, no Step framing, sections in correct order.

---

## Task 2: Restore why-zisk.md OLD-style section names

**Files:**
- Reference: `/Users/abix/Downloads/zisk-docs-OLD/intro/introduction/why-zisk.md`
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md`

**Goal:** Drop NEW's `## 1. ... ## 9.` numbered prefixes and the dependency-list scaffolding at the top. Restore OLD-style clean section names. Keep "Extensibility as the central motivation" as the lead section since whitepaper §1.2 elevates it (not in OLD).

- [ ] **Step 1: Read current why-zisk.md and OLD why-zisk.md**

```bash
cat /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md
cat /Users/abix/Downloads/zisk-docs-OLD/intro/introduction/why-zisk.md
```

OLD section names:
- `## Performance through modularity`
- `## Native precompiles`
- `## Hint-accelerated witness generation`
- `## Trace splitting eliminates padding`
- `## Parallel by construction`
- `## Parallel challenge derivation with LtHash`
- `## No trusted setup, post-quantum security`
- `## Standard developer workflow`

Final ordering for restored why-zisk.md:
1. `## Extensibility as the central motivation` (kept; wp §1.2 elevates)
2. `## Performance through modularity`
3. `## Native precompiles`
4. `## Hint-accelerated witness generation`
5. `## Trace splitting eliminates padding`
6. `## Parallel by construction`
7. `## Parallel challenge derivation with LtHash`
8. `## No trusted setup, post-quantum security`
9. `## Standard developer workflow`

- [ ] **Step 2: Remove the dependency-list scaffolding block at top**

Find the block in current why-zisk.md:

```
The principles connect like this:

1. **Extensibility** is the central motivation.
2. **Modularity** makes extensibility possible.
...
9. **The standard developer workflow** is what falls out for the user.

The remaining sections walk through each principle in turn.
```

Use Edit tool to delete the entire block (replace with empty string in old_string slot, or just remove the lines).

The opening paragraph that precedes it ("A set of design principles shapes the system...") stays.

- [ ] **Step 3: Rename section headers**

Use Edit tool with `replace_all: false` for each:

| Current | New |
|---|---|
| `## 1. Extensibility as the central motivation` | `## Extensibility as the central motivation` |
| `## 2. Performance through modularity` | `## Performance through modularity` |
| `## 3. Native precompiles` | `## Native precompiles` |
| `## 4. Hint-accelerated witness generation` | `## Hint-accelerated witness generation` |
| `## 5. Trace splitting eliminates padding` | `## Trace splitting eliminates padding` |
| `## 6. Parallel by construction` | `## Parallel by construction` |
| `## 7. Parallel challenge derivation with LtHash` | `## Parallel challenge derivation with LtHash` |
| `## 8. No trusted setup, post-quantum security` | `## No trusted setup, post-quantum security` |
| `## 9. Standard developer workflow` | `## Standard developer workflow` |

- [ ] **Step 4: Remove the "This section covers..." 1-line leads under each section**

Each numbered section currently has a 1-line "This section covers..." lead immediately after the heading. These were NEW-imposed framing. Remove each via Edit tool.

Example (under Extensibility):
```
This section covers the principle that drives every other choice on the page.

The principle that drives the rest of the design is
**extensibility**.
```

Becomes:
```
The principle that drives the rest of the design is
**extensibility**.
```

Repeat for all 9 sections.

- [ ] **Step 5: Verify section headers**

```bash
grep -E "^## " /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md
```

Expected output (exactly 9 lines, no `## 1.` prefixes):
```
## Extensibility as the central motivation
## Performance through modularity
## Native precompiles
## Hint-accelerated witness generation
## Trace splitting eliminates padding
## Parallel by construction
## Parallel challenge derivation with LtHash
## No trusted setup, post-quantum security
## Standard developer workflow
```

- [ ] **Step 6: Verify dependency list and "This section covers" leads gone**

```bash
grep -n "principles connect like this\|This section covers" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md
```

Expected: zero hits.

- [ ] **Step 7: Verify wp corrections preserved**

```bash
grep -n "Cryptographic hash functions\|Elliptic-curve arithmetic\|Bulk memory transfers\|Goldilocks\|LtHash\|self-contained modules" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md
```

Expected: 6+ hits confirming wp-aligned content still present.

- [ ] **Step 8: Run full verification suite**

```bash
echo "=== em-dash ==="; grep -nP "—" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md
echo "=== whitepaper ==="; grep -n "whitepaper" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md
echo "=== over-240 ==="; awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^\| / && !/^- / && !/^[0-9]\. / && !/^    / && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md
echo "=== reload ==="; tail -3 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

Expected: zero em-dashes, zero whitepaper mentions, zero over-240 prose paragraphs, compiled successfully.

- [ ] **Step 9: Visual scan**

Open `http://localhost:3000/intro/introduction/why-zisk` in browser. Confirm 9 clean section names without numbering, no top dependency list, no "This section covers..." leads.

---

## Task 3: Add toolchain content to how-zisk-works/overview.md

**Files:**
- Reference: `/Users/abix/Downloads/zisk-docs-OLD/intro/introduction/background.md` (last section "ZisK from the outside in")
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/overview.md`

**Goal:** Add the OLD background's "ZisK from the outside in" content to how-zisk-works/overview.md. Place between the current pipeline diagram and the page-nav table.

- [ ] **Step 1: Extract OLD "ZisK from the outside in" content**

```bash
grep -n "## ZisK from the outside in\|^## " /Users/abix/Downloads/zisk-docs-OLD/intro/introduction/background.md | head -20
```

Locate the section. Read lines from "## ZisK from the outside in" to end of file.

```bash
awk '/^## ZisK from the outside in/,0' /Users/abix/Downloads/zisk-docs-OLD/intro/introduction/background.md
```

Capture full content. Subsections:
- `### The toolchain`
- `### RISC-V was designed for hardware. ZisK was designed for ZK.`
- `### Two ways to run a guest`
- `### Where the rest of the docs picks up`

Drop the last subsection ("Where the rest of the docs picks up") since how-zisk-works/overview.md already has its own page-nav table at the bottom.

- [ ] **Step 2: Read current how-zisk-works/overview.md to find insertion point**

```bash
cat /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/overview.md
```

Identify the structure: heading → diagram → "What's on each page" table → closing nav.

The toolchain content inserts between the closing of the pipeline diagram (mermaid block + paragraph after it) and the `## What's on each page in this section` heading.

- [ ] **Step 3: Insert toolchain section**

Use Edit tool. Insert this new top-level section before `## What's on each page in this section`:

```markdown
## ZisK from the outside in

This section pins down what a ZisK system looks like end to end. It is the chain of artifacts that takes a Rust program from source code to a proof.

### The toolchain

ZisK ships its own Rust toolchain. It is essentially the standard
Rust toolchain with a small set of customisations, most notably
the ROM and RAM address ranges the linker uses for ZisK's address
space. You invoke it through `cargo-zisk build --release` from any
ordinary Rust project. The output is an ELF file under
`target/riscv64ima-zisk-zkvm-elf/release/<program>`.

That ELF is an **RV64IMA** binary: 64-bit registers and operations,
32-bit instruction encoding, plus the standard I (base integer), M
(multiply/divide), and A (atomic) extensions. ZisK additionally
accepts the F/D (floating-point, via a software library, slow)
and C (compressed, no proving impact) extensions to accommodate
compilers beyond Rust.

```mermaid
flowchart LR
    A(Rust program)
    B(RISC-V program.elf<br/>RV64IMA)
    C(ZisK ROM<br/>transpiled at load time)
    D(Trace + STARK proofs)
    A -->|cargo-zisk build --release| B
    B -->|transpiler| C
    C -->|emulator + prover| D

    classDef chip fill:#2D2E3D,stroke:#2D2E3D,color:#FFFFFF
    classDef artifact fill:#007755,stroke:#007755,color:#FFFFFF
    classDef output fill:#00FF7C,stroke:#007755,color:#2D2E3D
    class A chip
    class B,C artifact
    class D output
```

### RISC-V was designed for hardware. ZisK was designed for ZK.

The ELF format and the RV64IMA instruction semantics are inherited
from RISC-V, which exists to be executed efficiently on physical
silicon. ZisK reuses that contract because it lets the Rust
toolchain Just Work, but the actual *machine* that runs ZisK
instructions is purpose-built for zero-knowledge proving rather
than for hardware execution.

The biggest single difference is in the register model. RISC-V has
**32 general-purpose 64-bit registers** that any instruction can
freely use as operands or destinations. ZisK has **four**:
`a`, `b`, `c`, `flag`. Every instruction has the rigid shape
`(c, flag) = op(a, b)`. The 32 RISC-V registers themselves live
memory-mapped at the start of ZisK's RAM, and ZisK adds a few
"source" and "store" modes (read/write a RISC-V register, indirect
through `a + offset`, etc.) so any RISC-V access pattern can be
expressed.

The point of that change is to make every row of the proving
trace look identical in shape, an enormous simplification for the
constraint system. The deeper details of the four-register model,
the source/store modes, the `copyb` shim that bridges the two
worlds, and the address-map regions are documented on the
[ISA](/intro/deep/isa) and
[processor](/intro/deep/processor) pages in the *Deep
understanding* section. What matters here is the framing:
**standard ISA at the contract, custom ISA at the machine.**

### Two ways to run a guest

A compiled ELF can be executed in two different emulators that
produce identical results but trade speed against memory footprint:

- **Assembly emulator:** generated per-program, runs on shared
  memory locked into physical RAM, and is the default. Very fast
  with a 64 GB physical-memory floor.
- **Rust emulator (`ziskemu`):** interpreted, slower, and uses
  far less memory (32 GB floor). Useful for debugging,
  profiling, or constrained hardware.

`cargo-zisk` picks the Assembly emulator by default. The `-l` flag
switches to the Rust emulator and `-u` unlocks the Assembly's
shared memory at some cost to speed.
```

Apply style discipline while inserting:
- No em-dashes (already done above; verify).
- 240-char paragraphs (already done above; verify).
- No "whitepaper" mentions (already none in this content).

- [ ] **Step 4: Verify insertion location and content**

```bash
grep -n "^##\|^###" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/overview.md
```

Expected output ordering:
```
## The whole picture in one diagram
## ZisK from the outside in
### The toolchain
### RISC-V was designed for hardware. ZisK was designed for ZK.
### Two ways to run a guest
## What's on each page in this section
## What this section deliberately leaves out
```

- [ ] **Step 5: Run full verification suite**

```bash
echo "=== em-dash ==="; grep -nP "—" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/overview.md
echo "=== whitepaper ==="; grep -n "whitepaper" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/overview.md
echo "=== over-240 ==="; awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^\| / && !/^- / && !/^[0-9]\. / && !/^    / && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/overview.md
echo "=== reload ==="; tail -3 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

Expected: zero em-dashes, zero whitepaper mentions, zero over-240 prose paragraphs, compiled successfully.

- [ ] **Step 6: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/overview` in browser. Confirm new "ZisK from the outside in" section renders between the diagram and the page-nav table. Mermaid diagram in the toolchain subsection renders correctly.

---

## Task 4: Drop Step framing in components.md and restore OLD section names

**Files:**
- Reference: `/Users/abix/Downloads/zisk-docs-OLD/intro/how-zisk-works/components.md`
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md`

**Goal:** Drop NEW's `Step 1: ... Step 4:` headings + the "This page builds the chip model in four steps" intro list + the "This step covers..." 1-line leads. Restore OLD-style section names. Keep MemAlign briefly subsection (wp-anchored).

OLD section names (target):
- `## Why split the prover into chips at all?`
- `## The chips, at a glance`
- `### MemAlign briefly` (kept from current; wp-anchored addition not in OLD)
- `## How chips talk to each other`
- `## Precompiles, briefly`
- `## What happens when one instruction runs`
  - `### Example 1: x5 = x1 + x2 (a plain add)`
  - `### Example 2: Sha256::digest(buf) (a precompile call)`
- `## The big mental shift from a CPU`

- [ ] **Step 1: Read current components.md and OLD components.md**

```bash
cat /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
cat /Users/abix/Downloads/zisk-docs-OLD/intro/how-zisk-works/components.md
```

- [ ] **Step 2: Remove the "This page builds..." 4-step intro list**

Find the block after the opening paragraph:

```
This page builds the chip model in four steps.

1. Why ZisK splits the prover into chips at all.
2. What the chips are, at a glance.
3. How the chips talk to each other through buses.
4. What happens when one instruction runs.
```

Use Edit tool to delete the entire block.

- [ ] **Step 3: Rename section headers**

Use Edit tool with `replace_all: false`:

| Current | New |
|---|---|
| `## Step 1: Why split the prover into chips at all?` | `## Why split the prover into chips at all?` |
| `## Step 2: The chips, at a glance` | `## The chips, at a glance` |
| `## Step 3: How chips talk to each other` | `## How chips talk to each other` |
| `### Precompiles, briefly` (currently sub of Step 3) | Move to `## Precompiles, briefly` (top-level) |
| `## Step 4: What happens when one instruction runs` | `## What happens when one instruction runs` |

For "Precompiles, briefly", which currently sits as `###` under Step 3, it must be promoted to `##` and moved to its own top-level section between "How chips talk to each other" and "What happens when one instruction runs".

- [ ] **Step 4: Reorder Precompiles, briefly to top-level**

Read the current "How chips talk to each other" section + its `### Precompiles, briefly` sub-section. Move the precompile content out of "How chips talk" and place it as its own `## Precompiles, briefly` section after "How chips talk to each other" closes.

The MemAlign briefly subsection stays where it is (currently nested under "The chips, at a glance").

- [ ] **Step 5: Remove the "This step covers..." 1-line leads under each section**

Each renamed section may have a 1-line "This step covers..." lead immediately after the heading. Remove each via Edit tool.

Example:

```
## Step 1: Why split the prover into chips at all?

This step covers the motivation for the chip model: small, specialised constraint systems beat one big circuit.

Think of it as the difference between...
```

Becomes:

```
## Why split the prover into chips at all?

Think of it as the difference between...
```

Apply to all sections that have such a lead.

- [ ] **Step 6: Verify section names**

```bash
grep -E "^##|^###" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
```

Expected output (in this order):
```
## Why split the prover into chips at all?
## The chips, at a glance
### MemAlign briefly
## How chips talk to each other
## Precompiles, briefly
## What happens when one instruction runs
### Example 1: `x5 = x1 + x2` (a plain add)
### Example 2: `Sha256::digest(buf)` (a precompile call)
## The big mental shift from a CPU
```

- [ ] **Step 7: Verify Step framing absent**

```bash
grep -n "## Step [0-9]:\|This step covers\|This page builds the chip model" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
```

Expected: zero hits.

- [ ] **Step 8: Verify wp corrections preserved**

```bash
grep -n "Cryptographic hash functions\|Elliptic-curve arithmetic\|Bulk memory transfers\|MemAlign\|Goldilocks\|cubic extension\|phantom instruction" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
```

Expected: 7+ hits confirming wp-aligned content still present.

- [ ] **Step 9: Run full verification suite**

```bash
echo "=== em-dash ==="; grep -nP "—" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
echo "=== whitepaper ==="; grep -n "whitepaper" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
echo "=== over-240 ==="; awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^\| / && !/^- / && !/^[0-9]\. / && !/^    / && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
echo "=== reload ==="; tail -3 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

Expected: zero em-dashes, zero whitepaper mentions, zero over-240 prose paragraphs, compiled successfully.

- [ ] **Step 10: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/components` in browser. Confirm OLD-style section names, no Step framing, MemAlign briefly subsection still present, Precompiles briefly now its own top-level section.

---

## Task 5: Restore "Putting numbers on it" in scaling.md and drop 3-step framing

**Files:**
- Reference: `/Users/abix/Downloads/zisk-docs-OLD/intro/how-zisk-works/scaling.md` (for "Putting numbers on it" content)
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md`

**Goal:** Drop NEW's "3-step framing" at top + "This section covers..." 1-line leads. Restore the "Putting numbers on it" section from OLD with a caveat noting these are engineering values, not whitepaper-fixed. Keep wp-corrected node types (3 not 4) + LtHash naming.

OLD section structure (target):
- `# Scaling` (lead)
- `## The two halves: split + recombine`
- `## Half 1: trace splitting`
  - `### Cross-segment state: the Continuation Bus`
- `## Half 2: the aggregation tree`
- `## The shared-challenge trick (in plain language)`
- `## Putting numbers on it` ← **restore with caveat**
- `## What the verifier sees`
- `## Where this picks up`

Current page also has `## Sizing` section (NEW-added). Replace "Sizing" with "Putting numbers on it".

- [ ] **Step 1: Read current scaling.md and OLD scaling.md**

```bash
cat /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md
cat /Users/abix/Downloads/zisk-docs-OLD/intro/how-zisk-works/scaling.md
```

Capture OLD's "Putting numbers on it" section content. Note the numeric table and the surrounding prose.

- [ ] **Step 2: Remove the 3-step framing block at top**

Find the block:

```
Scaling has two halves and one shared trick.

1. Split the long execution into independently provable per-chip segments.
2. Recombine all the per-segment proofs into a single root proof.
3. Make a parallel-safe shared challenge work across independent provers.

The remaining sections cover each in turn.
```

Use Edit tool to delete the entire block.

- [ ] **Step 3: Remove "This section covers..." 1-line leads under each section**

Each `##` and `###` section currently has a 1-line "This section covers..." or "This step covers..." or "This sub-step covers..." lead. Remove each via Edit tool.

Affected sections:
- `## The two halves: split + recombine` — has lead `This section names the two halves at a glance...`
- `## Half 1: trace splitting` — has lead `This section covers how ZisK partitions execution...`
- `### Cross-segment state: the Continuation Bus` — has lead `This sub-step covers how state crosses segment boundaries...`
- `## Half 2: the aggregation tree` — has lead `This section covers how the many per-segment proofs collapse...`
- `## The shared-challenge trick (in plain language)` — has lead `This section covers the third leg of the scaling story...`
- `## Sizing` — has lead `This section notes that segment heights are an engineering knob...`
- `## What the verifier sees` — has lead `This section covers what the proof looks like to the verifier...` (or similar)

For each, use Edit tool to remove the lead paragraph.

- [ ] **Step 4: Replace `## Sizing` with `## Putting numbers on it` and restore numeric content with caveat**

Find the current `## Sizing` section. Replace the entire section (heading + body + cross-link to deep/limits) with:

```markdown
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

Each Main-chip segment caps at **2²² steps** (~4 M instructions),
so the count of Main segments is roughly *(total steps ÷ 4 M)*.

Memory and the precompile chips have similarly fixed segment
heights but they're sized to those chips' typical work patterns.
A chip that does almost nothing in a workload still produces just
one (small) segment, not one per Main segment.

A real Ethereum-block validation produces something on the order
of a few hundred per-chip segments and a binary aggregation tree
of roughly 10–12 levels. That tree sits comfortably below the
ceiling, the design has substantial headroom (see
[Limits](/intro/deep/limits) for the full table).
```

Apply style discipline:
- No em-dashes in the prose. (The `1–2` and `10–12` and `2¹⁴` etc. inside the table are en-dashes for numeric ranges, acceptable inside table content.)
- 240-char paragraphs.

- [ ] **Step 5: Verify section names match OLD target**

```bash
grep -E "^##|^###" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md
```

Expected output (in this order):
```
## The two halves: split + recombine
## Half 1: trace splitting
### Cross-segment state: the Continuation Bus
## Half 2: the aggregation tree
## The shared-challenge trick (in plain language)
## Putting numbers on it
## What the verifier sees
## Where this picks up
```

- [ ] **Step 6: Verify NEW framing absent**

```bash
grep -n "Scaling has two halves and one shared trick\|This section covers\|This step covers\|This sub-step covers\|## Sizing" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md
```

Expected: zero hits.

- [ ] **Step 7: Verify wp corrections preserved**

```bash
grep -n "Compressor nodes\|Aggregation nodes\|Leaf nodes\|LtHash\|homomorphism over multiset union" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md
```

Expected: 5+ hits confirming wp-aligned content present.

- [ ] **Step 8: Run full verification suite**

```bash
echo "=== em-dash ==="; grep -nP "—" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md
echo "=== whitepaper ==="; grep -n "whitepaper" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md
echo "=== over-240 ==="; awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^\| / && !/^- / && !/^[0-9]\. / && !/^    / && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md
echo "=== reload ==="; tail -3 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

Expected: zero em-dashes, zero whitepaper mentions, zero over-240 prose paragraphs, compiled successfully.

- [ ] **Step 9: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/scaling` in browser. Confirm OLD-style section flow, no top 3-step framing, "Putting numbers on it" section renders with table + caveat.

---

## Task 6: Verify the other 5 pages still aligned

**Files:**
- `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md`
- `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/overview.md`
- `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/pipeline.md`
- `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/host-and-guest.md`
- `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/proof-lifecycle.md`

**Goal:** Confirm these 5 pages preserved OLD-aligned structure with wp corrections. Spot-check that no NEW-only framing crept in.

- [ ] **Step 1: Verify intro.md has no "advanced mechanics" artificial phrasing**

```bash
grep -n "advanced mechanics\|whitepaper" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md
```

If "advanced mechanics" appears, replace with "deeper mechanics" or "deep section mechanics" via Edit tool.

If "whitepaper" appears, remove via Edit tool.

- [ ] **Step 2: Verify introduction/overview.md**

```bash
grep -n "Step [0-9]:\|## [0-9]\.\|This section covers\|This step covers" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/overview.md
```

Expected: zero hits. Page is structured by topic, no Step framing should be present.

- [ ] **Step 3: Verify pipeline.md has clean numbered stages (OLD style)**

```bash
grep -E "^## " /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/pipeline.md
```

Expected output (or close):
```
## 1. Compile
## 2. Setup
## 3. Execute
## 4. Prove
## 5. Wrap (optional)
## 6. Verify
## Where this picks up
```

Pipeline numbering is OLD-style (numbered stages are natural for a pipeline). Confirm this is still present.

- [ ] **Step 4: Verify host-and-guest.md preserves wp corrections**

```bash
grep -n "system level\|proof level\|Input Data\|ROM Data\|Output data\|Program memory\|both inputs\|both streams\|public-output instruction" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/host-and-guest.md
```

Expected: 5+ hits confirming trust model split + memory regions + public-output wording.

```bash
grep -n "no_main\|entrypoint" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/host-and-guest.md
```

Expected: at least 1 hit each.

- [ ] **Step 5: Verify proof-lifecycle.md preserves wp corrections**

```bash
grep -n "Compressor nodes\|own public outputs\|LogUp partial sum\|LtHash challenge" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/proof-lifecycle.md
```

Expected: 4+ hits confirming Compressor naming + leaf 3 values.

```bash
grep -n "Minimal STARK\|--minimal" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/proof-lifecycle.md
```

Expected: zero hits.

- [ ] **Step 6: Run full verification suite across all 5 files**

```bash
for f in /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/overview.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/pipeline.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/host-and-guest.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/proof-lifecycle.md; do
  echo "=== $f ==="
  echo "em-dash:"; grep -cP "—" "$f"
  echo "whitepaper:"; grep -c "whitepaper" "$f"
  echo "over-240:"; awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^\| / && !/^- / && !/^[0-9]\. / && !/^    / && length($0)>240 {c++} END{print c+0}' "$f"
done
```

Expected: all counts are 0.

- [ ] **Step 7: Hot-reload final check**

```bash
tail -3 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

Expected: compiled successfully.

---

## Task 7: Final cross-page consistency sweep

**Files:** all 10 in scope.

- [ ] **Step 1: Em-dash global sweep**

```bash
grep -nP "—" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/*.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/*.md
```

Expected: zero hits.

- [ ] **Step 2: Whitepaper-mention global sweep**

```bash
grep -rn "whitepaper" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/ /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/
```

Expected: zero hits.

- [ ] **Step 3: Paragraph length global sweep**

```bash
for f in /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/*.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/*.md; do
  awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^\| / && !/^- / && !/^[0-9]\. / && !/^    / && !/^fn / && !/^use / && !/^#!/ && !/^ziskos::/ && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' "$f"
done
```

Expected: zero hits.

- [ ] **Step 4: Locked-term spot-check**

```bash
for term in "Minimal STARK" "phantom row" "phantom rows" "SilentSig" "Big-integer arithmetic" "## Step [0-9]" "## [0-9]\\."; do
  echo "=== $term ==="
  grep -rnE "$term" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/ /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/
done
```

Expected: zero hits except in the legitimately numbered sections of pipeline.md (`## 1. Compile` etc., which is OLD-aligned).

For pipeline.md, `## [0-9]\.` should appear (OLD-style). For all other pages, zero `## [0-9]\.` hits.

```bash
grep -nE "^## [0-9]\." /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md
```

Expected: zero hits in these 3 files specifically.

- [ ] **Step 5: Wp-correction preservation spot-check**

```bash
echo "=== 3 precompile categories ==="
grep -rnc "Cryptographic hash functions" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
echo "=== Compressor nodes ==="
grep -rnc "Compressor nodes" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/proof-lifecycle.md
echo "=== Goldilocks ==="
grep -rnc "Goldilocks" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
echo "=== MemAlign briefly ==="
grep -rnc "MemAlign briefly" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
echo "=== Memory regions ==="
grep -rnc "Input Data\|ROM Data\|Output data\|Program memory" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/host-and-guest.md
```

Expected: each count > 0.

- [ ] **Step 6: Hot-reload final check**

```bash
tail -5 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

Expected: latest line is "compiled successfully".

- [ ] **Step 7: Browser walkthrough**

Open each page in sequence. Read top to bottom. Confirm:

1. http://localhost:3000/intro/intro
2. http://localhost:3000/intro/introduction/overview
3. http://localhost:3000/intro/introduction/background
4. http://localhost:3000/intro/introduction/why-zisk
5. http://localhost:3000/intro/how-zisk-works/overview
6. http://localhost:3000/intro/how-zisk-works/pipeline
7. http://localhost:3000/intro/how-zisk-works/host-and-guest
8. http://localhost:3000/intro/how-zisk-works/components
9. http://localhost:3000/intro/how-zisk-works/scaling
10. http://localhost:3000/intro/how-zisk-works/proof-lifecycle

Verify visually:
- background.md has full OLD-style narrative including SNARK history + 5-axes + circuits-to-zkVMs.
- why-zisk.md has 9 clean section names without numbering, no top dependency list.
- how-zisk-works/overview.md has new "ZisK from the outside in" section between diagram and page-nav table.
- components.md has clean OLD section names, no Step framing.
- scaling.md has "Putting numbers on it" section with table + caveat.
- All mermaid diagrams render correctly.
- No broken internal links.
- Sidebar resolves cleanly.

---

## Self-review notes

**Spec coverage check:**

- ✅ Background restore (all 5 OLD sections, drop "ZisK from outside in") → Task 1.
- ✅ Toolchain content moves to overview → Task 3.
- ✅ Why-zisk drops numbering and dependency list → Task 2.
- ✅ Components drops Step framing, restores OLD names → Task 4.
- ✅ Scaling drops 3-step framing, restores "Putting numbers on it" with caveat → Task 5.
- ✅ Other 5 pages verified preserved → Task 6.
- ✅ Final consistency sweep → Task 7.
- ✅ All 16 wp corrections preservation verified across Tasks 2, 4, 5, 6, 7.

**Placeholder scan:** zero TBD/TODO/FIXME. Every step has concrete action and exact verification command.

**Type consistency:** N/A (docs project, no code types). Term consistency verified via Task 7 spot-checks.

**Risks restated:**
- SNARK history not whitepaper-anchored. Kept as docs pedagogy, not contradicting wp.
- 5-axes is docs-original. Kept as design-space survey.
- Numeric trace heights are engineering values; caveat sentence in restored section handles this.
- Toolchain content moving from background to overview changes navigation. Internal cross-links preserved via Tasks 1 and 3.

---

## Success criteria

- All 10 pages match OLD structure (section names + flow), with the spec's allowed deviations:
  - why-zisk.md gains "Extensibility as the central motivation" as lead.
  - components.md gains "MemAlign briefly" subsection.
  - host-and-guest.md gains memory-regions section + trust-model split.
  - how-zisk-works/overview.md gains "ZisK from the outside in" content.
- All 16 wp-aligned corrections preserved.
- Zero whitepaper-citation mentions in prose.
- Zero em-dashes, zero over-240 prose paragraphs.
- Sidebar resolves cleanly. Dev server compiles every page successfully.
- Numeric trace-height table restored in scaling.md with caveat.
