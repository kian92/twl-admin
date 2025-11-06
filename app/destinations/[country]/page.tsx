import { Header } from "@/components/header"
import { Breadcrumb } from "@/components/breadcrumb"
import { countries, getExperiencesByCountry } from "@/lib/data/experiences"
import { notFound } from "next/navigation"
import { CountryHero } from "@/components/destinations/country-hero"
import { CountryExperiences } from "@/components/destinations/country-experiences"

export default function CountryPage({ params }: { params: { country: string } }) {
  const country = countries.find((c) => c.slug === params.country)

  if (!country) {
    notFound()
  }

  const experiences = getExperiencesByCountry(country.name)

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="container mx-auto px-4 max-w-7xl pt-6">
          <Breadcrumb items={[{ label: "Destinations", href: "/destinations" }, { label: country.name }]} />
        </div>
        <CountryHero country={country} experienceCount={experiences.length} />
        <CountryExperiences experiences={experiences} countryName={country.name} />
      </main>
    </div>
  )
}
