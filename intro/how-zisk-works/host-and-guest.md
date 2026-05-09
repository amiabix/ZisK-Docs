---
id: host-and-guest
sidebar_position: 3
title: Host & guest
description: The two-process model that ZisK runs. What's inside
  the zkVM (the guest), what's outside (the host), and what flows
  between them.
---

# Host & guest

The [pipeline](./pipeline) page showed the six stages from the
outside. This page opens up the stage where the guest actually
runs and shows what flows in and out of the zkVM during
execution.

The trust boundary between host and guest is the most important
mental model in ZisK. Get this clear and most of the rest of the
system follows.

ZisK is built around a **strict two-process split**:

- The **guest** is the code that runs *inside* the zkVM. Every
  instruction it executes will be attested by the proof. The
  guest is sandboxed: it cannot reach outside its
  own state to do I/O, syscalls, or network access.
- The **host** is the physical machine outside the zkVM. It
  runs ordinary code that prepares the inputs, drives the
  prover, and reads the result. The host also supplies the
  guest's input source and, for hint-enabled flows, the hint
  source used by the prover. None of what the host does is in
  the proof.

![Host / VM split: host code feeds input + hint streams into the guest, guest writes public outputs back to host](/diagrams/svgs/04-host-vm-split.svg)

Why split it this way? Because what the prover guarantees has
a clean boundary: **everything the guest touches is constrained
by the proof system; what happens on the host side lies outside
the proof entirely.**

This produces two distinct trust statements that are easy to
confuse:

- **At the system level**, the host is trusted by convention.
  The proof system makes no claim about the host's behaviour.
  Whether the verifier accepts what the host supplies as the
  inputs being proved is a policy decision.
- **At the proof level**, every byte the host supplies is
  unconstrained. The proof itself does not assert any property
  of input or hint bytes. If the guest relies on a property of
  a host-supplied value, the guest is responsible for checking
  it.

## Inputs from the host

The normal way to feed a guest is `ZiskStdin`. The host serializes
values or raw bytes into this framed input buffer; the guest reads
them with `ziskos::io::read()` or `ziskos::io::read_input_slice()`.

These bytes are **not public proof data by default**. They are part
of the execution witness: the prover sees them, the guest can use
them, and the proof attests that the committed outputs were produced
from whatever bytes the guest read. A verifier only learns an input
value if the guest explicitly commits that value, or a digest or
other statement about it, as a public output.

That gives the application one clear rule:

> Treat host-supplied input as private and untrusted until the guest
> validates whatever property it relies on and commits the public
> result the verifier needs.

### Public input as an application pattern

If an application has values that the verifier already knows, pass
them through `ZiskStdin` like any other input, then commit the part
the verifier needs to compare. For example, a rollup guest might read
a block body privately but commit the resulting state root, block
number, and transaction batch hash.

The public/private distinction is therefore made by **guest
commitment**, not by a separate public-input stream.

### Hints

ZisK also supports hint sources for hint-enabled precompile and
witness-generation flows. In the current SDK, hints are attached with
`ZiskHints` or `ZiskStream`, require hint-aware setup, and require the
Assembly executor.

Hints exist to skip expensive witness work. The host computes the hard
part off-line, hands the prover/guest-side helper the answer, and the
guest or precompile constraints cheaply verify the answer is correct.

Concrete examples of hints:

- The result of an expensive square root, where verifying the
  result is just one multiplication.
- The inverse of a group element, where verifying the inverse
  is one group operation.
- The recovered public key from a signature, where verifying
  the recovery is one curve check.

The proof system treats hint bytes as **unconstrained**. The guest
may consume a hint-backed result and act on it, but the proof
guarantees nothing about that value unless the guest or the
precompile constraints verify a property of it.

The same rule applies to normal stdin as well as hints. Any value
received from the host is untrusted until the guest verifies whatever
property it relies on.

> A hint that is never verified proves nothing.

That single line is the most important rule in the system.
Hints accelerate witness generation. They never bypass the
constraints. The guest's job is to verify whatever a hint
claims.

## Outputs from the guest

The guest has one channel to send data back: **public outputs**.

### Public outputs

Values the guest writes through a dedicated public-output
instruction. They become part of the proof's public data: the
verifier sees them and can assert against them.

A typical pattern: the guest computes some result (the new state
root after applying a block, the SHA-256 of a payload), and
commits the result as a public output. The host reads it out of
the proof after verification.

## What the guest cannot do

Everything *outside* the proof model is unavailable:

- **No syscalls:** no file system, no network, no clock.
- **No host-derived non-determinism:** the only non-determinism
  available is via host-supplied input or hint-backed helper
  flows, and any property the guest relies on must be verified.
- **No threads:** execution is sequential.
- **Bounded memory:** the guest's memory is finite (see
  [Limits](/intro/deep/limits)).

Everything the guest needs to know has to come from one of three
places:

1. The program ROM (its compiled binary, including embedded
   constants).
2. The input stream (`ZiskStdin`, private unless committed).
3. Hint-backed helper flows for advanced precompile/witness
   acceleration, when enabled.

If a value isn't in one of those, the guest can't see it.

## Where the guest's data lives

The guest's address space is split into named regions:

- **Input Data:** the memory region into which the
  input buffer is copied at initialisation. Read-only
  thereafter; not verifier-visible unless the guest commits it.
- **ROM Data:** program constants embedded in the binary,
  read-only.
- **System:** registers, UART, and CSR registers.
- **Output data:** the region into which the dedicated
  public-output instruction writes during execution.
