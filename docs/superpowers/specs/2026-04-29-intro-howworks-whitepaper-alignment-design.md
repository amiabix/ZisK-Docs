# Intro + How ZisK Works — Whitepaper Alignment Design

**Date:** 2026-04-29
**Scope:** `intro/` (intro.md + introduction/ 3 pages) + `intro/how-zisk-works/` (6 pages) = 10 pages.
**Source of truth:** ZisK Whitepaper v0.16.1 (commit 48cf7cc). Whitepaper is the single canonical source. No skill notes. No source-tree assumptions outside whitepaper. No drift placeholders.

## Goal

Align the Introduction and How ZisK Works docs sections to the whitepaper. Every claim in these pages must trace to a whitepaper section. Where current docs go beyond the whitepaper, decisions are documented in this spec.

## Out of scope

- `intro/deep/` 8 pages.
- `developer/`, `prover/`, `references/` sections.
- Source-tree verification (ProverClient API shape, CLI flags, precompile catalog enumeration). Existing code samples are preserved as-is.

## Page-by-page change inventory

### `intro/intro.md`

No changes. Already aligned after prior pass.

### `intro/introduction/overview.md`

- Verify whitepaper abstract phrasing parity. Already aligned. No content adds.
- Optional Goldilocks aside deferred to deep/ to avoid front-loading notation.

### `intro/introduction/background.md`

No structural changes. Phrasing already aligned to whitepaper §1.1.

### `intro/introduction/why-zisk.md`

- Replace specific precompile enumeration (SHA-256, Keccak-256, BLAKE2b, secp256k1/r1, BN254, BLS12-381, modular exp, KZG, DMA) with whitepaper categories per §1.2 + §4.2.4: elliptic-curve arithmetic, cryptographic hash functions, bulk memory transfers.
- Drop "PLONK wrap" specific naming from intro context where ambiguous; keep "STARK" + "PLONK" only.
- Verify Goldilocks notation `p = 2⁶⁴ − 2³² + 1` matches whitepaper §1.4 form.

### `intro/how-zisk-works/overview.md`

- Strip em-dashes.
- Apply 240-character paragraph cap.
- Add `proof-lifecycle` row to "What's on each page" table (currently lists 4, sidebar has 5).

### `intro/how-zisk-works/pipeline.md`

- Strip em-dashes.
- Apply 240-character paragraph cap.
- Convert bold-label bullets to colon format.
- Drop "Minimal STARK" wrap row from output table. Keep STARK (default) and PLONK only. Wrap section text adjusted accordingly.
- Fix the "internal sub-stages" cross-link to point at `how-zisk-works/proof-lifecycle` instead of `deep/pipeline`.
- Existing CLI flag examples preserved verbatim.

### `intro/how-zisk-works/host-and-guest.md`

- Strip em-dashes.
- Apply 240-character paragraph cap.
- Convert bold-label bullets to colon format.
- Fix trust-model wording per whitepaper §2.2.7: both inputs and hints are untrusted until the guest verifies them. Current text treats inputs as trusted by default; whitepaper does not.
- Fix guest code snippet to include `#![no_main]` and `ziskos::entrypoint!(main)` per whitepaper §2.2.2 entry-point convention.
- Add memory layout note per whitepaper §2.2.5 Table 1: Input Data, ROM Data, System, Output, Program Memory regions with whitepaper-stated address ranges.
- Existing ProverClient and ZiskHints code samples preserved verbatim.

### `intro/how-zisk-works/components.md`

- Strip em-dashes.
- Apply 240-character paragraph cap.
- Convert bold-label bullets to colon format.
- Replace specific precompile enumeration with whitepaper categories per §4.2.4: hash precompiles, ECC precompiles, bulk memory precompiles. Drop algorithm-level names.
- Add MemAlign callout per whitepaper §4.2.2.2: small processor with eight byte-wide registers, four fixed subprograms for read/write within or spanning aligned 8-byte words.
- Standardize on "phantom instructions" wording per whitepaper §2.2.3. Drop "phantom rows".
- Add brief Goldilocks mention per whitepaper §1.4.
- Bus and chip naming: confirm Title Case matches whitepaper Table 2.

### `intro/how-zisk-works/scaling.md`

- Strip em-dashes.
- Apply 240-character paragraph cap.
- Convert bold-label bullets to colon format.
- Drop the numeric segment-size table (`2²² steps`, `2¹⁴ segments`, `2³⁶ ≈ 64G`). Whitepaper does not state these values.
- Replace numeric framing with whitepaper-faithful qualitative claims: per-chip trace heights `Nᵢ` (whitepaper §5.2), padding limited to final segment of each chip, opportunistic aggregation tree, parallel-by-construction.
- Name LtHash homomorphism explicitly when discussing the shared-challenge trick per whitepaper §6.3.
- Cross-link to `deep/limits` for engineering numeric data.

### `intro/how-zisk-works/proof-lifecycle.md`

- Strip em-dashes.
- Apply 240-character paragraph cap.
- Convert bold-label bullets to colon format.
- Drop "Minimal STARK" from Phase 4 wrap section. Keep default STARK + PLONK only.
- Name the two values exposed by each leaf proof per whitepaper §6.4: LogUp partial sum `sᵢ` (consistency contribution) and LtHash vector `cᵢ` (challenge contribution).
- Add "Compressor nodes" naming per whitepaper §6.4 to Phase 3e aggregation diagram and prose. Whitepaper has three tree node types: Leaf, Compressor, Aggregation.
- Use "phantom instructions" wording per whitepaper §2.2.3 in Phase 3a emulation.

