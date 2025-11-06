import { Clock } from "lucide-react"

interface ExperienceItineraryProps {
  itinerary: Array<{ time: string; activity: string }>
}

export function ExperienceItinerary({ itinerary }: ExperienceItineraryProps) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Itinerary</h2>
          </div>

          <div className="space-y-6">
            {itinerary.map((item, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  {index < itinerary.length - 1 && <div className="w-0.5 h-full bg-border mt-2 flex-1 min-h-[40px]" />}
                </div>
                <div className="pb-6 flex-1">
                  <div className="font-semibold mb-2 text-lg">{item.time}</div>
                  <div className="text-muted-foreground leading-relaxed">{item.activity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