- **Program memory:** general-purpose read/write RAM.

The [Memory chip](./components) (introduced in detail on the
Components page) enforces consistency across all regions.
Reads return the most recent write. Write-once regions reject
any second write. Immutable regions reject any write at all.

## A worked example

To make the model concrete, here's a tiny program walked through
end to end. The guest reads a string from the input, hashes it
with SHA-256, and commits the digest as a public output.

### What the host does

```rust title="host/src/main.rs (sketch)"
let stdin = ZiskStdin::new();
stdin.write(&"Hello Zisk".to_string());           // (1) put input on the stream
client.setup(&PROGRAM).run()?.await?;              // (2) setup for this guest
let result = client.prove(&PROGRAM, stdin)
    .run()?
    .await?;                                       // (3) ask for a proof
result.verify()?;                                  // (4) verify
let mut digest = [0u8; 32];
result.get_public_values_slice(&mut digest);       // (5) read the public output
```

What lives where in the host's execution:

| Step | Host does | Where the value lives |
|---|---|---|
| (1) | Pushes `"Hello Zisk"` into a `ZiskStdin` buffer. | Host memory, then copied into the **input data** region before the guest reads it. |
| (2) | Runs setup for the guest program. | The prover prepares program-specific proving artifacts and the program verification key. |
| (3) | Calls `prove`. The prover spins up the guest. | Host code is done for now: control passes to the prover. |
| (4) | Calls `verify`. | Host's verifier checks the proof using the embedded proof data. |
| (5) | Reads back the public output. | The digest is in the proof's public-values region. |

### What the guest sees

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

A quick note before the table. **SHA-256 is a precompile**:
ZisK exposes it as a single ZisK instruction with its own
dedicated chip, rather than expanding it into thousands of
RISC-V instructions. The **transpiler** is the tool that
translates the standard RISC-V ELF into ZisK opcodes, mapping
known precompile calls (like `Sha256::digest`) to their ZisK
equivalents. Both concepts get full treatment in
[Components](./components).

What lives where in the guest's execution:

| Step | Guest does | Where the value lives |
|---|---|---|
| (a) | `io::read()` consumes from the input stream. The string `"Hello Zisk"` lands in guest memory. | **Input data region** of guest memory (read-only). |
| (b) | Calls SHA-256, but this is a **precompile**, not a Rust loop. The transpiler maps it to a ZisK opcode that the SHA-256 chip handles. | The 32-byte digest lives in mutable guest memory after the call returns. |
| (c) | `io::commit_slice` writes the digest into the **output region** via the dedicated public-output instruction. | **Output data region** of guest memory; will become public values in the proof. |

### What the host and guest exchange

Three flows, in chronological order:

![Host / Prover / Guest exchange (sequence): host calls prove, prover starts guest, guest reads input, computes SHA-256, commits digest, prover returns proof + public outputs to host](/diagrams/svgs/05-host-prover-guest-sequence.svg)

What the **verifier** learns from the proof:

- The digest (because the guest committed it as a public output).
- The program verification key/commitment embedded in the proof.
- That the digest is the SHA-256 of the input read by that exact
  guest program.

What the verifier **doesn't** learn (and couldn't, even if they
wanted to):

- Anything the host did before calling `prove`.
- The string `"Hello Zisk"`, unless the guest also commits it or a
  verifier-known digest of it.
- Any intermediate values the guest computed that weren't
  committed.
- Whether the prover used hints to accelerate the SHA-256 (hints,
  if any, would not be visible: only the digest would).

### What changes if we use hints

Hints do **not** make the normal input stream public or private;
`ZiskStdin` is already private unless the guest commits something.
Hints are an advanced side channel for hint-enabled proving flows,
most often used by precompile-heavy programs.

The current SDK shape is:

```rust
use zisk_sdk::{ExecutorKind, ZiskHints};

let hints = ZiskHints::from_file("hints.bin")?;
let client = ProverClient::embedded()
    .executor(ExecutorKind::Assembly)
    .build()?;

client.setup(&PROGRAM).with_hints().run()?.await?;

let result = client
    .prove(&PROGRAM, ZiskStdin::new())
    .hints(hints)
    .executor(ExecutorKind::Assembly)
    .run()?
    .await?;
```

The guest or precompile constraints must still check any relation
the hint claims. A hint that is never checked proves nothing.

This is the punchline of the model: **host-supplied data is private
and untrusted by default; only committed public outputs become
verifier-visible.**

The guest's job is to convert "untrusted-but-supplied" into
"verified-and-attested" by committing the smallest public statement
the verifier needs.

## Why this matters in practice

The host/guest split shapes how you write ZisK programs:

- **Anything that doesn't need to be proven goes in the host.**
  Reading a config file, fetching data, formatting output: all
  host-side.
- **The guest receives exactly the values the proof needs to
  attest to.** Smaller surface = cheaper proof.
- **Hints are an optimization, not a security model.** Use them
  to skip expensive computations the guest can verify, never to
  trust the host with a security-critical value.
- **What the verifier learns is exactly the public outputs.**
  Plan public outputs carefully: a verifier with the proof and
  the program verification key learns the public outputs, and
  nothing else about the inputs or the intermediate state.

## Where this picks up

You now know what the guest sees and what it doesn't.

The next page, [Components](./components), opens up the prover
side and shows what's actually inside the zkVM that produces
the proof: the chips that execute instructions, manage memory,
and run the expensive primitives.

For the formal definition of the execution model, the
instruction format, and the full opcode catalogue, see
[Deep understanding → The ISA](/intro/deep/isa).
