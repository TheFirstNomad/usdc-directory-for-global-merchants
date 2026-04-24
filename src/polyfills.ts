// Must be imported FIRST in src/main.tsx — before React, AppKit, Coinbase Wallet SDK, etc.
// Some web3 deps (notably @coinbase/wallet-sdk via @reown/appkit) reference Buffer/global/process
// at module-evaluation time. Without this shim the production bundle throws
// "ReferenceError: Buffer is not defined" before React mounts, leaving a blank page.
import { Buffer } from "buffer";

const g = globalThis as unknown as {
  Buffer?: typeof Buffer;
  global?: unknown;
  process?: { env?: Record<string, string> };
};

if (!g.Buffer) g.Buffer = Buffer;
if (!g.global) g.global = globalThis;
if (!g.process) g.process = { env: {} };