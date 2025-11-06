import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Mail, Home } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="container max-w-2xl">
          <Card className="border-2">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>

              <h1 className="text-3xl font-bold mb-3">Booking Confirmed!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your adventure awaits. We've sent a confirmation email with all the details.
              </p>

              <div className="bg-muted/50 rounded-xl p-6 mb-8 text-left">
                <div className="grid gap-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Reference</span>
                    <span className="font-semibold">WL-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confirmation Email</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Sent
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="outline" className="bg-transparent">
                  <Download className="mr-2 h-5 w-5" />
                  Download Itinerary
                </Button>
                <Link href="/">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Home className="mr-2 h-5 w-5" />
                    Back to Home
                  </Button>
                </Link>
              </div>

              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold mb-3">What's Next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Check your email for detailed booking confirmations and vouchers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Save your booking reference for easy access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Contact us anytime if you need to make changes</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
