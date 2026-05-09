# Intro + How ZisK Works Whitepaper Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Introduction and How ZisK Works docs sections to the ZisK whitepaper v0.16.1 (commit 48cf7cc). Every claim in 10 pages traces to a whitepaper section.

**Architecture:** Edit-only project on Docusaurus MDX/MD files. No code logic. Verification = em-dash grep, paragraph-length awk, hot-reload compile check, browser visual scan. Dev server runs at `http://localhost:3000`, hot-reload active (background task `bna3q4m2r`).

**Tech Stack:** Docusaurus, Markdown/MDX, Mermaid, plain text. Tools: Edit, Write, Read, Bash (grep/awk), browser at localhost:3000.

**Source of truth:** ZisK Whitepaper. No skill-knowledge edits to API code samples or CLI examples. Existing code samples preserved verbatim.

**Repository state:** Not a git repo (verified `ls .git` failed). Skip commits. Record changes via dev-server hot-reload only.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `intro/introduction/overview.md` | Page 1 of intro — what ZisK is | No change (already aligned) |
| `intro/introduction/background.md` | Page 2 of intro — problem framing | No change (already aligned) |
| `intro/introduction/why-zisk.md` | Page 3 of intro — design principles | Modify: precompile catalog → categories |
| `intro/intro.md` | Portal landing | No change (already aligned) |
| `intro/how-zisk-works/overview.md` | Section landing | Modify: em-dash strip + add proof-lifecycle row |
| `intro/how-zisk-works/pipeline.md` | 6-stage walkthrough | Modify: style + drop Minimal STARK + fix cross-link |
| `intro/how-zisk-works/host-and-guest.md` | Trust model + worked example | Modify: style + trust fix + entry-point fix + memory regions |
| `intro/how-zisk-works/components.md` | Chips + buses overview | Modify: style + precompile categories + MemAlign + Goldilocks |
| `intro/how-zisk-works/scaling.md` | Trace splitting + aggregation | Modify: style + numeric drop + LtHash naming |
| `intro/how-zisk-works/proof-lifecycle.md` | End-to-end run | Modify: style + drop Minimal + LogUp/LtHash names + Compressor |

**Spec reference:** `/Users/abix/Downloads/zisk-docs-update-proving-programs/docs/superpowers/specs/2026-04-29-intro-howworks-whitepaper-alignment-design.md`

---

## Global verification commands (use after every task)

```bash
# Em-dash check (must return zero hits)
grep -nP "—" <FILE>

# Paragraph length check (single-sentence paragraphs over 240 chars)
awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^- / && !/^[0-9]\. / && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' <FILE>

# Hot-reload status (must show "Compiled successfully")
tail -3 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

**Style rules applied uniformly:**
1. No em-dashes (`—`). Replace with `.`, `,`, `:`, or `()`.
2. Paragraph cap 240 chars.
3. Bold-label bullets use colon: `**Label:** detail.`
4. Code-block box-drawing chars retained (`─`, `▶`, etc.).
5. Whitepaper Title Case for: Operation Bus, ROM Bus, Memory Bus, Continuation Bus, Table Bus, Main, Memory, MemAlign, Base Operations, Precompiles, Tables, Input Data, ROM Data, Output, Program Memory.

---

## Task 1: why-zisk.md precompile category swap

**Files:**
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md`

- [ ] **Step 1: Read current Native precompiles section**

```bash
grep -n -A 20 "## Native precompiles" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/why-zisk.md
```

Expected: section listing `SHA-256, Keccak-256, BLAKE2b`, `secp256k1 / secp256r1`, etc.

- [ ] **Step 2: Replace specific algorithm list with whitepaper categories**

Use Edit tool to replace the bullet list under `## Native precompiles`.

Old (the specific 6-line bullet block):

```
- SHA-256, Keccak-256, BLAKE2b
- secp256k1 / secp256r1 ECDSA recovery and verification
- BN254 and BLS12-381 pairings
- Modular exponentiation
- KZG verification
- Bulk DMA memory transfers
```

New (whitepaper §1.2 + §4.2.4 categories):

```
- **Cryptographic hash functions:** committing to large data blobs and computing state roots.
- **Elliptic-curve arithmetic:** signature recovery, verification, and pairing-based protocols.
- **Bulk memory transfers:** moving large buffers between memory regions in one operation.
```

- [ ] **Step 3: Verify em-dash, paragraph length, hot-reload**

