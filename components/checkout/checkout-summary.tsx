"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTrip } from "@/components/trip-context"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"

export function CheckoutSummary() {
  const { tripItems, getTotalCost } = useTrip()
  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState(false)

  const subtotal = getTotalCost()
  const serviceFee = Math.round(subtotal * 0.05) // 5% service fee
  const total = subtotal + serviceFee - discount

  const applyPromo = () => {
    // Mock promo code validation
    if (promoCode.toUpperCase() === "WANDERLUST") {
      setDiscount(20)
      setPromoApplied(true)
    }
  }

  if (tripItems.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Link href="/experiences">
            <Button>Browse Experiences</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Experience List */}
          <div className="space-y-3">
            {tripItems.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.duration}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.bookingDate), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.adults} adult{item.adults > 1 ? "s" : ""}
                      {item.children > 0 && `, ${item.children} child${item.children > 1 ? "ren" : ""}`}
                    </p>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.selectedAddons.map((addon, idx) => (
                          <p key={idx} className="text-xs text-primary">
                            + {addon.name} {addon.quantity > 1 && `(×${addon.quantity})`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold">${item.totalPrice.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Promo Code */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Promo Code</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="pl-10"
                  disabled={promoApplied}
                />
              </div>
              <Button
                variant="outline"
                onClick={applyPromo}
                disabled={promoApplied || !promoCode}
                className="bg-transparent"
              >
                Apply
              </Button>
            </div>
            {promoApplied && <p className="text-xs text-primary">Promo code applied successfully!</p>}
            <p className="text-xs text-muted-foreground">Try code: WANDERLUST</p>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="font-medium">${serviceFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-primary">Discount</span>
                <span className="font-medium text-primary">-${discount}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold">${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Security Badge */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Secure Checkout</h4>
              <p className="text-xs text-muted-foreground">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
