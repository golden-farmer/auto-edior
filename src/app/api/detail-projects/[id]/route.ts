import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();
    const { id } = await context.params;

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('detail_projects')
      .select('id, title, snapshot, updated_at, product_name')
      .eq('id', id)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('Failed to load detail project:', error);
    return NextResponse.json({ error: 'Failed to load detail project.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();
    const { id } = await context.params;

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

    const { data, error } = await supabase
      .from('detail_projects')
      .update({
        title,
        product_name: productName,
        snapshot,
      })
      .eq('id', id)
      .eq('user_id', profile.id)
      .select('id, title, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('Failed to update detail project:', error);
    return NextResponse.json({ error: 'Failed to update detail project.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();
    const { id } = await context.params;

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('detail_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', profile.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete detail project:', error);
    return NextResponse.json({ error: 'Failed to delete detail project.' }, { status: 500 });
  }
}