Run the three global verification commands on `intro/introduction/why-zisk.md`. Expected: zero em-dashes, zero over-240 paragraphs, "Compiled successfully" in dev server log.

- [ ] **Step 4: Visual scan**

Open `http://localhost:3000/intro/introduction/why-zisk` in browser. Read top to bottom. Confirm precompile section now lists categories.

---

## Task 2: how-zisk-works/overview.md style + add proof-lifecycle row

**Files:**
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/overview.md`

- [ ] **Step 1: Read current file**

Read full file. Identify all em-dashes.

```bash
grep -nP "—" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/overview.md
```

- [ ] **Step 2: Strip em-dashes via targeted Edit calls**

For each em-dash occurrence, replace with `.`, `,`, `:`, or `()` per flow. Common patterns:

- `**overview level** —` → `**overview level**.`
- `Same material — same definitions, with the` → `Same material. Same definitions with the`

Use Edit tool with `replace_all: false`, exact context match.

- [ ] **Step 3: Add proof-lifecycle row to "What's on each page" table**

Find the table under `## What's on each page in this section`. It currently has 4 rows. Add a 5th row before or after `## Together` paragraph:

```
| **[Lifecycle of a proof](./proof-lifecycle)** | The full proving run end to end, in chronological order. Compile, setup, execute, prove (with sub-stages), wrap, verify. |
```

Use Edit tool to insert the new row at the right spot in the table.

- [ ] **Step 4: Update the four-questions list**

Add a fifth bullet question matching the new table row:

```
- "What does one full proving run look like end to end?" → **Lifecycle of a proof**.
```

- [ ] **Step 5: Apply 240 cap**

Run length awk. Split any over-240 paragraph at sentence boundaries. Insert blank line between sentences.

- [ ] **Step 6: Verify**

Run em-dash grep + length awk + hot-reload tail. All clean.

- [ ] **Step 7: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/overview` in browser. Confirm 5-row table.

---

## Task 3: pipeline.md style + drop Minimal STARK + fix cross-link

**Files:**
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/pipeline.md`

- [ ] **Step 1: Strip em-dashes**

Run `grep -nP "—" intro/how-zisk-works/pipeline.md`. For each occurrence, replace via Edit tool.

Common pattern in this file:

- `description: A six-stage tour of how a Rust program becomes a verified ZisK proof — at an overview level.` → `description: A six-stage tour of how a Rust program becomes a verified ZisK proof at an overview level.`
- `which is what verifiers later use to check those proofs.` (already clean)
- `verification is fast and constant — independent` → `verification is fast and constant. It is independent`

- [ ] **Step 2: Drop Minimal STARK from Wrap section table**

Find the wrap-options table:

```
| Output            | Use when                                            | Flag        |
| ----------------- | --------------------------------------------------- | ----------- |
| **STARK**         | Local verification, internal pipelines (default).   | *(none)*    |
| **Minimal STARK** | Off-chain distribution where size matters.          | `--minimal` |
| **PLONK**         | On-chain verification by an EVM Solidity contract.  | `--plonk`   |
```

Replace with two-row form (whitepaper §6 = STARK base + PLONK wrap only):

```
| Output     | Use when                                            | Flag        |
| ---------- | --------------------------------------------------- | ----------- |
| **STARK**  | Local verification, internal pipelines (default).   | *(none)*    |
| **PLONK**  | On-chain verification by an EVM Solidity contract.  | `--plonk`   |
```

- [ ] **Step 3: Update wrap section prose**

Find the paragraph after the table that explains Minimal vs PLONK:

```
The Minimal variant proves the original STARK with another, more
compact STARK on top — the result is smaller but still
STARK-style. The PLONK variant goes one step further and wraps
the result in a different kind of proof (a SNARK) that an EVM
contract can verify cheaply on-chain.
```

Replace with whitepaper-anchored:

```
The PLONK variant wraps the STARK in a SNARK that an EVM
contract can verify cheaply on-chain. Without the wrap, the
STARK output stands as the proof.
```

- [ ] **Step 4: Fix the internal-sub-stages cross-link**

Find:

```
For the internal sub-stages (especially what happens *inside* the Prove step) and
the exact CLI/SDK surface, see
[Deep understanding → The proving pipeline](/intro/deep/pipeline).
```

Replace with two-link form: how-zisk-works/proof-lifecycle for chronological walkthrough + deep/pipeline for mechanics:

