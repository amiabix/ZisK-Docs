# ZisK Docs Rewrite: Change Summary

**Date:** 2026-04-30
**Scope:** 18 pages across `intro/`, `intro/introduction/`, `intro/how-zisk-works/`, `intro/deep/`.
**Goal:** Bring the documentation into strict alignment with the ZisK Whitepaper while restoring OLD-style narrative structure.

---

## 1. Whitepaper-faithful content corrections

| # | Correction | Whitepaper anchor | Affected pages |
|---|---|---|---|
| 1 | 3 precompile categories (cryptographic hash functions, elliptic-curve arithmetic, bulk memory transfers). Algorithm enumeration dropped from intro pages. | §1.2 + §4.2.4 | `why-zisk.md`, `components.md` |
| 2 | 3 aggregation tree node types: Leaf, Compressor, Aggregation. Root described as topmost aggregation node, not a 4th node type. | §6.4 | `scaling.md`, `proof-lifecycle.md`, `deep/recursion.md` |
| 3 | Leaf proof exposes 3 values: own outputs `oᵢ`, LogUp partial sum `sᵢ`, LtHash challenge contribution `cᵢ`. | §6.4 | `proof-lifecycle.md`, `deep/recursion.md` |
| 4 | Trust model split: system level (host trusted by convention) vs proof level (host bytes unconstrained until verified). | §2.1 + §2.2.7 | `overview.md`, `host-and-guest.md` |
| 5 | Both streams (input + hint) untrusted until guest verifies. | §2.2.7 | `host-and-guest.md`, `deep/isa.md` |
| 6 | Memory regions named per Table 1: Input Data, ROM Data, System, Output data, Program memory. | §2.2.5 | `host-and-guest.md`, `deep/processor.md`, `deep/isa.md` |
| 7 | Goldilocks prime field + extension `𝕂 = 𝔽[X]/(X³ − X − 1)`. | §1.4 | `why-zisk.md`, `components.md`, `deep/arithmetization.md` |
| 8 | MemAlign 8 byte-wide registers + 4 fixed subprograms. | §4.2.2.2 | `components.md`, `deep/processor.md`, `deep/chips.md` |
| 9 | "Phantom instructions" wording. Dropped "phantom rows". | §2.2.3 | `deep/isa.md`, `components.md`, `proof-lifecycle.md` |
| 10 | LtHash homomorphism over multiset union + SIS-hard security. | §6.3 | `scaling.md`, `deep/recursion.md` |
| 11 | "Public-output instruction" in prose. `pubout` engineering name kept only in code-context. | §2.2.6 | `host-and-guest.md`, `deep/isa.md`, `deep/processor.md` |
| 12 | "Output data" region name. Dropped bare "Output". | §2.2.5 | `host-and-guest.md`, `deep/processor.md`, `deep/limits.md` |
| 13 | Guest entry-point convention `#![no_main]` + `ziskos::entrypoint!(main)` in worked example. | §2.2.2 | `host-and-guest.md` |
| 14 | "Verification key" → "program commitment" in conceptual prose. SDK API names (`ProgramVK`, `.with_program_vk()`) preserved in code-context. | §2.2.1 | `overview.md`, `pipeline.md`, `host-and-guest.md`, `proof-lifecycle.md`, `deep/pipeline.md`, `deep/limits.md` |
| 15 | "Minimal STARK" dropped from intro and how-zisk-works pages. Kept in `deep/pipeline.md` for full breakdown. | §6 | `pipeline.md`, `proof-lifecycle.md`, `why-zisk.md` |
| 16 | "SilentSig" brand attribution removed. ZisK Core Team byline aligns with whitepaper. | Whitepaper byline | `intro.md`, `overview.md` |

---

## 2. Style discipline

Applied uniformly across all 18 pages:

- **Zero em-dashes** (`—`, U+2014) in prose. Box-drawing chars in code blocks retained.
- **Zero whitepaper inline citations** (`§X.Y` style) in prose, per the project rule.
- **Paragraph cap 240 characters** for prose paragraphs.
- **Bold-label bullets** standardized to colon form: `**Label:** detail.`
- **Title Case for whitepaper-named entities**: Operation Bus, ROM Bus, Memory Bus, Continuation Bus, Table Bus, Main, Memory, MemAlign, Base Operations, Precompiles, Tables, Input Data, ROM Data, Output data, Program memory.

