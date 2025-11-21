#!/usr/bin/env node
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}
import { createServer } from 'vite';

const server = await createServer();
await server.listen();
server.printUrls();
