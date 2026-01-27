"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Star, DollarSign } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"
import { toast } from "sonner"
import { useAdmin } from "@/components/admin-context"
import { useTranslations } from 'next-intl'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPagination } from "@/utils/pagination"

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"]

interface ExperienceWithPackagePrices extends ExperienceRow {
  package_adult_price?: number | undefined
  package_child_price?: number | undefined
  package_vehicle_price?: number | undefined
  tour_types?: ('group' | 'private')[]
  creator_name?: string
  updater_name?: string
  min_pax?: number | undefined
}

const ITEMS_PER_PAGE = 12

export default function ExperiencesPage() {
  const t = useTranslations()
  const { profile } = useAdmin()
  const [experiences, setExperiences] = useState<ExperienceWithPackagePrices[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedCreator, setSelectedCreator] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [adminProfiles, setAdminProfiles] = useState<Record<string, string>>({})

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
      const experiencesList = Array.isArray(payload) ? payload : []

      // Fetch admin profiles for creator names (only if user is admin)
      let profilesMap: Record<string, string> = {}
      try {
        const profilesResponse = await fetch("/api/admin/staff")
        if (profilesResponse.ok) {
          const profiles = await profilesResponse.json()
          profiles.forEach((profile: any) => {
            profilesMap[profile.id] = profile.full_name || 'Unknown'
          })
          setAdminProfiles(profilesMap)
        }
      } catch (err) {
        console.error("Failed to load staff profiles", err)
        // Continue without creator names if this fails
      }

      // Fetch package prices for each experience
      const experiencesWithPrices: ExperienceWithPackagePrices[] = await Promise.all(
        experiencesList.map(async (exp) => {
          const creatorName = exp.created_by ? (profilesMap[exp.created_by] || 'Unknown') : undefined
          const updaterName = exp.updated_by ? (profilesMap[exp.updated_by] || 'Unknown') : undefined

          try {
            const packagesResponse = await fetch(`/api/admin/packages?experience_id=${exp.id}`)
            if (packagesResponse.ok) {
              const packages = await packagesResponse.json()
              if (packages && packages.length > 0) {
                const adultPrices: number[] = []
                const childPrices: number[] = []
                const vehiclePrices: number[] = []
                const minGroupSizes: number[] = []

                packages.forEach((pkg: any) => {
                  pkg.pricing_tiers?.forEach((tier: any) => {
                    const price = tier.selling_price ?? tier.base_price

                    if (tier.tier_type === 'adult' && typeof price === 'number') {
                      adultPrices.push(price)
                    }

                    if (tier.tier_type === 'child' && typeof price === 'number') {
                      childPrices.push(price)
                    }

                    if (tier.tier_type === 'vehicle' && typeof price === 'number') {
                      vehiclePrices.push(price)
                    }
                  })

                  // Collect min_group_size from packages
                  if (typeof pkg.min_group_size === 'number') {
                    minGroupSizes.push(pkg.min_group_size)
                  }
                })

                const lowestAdultPrice =
                  adultPrices.length > 0 ? Math.min(...adultPrices) : (vehiclePrices.length > 0 ? 0 : exp.adult_price)

                const lowestChildPrice =
                  childPrices.length > 0 ? Math.min(...childPrices) : (vehiclePrices.length > 0 ? 0 : exp.child_price)

                const lowestVehiclePrice =
                  vehiclePrices.length > 0 ? Math.min(...vehiclePrices) : undefined

                // Get the minimum pax across all packages
                const minPax = minGroupSizes.length > 0 ? Math.min(...minGroupSizes) : undefined

                // Collect unique tour types from all packages
                const tourTypes = [...new Set(packages.map((pkg: any) => pkg.tour_type || 'group'))] as ('group' | 'private')[]

                return {
                  ...exp,
                  package_adult_price: lowestAdultPrice || exp.adult_price,
                  package_child_price: lowestChildPrice || exp.child_price,
                  package_vehicle_price: lowestVehiclePrice,
                  tour_types: tourTypes,
                  creator_name: creatorName,
                  updater_name: updaterName,
                  min_pax: minPax,
                }
              }
            }
          } catch (err) {
            console.error(`Failed to load packages for experience ${exp.id}`, err)
          }
          // Fallback to experience-level prices
          return {
            ...exp,
            package_adult_price: exp.adult_price,
            package_child_price: exp.child_price,
            tour_types: ['group'], // Default to group if no packages found
            creator_name: creatorName,
            updater_name: updaterName,
          }
        })
      )

      setExperiences(experiencesWithPrices)
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

  const creators = useMemo(() => {
    const unique = new Set<string>()
    experiences.forEach((exp) => {
      if (exp.creator_name) {
        unique.add(exp.creator_name)
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
      const matchesStatus = selectedStatus === "all" || exp.status === selectedStatus
      const matchesCreator = selectedCreator === "all" || exp.creator_name === selectedCreator
      return matchesSearch && matchesCategory && matchesCountry && matchesStatus && matchesCreator
    })
  }, [experiences, searchQuery, selectedCategory, selectedCountry, selectedStatus, selectedCreator])

  // Pagination calculations
  const totalPages = Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedExperiences = filteredExperiences.slice(startIndex, endIndex)
console.log('paginatedExperiences',paginatedExperiences);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedCountry, selectedStatus, selectedCreator])

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
    if (!window.confirm(t('experiences.deleteConfirmTitle', { title: experience.title }))) {
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
      toast.success(t('experiences.experienceRemoved'))
      void loadExperiences()
    } catch (err) {
      console.error("Failed to delete experience", err)
      toast.error(err instanceof Error ? err.message : t('experiences.failedToDelete'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('experiences.title')}</h1>
          <p className="text-muted-foreground">
            {filteredExperiences.length === experiences.length ? (
              <>{t('experiences.totalExperiences', { count: experiences.length.toLocaleString() })}</>
            ) : (
              <>{t('experiences.showing', { filtered: filteredExperiences.length.toLocaleString(), total: experiences.length.toLocaleString() })}</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/experiences/bulk-pricing">
              <DollarSign className="w-4 h-4 mr-2" />
              Bulk Pricing
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/experiences/new">
              <Plus className="w-4 h-4 mr-2" />
              {t('experiences.addExperience')}
            </Link>
          </Button>
        </div>
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
              placeholder={t('experiences.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('experiences.allCountries')} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country === "all" ? t('experiences.allCountries') : country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('experiences.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('experiences.allStatus')}</SelectItem>
              <SelectItem value="active">{t('experiences.active')}</SelectItem>
              <SelectItem value="draft">{t('experiences.status.draft')}</SelectItem>
              <SelectItem value="review">{t('experiences.status.review')}</SelectItem>
            </SelectContent>
          </Select>
          {profile?.role === 'admin' && (
            <Select value={selectedCreator} onValueChange={setSelectedCreator}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('experiences.allCreators')} />
              </SelectTrigger>
              <SelectContent>
                {creators.map((creator) => (
                  <SelectItem key={creator} value={creator}>
                    {creator === "all" ? t('experiences.allCreators') : creator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
                {experience.gallery && experience.gallery.length > 0 ? (
                  <Image
                    src={experience.gallery[0]}
                    alt={experience.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : experience.image_url ? (
                  <Image
                    src={experience.image_url}
                    alt={experience.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {experience.country}
                  </Badge>
                  <Badge className="bg-primary">{experience.category}</Badge>
                </div>
                <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                  <Badge
                    variant={experience.status === "active" ? "default" : "secondary"}
                    className={
                      experience.status === "active"
                        ? "bg-green-600 hover:bg-green-700"
                        : experience.status === "review"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                    }
                  >
                    {experience.status === "active" ? "Active" : experience.status === "review" ? "Review" : "Draft"}
                  </Badge>
                  {experience.tour_types && experience.tour_types.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className={type === 'private' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}
                    >
                      {type === 'private' ? 'Private' : 'Group'}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-1">{experience.title}</h3>
                  {profile?.role === 'admin' && (experience.creator_name || experience.updater_name || experience.min_pax) && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {experience.creator_name && (
                        <p>
                          Created by: <span className="font-medium">{experience.creator_name}</span>
                        </p>
                      )}
                      {experience.updater_name && (
                        <p>
                          Updated by: <span className="font-medium">{experience.updater_name}</span>
                        </p>
                      )}
                      {experience.min_pax && (
                        <p>
                          Min pax: <span className="font-medium">{experience.min_pax}</span>
                        </p>
                      )}
                    </div>
                  )}
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
                      <div className="font-semibold text-foreground">
                        {(experience.package_adult_price ?? experience.adult_price) > 0 && (
                          <span>${Math.floor(experience.package_adult_price ?? experience.adult_price)} adult</span>
                        )}
                        {experience.package_vehicle_price && experience.package_vehicle_price > 0 && (
                          <span className={experience.package_adult_price && experience.package_adult_price > 0 ? "ml-2" : ""}>
                            {experience.package_adult_price && experience.package_adult_price > 0 ? "· " : ""}
                            ${Math.floor(experience.package_vehicle_price)} vehicle
                          </span>
                        )}
                      </div>
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
          <p className="text-muted-foreground">{t('experiences.noMatchingExperiences')}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSelectedCategory("all")
                setSelectedCountry("all")
                setSelectedStatus("all")
                if (profile?.role === 'admin') {
                  setSelectedCreator("all")
                }
                setSearchQuery("")
                void loadExperiences()
              }}
            >
              {t('experiences.clearFilters')}
            </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          <Pagination className="mt-8">
            <PaginationContent>
              {/* Previous */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* Page numbers */}
              {getPagination(currentPage, totalPages).map((page, index) =>
                page === "..." ? (
                  <PaginationItem key={`dots-${index}`}>
                    <span className="px-3 text-muted-foreground">...</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              {/* Next */}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(totalPages, prev + 1)
                    )
                  }
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Footer text */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredExperiences.length)} of{" "}
            {filteredExperiences.length} experiences
          </div>
        </>
      )}
    </div>
  )
}
