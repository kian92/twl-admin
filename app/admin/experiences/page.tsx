"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"]

const ITEMS_PER_PAGE = 12

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<ExperienceRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const loadExperiences = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/experiences")
      const payload = (await response.json().catch(() => null)) as ExperienceRow[] | { error?: string } | null
      if (!response.ok) {
        const message = (payload as { error?: string } | null)?.error ?? "Unable to load experiences."
        throw new Error(message)
      }
      setExperiences(Array.isArray(payload) ? payload : [])
    } catch (err) {
      console.error("Failed to load experiences", err)
      setError(err instanceof Error ? err.message : "Unable to load experiences. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadExperiences()
  }, [loadExperiences])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    experiences.forEach((exp) => {
      if (exp.category) {
        unique.add(exp.category)
      }
    })
    return ["all", ...Array.from(unique)]
  }, [experiences])

  const countries = useMemo(() => {
    const unique = new Set<string>()
    experiences.forEach((exp) => {
      if (exp.country) {
        unique.add(exp.country)
      }
    })
    return ["all", ...Array.from(unique).sort()]
  }, [experiences])

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.country.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || exp.category === selectedCategory
      const matchesCountry = selectedCountry === "all" || exp.country === selectedCountry
      return matchesSearch && matchesCategory && matchesCountry
    })
  }, [experiences, searchQuery, selectedCategory, selectedCountry])

  // Pagination calculations
  const totalPages = Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedExperiences = filteredExperiences.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedCountry])

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      pages.push(totalPages)
    }

    return pages
  }

  const handleDelete = async (experience: ExperienceRow) => {
    if (!window.confirm(`Delete "${experience.title}"? This action cannot be undone.`)) {
      return
    }
    try {
      const response = await fetch(`/api/admin/experiences/${experience.slug}/${experience.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? "Unable to delete experience.")
      }
      toast.success("Experience removed")
      void loadExperiences()
    } catch (err) {
      console.error("Failed to delete experience", err)
      toast.error(err instanceof Error ? err.message : "Unable to delete experience. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Experience Management</h1>
          <p className="text-muted-foreground">
            {filteredExperiences.length === experiences.length ? (
              <>{experiences.length.toLocaleString()} total experiences</>
            ) : (
              <>Showing {filteredExperiences.length.toLocaleString()} of {experiences.length.toLocaleString()} experiences</>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/experiences/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {/* Search and Country Filter */}
        <div className="flex gap-4 flex-wrap md:flex-nowrap">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country === "all" ? "All Countries" : country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading &&
          [0, 1, 2, 3, 4, 5].map((item) => (
            <Card key={`experience-skeleton-${item}`} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}

        {!loading &&
          paginatedExperiences.map((experience) => (
            <Card key={experience.id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={experience.gallery?.[0] || "/placeholder.svg"}
                  alt={experience.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {experience.country}
                  </Badge>
                  <Badge className="bg-primary">{experience.category}</Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-1">{experience.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {experience.location} • {experience.duration}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{experience.rating?.toFixed(1) ?? "—"}</span>
                    <span className="text-muted-foreground">
                      ({experience.review_count?.toLocaleString() ?? 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground leading-tight">
                      <div className="font-semibold text-foreground">${experience.adult_price} adult</div>
                      <div>${experience.child_price} child</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/experiences/${experience.slug}/${experience.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void handleDelete(experience)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {!loading && filteredExperiences.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No experiences found matching your criteria</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSelectedCategory("all")
                          setSelectedCountry("all")
                          setSearchQuery("")
                          void loadExperiences()
                        }}
                      >
                        Clear Filters
                      </Button>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredExperiences.length > 0 && totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(page as number)
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredExperiences.length)} of {filteredExperiences.length} experiences
          </div>
        </div>
      )}
    </div>
  )
}
