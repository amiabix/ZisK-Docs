---
title: Introduction to ZisK
excerpt: >-
  This documentation will help you get started with ZisK. It covers setup,
  configuration, proof generation, and integration details to help you get
  started with ZisK
hidden: false
next:
  description: Let’s get started by setting up the required environment and dependencies.
  pages:
    - slug: installation-guide
      title: Installation Guide
      type: basic
---
# Introduction

ZisK is a high-performance Zero-Knowledge Virtual Machine (zkVM) designed to generate verifiable proofs of arbitrary program execution. It enables developers to prove the correctness of computation without revealing its internal state, making it suitable for privacy-preserving and verifiable systems across decentralized and trustless environments.


Traditional proving systems often demand significant cryptographic expertise and computational resources. ZisK abstracts this complexity through a modular, optimized architecture that reduces overhead while maintaining strong cryptographic soundness. The system is implemented in Rust, emphasizing determinism, low latency, and reliability.


ZisK provides standardized interfaces such as JSON-RPC, gRPC, and CLI, allowing it to be used as both a standalone service and an embeddable library. The zkVM is designed for flexibility — suitable for single-node setups or distributed proving clusters — enabling developers to deploy proofs efficiently across diverse environments.

***

## Why ZisK

ZisK is built to make zero-knowledge computation practical and efficient. It focuses on performance, reliability, and developer usability without adding unnecessary complexity.

* Designed for high-throughput, low-latency proof generation, suitable for both local and distributed environments.
* Implemented in Rust for predictable performance and safety, with future support for additional languages.
* Features a distributed proving system with a gRPC-based coordinator that allows horizontal scaling and fault-tolerant execution.
* Includes optimized GPU and circuit execution, resulting in around 20% faster proving compared to earlier versions.
* Uses a dual memory model with aligned access for better memory efficiency and reduced computational overhead.
* Maintains 128-bit post-quantum security using lattice-based challenge derivation.
* Provides standard interfaces (JSON-RPC, gRPC, CLI) for straightforward integration into existing systems.
* Fully open-source and built on proven components from Polygon zkEVM and Plonky3.