```
For the chronological walkthrough of all six stages, see
[Lifecycle of a proof](./proof-lifecycle).
For the per-AIR STARK internals and exact CLI/SDK surface, see
[Deep understanding → The proving pipeline](/intro/deep/pipeline).
```

- [ ] **Step 5: Mermaid diagram cleanup**

Find the wrap node in the mermaid block:

```
    WRAP -->|none| OUT
    WRAP -->|Minimal STARK| OUT
    WRAP -->|PLONK| OUT
```

Drop the Minimal STARK arrow:

```
    WRAP -->|none| OUT
    WRAP -->|PLONK| OUT
```

- [ ] **Step 6: Apply 240 cap + colon bullets where present**

Length awk. Split offenders. Convert any `**Label** —` to `**Label:**`.

- [ ] **Step 7: Verify**

Em-dash grep + length awk + hot-reload tail. Clean.

- [ ] **Step 8: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/pipeline`. Confirm 2-row wrap table, mermaid renders, links resolve.

---

## Task 4: host-and-guest.md style + trust-model fix + entry-point fix + memory regions

**Files:**
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/host-and-guest.md`

- [ ] **Step 1: Strip em-dashes**

Run `grep -nP "—" intro/how-zisk-works/host-and-guest.md`. Many occurrences. Replace each via Edit tool.

- [ ] **Step 2: Fix trust-model wording**

Find (around line 53):

```
### Public inputs

Values the verifier already knows about (or can compute) — for
example, the block being validated, the transactions in a batch,
the parameters of a contract call.

The host loads these into the **input stream** before execution
begins. The verifier sees them and treats them as inputs to the
computation being proved.
```

Replace with whitepaper §2.2.7-aligned form (both inputs and hints untrusted until verified, but inputs are public to the verifier):

```
### Public inputs

Values the verifier already knows about, for example the block
being validated, the transactions in a batch, or the parameters
of a contract call.

The host loads these into the **input stream** before execution
begins. They are visible to the verifier as part of the proof's
public data.

The proof system itself does not assert any property of the
input stream beyond the bytes the guest reads. If the guest
relies on a property of an input, the guest is responsible for
checking it.
```

- [ ] **Step 3: Tighten the hint section**

Find:

```
> A hint that is never verified proves nothing.
```

Add a sentence above the blockquote making the input/hint parallel explicit:

```
The same rule applies to inputs as it does to hints: any value
received from the host is unconstrained until the guest itself
verifies whatever property it relies on.

> A hint that is never verified proves nothing.
```

- [ ] **Step 4: Fix guest code snippet entry-point**

Find the worked-example guest snippet (around line 151):

```rust title="guest/src/main.rs"
fn main() {
    let input: String = io::read();              // (a) read from input stream
    let digest = Sha256::digest(input.as_bytes());// (b) compute SHA-256 (precompile)
    io::commit_slice(&digest);                    // (c) write to public outputs
}
```

Replace with whitepaper §2.2.2-aligned form including entry-point declaration:

```rust title="guest/src/main.rs"
#![no_main]
ziskos::entrypoint!(main);

use sha2::{Digest, Sha256};
use ziskos::io;

fn main() {
    let input: String = io::read();              // (a) read from input stream
    let digest = Sha256::digest(input.as_bytes());// (b) compute SHA-256 (precompile)
    io::commit_slice(&digest);                    // (c) write to public outputs
}
```

- [ ] **Step 5: Add memory layout note**

After the "What the guest cannot do" section (around line 110), add a new section before "A worked example":

```markdown
## Where the guest's data lives

The guest's address space is split into named regions per
whitepaper §2.2.5:

- **Input Data:** the public input stream, written once at
  initialisation, read-only thereafter.
- **ROM Data:** program constants embedded in the binary,
  read-only.
- **System:** registers, UART, and CSR registers.
- **Output:** the region into which `pubout` writes public
  outputs during execution.
- **Program Memory:** general-purpose read/write RAM.

The Memory chip enforces consistency across all regions. Reads
return the most recent write, write-once regions reject any
second write, and immutable regions reject any write at all.
```

- [ ] **Step 6: Apply 240 cap + colon bullets**

Length awk. Split. Convert bold-label bullets.

- [ ] **Step 7: Preserve ProverClient + ZiskHints code samples**

Confirm the host code blocks (both the public-input and hint variants near line 130 and line 211) are unchanged. No skill-knowledge edits to API surface.

- [ ] **Step 8: Verify**

Em-dash grep + length awk + hot-reload tail. Clean.