---

## 3. Structural restore (OLD reference)

The `intro/` and `intro/how-zisk-works/` sections previously had NEW-imposed scaffolding (numbered `## Step 1: ...` sections, dependency lists, "This step covers..." leads). Restored OLD-style narrative structure:

- **`background.md`** restored to full 5-section narrative: SNARK history (3 waves), circuits → zkVMs, two flavours of zkVM, "What every zkVM has to choose" (5 axes), Where ZisK fits.
- **"ZisK from outside in"** content (toolchain, RV-vs-ZK framing, two emulators) moved from background to `how-zisk-works/overview.md`.
- **`scaling.md`** restored "Putting numbers on it" section with engineering-values caveat at top.
- **`why-zisk.md`** dropped numbered `## 1. ... ## 9.` prefixes and dependency-list scaffolding. Restored OLD-style clean section names.
- **`components.md`** dropped `## Step 1: ... ## Step 4:` framing. Restored OLD-style clean section names. Promoted "Precompiles, briefly" to top-level.

---

## 4. Diagram pass

### Unified palette (across all flowcharts)

```
classDef chip      fill:#2D2E3D,stroke:#2D2E3D,color:#FFFFFF   /* active components */
classDef artifact  fill:#007755,stroke:#007755,color:#FFFFFF   /* data, proofs, traces */
classDef output    fill:#00FF7C,stroke:#007755,color:#2D2E3D   /* final result */
classDef decision  fill:#F3F3F2,stroke:#007755,color:#2D2E3D   /* branches */
```

### Single shape rule

All flowchart nodes use `[Square]`. One `{Diamond}` exception for the `{wrap?}` decision in `pipeline.md`. Cylinders, stadiums, slants, and round shapes flattened.

### Sequence diagram theming

8 sequence diagrams across host-and-guest, components, proof-lifecycle now use a consistent theme:

```
%%{init: {'theme': 'base', 'themeVariables': {
    'actorBkg': '#FFFFFF', 'actorTextColor': '#2D2E3D',
    'actorBorder': '#2D2E3D', 'actorLineColor': '#7A7E9C',
    'noteBkgColor': '#F3F3F2', 'noteTextColor': '#2D2E3D',
    'noteBorderColor': '#007755'
}}}%%
```

White card actors with dark text and border, gray lifelines, light gray notes with green border. Mermaid actors no longer default lavender.

### Semantic class drift fixes

- **ROM and Tables** classed as `chip` (per whitepaper §4.1, both are chip types). Previously `artifact`.
- **Continuation-chain segments** reclassed as `artifact` (segments are partitioned trace data, not active processes). Previously `chip`.
- **Phase 3 sub-stages** classed uniformly. Phase 3f no longer styled as `output` while 3a-3e are `chip`.
- **Whole pipeline diagram** Verifier reclassed as `chip` (actor) instead of `output` (result).

---

## 5. Fresh-dev orientation pass

### Closer label standardized

All pages use `## Where this picks up` for forward-nav. Variants `## Where to go next`, `## What's next`, `## And then?` consolidated. Exception: `intro.md` portal landing keeps `## And then?` (portal voice).

### Closers added to 6 dead-ended pages

Pages that previously had no forward-nav now have a closer with 2-4 sentence breadcrumb to the next conceptual page:

- `introduction/background.md`
- `introduction/why-zisk.md`
- `how-zisk-works/overview.md`
- `how-zisk-works/components.md`
- `deep/recursion.md`
- `deep/limits.md`

### Inline glosses for jargon at first appearance

- **ELF**: "executable file in the standard format Linux uses for native binaries"
- **Program commitment**: "small cryptographic fingerprint (a hash) of the compiled ELF, included in the verifier's context"
- **Witness**: "the full set of intermediate values the prover needs to fill in to produce a proof"
- **AIR**: "Algebraic Intermediate Representation, the constraint shape each chip uses"
- **Precompile + transpiler**: glossed in worked example before SHA-256 demonstration
- **Phantom instructions**: defined per whitepaper §2.2.3
- **Memory chip**: forward-link added on host-and-guest.md
- **PIL**: "Polynomial Intermediate Language, the constraint description language ZisK circuits are written in"
- **`<crate>` placeholder**: explained in pipeline.md Compile stage
- **`dma_inputcpy`**: glossed as precompile in proof-lifecycle.md log example
- **Tree depth**: glossed in scaling.md numeric table
- **Bus concept**: glossed before Continuation Bus introduction in scaling.md

