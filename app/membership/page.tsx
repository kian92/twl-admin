"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Breadcrumb } from "@/components/breadcrumb"
import { useAuth, type MembershipTier } from "@/components/auth-context"
import { useTrip } from "@/components/trip-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Award,
  Calendar,
  Check,
  Crown,
  Gift,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Bookmark,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Heart,
} from "lucide-react"

import { useFavorites } from "@/components/favorites-context"

const TIER_CONFIG = {
  explorer: {
    name: "Explorer",
    icon: Star,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    nextTier: "adventurer",
    pointsRequired: 1000,
    benefits: [
      "5% discount on all bookings",
      "Monthly newsletter with travel tips",
      "Access to community forum",
      "Birthday bonus: 50 points",
    ],
  },
  adventurer: {
    name: "Adventurer",
    icon: Award,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    nextTier: "voyager",
    pointsRequired: 3000,
    benefits: [
      "10% discount on all bookings",
      "Early access to new destinations",
      "Free add-on per booking (up to $20)",
      "Priority customer support",
      "Referral bonus: 200 points per friend",
      "Quarterly exclusive experiences",
    ],
  },
  voyager: {
    name: "Voyager",
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    nextTier: null,
    pointsRequired: null,
    benefits: [
      "15% discount on all bookings",
      "VIP early access to all new features",
      "Free add-on per booking (up to $50)",
      "Dedicated concierge service",
      "Referral bonus: 500 points per friend",
      "Exclusive luxury experiences",
      "Annual travel credit: $100",
      "Complimentary travel insurance",
    ],
  },
}

const UPCOMING_REWARDS = [
  { points: 500, reward: "Free city tour add-on", icon: Gift },
  { points: 1000, reward: "Upgrade to Adventurer tier", icon: TrendingUp },
  { points: 1500, reward: "$50 travel credit", icon: Sparkles },
  { points: 2000, reward: "Premium experience unlock", icon: Zap },
]

