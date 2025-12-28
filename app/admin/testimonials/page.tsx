"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Star, ExternalLink, Link2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"
import { toast } from "sonner"
import { TestimonialForm } from "@/components/testimonials/testimonial-form"

type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"]

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTestimonial, setSelectedTestimonial] = useState<TestimonialRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Fetch testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/testimonials")
        if (!response.ok) throw new Error("Failed to fetch testimonials")
        const data = await response.json()
        setTestimonials(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        toast.error("Failed to load testimonials")
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  // Filter testimonials
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((testimonial) => {
      const matchesSearch =
        testimonial.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testimonial.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (testimonial.tour_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

      const matchesPlatform = platformFilter === "all" || testimonial.platform === platformFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && testimonial.is_active) ||
        (statusFilter === "inactive" && !testimonial.is_active) ||
        (statusFilter === "featured" && testimonial.is_featured)

      return matchesSearch && matchesPlatform && matchesStatus
    })
  }, [testimonials, searchQuery, platformFilter, statusFilter])

  // Paginate
  const paginatedTestimonials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTestimonials.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTestimonials, currentPage])

  const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage)

  const handleEdit = (testimonial: TestimonialRow) => {
    setSelectedTestimonial(testimonial)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return

    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete testimonial")

      setTestimonials((prev) => prev.filter((t) => t.id !== id))
      toast.success("Testimonial deleted successfully")
    } catch (err) {
      toast.error("Failed to delete testimonial")
    }
  }

  const handleFormSuccess = (updatedTestimonial: TestimonialRow) => {
    setTestimonials((prev) => {
      const existing = prev.find((t) => t.id === updatedTestimonial.id)
      if (existing) {
        return prev.map((t) => (t.id === updatedTestimonial.id ? updatedTestimonial : t))
      }
      return [updatedTestimonial, ...prev]
    })
    setDialogOpen(false)
    setCreateDialogOpen(false)
    setSelectedTestimonial(null)
  }

  const getPlatformBadge = (platform: string | null) => {
    if (!platform) return null

    const platformColors = {
      instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      facebook: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      twitter: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
      google: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      website: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      email: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }

    return (
      <Badge
        variant="outline"
        className={platformColors[platform as keyof typeof platformColors] || platformColors.other}
      >
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </Badge>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Testimonials</h1>
            <p className="text-muted-foreground mt-1">Manage customer testimonials and reviews</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Testimonial</DialogTitle>
                <DialogDescription>Create a new testimonial from social media or other sources.</DialogDescription>
              </DialogHeader>
              <TestimonialForm onSuccess={handleFormSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, content, or tour..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={platformFilter}
                onValueChange={(value) => {
                  setPlatformFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No testimonials found</p>
          </Card>
        ) : (
          <>
            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTestimonials.map((testimonial) => (
                <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{testimonial.author_name}</h3>
                          {testimonial.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {testimonial.author_location && (
                          <p className="text-sm text-muted-foreground">{testimonial.author_location}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(testimonial)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {testimonial.tour_name && (
                      <p className="text-sm font-medium text-primary mb-2">{testimonial.tour_name}</p>
                    )}

                    {(testimonial as any).experiences && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <a
                          href={`/admin/experiences/${(testimonial as any).experiences.slug}/${(testimonial as any).experiences.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {(testimonial as any).experiences.title}
                        </a>
                      </div>
                    )}

                    {testimonial.tour_date && (
                      <p className="text-xs text-muted-foreground mb-2">{testimonial.tour_date}</p>
                    )}

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{testimonial.content}</p>

                    <div className="flex flex-wrap gap-2 items-center">
                      {testimonial.platform && getPlatformBadge(testimonial.platform)}
                      {!testimonial.is_active && <Badge variant="secondary">Inactive</Badge>}
                      {testimonial.social_media_url && (
                        <a
                          href={testimonial.social_media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                {currentPage > 1 ? (
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <PaginationPrevious
                    style={{ cursor: "not-allowed", opacity: 0.5 }}
                    onClick={(e) => e.preventDefault()}
                  />
                )}
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationLink
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      style={{ cursor: "pointer" }}
                    >
                      {page}
                    </PaginationLink>
                  ))}
                </div>
                {currentPage < totalPages ? (
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <PaginationNext
                    style={{ cursor: "not-allowed", opacity: 0.5 }}
                    onClick={(e) => e.preventDefault()}
                  />
                )}
              </Pagination>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
            <DialogDescription>Update the testimonial details.</DialogDescription>
          </DialogHeader>
          {selectedTestimonial && (
            <TestimonialForm testimonial={selectedTestimonial} onSuccess={handleFormSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
