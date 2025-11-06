"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Award, Users, TrendingUp } from "lucide-react"

const membershipTiers = [
  {
    name: "Explorer",
    color: "from-blue-500 to-blue-600",
    users: 1250,
    benefits: [
      { name: "Discount Rate", value: "5%" },
      { name: "Referral Bonus", value: "100 points" },
      { name: "Free Add-ons", value: "None" },
    ],
  },
  {
    name: "Adventurer",
    color: "from-purple-500 to-purple-600",
    users: 450,
    benefits: [
      { name: "Discount Rate", value: "10%" },
      { name: "Referral Bonus", value: "200 points" },
      { name: "Free Add-ons", value: "Up to $20" },
    ],
  },
  {
    name: "Voyager",
    color: "from-amber-500 to-amber-600",
    users: 150,
    benefits: [
      { name: "Discount Rate", value: "15%" },
      { name: "Referral Bonus", value: "500 points" },
      { name: "Free Add-ons", value: "Up to $50" },
    ],
  },
]

const rewardSettings = [
  { name: "Points per $1 spent", value: "10" },
  { name: "Points for review", value: "50" },
  { name: "Points for referral", value: "200" },
  { name: "Points to $ conversion", value: "100 points = $1" },
]

export default function MembershipPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Membership & Rewards</h1>
        <p className="text-muted-foreground">Manage membership tiers and reward programs</p>
      </div>

      {/* Membership Tiers */}
      <div className="grid gap-4 md:grid-cols-3">
        {membershipTiers.map((tier) => (
          <Card key={tier.name}>
            <CardHeader>
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center mb-2`}
              >
                <Award className="w-6 h-6 text-white" />
              </div>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Users className="w-4 h-4" />
                  <span>{tier.users} members</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tier.benefits.map((benefit) => (
                <div key={benefit.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{benefit.name}</span>
                  <span className="font-medium">{benefit.value}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Edit Benefits
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reward Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Reward Settings</CardTitle>
          <CardDescription>Configure how users earn and redeem points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {rewardSettings.map((setting) => (
              <div key={setting.name} className="space-y-2">
                <Label htmlFor={setting.name}>{setting.name}</Label>
                <Input id={setting.name} defaultValue={setting.value} />
              </div>
            ))}
          </div>
          <Button>Save Settings</Button>
        </CardContent>
      </Card>

      {/* Promotional Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Promotional Campaigns</CardTitle>
          <CardDescription>Create bonus point campaigns and special offers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Summer Travel Bonus</h4>
                <p className="text-sm text-muted-foreground">2x points on all bookings</p>
                <p className="text-xs text-muted-foreground mt-1">Active until: July 31, 2024</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  End
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Referral Boost</h4>
                <p className="text-sm text-muted-foreground">Extra 100 points for referrals</p>
                <p className="text-xs text-muted-foreground mt-1">Active until: August 15, 2024</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  End
                </Button>
              </div>
            </div>
          </div>

          <Button>
            <TrendingUp className="w-4 h-4 mr-2" />
            Create New Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
