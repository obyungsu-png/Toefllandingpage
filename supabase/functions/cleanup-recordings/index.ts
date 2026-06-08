/**
 * cleanup-recordings — Supabase Edge Function
 *
 * Deletes student speaking recordings older than 30 days.
 * Schedule: run daily via Supabase cron (pg_cron) or external scheduler.
 *
 * Storage bucket: "recordings"
 * Expected path pattern: recordings/{userId}/{testId}/{filename}
 *
 * To schedule with pg_cron (run in Supabase SQL editor):
 *   select cron.schedule(
 *     'cleanup-recordings-daily',
 *     '0 3 * * *',   -- every day at 03:00 UTC
 *     $$
 *       select net.http_post(
 *         url := 'https://<PROJECT_REF>.supabase.co/functions/v1/cleanup-recordings',
 *         headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb
 *       )
 *     $$
 *   );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BUCKET = 'recordings';
const RETENTION_DAYS = 30;

Deno.serve(async (req) => {
  // Allow only authenticated service-role calls
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffISO = cutoff.toISOString();

  // List all files in the bucket
  const { data: files, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } });

  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), { status: 500 });
  }

  // Filter files older than retention window
  const toDelete = (files ?? [])
    .filter(f => f.created_at && f.created_at < cutoffISO)
    .map(f => f.name);

  if (toDelete.length === 0) {
    return new Response(JSON.stringify({ deleted: 0, message: 'Nothing to clean up.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error: deleteErr } = await supabase.storage.from(BUCKET).remove(toDelete);
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), { status: 500 });
  }

  console.log(`[cleanup-recordings] Deleted ${toDelete.length} files older than ${RETENTION_DAYS} days.`);

  return new Response(
    JSON.stringify({ deleted: toDelete.length, files: toDelete }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
