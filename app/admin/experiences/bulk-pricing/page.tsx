"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/admin/RichTextEditor"

interface Experience {
  id: string
  title: string
  location: string
  country: string
  duration: string
  category: string
  adult_price: number
  child_price: number
  description?: string
  gallery?: string[]
}

interface PackagePricingTier {
  package_name: string
  description?: string
  min_group_size: number
  max_group_size: number | null
  adult_price: number
  child_price?: number
}

interface PricingUpdate {
  update_mode: 'simple' | 'multi_package'
  // Basic information
  description?: string
  // Simple mode fields
  adult_price?: number
  child_price?: number
  markup_type?: 'none' | 'percentage' | 'fixed'
  markup_value?: number
  input_currency?: 'USD' | 'SGD'
  sgd_to_usd_rate?: number
  // Multi-package mode fields
  package_tiers?: PackagePricingTier[]
}

export default function BulkPricingPage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [pricingUpdate, setPricingUpdate] = useState<PricingUpdate>({
    update_mode: 'simple',
    description: undefined,
    adult_price: undefined,
    child_price: undefined,
    markup_type: 'none',
    markup_value: 0,
    input_currency: 'USD',
    sgd_to_usd_rate: 1.3,
    package_tiers: []
  })

  useEffect(() => {
    loadExperiences()
  }, [])

  const loadExperiences = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/experiences")
      if (!response.ok) throw new Error("Failed to load experiences")
      const data = await response.json()
      setExperiences(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load experiences")
    } finally {
      setLoading(false)
    }
  }

  const filteredExperiences = experiences.filter(exp =>
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredExperiences.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredExperiences.map(exp => exp.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one experience")
      return
    }

    if (pricingUpdate.update_mode === 'simple') {
      if (!pricingUpdate.adult_price && !pricingUpdate.child_price) {
        toast.error("Please enter at least one price to update")
        return
      }
    } else {
      if (!pricingUpdate.package_tiers || pricingUpdate.package_tiers.length === 0) {
        toast.error("Please add at least one package tier")
        return
      }
    }

    setSaving(true)
    let successCount = 0
    let failCount = 0

    try {
      const conversionRate = pricingUpdate.input_currency === 'SGD' ? pricingUpdate.sgd_to_usd_rate || 1.3 : 1

      for (const expId of selectedIds) {
        try {
          if (pricingUpdate.update_mode === 'multi_package') {
            // Delete existing packages first
            const packagesResponse = await fetch(`/api/admin/packages?experience_id=${expId}`)
            if (packagesResponse.ok) {
              const existingPackages = await packagesResponse.json()
              for (const pkg of existingPackages) {
                await fetch(`/api/admin/packages/${pkg.id}`, { method: "DELETE" })
              }
            }

            // Create new packages based on tiers
            for (const tier of pricingUpdate.package_tiers!) {
              const adultPriceUSD = Math.round(tier.adult_price / conversionRate)
              const childPriceUSD = tier.child_price ? Math.round(tier.child_price / conversionRate) : 0

              const packagePayload = {
                experience_id: expId,
                package_name: tier.package_name,
                package_code: `PKG-${tier.min_group_size}`,
                description: tier.description || `Package for ${tier.min_group_size}${tier.max_group_size ? `-${tier.max_group_size}` : '+'} people`,
                tour_type: 'group',
                min_group_size: tier.min_group_size,
                max_group_size: tier.max_group_size,
                inclusions: [],
                exclusions: [],
                is_active: true,
                display_order: tier.min_group_size,
                available_from: null,
                available_to: null,
                markup_type: pricingUpdate.markup_type || 'none',
                markup_value: pricingUpdate.markup_value || 0,
                base_adult_price: adultPriceUSD,
                base_child_price: childPriceUSD,
                supplier_currency: 'USD',
                supplier_cost_adult: adultPriceUSD,
                supplier_cost_child: childPriceUSD,
                exchange_rate: 1.0,
                adult_price: adultPriceUSD,
                child_price: childPriceUSD,
                adult_min_age: 18,
                adult_max_age: null,
                child_min_age: 3,
                child_max_age: 17,
                requires_full_payment: false,
                addons: []
              }

              const response = await fetch("/api/admin/packages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packagePayload),
              })

              if (!response.ok) {
                failCount++
              } else {
                successCount++
              }
            }

            // Update experience base price to first tier's price
            const firstTierAdultPrice = pricingUpdate.package_tiers![0].adult_price / conversionRate
            const firstTierChildPrice = pricingUpdate.package_tiers![0].child_price ? pricingUpdate.package_tiers![0].child_price / conversionRate : 0

            // Get current experience data first
            const experience = experiences.find(e => e.id === expId)
            if (!experience) continue

            const experienceUpdatePayload: any = {
              title: experience.title,
              location: experience.location,
              country: experience.country,
              duration: experience.duration,
              category: experience.category,
              adult_price: Math.round(firstTierAdultPrice) || 0,
              child_price: Math.round(firstTierChildPrice) || 0,
            }

            if (pricingUpdate.description !== undefined && pricingUpdate.description !== null) {
              experienceUpdatePayload.description = pricingUpdate.description
            }

            console.log('Updating experience with payload:', experienceUpdatePayload)

            const expUpdateResponse = await fetch(`/api/admin/experiences/${experience.title.toLowerCase().replace(/\s+/g, '-')}/${expId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(experienceUpdatePayload)
            })

            if (!expUpdateResponse.ok) {
              const errorData = await expUpdateResponse.json().catch(() => ({}))
              console.error('Failed to update experience:', errorData)
              toast.error(`Failed to update experience: ${errorData.error || 'Unknown error'}`)
            }
          } else {
            // Simple mode - existing logic
            const adultPriceUSD = pricingUpdate.adult_price !== undefined ? Math.round(pricingUpdate.adult_price / conversionRate) : undefined
            const childPriceUSD = pricingUpdate.child_price !== undefined ? Math.round(pricingUpdate.child_price / conversionRate) : undefined

            // Get the experience's packages
            const packagesResponse = await fetch(`/api/admin/packages?experience_id=${expId}`)
            if (!packagesResponse.ok) {
              failCount++
              continue
            }

            const packages = await packagesResponse.json()

            // Update each package
            for (const pkg of packages) {
              const packagePayload: any = {}

              // Calculate selling prices based on markup
              if (adultPriceUSD !== undefined) {
                packagePayload.base_adult_price = adultPriceUSD
                packagePayload.supplier_cost_adult = adultPriceUSD

                let sellingPrice = adultPriceUSD
                if (pricingUpdate.markup_type === 'percentage' && pricingUpdate.markup_value) {
                  sellingPrice = adultPriceUSD * (1 + pricingUpdate.markup_value / 100)
                } else if (pricingUpdate.markup_type === 'fixed' && pricingUpdate.markup_value) {
                  sellingPrice = adultPriceUSD + pricingUpdate.markup_value
                }
                packagePayload.adult_price = sellingPrice
              }

              if (childPriceUSD !== undefined) {
                packagePayload.base_child_price = childPriceUSD
                packagePayload.supplier_cost_child = childPriceUSD

                let sellingPrice = childPriceUSD
                if (pricingUpdate.markup_type === 'percentage' && pricingUpdate.markup_value) {
                  sellingPrice = childPriceUSD * (1 + pricingUpdate.markup_value / 100)
                } else if (pricingUpdate.markup_type === 'fixed' && pricingUpdate.markup_value) {
                  sellingPrice = childPriceUSD + pricingUpdate.markup_value
                }
                packagePayload.child_price = sellingPrice
              }

              if (pricingUpdate.markup_type) {
                packagePayload.markup_type = pricingUpdate.markup_type
                packagePayload.markup_value = pricingUpdate.markup_value || 0
              }

              // Create pricing tiers array for the update
              const pricingTiers = []

              if (adultPriceUSD !== undefined) {
                const adultTier = pkg.pricing_tiers?.find((t: any) => t.tier_type === 'adult')
                pricingTiers.push({
                  tier_type: 'adult',
                  tier_label: adultTier?.tier_label || 'Adult (18+ years)',
                  min_age: adultTier?.min_age || 18,
                  max_age: adultTier?.max_age || null,
                  base_price: packagePayload.base_adult_price,
                  supplier_cost: packagePayload.supplier_cost_adult,
                  supplier_currency: 'USD',
                  exchange_rate: 1.0,
                  markup_type: pricingUpdate.markup_type,
                  markup_value: pricingUpdate.markup_value || 0,
                  selling_price: packagePayload.adult_price,
                  currency: 'USD',
                  is_active: true
                })
              }

              if (childPriceUSD !== undefined) {
                const childTier = pkg.pricing_tiers?.find((t: any) => t.tier_type === 'child')
                pricingTiers.push({
                  tier_type: 'child',
                  tier_label: childTier?.tier_label || 'Child (3-17 years)',
                  min_age: childTier?.min_age || 3,
                  max_age: childTier?.max_age || 17,
                  base_price: packagePayload.base_child_price,
                  supplier_cost: packagePayload.supplier_cost_child,
                  supplier_currency: 'USD',
                  exchange_rate: 1.0,
                  markup_type: pricingUpdate.markup_type,
                  markup_value: pricingUpdate.markup_value || 0,
                  selling_price: packagePayload.child_price,
                  currency: 'USD',
                  is_active: true
                })
              }

              packagePayload.pricing_tiers = pricingTiers

              // Update the package
              const updateResponse = await fetch(`/api/admin/packages/${pkg.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packagePayload)
              })

              if (!updateResponse.ok) {
                console.error(`Failed to update package ${pkg.id}`)
                failCount++
              } else {
                successCount++
              }
            }

            // Also update the experience base prices for backwards compatibility
            // Get current experience data first
            const experience = experiences.find(e => e.id === expId)
            if (!experience) continue

            const experienceUpdatePayload: any = {
              title: experience.title,
              location: experience.location,
              country: experience.country,
              duration: experience.duration,
              category: experience.category,
              adult_price: adultPriceUSD !== undefined ? Math.round(adultPriceUSD) : (experience.adult_price || 0),
              child_price: childPriceUSD !== undefined ? Math.round(childPriceUSD) : (experience.child_price || 0),
            }

            if (pricingUpdate.description !== undefined && pricingUpdate.description !== null) {
              experienceUpdatePayload.description = pricingUpdate.description
            }

            console.log('Updating experience with payload:', experienceUpdatePayload)

            const expUpdateResponse = await fetch(`/api/admin/experiences/${experience.title.toLowerCase().replace(/\s+/g, '-')}/${expId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(experienceUpdatePayload)
            })

            if (!expUpdateResponse.ok) {
              const errorData = await expUpdateResponse.json().catch(() => ({}))
              console.error('Failed to update experience:', errorData)
              toast.error(`Failed to update experience: ${errorData.error || 'Unknown error'}`)
            }
          }
        } catch (err) {
          console.error(`Failed to update experience ${expId}:`, err)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} package(s)`)
      }
      if (failCount > 0) {
        toast.error(`Failed to update ${failCount} package(s)`)
      }

      // Clear selection and reload
      setSelectedIds(new Set())
      await loadExperiences()

    } catch (err) {
      console.error("Bulk update failed:", err)
      toast.error("Failed to update pricing")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/experiences">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Bulk Pricing Update</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/experiences">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bulk Pricing Update</h1>
            <p className="text-muted-foreground">Update pricing for multiple experiences at once</p>
          </div>
        </div>
      </div>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
          <CardDescription>Set the new prices to apply to selected experiences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Update Mode Selection */}
          <div className="space-y-2">
            <Label htmlFor="update_mode">Update Mode</Label>
            <Select
              value={pricingUpdate.update_mode}
              onValueChange={(value) => setPricingUpdate({
                ...pricingUpdate,
                update_mode: value as 'simple' | 'multi_package'
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple - Update existing packages</SelectItem>
                <SelectItem value="multi_package">Multi-Package - Create packages by group size</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {pricingUpdate.update_mode === 'simple'
                ? 'Updates prices for existing packages in selected experiences'
                : 'Replaces all packages with new ones based on group size tiers (e.g., 2 pax @ $1000, 4 pax @ $800)'}
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(Optional)</span></Label>
            <RichTextEditor
              content={pricingUpdate.description || ""}
              onChange={(html) => {
                // Only update if there's actual content (not just empty HTML tags)
                const hasContent = html && html.trim() && html !== '<p></p>' && html !== '<p><br></p>';
                setPricingUpdate({
                  ...pricingUpdate,
                  description: hasContent ? html : undefined
                });
              }}
              placeholder="Leave empty to keep current description"
            />
            <p className="text-xs text-muted-foreground">
              If provided, this will update the description for all selected experiences
            </p>
          </div>

          {/* Currency Selection */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="input_currency">Input Currency</Label>
              <Select
                value={pricingUpdate.input_currency}
                onValueChange={(value) => setPricingUpdate({
                  ...pricingUpdate,
                  input_currency: value as 'USD' | 'SGD'
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD (United States Dollar)</SelectItem>
                  <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pricingUpdate.input_currency === 'SGD' && (
              <div className="space-y-2">
                <Label htmlFor="sgd_rate">SGD to USD Rate</Label>
                <Input
                  id="sgd_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricingUpdate.sgd_to_usd_rate || 1.3}
                  onChange={(e) => setPricingUpdate({
                    ...pricingUpdate,
                    sgd_to_usd_rate: e.target.value ? parseFloat(e.target.value) : 1.3
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  1 SGD = {(1 / (pricingUpdate.sgd_to_usd_rate || 1.3)).toFixed(2)} USD
                </p>
              </div>
            )}
          </div>

          {pricingUpdate.update_mode === 'simple' ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adult_price">Adult Price ({pricingUpdate.input_currency})</Label>
              <Input
                id="adult_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave empty to keep current price"
                value={pricingUpdate.adult_price || ''}
                onChange={(e) => setPricingUpdate({
                  ...pricingUpdate,
                  adult_price: e.target.value ? parseFloat(e.target.value) : undefined
                })}
              />
              {pricingUpdate.input_currency === 'SGD' && pricingUpdate.adult_price && (
                <p className="text-xs text-muted-foreground">
                  ≈ ${Math.round(pricingUpdate.adult_price / (pricingUpdate.sgd_to_usd_rate || 1.3))} USD
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="child_price">Child Price ({pricingUpdate.input_currency})</Label>
              <Input
                id="child_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave empty to keep current price"
                value={pricingUpdate.child_price || ''}
                onChange={(e) => setPricingUpdate({
                  ...pricingUpdate,
                  child_price: e.target.value ? parseFloat(e.target.value) : undefined
                })}
              />
              {pricingUpdate.input_currency === 'SGD' && pricingUpdate.child_price && (
                <p className="text-xs text-muted-foreground">
                  ≈ ${Math.round(pricingUpdate.child_price / (pricingUpdate.sgd_to_usd_rate || 1.3))} USD
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="markup_type">Markup Type</Label>
              <Select
                value={pricingUpdate.markup_type}
                onValueChange={(value) => setPricingUpdate({
                  ...pricingUpdate,
                  markup_type: value as 'none' | 'percentage' | 'fixed'
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Markup</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pricingUpdate.markup_type !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="markup_value">
                  Markup Value {pricingUpdate.markup_type === 'percentage' ? '(%)' : '(USD)'}
                </Label>
                <Input
                  id="markup_value"
                  type="number"
                  step={pricingUpdate.markup_type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  value={pricingUpdate.markup_value || ''}
                  onChange={(e) => setPricingUpdate({
                    ...pricingUpdate,
                    markup_value: e.target.value ? parseFloat(e.target.value) : 0
                  })}
                />
              </div>
            )}
          </div>

          {/* Price Preview for Simple Mode */}
          {(pricingUpdate.adult_price || pricingUpdate.child_price) && (() => {
            const conversionRate = pricingUpdate.input_currency === 'SGD' ? pricingUpdate.sgd_to_usd_rate || 1.3 : 1
            const adultPriceUSD = pricingUpdate.adult_price ? Math.round(pricingUpdate.adult_price / conversionRate) : 0
            const childPriceUSD = pricingUpdate.child_price ? Math.round(pricingUpdate.child_price / conversionRate) : 0

            return (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Price Preview (in USD):</p>
                {pricingUpdate.input_currency === 'SGD' && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Using conversion rate: 1 SGD = {(1 / conversionRate).toFixed(2)} USD
                  </p>
                )}
                <div className="space-y-1 text-sm">
                  {pricingUpdate.adult_price && (
                    <p>
                      Adult: ${adultPriceUSD} (Cost) → $
                      {pricingUpdate.markup_type === 'percentage'
                        ? Math.round(adultPriceUSD * (1 + (pricingUpdate.markup_value || 0) / 100))
                        : pricingUpdate.markup_type === 'fixed'
                        ? Math.round(adultPriceUSD + (pricingUpdate.markup_value || 0))
                        : adultPriceUSD
                      } (Selling)
                    </p>
                  )}
                  {pricingUpdate.child_price && (
                    <p>
                      Child: ${childPriceUSD} (Cost) → $
                      {pricingUpdate.markup_type === 'percentage'
                        ? Math.round(childPriceUSD * (1 + (pricingUpdate.markup_value || 0) / 100))
                        : pricingUpdate.markup_type === 'fixed'
                        ? Math.round(childPriceUSD + (pricingUpdate.markup_value || 0))
                        : childPriceUSD
                      } (Selling)
                    </p>
                  )}
                </div>
              </div>
            )
          })()}
            </>
          ) : (
            <>
              {/* Multi-Package Mode UI */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Package Tiers</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const newTiers = [...(pricingUpdate.package_tiers || [])]
                      newTiers.push({
                        package_name: `Group of ${newTiers.length + 2}`,
                        description: '',
                        min_group_size: newTiers.length + 2,
                        max_group_size: newTiers.length + 2,
                        adult_price: 0,
                        child_price: 0
                      })
                      setPricingUpdate({ ...pricingUpdate, package_tiers: newTiers })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tier
                  </Button>
                </div>

                {pricingUpdate.package_tiers && pricingUpdate.package_tiers.length > 0 ? (
                  <div className="space-y-4">
                    {pricingUpdate.package_tiers.map((tier, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Package Name</Label>
                                  <Input
                                    value={tier.package_name}
                                    onChange={(e) => {
                                      const newTiers = [...pricingUpdate.package_tiers!]
                                      newTiers[index].package_name = e.target.value
                                      setPricingUpdate({ ...pricingUpdate, package_tiers: newTiers })
                                    }}
                                    placeholder="e.g., Group of 2"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Group Size</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={tier.min_group_size}
                                      onChange={(e) => {
                                        const newTiers = [...pricingUpdate.package_tiers!]
                                        newTiers[index].min_group_size = parseInt(e.target.value) || 1
                                        setPricingUpdate({ ...pricingUpdate, package_tiers: newTiers })
                                      }}
                                      placeholder="Min"
                                    />
                                    <span className="self-center">to</span>
                                    <Input
                                      type="number"
                                      min={tier.min_group_size}
                                      value={tier.max_group_size || ''}
                                      onChange={(e) => {
                                        const newTiers = [...pricingUpdate.package_tiers!]
                                        newTiers[index].max_group_size = e.target.value ? parseInt(e.target.value) : null
                                        setPricingUpdate({ ...pricingUpdate, package_tiers: newTiers })
                                      }}
                                      placeholder="Max (optional)"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Description <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                                <Textarea
                                  value={tier.description || ''}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    const newTiers = [...pricingUpdate.package_tiers!]
                                    newTiers[index].description = e.target.value
                                    setPricingUpdate({ ...pricingUpdate, package_tiers: newTiers })
                                  }}
                                  placeholder="Package description"
                                  rows={2}
                                />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Adult Price ({pricingUpdate.input_currency})</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={tier.adult_price || ''}
                                    onChange={(e) => {
                                      const newTiers = [...pricingUpdate.package_tiers!]
                                      newTiers[index].adult_price = parseFloat(e.target.value) || 0
                                      setPricingUpdate({ ...pricingUpdate, package_tiers: newTiers })
                                    }}
                                    placeholder="Per person"
                                  />
                                  {pricingUpdate.input_currency === 'SGD' && tier.adult_price > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      ≈ ${Math.round(tier.adult_price / (pricingUpdate.sgd_to_usd_rate || 1.3))} USD
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>Child Price ({pricingUpdate.input_currency}) <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={tier.child_price || ''}
                                    onChange={(e) => {
                                      const newTiers = [...pricingUpdate.package_tiers!]
                                      newTiers[index].child_price = e.target.value ? parseFloat(e.target.value) : undefined
                                      setPricingUpdate({ ...pricingUpdate, package_tiers: newTiers })
                                    }}
                                    placeholder="Per person"
                                  />
                                  {pricingUpdate.input_currency === 'SGD' && tier.child_price && tier.child_price > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      ≈ ${Math.round(tier.child_price / (pricingUpdate.sgd_to_usd_rate || 1.3))} USD
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newTiers = pricingUpdate.package_tiers!.filter((_, i) => i !== index)
                                setPricingUpdate({ ...pricingUpdate, package_tiers: newTiers })
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No package tiers added. Click "Add Tier" to create pricing for different group sizes.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Experience Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Experiences</CardTitle>
              <CardDescription>
                {selectedIds.size > 0
                  ? `${selectedIds.size} experience(s) selected`
                  : "No experiences selected"}
              </CardDescription>
            </div>
            <Button
              onClick={handleBulkUpdate}
              disabled={saving || selectedIds.size === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Selected
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Experiences</Label>
            <Input
              id="search"
              placeholder="Search by title, location, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 py-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectedIds.size === filteredExperiences.length && filteredExperiences.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select All ({filteredExperiences.length})
            </label>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredExperiences.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={exp.id}
                  checked={selectedIds.has(exp.id)}
                  onCheckedChange={() => toggleSelect(exp.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{exp.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {exp.location}, {exp.country}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: Adult ${(exp.adult_price || 0).toFixed(2)} / Child ${(exp.child_price || 0).toFixed(2)}
                  </p>
                </div>
                {exp.gallery && exp.gallery.length > 0 && (
                  <div className="relative w-16 h-16 rounded overflow-hidden">
                    <img
                      src={exp.gallery[0]}
                      alt={exp.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredExperiences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No experiences found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
