"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { ExperienceCard } from "@/components/experiences/experience-card"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import type { DetailedExperience } from "@/lib/data/experiences"

interface CountryExperiencesProps {
  experiences: DetailedExperience[]
  countryName: string
}

const ITEMS_PER_PAGE = 12

export function CountryExperiences({ experiences, countryName }: CountryExperiencesProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const pageFromUrl = Number.parseInt(searchParams.get("page") || "1", 10)

  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(pageFromUrl)

  useEffect(() => {
    setCurrentPage(pageFromUrl)
  }, [pageFromUrl])

  const categories = ["all", ...Array.from(new Set(experiences.map((e) => e.category)))]

  const filteredExperiences =
    selectedCategory === "all" ? experiences : experiences.filter((e) => e.category === selectedCategory)

  const totalPages = Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedExperiences = filteredExperiences.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Experiences in {countryName}</h2>
          <p className="text-muted-foreground mb-6">
            Mix and match these experiences to create your perfect {countryName} trip playlist
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedExperiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>

        {filteredExperiences.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No experiences found in this category</p>
          </div>
        )}

        {filteredExperiences.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </section>
  )
}
