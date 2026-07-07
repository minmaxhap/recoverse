/// <reference types="@cloudflare/vitest-pool-workers" />
import type { Env } from '../src/kv';

declare module 'cloudflare:test' {
  interface ProvidedEnv extends Env {}
}
