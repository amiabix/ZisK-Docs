# OLD Structure + Whitepaper Content Restore

**Date:** 2026-04-30
**Scope:** 10 pages: `intro/intro.md` + `intro/introduction/*` (3) + `intro/how-zisk-works/*` (6).
**Reference:** `/Users/abix/Downloads/zisk-docs-OLD/` is the structural template.
**Source of truth for facts:** ZisK Whitepaper v0.16.1 (no inline citations in prose).

## Goal

Restore the OLD docs structure and narrative pacing while keeping the whitepaper-aligned factual corrections we made in the prior pass.

## Principle

Take OLD pages as the structural and narrative base. Layer in every whitepaper-aligned correction surgically. Drop NEW-version structural impositions (numbered Step framings, dependency-list scaffolding) that weren't in OLD.

## Decisions locked

1. **Background restore scope:** all five OLD sections — history of ZK proofs, circuits→zkVMs, two flavours, what every zkVM chooses, where ZisK fits. Drop only the toolchain section (moves to overview).
2. **Toolchain section:** moves to `how-zisk-works/overview.md`.
3. **Pipeline numbering:** keep OLD's `## 1. Compile`, `## 2. Setup`, etc. Pipeline stages are naturally numbered.
4. **Scaling numbers:** restore "Putting numbers on it" with numeric table. Add a caveat noting these are engineering values, not whitepaper-fixed.
5. **why-zisk.md numbering:** drop NEW's `## 1. ... ## 9.` numbering. Use OLD-style clean section names. Add "Extensibility as the central motivation" as the lead section.
6. **Components Step framing:** drop NEW's `Step 1: ... Step 4:` headings. Use OLD-style clean section names.

## Per-page change inventory

### `intro/intro.md`
- Keep OLD portal landing structure.
- Drop "advanced mechanics" phrasing if present in description; use "deeper mechanics" or similar.

### `intro/introduction/overview.md`
- Keep OLD structure: lead, properties, trust model, what ZisK does not do, where to go next.
- Layer whitepaper-aligned content corrections (already applied; verify still present after restore).

### `intro/introduction/background.md`
**Major restore.** Take OLD as base. Sections in order:
1. `## A short history of zero-knowledge proofs` with subsections SNARKs, STARKs, Recursion and aggregation, Why zkVMs are now plausible.
2. `## From circuits to zkVMs`
3. `## The two flavours of zkVM` with subsections ZK-native ISAs, Standard ISAs.
4. `## What every zkVM has to choose` with subsections Proof system, Field, Continuation strategy, Precompile model, Witness-acceleration model.
5. `## Where ZisK fits`

Drop OLD's 6th "ZisK from the outside in" section (moves to `how-zisk-works/overview.md`).

Drop NEW's "Step 1-4" framing.

### `intro/introduction/why-zisk.md`
Restore OLD-style clean section names:
1. `## Extensibility as the central motivation` (kept from NEW; whitepaper §1.2 elevates this)
2. `## Performance through modularity`
3. `## Native precompiles`
4. `## Hint-accelerated witness generation`
5. `## Trace splitting eliminates padding`
6. `## Parallel by construction`
7. `## Parallel challenge derivation with LtHash`
8. `## No trusted setup, post-quantum security`
9. `## Standard developer workflow`

Drop NEW's `## 1. ... ## 9.` numbered prefixes.

Drop NEW's dependency-list "The principles connect like this..." block at top.

Layer whitepaper corrections: 3 precompile categories (no algorithm enumeration), drop Minimal STARK if mentioned.

### `intro/how-zisk-works/overview.md`
Keep current pipeline diagram + page nav table.

**Add** "ZisK from the outside in" content from OLD background:
- The toolchain
- RISC-V was designed for hardware. ZisK was designed for ZK.
- Two ways to run a guest

Place between current diagram and page-nav table.

### `intro/how-zisk-works/pipeline.md`
Keep OLD-style 6 numbered stages.

Wp corrections (already applied): drop Minimal STARK row from wrap table, fix internal-sub-stages cross-link.

### `intro/how-zisk-works/host-and-guest.md`
Keep OLD structure.

Wp corrections (already applied): trust model split, memory regions section, guest entrypoint snippet, both streams untrusted, public-output instruction wording.

### `intro/how-zisk-works/components.md`
Restore OLD-style section names:
- `## Why split the prover into chips at all?`
- `## The chips, at a glance`
- `## How chips talk to each other`
- `## Precompiles, briefly`
- `## What happens when one instruction runs`
- `## The big mental shift from a CPU`

Drop NEW's `Step 1: ... Step 4:` framing.

Drop "this page builds the chip model in four steps" intro list.

Keep MemAlign briefly subsection.

Wp corrections (already applied): 3 precompile categories, Tables as chip, Goldilocks + extension field, phantom instructions wording.

### `intro/how-zisk-works/scaling.md`
Restore OLD section flow.

Drop NEW's "3-step framing" at top ("Scaling has two halves and one shared trick. 1. Split... 2. Recombine... 3. Make a parallel-safe shared challenge work.").

