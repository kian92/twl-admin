import { Search, Plus, Sparkles } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "Browse Experiences",
    description: "Explore curated tours, activities, and attractions from destinations worldwide",
  },
  {
    icon: Plus,
    title: "Build Your Itinerary",
    description: "Add experiences to your trip with a single click and create your perfect journey",
  },
  {
    icon: Sparkles,
    title: "Book & Travel",
    description: "Review your itinerary, customize the order, and book everything seamlessly",
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-normal mb-4">How it works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Planning your journey has never been simpler</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <step.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
