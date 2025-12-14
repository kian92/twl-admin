export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  category_id?: string;
  category?: BlogCategory;
  author_id?: string;
  author?: {
    id: string;
    full_name: string;
  };
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  views_count: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  is_featured: boolean;
  display_order: number;
  tags?: BlogTag[];
  created_at: string;
  updated_at: string;
}

export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  category_id?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  is_featured: boolean;
  display_order: number;
  tag_ids?: string[];
}
