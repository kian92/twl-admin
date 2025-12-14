import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(*),
        author:admin_profiles(id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (err) {
    console.error('Failed to fetch blog posts:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create blog post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || null,
        content: body.content,
        featured_image: body.featured_image || null,
        category_id: body.category_id || null,
        author_id: body.author_id || null,
        status: body.status || 'draft',
        published_at: body.status === 'published' ? new Date().toISOString() : (body.published_at || null),
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        seo_keywords: body.seo_keywords || null,
        is_featured: body.is_featured || false,
        display_order: body.display_order || 0,
      })
      .select()
      .single();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    // Add tags if provided
    if (body.tag_ids && Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
      const postTags = body.tag_ids.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }));

      await supabase.from('blog_post_tags').insert(postTags);
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error('Failed to create blog post:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
