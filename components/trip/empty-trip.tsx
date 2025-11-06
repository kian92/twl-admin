import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, Sparkles } from "lucide-react"
import Link from "next/link"

export function EmptyTrip() {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Music className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Your Trip Playlist is Empty</h3>
        <p className="text-muted-foreground mb-8 max-w-md">
          Start building your dream journey by adding experiences. It's as easy as creating a playlist!
        </p>
        <Link href="/experiences">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Sparkles className="mr-2 h-5 w-5" />
            Discover Experiences
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
