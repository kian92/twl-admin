"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useMemo } from "react"

interface ExperienceReviewsProps {
  rating: number
  reviewCount: number
}

const mockReviews = [
  {
    id: 1,
    author: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "2 weeks ago",
    timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
    comment:
      "Absolutely incredible experience! The sunrise was breathtaking and our guide was knowledgeable and friendly. Highly recommend!",
  },
  {
    id: 2,
    author: "Michael Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "1 month ago",
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
    comment:
      "One of the best things I did in Bali. The trek was challenging but worth every step. The breakfast at the summit was a nice touch.",
  },
  {
    id: 3,
    author: "Emma Williams",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4,
    date: "1 month ago",
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
    comment:
      "Great experience overall. The early morning start was tough but the views made it worthwhile. Would do it again!",
  },
  {
    id: 4,
    author: "David Martinez",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "2 months ago",
    timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
    comment:
      "Amazing adventure! The guide was professional and made sure everyone was safe. The views from the top were stunning.",
  },
  {
    id: 5,
    author: "Lisa Anderson",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4,
    date: "2 months ago",
    timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
    comment:
      "Really enjoyed this experience. The hike was moderate difficulty and the sunrise was beautiful. Would recommend bringing warm clothes!",
  },
  {
    id: 6,
    author: "James Wilson",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "3 months ago",
    timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000,
    comment:
      "Best experience in Bali! Our guide was fantastic and the whole group had a great time. The breakfast at the top was delicious.",
  },
  {
    id: 7,
    author: "Sophie Taylor",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 3,
    date: "3 months ago",
    timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000,
    comment:
      "Good experience but quite crowded. The sunrise was nice but there were too many people at the summit. Still worth doing though.",
  },
  {
    id: 8,
    author: "Robert Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "4 months ago",
    timestamp: Date.now() - 120 * 24 * 60 * 60 * 1000,
    comment:
      "Unforgettable experience! The trek was challenging but our guide kept us motivated. The sunrise view was absolutely worth it.",
  },
  {
    id: 9,
    author: "Maria Garcia",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4,
    date: "4 months ago",
    timestamp: Date.now() - 120 * 24 * 60 * 60 * 1000,
    comment:
      "Very well organized tour. The guide was knowledgeable about the volcano and local culture. Great value for money.",
  },
  {
    id: 10,
    author: "Thomas Lee",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "5 months ago",
    timestamp: Date.now() - 150 * 24 * 60 * 60 * 1000,
    comment:
      "This was the highlight of my Bali trip! The early morning start was worth it for the incredible sunrise. Highly recommend!",
  },
  {
    id: 11,
    author: "Jennifer White",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4,
    date: "5 months ago",
    timestamp: Date.now() - 150 * 24 * 60 * 60 * 1000,
    comment:
      "Great experience with a professional guide. The trek was moderate and suitable for most fitness levels. Beautiful views!",
  },
  {
    id: 12,
    author: "Daniel Kim",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 2,
    date: "6 months ago",
    timestamp: Date.now() - 180 * 24 * 60 * 60 * 1000,
    comment:
      "The experience was okay but not as expected. The weather wasn't great so we couldn't see much of the sunrise. Guide was nice though.",
  },
]

const ratingDistribution = [
  { stars: 5, percentage: 75 },
  { stars: 4, percentage: 20 },
  { stars: 3, percentage: 3 },
  { stars: 2, percentage: 1 },
  { stars: 1, percentage: 1 },
]

const REVIEWS_PER_PAGE = 5

export function ExperienceReviews({ rating, reviewCount }: ExperienceReviewsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const sortBy = searchParams.get("sortBy") || "recent"
  const currentPage = Number.parseInt(searchParams.get("reviewPage") || "1", 10)

  const sortedReviews = useMemo(() => {
    const reviews = [...mockReviews]

    switch (sortBy) {
      case "highest":
        return reviews.sort((a, b) => b.rating - a.rating || b.timestamp - a.timestamp)
      case "lowest":
        return reviews.sort((a, b) => a.rating - b.rating || b.timestamp - a.timestamp)
      case "oldest":
        return reviews.sort((a, b) => a.timestamp - b.timestamp)
      case "recent":
      default:
        return reviews.sort((a, b) => b.timestamp - a.timestamp)
    }
  }, [sortBy])

  const totalPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE)
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE
  const paginatedReviews = sortedReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE)

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", value)
    params.set("reviewPage", "1")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("reviewPage", page.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: false })

    const reviewsSection = document.getElementById("reviews-section")
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <section id="reviews-section" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-3xl font-bold mb-8">Reviews</h2>

        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + REVIEWS_PER_PAGE, sortedReviews.length)} of{" "}
              {sortedReviews.length} reviews
            </div>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {paginatedReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{review.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold">{review.author}</div>
                          <div className="text-sm text-muted-foreground">{review.date}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
