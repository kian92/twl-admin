"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, User, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTrip } from "@/components/trip-context"

export function CheckoutForm() {
  const router = useRouter()
  const { clearTrip } = useTrip()
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Clear trip and redirect to success page
    clearTrip()
    router.push("/checkout/success")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="john@example.com" className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="pl-10" required />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travel Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Travel Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="travelers">Number of Travelers</Label>
            <Input id="travelers" type="number" min="1" defaultValue="1" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accommodation">Hotel/Accommodation (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="accommodation" placeholder="Enter your hotel name" className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests (Optional)</Label>
            <textarea
              id="notes"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Any dietary restrictions, accessibility needs, or special requests..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex-1 cursor-pointer">
                Credit / Debit Card
              </Label>
              <div className="flex gap-2">
                <div className="h-6 w-10 bg-muted rounded flex items-center justify-center text-xs font-semibold">
                  VISA
                </div>
                <div className="h-6 w-10 bg-muted rounded flex items-center justify-center text-xs font-semibold">
                  MC
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="paypal" id="paypal" />
              <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                PayPal
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="pay-later" id="pay-later" />
              <Label htmlFor="pay-later" className="flex-1 cursor-pointer">
                Pay at Venue
              </Label>
            </div>
          </RadioGroup>

          {paymentMethod === "card" && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" placeholder="MM/YY" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" maxLength={3} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input id="cardName" placeholder="John Doe" required />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms & Submit */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="terms" required />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the terms and conditions, cancellation policy, and privacy policy. I understand that all
              bookings are subject to availability.
            </label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox id="newsletter" />
            <label htmlFor="newsletter" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              Send me travel tips, special offers, and updates from The Wandering Lens
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Complete Booking"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">Your payment information is secure and encrypted</p>
        </CardContent>
      </Card>
    </form>
  )
}