- [ ] **Step 9: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/host-and-guest`. Confirm new memory regions section renders, guest code shows entry-point, trust prose updated.

---

## Task 5: components.md style + precompile categories + MemAlign + Goldilocks

**Files:**
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md`

- [ ] **Step 1: Strip em-dashes**

Run `grep -nP "—" intro/how-zisk-works/components.md`. Replace each.

- [ ] **Step 2: Replace precompile algorithm list with categories**

Find (around line 130):

```
- Hashes: `sha256`, `keccak`, `blake2`, `poseidon2`
- Signatures: `secp256k1_*`, `secp256r1_*`
- Pairings / curves: `bn254_*`, `bls12_381_*`
- Big-integer arithmetic: `add256`, `arith256`, `arith384_mod`
- Bulk memory: `dma_memcpy`, `dma_memcmp`, `dma_inputcpy`, …
```

Replace with whitepaper §4.2.4 category-only form:

```
- **Cryptographic hash functions:** committing to large data and computing state roots.
- **Elliptic-curve arithmetic:** ECDSA recovery and verification, pairing-based protocols.
- **Bulk memory transfers:** moving large buffers between memory regions in one operation.
- **Big-integer arithmetic:** modular reductions used in cryptographic primitives.
```

Add a sentence:

```
The full catalogue of available precompile opcodes lives in
[Precompile reference](/references/zisk-os/precompiles).
```

- [ ] **Step 3: Standardize "phantom instructions"**

Run:

```bash
grep -n "phantom row" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/components.md
```

For each occurrence, replace `phantom row` (and `phantom rows`) with `phantom instruction` (`phantom instructions`).

Example sites: SHA-256 sequence diagram caption, Main chip records prose.

- [ ] **Step 4: Add MemAlign callout**

Find the `| **MemAlign** |` row in the chips table (around line 71). Confirm it stays. After the chips table, add a brief subsection:

```markdown
### MemAlign briefly

Per whitepaper §4.2.2.2, MemAlign is a small processor with
eight byte-wide registers. It executes one of four fixed
subprograms depending on the requested access:

1. **Read within one word:** one aligned read, extract bytes.
2. **Write within one word:** one aligned read, patch bytes,
   one aligned write.
3. **Read spanning two words:** two aligned reads, combine.
4. **Write spanning two words:** two aligned reads, patch
   bytes in each, two aligned writes.

Every memory access on the Memory Bus is therefore an aligned
8-byte operation, regardless of how the guest issued it.
```

- [ ] **Step 5: Add Goldilocks mention**

In the "How chips talk to each other" section, after the bus-balancing explanation paragraph, add:

```markdown
All bus messages and constraint values are field elements over
the Goldilocks prime (*p* = 2⁶⁴ − 2³² + 1) per whitepaper §1.4.
```

- [ ] **Step 6: Apply 240 cap + colon bullets**

Length awk. Split. Colon-format bullets.

- [ ] **Step 7: Verify**

Em-dash grep + length awk + hot-reload tail. Clean.

- [ ] **Step 8: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/components`. Confirm category list, MemAlign subsection, Goldilocks mention.

---

## Task 6: scaling.md style + numeric drop + LtHash naming

**Files:**
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/scaling.md`

- [ ] **Step 1: Strip em-dashes**

Run `grep -nP "—" intro/how-zisk-works/scaling.md`. Replace each.

- [ ] **Step 2: Drop the numeric "Putting numbers on it" section**

Find (around line 154):

```markdown
## Putting numbers on it

Abstract diagrams are easier to internalise with concrete sizes.
Here's roughly what the splitting and aggregation produce for two
very different workloads:

| Workload                      | Steps        | ...
...
A real Ethereum-block validation produces something on the order
of a few hundred per-chip segments and a binary aggregation tree
of roughly 10–12 levels. That tree sits comfortably below the
ceiling — the design has substantial headroom (see
[Limits](/intro/deep/limits) for the full table).
```

Replace with whitepaper-faithful qualitative form:

```markdown
## Sizing

The whitepaper does not fix specific trace heights in §5.2.
Each chip declares its own segment height *Nᵢ*, sized to that
chip's typical work pattern. A chip that does almost nothing in
a workload still produces just one short segment, not one per
Main segment.

For concrete engineering numbers (segment heights, maximum
segments, maximum total steps), see
[Deep understanding → Limits](/intro/deep/limits).
```

- [ ] **Step 3: Name LtHash explicitly in shared-challenge section**