**Restore "Putting numbers on it"** section. Numeric trace-height table with caveat:

> The values below are engineering choices. They are not fixed properties of the design and may change between releases.

Wp corrections (already applied): 3 node types Leaf + Compressor + Aggregation with root as topmost position, LtHash naming, drop "whitepaper" mentions.

### `intro/how-zisk-works/proof-lifecycle.md`
Keep current Phase 0–5 + sub-stages 3a–3f.

Already OLD-aligned. Wp corrections already applied: leaf 3 values, Compressor nodes, drop Minimal STARK, phantom instructions.

## Whitepaper corrections to preserve

These were applied in the prior pass and must survive the OLD restore:

- 3 precompile categories (drop Big-integer, drop SHA/Keccak/etc enumeration)
- 3 aggregation tree node types (Leaf, Compressor, Aggregation; root as position)
- Leaf exposes 3 public values (oᵢ, sᵢ, cᵢ)
- Trust model split (system level vs proof level)
- Both streams untrusted until guest verifies (per §2.2.7)
- Memory regions named per Table 1 (Input Data, ROM Data, System, Output data, Program memory)
- Guest entry-point snippet includes `#![no_main]` + `ziskos::entrypoint!(main)`
- Goldilocks prime field + extension 𝕂 = 𝔽[X]/(X³ − X − 1)
- MemAlign 4 fixed subprograms
- "Phantom instructions" wording (drop "phantom rows")
- LtHash homomorphism + SIS-hard
- "Public-output instruction" (drop `pubout` engineering name from prose)
- "Output data" region name (drop "Output")
- Drop "Minimal STARK" from intro pages
- Drop SilentSig brand
- Drop all "whitepaper §X.Y" citations from prose

## Style discipline preserved

1. Zero em-dashes (`—`) in prose. Box-drawing chars in code blocks retained.
2. Paragraph cap 240 chars for prose.
3. Bold-label bullets use colon: `**Label:** detail.`
4. Whitepaper Title Case for: Operation Bus, ROM Bus, Memory Bus, Continuation Bus, Table Bus, Main, Memory, MemAlign, Base Operations, Precompiles, Tables, Input Data, ROM Data, Output data, Program memory.
5. No "whitepaper" mentions in prose.

## Section-to-section flow

Each page closes with a "Where this picks up" pointer to the next conceptual page. OLD already has these; preserve.

Each page opens with a brief framing paragraph saying what the section covers. OLD has this; preserve.

Cross-references in prose use plain links: `[Components](./components)` or `[Deep understanding → Chips](/intro/deep/chips)`. No "see §X.Y" citation style.

## Validation strategy

After all edits:

1. **Whitepaper-mention audit:** zero hits across 10 pages.
2. **Em-dash audit:** zero hits in prose.
3. **Paragraph length audit:** no prose paragraph over 240 chars.
4. **Locked-term spot-check:** zero hits for "Minimal STARK", "phantom row", "SilentSig", "Big-integer arithmetic".
5. **OLD section name diff:** all OLD section headers present in restored pages where applicable.
6. **Wp correction spot-check:** all 16 corrections from the preserve list still present.
7. **Hot-reload compile:** dev server compiles without errors.

## Items deliberately preserved

- ProverClient + ZiskHints code samples in host-and-guest.md.
- cargo-zisk CLI examples and flags.
- Mermaid diagrams (already styled with unified palette in prior pass).
- ASCII art blocks in why-zisk.md and scaling.md.

## Risks

1. **OLD background SNARK history not whitepaper-anchored.** Whitepaper §1 lead jumps straight to circuits→zkVMs. SNARK/STARK/recursion history is docs-pedagogy. Mitigation: keep concise, factual, not contradicting wp.
2. **5-axes "What every zkVM chooses" is docs-original framing.** Whitepaper does not enumerate axes. Mitigation: keep as docs survey of design space; nothing in it contradicts wp.
3. **Numeric trace heights are engineering values.** Caveat sentence handles this.
4. **Toolchain content moving from background to overview** changes navigation flow. Update internal cross-links.

## Implementation order

1. `introduction/background.md` — biggest restore. Take OLD as base, drop "ZisK from outside in" final section, layer wp corrections.
2. `introduction/why-zisk.md` — drop numbering, restore OLD section names, keep "Extensibility" lead, layer wp corrections.
3. `how-zisk-works/overview.md` — add "ZisK from outside in" content from OLD background.
4. `how-zisk-works/components.md` — drop Step framing, restore OLD section names.
5. `how-zisk-works/scaling.md` — drop 3-step framing, restore OLD flow, restore numeric table with caveat.
6. Verify other pages still aligned (intro.md, overview.md, pipeline.md, host-and-guest.md, proof-lifecycle.md).
7. Run validation suite.

## Success criteria

- All 10 pages match OLD structure (section names + flow).
- All wp-aligned facts preserved.
- Zero whitepaper-citation mentions in prose.
- Zero em-dashes, zero over-240 prose paragraphs.
- Sidebar resolves cleanly. Dev server compiles.
