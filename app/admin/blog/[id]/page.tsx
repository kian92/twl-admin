"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { BlogPostForm } from "@/components/admin/BlogPostForm"
import { BlogPost } from "@/types/blog"

export default function EditBlogPostPage() {
  const params = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchPost()
    }
  }, [params.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/admin/blog/posts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      }
    } catch (error) {
      console.error("Failed to fetch post:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    )
  }

  return <BlogPostForm mode="edit" post={post} />
}