export default function MembershipPage() {
  const router = useRouter()
  const { user, isAuthenticated, getPointsHistory, getBookingHistory } = useAuth()
  const { tripItems, getTotalCost } = useTrip()
  const { favorites } = useFavorites()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in")
    }
  }, [isAuthenticated, router])

  if (!user) {
    return null
  }

  const tierConfig = TIER_CONFIG[user.membershipTier]
  const TierIcon = tierConfig.icon
  const pointsHistory = getPointsHistory()
  const bookingHistory = getBookingHistory()

  const progressToNextTier = tierConfig.nextTier ? (user.points / tierConfig.pointsRequired!) * 100 : 100

  const pointsNeeded = tierConfig.nextTier ? tierConfig.pointsRequired! - user.points : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      <div className="container mx-auto px-4 max-w-7xl py-12 space-y-8">
        <Breadcrumb items={[{ label: "Membership" }]} />

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Your Membership</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your rewards, unlock exclusive benefits, and level up your travel experience
          </p>
        </div>

        {/* Current Tier Card */}
        <Card className={`border-2 ${tierConfig.borderColor}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full ${tierConfig.bgColor} flex items-center justify-center`}>
                    <TierIcon className={`h-6 w-6 ${tierConfig.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{tierConfig.name} Member</CardTitle>
                    <CardDescription>Member since {new Date(user.joinedDate).toLocaleDateString()}</CardDescription>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {user.points.toLocaleString()} points
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {tierConfig.nextTier && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {TIER_CONFIG[tierConfig.nextTier].name}</span>
                  <span className="font-medium">{pointsNeeded.toLocaleString()} points to go</span>
                </div>
                <Progress value={progressToNextTier} className="h-2" />
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Your Benefits
              </h3>
              <div className="grid gap-2">
                {tierConfig.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Saved Favorites
                </CardTitle>
                <CardDescription>Experiences you've saved for later</CardDescription>
              </div>
              {favorites.length > 0 && (
                <Link href="/experiences">
                  <Button variant="outline" size="sm">
                    Explore More
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {favorites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No favorites yet</p>
                <Link href="/experiences">
                  <Button variant="link" className="mt-2">
                    Start exploring
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.slice(0, 6).map((item) => (
                  <Link key={item.id} href={`/experiences/${item.id}`}>
                    <div className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-lg transition-all">
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-sm line-clamp-2 mb-2">{item.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </span>
                          <span className="font-semibold text-sm">${item.price}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {favorites.length > 6 && (
              <div className="mt-4 text-center">
                <Link href="/experiences">
                  <Button variant="outline" size="sm">
                    View all {favorites.length} favorites
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Trips Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5" />
                  Saved Trips
                </CardTitle>
                <CardDescription>Your current trip playlist ready to book</CardDescription>
              </div>
              {tripItems.length > 0 && (
                <Link href="/my-trip">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tripItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No saved experiences yet</p>
                <Link href="/experiences">
                  <Button variant="link" className="mt-2">
                    Start exploring
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {tripItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="relative h-20 w-28 rounded-md overflow-hidden flex-shrink-0">
                        <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.duration}
                          </span>
                        </div>
                        <p className="font-semibold text-sm mt-2">${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {tripItems.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{tripItems.length - 3} more experience{tripItems.length - 3 > 1 ? "s" : ""}
                  </p>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold">${getTotalCost()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Bookings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking History
            </CardTitle>
            <CardDescription>Your past and upcoming trips</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bookingHistory.map((booking, index) => (
                  <div key={booking.id}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Booking #{booking.id}</span>
                            <Badge
                              variant={
                                booking.status === "completed"
                                  ? "secondary"
                                  : booking.status === "upcoming"
                                    ? "default"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {booking.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {booking.status === "cancelled" && <XCircle className="h-3 w-3 mr-1" />}
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Booked on {new Date(booking.bookingDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-bold text-lg">${booking.totalCost}</span>
                      </div>

                      <div className="grid gap-3">
                        {booking.experiences.map((exp) => (
                          <div key={exp.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                            <div className="relative h-16 w-24 rounded-md overflow-hidden flex-shrink-0">
                              <Image
                                src={exp.image || "/placeholder.svg"}
                                alt={exp.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-1">{exp.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {exp.location}
                              </p>
                              <p className="text-sm font-semibold mt-1">${exp.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {index < bookingHistory.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* All Membership Tiers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                All Membership Tiers
              </CardTitle>
              <CardDescription>Compare benefits across all tiers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(TIER_CONFIG) as MembershipTier[]).map((tier) => {
                const config = TIER_CONFIG[tier]
                const Icon = config.icon
                const isCurrentTier = tier === user.membershipTier

                return (
                  <div
                    key={tier}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      isCurrentTier ? config.borderColor + " " + config.bgColor : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <span className="font-semibold">{config.name}</span>
                      </div>
                      {isCurrentTier && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {config.pointsRequired
                        ? `Requires ${config.pointsRequired.toLocaleString()} points`
                        : "Premium tier"}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Upcoming Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Upcoming Rewards
              </CardTitle>
              <CardDescription>Rewards you can unlock with your points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {UPCOMING_REWARDS.map((reward, index) => {
                const Icon = reward.icon
                const canUnlock = user.points >= reward.points
                const isNextReward = !canUnlock && (index === 0 || user.points >= UPCOMING_REWARDS[index - 1].points)

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-colors ${
                      canUnlock
                        ? "border-primary bg-primary/5"
                        : isNextReward
                          ? "border-border bg-muted/50"
                          : "border-border opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            canUnlock ? "bg-primary/10" : "bg-muted"
                          }`}
                        >
                          {canUnlock ? (
                            <TrendingUp className="h-5 w-5 text-primary" />
                          ) : (
                            <Icon className={`h-5 w-5 ${canUnlock ? "text-primary" : "text-muted-foreground"}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{reward.reward}</p>
                          <p className="text-xs text-muted-foreground mt-1">{reward.points.toLocaleString()} points</p>
                        </div>
                      </div>
                      {canUnlock && (
                        <Button size="sm" variant="outline">
                          Claim
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Points History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Points History
            </CardTitle>
            <CardDescription>Track your recent points activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pointsHistory.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          item.type === "earned" ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        {item.type === "earned" ? (
                          <TrendingUp className="h-5 w-5 text-primary" />
                        ) : (
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${item.type === "earned" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {item.points > 0 ? "+" : ""}
                      {item.points}
                    </span>
                  </div>
                  {index < pointsHistory.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Refer Friends, Earn Rewards
                </CardTitle>
                <CardDescription>
                  Share your love for travel and earn{" "}
                  {user.membershipTier === "voyager" ? "500" : user.membershipTier === "adventurer" ? "200" : "100"}{" "}
                  points per referral
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Share
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-background rounded-lg border font-mono text-sm">
                WANDERING-{user.id.toUpperCase()}
              </div>
              <Button>Copy Code</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
