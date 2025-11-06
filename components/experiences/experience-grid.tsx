"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { ExperienceCard } from "@/components/experiences/experience-card"
import { FilterSidebar } from "@/components/experiences/filter-sidebar"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { allExperiences } from "@/lib/data/experiences"

const ITEMS_PER_PAGE = 12

export function ExperienceGrid() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const pageFromUrl = Number.parseInt(searchParams.get("page") || "1", 10)

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [selectedDurations, setSelectedDurations] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(pageFromUrl)

  useEffect(() => {
    setCurrentPage(pageFromUrl)
  }, [pageFromUrl])

  const filteredExperiences = allExperiences.filter((exp) => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(exp.category)
    const priceMatch = exp.price >= priceRange[0] && exp.price <= priceRange[1]

    let durationMatch = true
    if (selectedDurations.length > 0) {
      const hours = Number.parseFloat(exp.duration)
      durationMatch = selectedDurations.some((duration) => {
        if (duration === "short") return hours <= 3
        if (duration === "half") return hours > 3 && hours <= 6
        if (duration === "full") return hours > 6
        return true
      })
    }

    return categoryMatch && priceMatch && durationMatch
  })

  const totalPages = Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedExperiences = filteredExperiences.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleFilterChange = (callback: () => void) => {
    callback()
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              selectedCategories={selectedCategories}
              setSelectedCategories={(cats) => handleFilterChange(() => setSelectedCategories(cats))}
              priceRange={priceRange}
              setPriceRange={(range) => handleFilterChange(() => setPriceRange(range))}
              selectedDurations={selectedDurations}
              setSelectedDurations={(durations) => handleFilterChange(() => setSelectedDurations(durations))}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {filteredExperiences.length} Experience{filteredExperiences.length !== 1 ? "s" : ""}
                </h2>
                <p className="text-sm text-muted-foreground">Find your perfect adventure</p>
              </div>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden bg-transparent">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <FilterSidebar
                    selectedCategories={selectedCategories}
                    setSelectedCategories={(cats) => handleFilterChange(() => setSelectedCategories(cats))}
                    priceRange={priceRange}
                    setPriceRange={(range) => handleFilterChange(() => setPriceRange(range))}
                    selectedDurations={selectedDurations}
                    setSelectedDurations={(durations) => handleFilterChange(() => setSelectedDurations(durations))}
                  />
                </SheetContent>
              </Sheet>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedExperiences.map((experience) => (
                <ExperienceCard key={experience.id} experience={experience} />
              ))}
            </div>

            {filteredExperiences.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-4">No experiences match your filters</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategories([])
                    setPriceRange([0, 200])
                    setSelectedDurations([])
                    router.push("?page=1", { scroll: false })
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {filteredExperiences.length > 0 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