Find the "shared-challenge trick" section. Currently uses "special hash function" and parks LtHash naming for the deep section. Surface LtHash by name in this overview:

After the paragraph starting "ZisK avoids both by using a special hash function...", append:

```markdown
The function is **LtHash**, a lattice-based multiset hash per
whitepaper §6.3 [Tea25]. Its homomorphism over multiset union
means partial accumulators from any subset of provers can be
merged later into the full accumulator with no order
constraints.
```

- [ ] **Step 4: Apply 240 cap + colon bullets**

Length awk. Split. Colon format.

- [ ] **Step 5: Verify**

Em-dash grep + length awk + hot-reload tail. Clean.

- [ ] **Step 6: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/scaling`. Confirm numeric table dropped, LtHash named.

---

## Task 7: proof-lifecycle.md style + drop Minimal + LogUp/LtHash names + Compressor

**Files:**
- Modify: `/Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/proof-lifecycle.md`

- [ ] **Step 1: Strip em-dashes**

Run `grep -nP "—" intro/how-zisk-works/proof-lifecycle.md`. Replace each.

- [ ] **Step 2: Drop Minimal STARK from Phase 4 Wrap section**

Find (around line 361):

```markdown
## Phase 4 — Wrap (optional)

If you need a smaller proof or one verifiable on-chain:

```bash
# default — STARK, no wrap
cargo-zisk prove -i "Hello Zisk"

# Minimal STARK (smaller, recursive STARK over the default)
cargo-zisk prove -i "Hello Zisk" --minimal

# PLONK SNARK (constant-size, EVM-verifiable)
cargo-zisk prove -i "Hello Zisk" --plonk
```

Wrapping is just one more layer of recursion: a verifier circuit
that checks the previous proof, wrapped in a new proof of
whichever kind you asked for.
```

Replace with whitepaper-anchored two-option form:

```markdown
## Phase 4: Wrap (optional)

If the proof needs to be verified on an EVM chain, wrap it in a
SNARK that the contract can verify cheaply.

```bash
# default: STARK, no wrap
cargo-zisk prove -i "Hello Zisk"

# PLONK SNARK, constant-size, EVM-verifiable
cargo-zisk prove -i "Hello Zisk" --plonk
```

Wrapping is one more layer of recursion. A verifier circuit
checks the underlying STARK, then is itself wrapped in a SNARK.
```

- [ ] **Step 3: Name the two leaf values explicitly in Phase 3d**

Find (around line 296):

```markdown
Each per-segment proof exposes two small numbers in its public
data, which the next sub-stage will use:

- A **consistency contribution** — this segment's share of the
  global "every bus message was received" check.
- A **challenge contribution** — this segment's share of the
  shared random challenge that all segments agreed on.

These two numbers are tiny (one field element each), but they're
what makes everything stitch together at the end.
```

Replace with whitepaper-named form per §6.4:

```markdown
Each per-segment proof exposes two values in its public data,
which the next sub-stage uses:

- **LogUp partial sum sᵢ:** this segment's signed contribution
  to bus balancing per whitepaper §3.3 and §6.4. The global
  check is `Σsᵢ = 0`.
- **LtHash challenge contribution cᵢ:** this segment's
  additive share of the shared challenge `α` per whitepaper
  §6.3 and §6.4.

Both are field elements. The aggregation tree adds them up the
tree and the root checks the sums.
```

- [ ] **Step 4: Add Compressor node naming in Phase 3e**

Find the Phase 3e Aggregation section (around line 306). Add a paragraph after the sequence diagram explaining the three node types per whitepaper §6.4:

```markdown
The aggregation tree has three node types per whitepaper §6.4:

- **Leaf nodes:** the raw per-segment proofs.
- **Compressor nodes:** sit directly above leaves and convert
  each leaf proof into a recursion-friendly format with the
  same public outputs.
- **Aggregation nodes:** combine two compressed proofs into one
  by verifying both children and summing their `sᵢ` and `cᵢ`.
- **Root:** runs the two final checks (`Σsᵢ = 0` and the
  challenge consistency).
```

- [ ] **Step 5: Use "phantom instructions" wording**

In Phase 3a Emulation, find any "phantom row" mentions and replace with "phantom instruction" per whitepaper §2.2.3.

- [ ] **Step 6: Apply 240 cap + colon bullets**

Length awk. Split. Colon format.

- [ ] **Step 7: Update Phase headings**

The skill rule favours `## Phase N: title` (colon) over `## Phase N — title` (em-dash). Convert all 6 phase headings:

