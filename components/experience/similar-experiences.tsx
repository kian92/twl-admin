"use client"

import { ExperienceCard } from "@/components/experiences/experience-card"
import { allExperiences } from "@/lib/data/experiences"

interface SimilarExperiencesProps {
  currentId: string
  category: string
}

export function SimilarExperiences({ currentId, category }: SimilarExperiencesProps) {
  const similarExperiences = allExperiences
    .filter((exp) => exp.category === category && exp.id !== currentId)
    .slice(0, 3)

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-3xl font-bold mb-8">You Might Also Like</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarExperiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      </div>
    </section>
  )
}