## Whitepaper-locked terminology

Single source of truth = whitepaper. Decisions:

| Term | Whitepaper anchor | Rule |
|---|---|---|
| Proof types | §6 | "STARK" (default) + "PLONK" (EVM wrap) only in intro + how-zisk-works pages. |
| Precompile catalog | §1.2, §4.2.4 | Categories only: elliptic-curve arithmetic, cryptographic hash functions, bulk memory transfers. Algorithm names not in intro pages. |
| Phantom instructions | §2.2.3 | "Phantom instructions" verbatim. Not "phantom rows". |
| Goldilocks | §1.4 | `p = 2⁶⁴ − 2³² + 1`. Extension `𝔽[X]/(X³ − X − 1)` only in why-zisk.md. |
| Bus names | §4.3, Table 2 | Title Case: Operation Bus, ROM Bus, Memory Bus, Continuation Bus, Table Bus. |
| Chip names | §4.2 | Title Case: Main, Memory, MemAlign, Base Operations, Precompiles, Tables. |
| Memory regions | §2.2.5, Table 1 | Exact names: Input Data, ROM Data, System, Output, Program Memory. |
| Trust model | §2.2.7 | "Any value received from the host is untrusted until the guest has verified it" applies to both inputs and hints. |
| LtHash | §6.3 [Tea25] | Homomorphic over multiset union. SIS-hard [Ajt96]. |
| LogUp | §3.3 [Hab22], §6.4 | Partial sum `sᵢ` exposed as public output. Global `Σsᵢ = 0` at root. |
| Tree node types | §6.4, Figure 5 | Leaf, Compressor, Aggregation, Root. |
| Trace splitting | §5.2 | Per-chip partition. Padding limited to final segment per chip. |
| Continuation Bus | §5.3 | Chip-specific payload. Main carries (pc, c-reg). Memory carries (last addr, timestamp). Genesis + terminus anchors. |

## Style rules (apply to all pages in scope)

1. **No em-dashes** (`—`). Replace with `.`, `,`, `:`, or `()` as fits flow.
2. **Paragraph cap: 240 characters.** Split longer paragraphs at sentence boundaries.
3. **Bold-label bullets:** colon format `**Label:** detail.` Drop the `**Label** —` and `**Label.**` variants.
4. **Code-block box-drawing characters retained** in ASCII diagrams. Em-dash ban applies to prose only.
5. **Backticks for code identifiers** (`cargo-zisk`, `ZiskStdin`, `io::read`). Plain text for protocol names (STARK, PLONK).
6. **Italics via asterisks** (`*emphasis*`). Avoid underscore italics.
7. **Title Case for whitepaper-named entities** (chips, buses, memory regions). Sentence case for prose.

## Validation strategy

1. **Em-dash audit:** `grep -nP "—"` across 10 pages must return zero hits in prose.
2. **Paragraph length audit:** every prose paragraph ≤ 240 chars.
3. **Whitepaper anchor audit:** every claim with a whitepaper anchor in this spec must use whitepaper-canonical wording in the page text.
4. **Hot-reload preview:** dev server already running at `http://localhost:3000`. Each edited page visited and read top-to-bottom before sign-off.
5. **Cross-page consistency:** terminology table is canonical. Spot-check by grepping each locked term across the 10 pages.

## Items deliberately preserved as-is

- ProverClient + ZiskHints code samples in `host-and-guest.md`. No skill-knowledge edits.
- cargo-zisk CLI examples and flags. No skill-knowledge edits.
- Mermaid diagrams. Refreshed only where a whitepaper-locked label changes (e.g. "Minimal STARK" node removed).
- ASCII art diagrams in `why-zisk.md` precompile contrast block. Not edited.

## Risks

1. **"Minimal STARK" removal cascades** to `developer/proving-programs/proof-format.mdx`. Out of scope. Inconsistency between intro pages (STARK + PLONK) and proving-programs page (three-way) will exist until that page is touched in a separate spec.
2. **Precompile category-only listing** in why-zisk.md and components.md may feel less concrete to developers. Mitigated by `references/zisk-os/precompiles/` link.
3. **Numeric drop in scaling.md** removes a useful pedagogical anchor. Mitigated by cross-link to `deep/limits.md`.

## Implementation order

1. `intro/introduction/why-zisk.md`: precompile category swap.
2. `intro/how-zisk-works/overview.md`: style + table row add.
3. `intro/how-zisk-works/pipeline.md`: style + Minimal STARK drop + cross-link fix.
4. `intro/how-zisk-works/host-and-guest.md`: style + trust-model fix + entry-point fix + memory regions.
5. `intro/how-zisk-works/components.md`: style + precompile category swap + MemAlign + Goldilocks.
6. `intro/how-zisk-works/scaling.md`: style + numeric drop + LtHash naming.
7. `intro/how-zisk-works/proof-lifecycle.md`: style + Minimal drop + LogUp/LtHash naming + Compressor naming.

After each page: hot-reload check, visual scan, lint pass (em-dash + paragraph cap).

## Success criteria

- Zero em-dashes across 10 pages.
- All prose paragraphs ≤ 240 chars.
- All claims trace to a whitepaper section listed in this spec.
- Sidebar still resolves cleanly. No broken internal links.
- Dev server compiles without warnings on every edited page.
