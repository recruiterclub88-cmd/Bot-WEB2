import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/db';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('key,value')
    .in('key', ['system_prompt','site_url','candidate_link','agency_link','tone']);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map: Record<string, string> = {};
  for (const row of data || []) map[row.key] = row.value;

  return NextResponse.json({
    system_prompt: map.system_prompt || '',
    site_url: map.site_url || '',
    candidate_link: map.candidate_link || '',
    agency_link: map.agency_link || '',
    tone: map.tone || '',
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const upserts = [
    ['system_prompt', String(body.system_prompt || '')],
    ['site_url', String(body.site_url || '')],
    ['candidate_link', String(body.candidate_link || '')],
    ['agency_link', String(body.agency_link || '')],
    ['tone', String(body.tone || '')],
  ].map(([key, value]) => ({ key, value }));

  const { error } = await supabaseAdmin.from('settings').upsert(upserts, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
