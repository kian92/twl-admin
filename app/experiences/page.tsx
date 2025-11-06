import { Header } from "@/components/header"
import { Breadcrumb } from "@/components/breadcrumb"
import { ExperiencesHero } from "@/components/experiences/experiences-hero"
import { ExperienceGrid } from "@/components/experiences/experience-grid"
import { Suspense } from "react"

export default function ExperiencesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="container mx-auto px-4 max-w-7xl pt-6">
          <Breadcrumb items={[{ label: "Experiences" }]} />
        </div>
        <ExperiencesHero />
        <Suspense fallback={<div className="container py-12">Loading experiences...</div>}>
          <ExperienceGrid />
        </Suspense>
      </main>
    </div>
  )
}
