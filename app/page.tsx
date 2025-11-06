import { Header } from "@/components/header"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturedPlaylists } from "@/components/home/featured-playlists"
import { TrendingExperiences } from "@/components/home/trending-experiences"
import { HowItWorks } from "@/components/home/how-it-works"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturedPlaylists />
        <TrendingExperiences />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