- `## Phase 0 — Compile (one-time, before everything)` → `## Phase 0: Compile (one-time, before everything)`
- `## Phase 1 — Setup (one-time, per ELF)` → `## Phase 1: Setup (one-time, per ELF)`
- `## Phase 2 — Execute (optional sanity check)` → `## Phase 2: Execute (optional sanity check)`
- `## Phase 3 — Prove` → `## Phase 3: Prove`
- `## Phase 4 — Wrap (optional)` → `## Phase 4: Wrap (optional)` (already done in Step 2)
- `## Phase 5 — Verify` → `## Phase 5: Verify`

Sub-headings `### Phase 3a — Emulation` etc. similarly converted to colon form.

- [ ] **Step 8: Verify**

Em-dash grep + length awk + hot-reload tail. Clean.

- [ ] **Step 9: Visual scan**

Open `http://localhost:3000/intro/how-zisk-works/proof-lifecycle`. Confirm Compressor nodes added, LogUp/LtHash named, Minimal dropped, Phase headings use colons.

---

## Final task: cross-page consistency sweep

**Files:** all 10 in scope.

- [ ] **Step 1: Em-dash global sweep**

```bash
grep -nP "—" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/*.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/*.md
```

Expected: zero hits. If any remain, fix.

- [ ] **Step 2: Paragraph length global sweep**

```bash
for f in /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/*.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/*.md; do
  awk 'BEGIN{RS=""; FS=""} !/^---/ && !/^```/ && !/^- / && !/^[0-9]\. / && length($0)>240 {gsub(/\n/," "); print FILENAME":"NR":"length($0)":"substr($0,1,80)"..."}' "$f"
done
```

Expected: zero hits. If any remain, split.

- [ ] **Step 3: Locked-term spot-check**

For each of these terms, grep across the 10 pages. Confirm consistent usage:

```bash
for term in "Minimal STARK" "phantom row" "phantom rows" "SilentSig"; do
  echo "=== $term ==="
  grep -rn "$term" /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/intro.md /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/introduction/ /Users/abix/Downloads/zisk-docs-update-proving-programs/intro/how-zisk-works/
done
```

Expected: zero hits for all four. If any present, remove.

- [ ] **Step 4: Hot-reload final check**

```bash
tail -5 /private/tmp/claude-501/-Users-abix-Downloads-zisk-docs-update-proving-programs/86cccb60-cc4c-4bdd-b05f-1897ce94771a/tasks/bna3q4m2r.output
```

Expected: latest line is "Compiled successfully".

- [ ] **Step 5: Browser walkthrough**

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

No broken links, mermaid renders, sidebar resolves.

---

## Self-review notes (post-write)

**Spec coverage check:**

- ✅ Page-by-page changes (spec §"Page-by-page change inventory") → Tasks 1–7.
- ✅ Whitepaper-locked terminology (spec §"Whitepaper-locked terminology") → applied within tasks (Minimal STARK drop in Tasks 3+7, precompile categories in Tasks 1+5, phantom instructions in Tasks 5+7, Goldilocks in Task 5, memory regions in Task 4, trust model in Task 4, LtHash naming in Tasks 6+7, LogUp naming in Task 7, Compressor naming in Task 7).
- ✅ Style rules (spec §"Style rules") → embedded as global rules + per-task verification.
- ✅ Validation strategy (spec §"Validation strategy") → final task + per-task verify steps.
- ✅ Items deliberately preserved (spec §"Items deliberately preserved as-is") → explicit no-touch instructions in Task 4 Step 7.
- ✅ Implementation order (spec §"Implementation order") → matches Task 1–7 ordering.

**Placeholder scan:** zero TBD/TODO/FIXME. Every step has concrete action and exact verification command.

**Type consistency:** N/A (docs project, no code types). Term consistency verified via final task Step 3.

**Risks restated:** Minimal STARK removal causes intro vs developer/proving-programs/proof-format.mdx mismatch (out of scope). Numeric drop in scaling.md mitigated by deep/limits link. Precompile category-only listing mitigated by references/zisk-os/precompiles link.

---

## Success criteria

- Zero em-dashes across 10 pages.
- All prose paragraphs ≤ 240 chars.
- Locked terms (Minimal STARK, phantom rows, SilentSig) absent.
- Whitepaper-named terms (Compressor nodes, LogUp partial sum, LtHash, phantom instructions, MemAlign) present where required.
- Sidebar still resolves cleanly.
- Dev server compiles every page successfully.
