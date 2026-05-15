import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/auth';

export async function GET() {
  try {
    const { supabase, profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('detail_projects')
      .select('id, title, created_at, updated_at, product_name')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ projects: data ?? [] });
  } catch (error) {
    console.error('Failed to load detail projects:', error);
    return NextResponse.json({ error: 'Failed to load detail projects.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    const snapshot = body.snapshot;
    const productName = String(body.productName || '').trim() || null;

    if (!title || !snapshot) {
      return NextResponse.json({ error: 'Title and snapshot are required.' }, { status: 400 });
    }

    const { count, error: countError } = await supabase
      .from('detail_projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) >= 10) {
      return NextResponse.json(
        { error: '임시 저장은 계정당 최대 10개까지 가능합니다. 기존 저장본을 삭제하거나 수정해주세요.' },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from('detail_projects')
      .insert({
        user_id: profile.id,
        title,
        product_name: productName,
        snapshot,
      })
      .select('id, title, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error('Failed to create detail project:', error);
    return NextResponse.json({ error: 'Failed to create detail project.' }, { status: 500 });
  }
}
