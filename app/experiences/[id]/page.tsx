import { Header } from "@/components/header"
import { ExperienceGallery } from "@/components/experience/experience-gallery"
import { ExperienceNav } from "@/components/experience/experience-nav"
import { ExperienceOverview } from "@/components/experience/experience-overview"
import { ExperienceDetails } from "@/components/experience/experience-details"
import { ExperienceReviews } from "@/components/experience/experience-reviews"
import { SimilarExperiences } from "@/components/experience/similar-experiences"
import { ScrollToTop } from "@/components/scroll-to-top"
import { Breadcrumb } from "@/components/breadcrumb"
import { notFound } from "next/navigation"
import { getExperienceById } from "@/lib/data/experiences"
import { ExperienceFAQ } from "@/components/experience/experience-faq"
import { ExperienceItinerary } from "@/components/experience/experience-itinerary"

export default function ExperiencePage({ params }: { params: { id: string } }) {
  const experience = getExperienceById(params.id)

  if (!experience) {
    notFound()
  }

  const galleryImages = [
    experience.image,
    experience.image,
    experience.image,
    experience.image,
    experience.image,
    experience.image,
    experience.image,
    experience.image,
  ]

  const defaultFaqs = [
    {
      question: "What is included in the price?",
      answer: experience.inclusions?.join(", ") || "Please check the inclusions section for details.",
    },
    {
      question: "What is the cancellation policy?",
      answer: experience.cancellationPolicy || "Please contact us for cancellation policy details.",
    },
    {
      question: "What should I bring?",
      answer: experience.whatToBring?.join(", ") || "Please check the what to bring section for details.",
    },
    {
      question: "How long is the experience?",
      answer: `This experience lasts ${experience.duration}.`,
    },
  ]

  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <Header />
      <ExperienceNav />
      <main>
        <div className="container mx-auto px-4 max-w-7xl pt-6">
          <Breadcrumb
            items={[
              { label: "Destinations", href: "/destinations" },
              {
                label: experience.country,
                href: `/destinations/${experience.country.toLowerCase().replace(/\s+/g, "-")}`,
              },
              { label: experience.title },
            ]}
          />
        </div>
        <div id="gallery" className="container mx-auto px-4 max-w-7xl py-6">
          <ExperienceGallery images={galleryImages} title={experience.title} />
        </div>
        <div id="overview">
          <ExperienceOverview experience={experience} />
        </div>
        <div id="itinerary">
          <ExperienceItinerary itinerary={experience.itinerary} />
        </div>
        <div id="details">
          <ExperienceDetails experience={experience} />
        </div>
        <div id="reviews">
          <ExperienceReviews rating={experience.rating} reviewCount={experience.reviewCount} />
        </div>
        <div id="faq">
          <ExperienceFAQ faqs={experience.faqs || defaultFaqs} />
        </div>
        <div id="similar">
          <SimilarExperiences currentId={experience.id} category={experience.category} />
        </div>
      </main>
    </div>
  )
}
