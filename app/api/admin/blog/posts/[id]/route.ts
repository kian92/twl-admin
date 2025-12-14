import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(*),
        author:admin_profiles(id, full_name),
        tags:blog_post_tags(tag:blog_tags(*))
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('Failed to fetch blog post:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update blog post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .update({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || null,
        content: body.content,
        featured_image: body.featured_image || null,
        category_id: body.category_id || null,
        status: body.status,
        published_at: body.status === 'published' && !body.published_at ? new Date().toISOString() : (body.published_at || null),
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        seo_keywords: body.seo_keywords || null,
        is_featured: body.is_featured,
        display_order: body.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    // Update tags
    if (body.tag_ids !== undefined) {
      // Delete existing tags
      await supabase.from('blog_post_tags').delete().eq('post_id', id);

      // Add new tags
      if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
        const postTags = body.tag_ids.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId,
        }));

        await supabase.from('blog_post_tags').insert(postTags);
      }
    }

    return NextResponse.json({ post }, { status: 200 });
  } catch (err) {
    console.error('Failed to update blog post:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Failed to delete blog post:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
