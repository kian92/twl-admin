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

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"]

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<ExperienceRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.country.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || exp.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [experiences, searchQuery, selectedCategory])

  const handleDelete = async (experience: ExperienceRow) => {
    if (!window.confirm(`Delete "${experience.title}"? This action cannot be undone.`)) {
      return
    }
    try {
      const response = await fetch(`/api/admin/experiences/${experience.id}`, {
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
            Manage all travel experiences and packages ({experiences.length.toLocaleString()} total)
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
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
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
          filteredExperiences.map((experience) => (
            <Card key={experience.id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={experience.image_url || "/placeholder.svg"}
                  alt={experience.title}
                  fill
                  className="object-cover"
                />
                <Badge className="absolute top-2 right-2">{experience.category}</Badge>
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
                    <span className="text-lg font-bold">${experience.price}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/experiences/${experience.id}`}>
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
                          setSearchQuery("")
                          void loadExperiences()
                        }}
                      >
                        Clear Filters
                      </Button>
        </div>
      )}
    </div>
  )
}
