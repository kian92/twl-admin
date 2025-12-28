"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, MapPin, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Experience {
  id: string
  title: string
  location: string
  country: string
  duration: string
  status: string
}

interface ExperienceComboboxProps {
  value?: string | null
  onChange: (experienceId: string | null, experience: Experience | null) => void
}

export function ExperienceCombobox({ value, onChange }: ExperienceComboboxProps) {
  const [open, setOpen] = useState(false)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null)

  // Fetch experiences
  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/admin/experiences")
        if (response.ok) {
          const data = await response.json()
          setExperiences(data)

          // If there's a value, find and set the selected experience
          if (value) {
            const found = data.find((exp: Experience) => exp.id === value)
            if (found) {
              setSelectedExperience(found)
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch experiences:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExperiences()
  }, [value])

  const handleSelect = (experienceId: string) => {
    const experience = experiences.find((exp) => exp.id === experienceId)
    if (experience) {
      setSelectedExperience(experience)
      onChange(experienceId, experience)
    }
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedExperience(null)
    onChange(null, null)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading experiences...
              </>
            ) : selectedExperience ? (
              <span className="truncate">{selectedExperience.title}</span>
            ) : (
              "Search and select an experience..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search experiences..." />
            <CommandEmpty>No experience found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {experiences.map((experience) => (
                <CommandItem
                  key={experience.id}
                  value={`${experience.title} ${experience.location} ${experience.country}`}
                  onSelect={() => handleSelect(experience.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === experience.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{experience.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {experience.location}, {experience.country}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {experience.duration}
                      </span>
                    </div>
                  </div>
                  {experience.status && (
                    <Badge
                      variant={experience.status === "active" ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {experience.status}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedExperience && (
        <div className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
          <div className="flex-1">
            <div className="font-medium text-sm">{selectedExperience.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {selectedExperience.location}, {selectedExperience.country} • {selectedExperience.duration}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Link this testimonial to a specific tour/experience
      </p>
    </div>
  )
}
