import Link from "next/link"
import { Card } from "@/components/ui/card"

const playlists = [
  {
    id: "best-of-bali",
    title: "Best of Bali",
    description: "Temples, beaches, and rice terraces",
    experiences: 8,
    image: "/bali-temple-rice-terraces.jpg",
    category: "ADVENTURES IN ASIA",
  },
  {
    id: "weekend-getaways",
    title: "Weekend Escapes",
    description: "Quick getaways for the time-conscious traveler",
    experiences: 5,
    image: "/weekend-beach-getaway.jpg",
    category: "THE WEEKEND EDIT",
  },
  {
    id: "family-favourites",
    title: "Paradise Awaits in Bali and Beyond",
    description: "Discover Indonesia's hidden gems",
    experiences: 10,
    image: "/family-vacation-theme-park.jpg",
    category: "DISCOVER INDONESIA",
  },
]

export function FeaturedPlaylists() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-foreground">
            Things to do wherever you're going
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <Link key={playlist.id} href={`/experiences?playlist=${playlist.id}`}>
              <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="relative h-[400px] overflow-hidden">
                  <img
                    src={playlist.image || "/placeholder.svg"}
                    alt={playlist.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-xs font-medium uppercase tracking-wider mb-2 text-white/80">
                      {playlist.category}
                    </p>
                    <h3 className="font-serif text-2xl font-normal mb-2 text-balance">{playlist.title}</h3>
                    <p className="text-sm text-white/90">{playlist.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
