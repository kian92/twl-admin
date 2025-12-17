"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { BlogPost, BlogCategory, BlogTag, BlogPostFormData } from "@/types/blog"
import { ArrowLeft, Save, Send, Eye, X, Plus } from "lucide-react"
import { RichTextEditor } from "./RichTextEditor"
import { ImageUpload } from "./ImageUpload"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BlogPostFormProps {
  post?: BlogPost
  mode: "create" | "edit"
}

export function BlogPostForm({ post, mode }: BlogPostFormProps) {
  const router = useRouter()
  const t = useTranslations('blog')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    post?.tags?.map((tag) => tag.id) || []
  )
  const [newTagName, setNewTagName] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: post?.title || "",
    slug: post?.slug || "",
    excerpt: post?.excerpt || "",
    content: post?.content || "",
    featured_image: post?.featured_image || "",
    category_id: post?.category_id || "",
    status: post?.status || "draft",
    published_at: post?.published_at || "",
    seo_title: post?.seo_title || "",
    seo_description: post?.seo_description || "",
    seo_keywords: post?.seo_keywords || [],
    is_featured: post?.is_featured || false,
    display_order: post?.display_order || 0,
    tag_ids: [],
  })

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/blog/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/admin/blog/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      // Replace spaces and special punctuation with hyphens
      .replace(/[\s\.,!?;:'"(){}[\]\/\\|<>@#$%^&*+=~`]+/g, "-")
      // Keep alphanumeric characters (including Chinese, Japanese, Korean, etc.)
      // Remove only truly problematic URL characters
      .replace(/[^\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af-]/g, "")
      // Clean up multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
  }

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: mode === "create" ? generateSlug(title) : formData.slug,
    })
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const createTag = async () => {
    if (!newTagName.trim()) return

    try {
      const response = await fetch("/api/admin/blog/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName,
          slug: generateSlug(newTagName),
        }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setTags([...tags, newTag])
        setSelectedTagIds([...selectedTagIds, newTag.id])
        setNewTagName("")
      }
    } catch (error) {
      console.error("Failed to create tag:", error)
    }
  }

  const handleSubmit = async (status: "draft" | "published") => {
    try {
      setLoading(true)

      // Get current user ID for author
      const profileResponse = await fetch("/api/auth/profile")
      const profileData = await profileResponse.json()

      // Clean up empty strings to null for UUID fields
      const submitData = {
        ...formData,
        category_id: formData.category_id || null,
        status,
        tag_ids: selectedTagIds,
        author_id: mode === "create" ? profileData.id : undefined,
      }

      const url = mode === "create"
        ? "/api/admin/blog/posts"
        : `/api/admin/blog/posts/${post?.id}`

      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        router.push("/admin/blog")
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to save post:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/blog")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {mode === "create" ? t('newPost') : t('editPost')}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t('basicInformation')}</h2>

            <div className="space-y-2">
              <Label htmlFor="title">{t('postTitle')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t('enterPostTitle')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t('postSlug')}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder={t('enterPostSlug')}
              />
              <p className="text-xs text-muted-foreground">
                {t('slugDescription')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">{t('excerpt')}</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder={t('enterExcerpt')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t('content')}</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) =>
                  setFormData({ ...formData, content })
                }
                placeholder={t('enterContent')}
              />
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t('seoSettings')}</h2>

            <div className="space-y-2">
              <Label htmlFor="seo_title">{t('seoTitle')}</Label>
              <Input
                id="seo_title"
                value={formData.seo_title}
                onChange={(e) =>
                  setFormData({ ...formData, seo_title: e.target.value })
                }
                placeholder={t('enterSeoTitle')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">{t('seoDescription')}</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description}
                onChange={(e) =>
                  setFormData({ ...formData, seo_description: e.target.value })
                }
                placeholder={t('enterSeoDescription')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords">{t('seoKeywords')}</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords?.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seo_keywords: e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={t('enterSeoKeywords')}
              />
              <p className="text-xs text-muted-foreground">
                {t('keywordsDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t('publishSettings')}</h2>

            <div className="space-y-2">
              <Label htmlFor="category">{t('category')}</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ImageUpload
              value={formData.featured_image}
              onChange={(url) =>
                setFormData({ ...formData, featured_image: url })
              }
              label={t('featuredImage')}
            />

            <div className="space-y-2">
              <Label>{t('tags')}</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId)
                  return tag ? (
                    <Badge key={tagId} variant="secondary">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => toggleTag(tagId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
              <Select
                value=""
                onValueChange={(value) => toggleTag(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTags')} />
                </SelectTrigger>
                <SelectContent>
                  {tags
                    .filter((tag) => !selectedTagIds.includes(tag.id))
                    .map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder={t('createTag')}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      createTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={createTag}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked as boolean })
                }
              />
              <Label htmlFor="is_featured">{t('featuredPost')}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">{t('displayOrder')}</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_order: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <Button
              type="button"
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t('preview')}
            </Button>

            <Button
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {t('saveAsDraft')}
            </Button>

            <Button
              onClick={() => handleSubmit("published")}
              disabled={loading}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {mode === "create" ? t('publish') : t('update')}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('preview')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {formData.featured_image && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <img
                  src={formData.featured_image}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2">{formData.title}</h1>
              {formData.excerpt && (
                <p className="text-lg text-muted-foreground">{formData.excerpt}</p>
              )}
            </div>
            {selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId)
                  return tag ? (
                    <Badge key={tagId} variant="outline">
                      {tag.name}
                    </Badge>
                  ) : null
                })}
              </div>
            )}
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