### Page-intro framing

Each how-zisk-works page now opens with a short orientation paragraph linking back to its predecessor. Examples:

- `pipeline.md`: "first stop on the *How ZisK works* tour..."
- `host-and-guest.md`: "The pipeline page showed the six stages from the outside. This page opens up the stage where the guest actually runs..."
- `components.md`: "This page covers what the chips are, why ZisK is built this way, and how the chips talk to each other..."
- `scaling.md`: "This page covers how the breaking-and-folding works at an overview level..."

---

## 6. Lead tightening (final pass)

Several page leads previously read as overly conversational. Tightened to mirror whitepaper voice:

- **`intro/intro.md`** portal lead now mirrors whitepaper abstract.
- **`introduction/overview.md`** lead is now 3 short paragraphs taken near-verbatim from the whitepaper abstract.
- **`introduction/background.md`** lead trimmed from 3 framing paragraphs to 1.
- **`introduction/why-zisk.md`** lead trimmed from 2 framing paragraphs to 1.
- **`how-zisk-works/overview.md`** dropped "for someone who wants..." conditional voice.
- **`components.md`** dropped double-negative "isn't producing one giant proof" opener.

---

## 7. Items deliberately preserved

These were preserved by explicit decision during the rewrite:

- **ProverClient + ZiskHints + ZiskStdin code samples** in `host-and-guest.md` (not source-verified per spec rule).
- **`cargo-zisk` CLI flag examples** across pages (not source-verified).
- **Engineering API names in code context**: `ProgramVK`, `.with_program_vk()`, `.with_hints()`, `pubout` opcode.
- **`intro/intro.md`** portal voice closer (`## And then?`).
- **Hint-variant code snippet** in `host-and-guest.md` retains dangling `stdin` reference (preserved per explicit instruction).

---

## 8. Honest gaps remaining

These are known limitations of the current rewrite, deliberately scoped out:

1. **Cross-section "Minimal STARK" mismatch.** Intro and how-zisk-works pages drop "Minimal STARK" per whitepaper §6. `deep/pipeline.md` and `developer/proving-programs/proof-format.mdx` retain the three-format breakdown. A separate spec would unify these.
2. **Engineering numerical limits in `deep/limits.md`** (2²² steps per Main segment, 2¹⁴ max segments, 2³⁶ max steps) are not whitepaper-stated. Engineering values, caveat present in `scaling.md`.
3. **Engineering API code samples not verified** against current SDK source. The whitepaper-only sourcing rule meant we did not cross-reference SDK methods.

---

## 9. File-level coverage

| Section | Files | Whitepaper sections covered |
|---|---|---|
| `intro/intro.md` | 1 | Abstract |
| `intro/introduction/` | 3 (overview, background, why-zisk) | §1, §1.1, §1.2 |
| `intro/how-zisk-works/` | 6 (overview, pipeline, host-and-guest, components, scaling, proof-lifecycle) | §2, §3, §4, §5, §6 (overview-level) |
| `intro/deep/` | 8 (isa, processor, arithmetization, chips, continuations, recursion, pipeline, limits) | §2 (full), §3 (full), §4 (full), §5, §6, §6.3, §6.4, engineering limits |

Every whitepaper section has at least one docs page that covers it.

---

## 10. Verification status

- Zero em-dashes across 18 pages
- Zero "whitepaper" inline citations across 18 pages
- Zero locked-term hits: "Minimal STARK", "phantom row", "SilentSig", "Big-integer arithmetic", `## Step N:`, `## N. ...` (except `pipeline.md` legitimate stage numbering)
- Zero "verification key" or "verkey" in conceptual prose
- All 6 previously-missing closers present
- Sequence diagrams themed (8/8)
- Flowcharts use unified palette (all)
- Dev server compiles successfully
