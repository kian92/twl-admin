"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const sections = [
  { id: "gallery", label: "Gallery" },
  { id: "overview", label: "Overview" },
  { id: "itinerary", label: "Itinerary" },
  { id: "details", label: "Details" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
  { id: "similar", label: "Similar" },
]

export function ExperienceNav() {
  const [activeSection, setActiveSection] = useState("gallery")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries.filter((entry) => entry.isIntersecting)
        if (visibleSections.length > 0) {
          const mostVisible = visibleSections.reduce((prev, current) =>
            current.intersectionRatio > prev.intersectionRatio ? current : prev,
          )
          setActiveSection(mostVisible.target.id)
        }
      },
      {
        rootMargin: "-120px 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 130
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <nav className="sticky top-16 z-40 bg-background border-b border-border">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={cn(
                "py-4 text-sm font-medium whitespace-nowrap transition-colors relative",
                activeSection === id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {activeSection === id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
