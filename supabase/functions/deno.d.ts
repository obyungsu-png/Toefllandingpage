/**
 * Ambient type declarations for Supabase Edge Functions (Deno runtime).
 *
 * These function files are NOT part of the frontend TypeScript project — the
 * root tsconfig.json only includes `src/`. Without this dedicated config the
 * IDE falls back to an inferred (strict) project and reports errors for the
 * Deno globals and the `npm:` / `https:` / `jsr:` import specifiers that the
 * Deno runtime requires.
 *
 * This file, loaded by the tsconfig.json next to it, provides minimal ambient
 * types so the IDE can resolve those specifiers by re-exporting from the
 * locally installed npm packages. No Deno language extension is required.
 */

// ── Deno runtime globals used by these edge functions ──────────────
declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
  env: {
    get(key: string): string | undefined;
  };
};

// ── https: / npm: / jsr: specifiers → re-export installed packages ──
declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

declare module 'npm:@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

declare module 'jsr:@supabase/supabase-js@2.49.8' {
  export * from '@supabase/supabase-js';
}

declare module 'npm:hono' {
  export * from 'hono';
}

declare module 'npm:hono/cors' {
  export * from 'hono/cors';
}

declare module 'npm:hono/logger' {
  export * from 'hono/logger';
}
