import { Header } from "@/components/header"
import { Breadcrumb } from "@/components/breadcrumb"
import { countries } from "@/lib/data/experiences"
import { DestinationCard } from "@/components/destinations/destination-card"
import { MapPin, Sparkles } from "lucide-react"

export default function DestinationsPage() {
  const popularDestinations = countries.filter((c) => c.popular)
  const otherDestinations = countries.filter((c) => !c.popular)

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20" />
          <div className="container mx-auto px-4 max-w-7xl relative">
            <Breadcrumb items={[{ label: "Destinations" }]} />
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border mb-6">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Explore Destinations</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                Where will your journey take you?
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty">
                Browse our curated destinations and mix & match experiences to create your perfect trip playlist
              </p>
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">Popular Destinations</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularDestinations.map((destination) => (
                <DestinationCard key={destination.slug} destination={destination} />
              ))}
            </div>
          </div>
        </section>

        {/* Other Destinations */}
        {otherDestinations.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-7xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">More Destinations</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherDestinations.map((destination) => (
                  <DestinationCard key={destination.slug} destination={destination} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
