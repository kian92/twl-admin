"use client"

import { useEffect, useMemo, useState } from "react"
import { useAdmin } from "@/components/admin-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Award, Users, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getMembershipTiers,
  getRewardSettings,
  getRewardCampaigns,
} from "@/lib/supabase/admin-data"
import type { Database } from "@/types/database"
import { toast } from "sonner"

type MembershipTier = Database["public"]["Tables"]["membership_tiers"]["Row"]
type RewardSetting = Database["public"]["Tables"]["reward_settings"]["Row"]
type RewardCampaign = Database["public"]["Tables"]["reward_campaigns"]["Row"]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
})

const normalizeDate = (value: string | null) => {
  if (!value) return null
  return new Date(`${value}T12:00:00.000Z`)
}

export default function MembershipPage() {
  const { supabase } = useAdmin()
  const [tiers, setTiers] = useState<MembershipTier[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [campaigns, setCampaigns] = useState<RewardCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tierData, settingData, campaignData] = await Promise.all([
          getMembershipTiers(supabase),
          getRewardSettings(supabase),
          getRewardCampaigns(supabase),
        ])
        if (!isMounted) return
        setTiers(tierData as MembershipTier[])
        setSettings(
          Object.fromEntries((settingData as RewardSetting[]).map((item) => [item.key, item.value])) as Record<
            string,
            string
          >,
        )
        setCampaigns(campaignData as RewardCampaign[])
      } catch (err) {
        console.error("Failed to load membership data", err)
        if (!isMounted) return
        setError("Unable to load membership & rewards data.")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(settings).map(async ([key, value]) => {
          const { error: updateError } = await (supabase as any)
            .from("reward_settings")
            .update({ value })
            .eq("key", key)
          if (updateError) {
            throw updateError
          }
        }),
      )
      toast.success("Reward settings updated")
    } catch (err) {
      console.error("Failed to update reward settings", err)
      toast.error("Unable to update reward settings.")
    } finally {
      setSaving(false)
    }
  }

  const settingsList = useMemo(() => Object.entries(settings), [settings])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Membership & Rewards</h1>
        <p className="text-muted-foreground">Manage membership tiers and reward programs</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? [0, 1, 2].map((item) => (
              <Card key={`tier-skeleton-${item}`}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-5 w-32 mt-4" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[0, 1, 2].map((row) => (
                    <Skeleton key={`benefit-${item}-${row}`} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))
          : tiers.map((tier) => (
              <Card key={tier.id}>
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${tier.gradient_from} ${tier.gradient_to} flex items-center justify-center mb-2`}
                  >
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="w-4 h-4" />
                      <span>{(tier.member_count ?? 0).toLocaleString()} members</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount Rate</span>
                    <span className="font-medium">{tier.discount_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referral Bonus</span>
                    <span className="font-medium">{tier.referral_bonus_points} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Free Add-ons</span>
                    <span className="font-medium">{tier.free_addons_value ?? "—"}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Edit Benefits
                  </Button>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reward Settings</CardTitle>
          <CardDescription>Configure how users earn and redeem points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={`setting-skeleton-${item}`} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {settingsList.map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{key.replace(/-/g, " ")}</Label>
                  <Input id={key} value={value} onChange={(event) => handleSettingChange(key, event.target.value)} />
                </div>
              ))}
            </div>
          )}
          <Button onClick={handleSaveSettings} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promotional Campaigns</CardTitle>
          <CardDescription>Create bonus point campaigns and special offers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((item) => (
                <Skeleton key={`campaign-skeleton-${item}`} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{campaign.name}</h4>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {campaign.status} •{" "}
                      {campaign.ends_at
                        ? `Ends ${dateFormatter.format(normalizeDate(campaign.ends_at)!)}`
                        : "No end date"}
                    </p>
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
              ))}
              {campaigns.length === 0 && <p className="text-sm text-muted-foreground">No campaigns configured yet.</p>}
            </div>
          )}

          <Button>
            <TrendingUp className="w-4 h-4 mr-2" />
            Create New Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
