import Link from "next/link"
import { Camera, Facebook, Instagram, Twitter, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-secondary/20 border-t">
      <div className="container mx-auto px-4 max-w-7xl py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5 text-foreground" />
              <span className="font-serif text-xl font-normal tracking-wide">The Wandering Lens</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Your journey, curated your way. Discover extraordinary travel experiences worldwide.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-white border flex items-center justify-center hover:bg-secondary/50 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-white border flex items-center justify-center hover:bg-secondary/50 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-white border flex items-center justify-center hover:bg-secondary/50 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@wanderinglens.com"
                className="h-9 w-9 rounded-full bg-white border flex items-center justify-center hover:bg-secondary/50 transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/destinations"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Destinations
                </Link>
              </li>
              <li>
                <Link
                  href="/experiences"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Experiences
                </Link>
              </li>
              <li>
                <Link href="/my-trip" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  My Trip
                </Link>
              </li>
              <li>
                <Link
                  href="/membership"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Membership
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/cancellation"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} The Wandering Lens. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
