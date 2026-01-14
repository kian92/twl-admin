import { Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ExperienceDetailsProps {
  experience: {
    description: string
    highlights: string[] | string
    inclusions: string[] | string
    exclusions?: string[] | string
    itinerary: Array<{ time: string; activity: string }>
    whatToBring: string[]
    notSuitableFor?: string[]
    meetingPoint?: string
    cancellationPolicy: string
  }
}

export function ExperienceDetails({ experience }: ExperienceDetailsProps) {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="max-w-4xl space-y-12">
          {/* Highlights */}
          <div className="grid md:grid-cols-[200px_1fr] gap-6 pb-12 border-b">
            <h2 className="text-xl font-bold">Highlights</h2>
            {typeof experience.highlights === 'string' ? (
              <div
                className="prose prose-sm max-w-none text-muted-foreground [&_ul]:space-y-2 [&_li]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: experience.highlights }}
              />
            ) : (
              <ul className="space-y-3">
                {experience.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Full Description */}
          <div className="grid md:grid-cols-[200px_1fr] gap-6 pb-12 border-b">
            <h2 className="text-xl font-bold">Full description</h2>
            <div>
              <p className="text-muted-foreground leading-relaxed">{experience.description}</p>
            </div>
          </div>

          {/* Includes */}
          <div className="grid md:grid-cols-[200px_1fr] gap-6 pb-12 border-b">
            <h2 className="text-xl font-bold">Includes</h2>
            <div className="space-y-6">
              {typeof experience.inclusions === 'string' ? (
                <div
                  className="prose prose-sm max-w-none text-muted-foreground [&_ul]:space-y-2 [&_li]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: experience.inclusions }}
                />
              ) : (
                <div className="space-y-3">
                  {experience.inclusions.map((inclusion, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{inclusion}</span>
                    </div>
                  ))}
                </div>
              )}
              {experience.exclusions && (typeof experience.exclusions === 'string' ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Excludes</h3>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground [&_ul]:space-y-2 [&_li]:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: experience.exclusions }}
                  />
                </div>
              ) : (
                experience.exclusions.length > 0 && (
                  <div className="space-y-3">
                    {experience.exclusions.map((exclusion, index) => (
                      <div key={`ex-${index}`} className="flex items-start gap-3">
                        <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{exclusion}</span>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Not Suitable For */}
          {experience.notSuitableFor && experience.notSuitableFor.length > 0 && (
            <div className="grid md:grid-cols-[200px_1fr] gap-6 pb-12 border-b">
              <h2 className="text-xl font-bold">Not suitable for</h2>
              <ul className="space-y-2">
                {experience.notSuitableFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meeting Point */}
          {experience.meetingPoint && (
            <div className="grid md:grid-cols-[200px_1fr] gap-6 pb-12 border-b">
              <h2 className="text-xl font-bold">Meeting point</h2>
              <div>
                <p className="text-muted-foreground leading-relaxed mb-4">{experience.meetingPoint}</p>
                <Button variant="link" className="p-0 h-auto font-normal" asChild>
                  <Link href="#" className="inline-flex items-center gap-2 underline">
                    Open in Google Maps
                    <span>→</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* What to Bring */}
          <div className="grid md:grid-cols-[200px_1fr] gap-6 pb-12 border-b">
            <h2 className="text-xl font-bold">What to bring</h2>
            <ul className="space-y-2">
              {experience.whatToBring.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cancellation Policy */}
          <div className="grid md:grid-cols-[200px_1fr] gap-6 pb-12 border-b">
            <h2 className="text-xl font-bold flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-1" />
              Cancellation policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">{experience.cancellationPolicy}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
