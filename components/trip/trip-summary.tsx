"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTrip } from "@/components/trip-context"
import { Clock, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"

export function TripSummary() {
  const { tripItems, getTotalCost, getTotalDuration, clearTrip } = useTrip()

  if (tripItems.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Trip Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Experiences</span>
              </div>
              <span className="font-semibold">{tripItems.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Total Duration</span>
              </div>
              <span className="font-semibold">{getTotalDuration()}</span>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold">Total Cost</span>
              </div>
              <span className="text-2xl font-bold">${getTotalCost()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/checkout" className="block">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
                Proceed to Checkout
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={clearTrip}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">Pro Tip</h4>
          <p className="text-sm text-muted-foreground">
            Drag experiences to reorder them by day. Group similar locations together to optimize your travel time!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
