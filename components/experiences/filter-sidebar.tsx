"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface FilterSidebarProps {
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  selectedDurations: string[]
  setSelectedDurations: (durations: string[]) => void
}

const categories = [
  { id: "adventure", label: "Adventure" },
  { id: "culture", label: "Culture" },
  { id: "relaxation", label: "Relaxation" },
]

const durations = [
  { id: "short", label: "Short (< 3h)" },
  { id: "half", label: "Half Day (3-6h)" },
  { id: "full", label: "Full Day (6h+)" },
]

export function FilterSidebar({
  selectedCategories,
  setSelectedCategories,
  priceRange,
  setPriceRange,
  selectedDurations,
  setSelectedDurations,
}: FilterSidebarProps) {
  const toggleCategory = (category: string) => {
    setSelectedCategories(
      selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category],
    )
  }

  const toggleDuration = (duration: string) => {
    setSelectedDurations(
      selectedDurations.includes(duration)
        ? selectedDurations.filter((d) => d !== duration)
        : [...selectedDurations, duration],
    )
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 200])
    setSelectedDurations([])
  }

  const hasActiveFilters =
    selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 200 || selectedDurations.length > 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-0 text-primary">
            Clear all
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Category</Label>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.label)}
                onCheckedChange={() => toggleCategory(category.label)}
              />
              <label
                htmlFor={category.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {category.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Price Range</Label>
          <span className="text-sm text-muted-foreground">
            ${priceRange[0]} - ${priceRange[1]}
          </span>
        </div>
        <Slider
          min={0}
          max={200}
          step={5}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="py-4"
        />
      </div>

      {/* Duration Filter */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Duration</Label>
        <div className="space-y-3">
          {durations.map((duration) => (
            <div key={duration.id} className="flex items-center space-x-2">
              <Checkbox
                id={duration.id}
                checked={selectedDurations.includes(duration.id)}
                onCheckedChange={() => toggleDuration(duration.id)}
              />
              <label
                htmlFor={duration.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {duration.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
