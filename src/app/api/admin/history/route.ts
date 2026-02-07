import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/db';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('id, created_at, direction, text, contacts(wa_chat_id, lead_type, stage)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}
