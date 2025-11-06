import Image from "next/image"
import { MapPin, Compass } from "lucide-react"

interface CountryHeroProps {
  country: {
    name: string
    description: string
    image: string
  }
  experienceCount: number
}

export function CountryHero({ country, experienceCount }: CountryHeroProps) {
  return (
    <section className="relative h-[400px] overflow-hidden">
      <Image src={country.image || "/placeholder.svg"} alt={country.name} fill className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

      <div className="container mx-auto px-4 max-w-7xl relative h-full flex flex-col justify-end pb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4 w-fit">
          <MapPin className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">Destination</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">{country.name}</h1>
        <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl text-pretty">{country.description}</p>

        <div className="flex items-center gap-2 text-white/80">
          <Compass className="h-5 w-5" />
          <span className="text-sm font-medium">
            {experienceCount} experience{experienceCount !== 1 ? "s" : ""} available
          </span>
        </div>
      </div>
    </section>
  )
}
