"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { getExperienceById, updateExperience } from "@/lib/supabase/admin-data"
import type { Database } from "@/types/database"
import { toast } from "sonner"

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"]

interface FormState {
  title: string
  location: string
  country: string
  description: string
  duration: string
  price: string
  category: string
  image_url: string
  highlights: string
  inclusions: string
  cancellation_policy: string
}

const categories = ["Adventure", "Culture", "Relaxation", "Wellness", "Nature"]

export default function EditExperiencePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { supabase } = useAdmin()
  const [experience, setExperience] = useState<ExperienceRow | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadExperience = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getExperienceById(supabase, params.id)
        if (!isMounted) return
        if (!data) {
          setError("Experience not found.")
          setExperience(null)
          setForm(null)
          return
        }
        setExperience(data as ExperienceRow)
        setForm({
          title: data.title,
          location: data.location,
          country: data.country,
          description: data.description ?? "",
          duration: data.duration,
          price: data.price.toString(),
          category: data.category,
          image_url: data.image_url ?? "",
          highlights: (data.highlights ?? []).join("\n"),
          inclusions: (data.inclusions ?? []).join("\n"),
          cancellation_policy: data.cancellation_policy ?? "",
        })
      } catch (err) {
        console.error("Failed to load experience", err)
        if (!isMounted) return
        setError("Unable to load experience. Please try again.")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadExperience()

    return () => {
      isMounted = false
    }
  }, [supabase, params.id])

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleSelectChange = (field: keyof FormState) => (value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const highlightsList = useMemo(() => form?.highlights.split("\n").filter(Boolean) ?? [], [form])
  const inclusionsList = useMemo(() => form?.inclusions.split("\n").filter(Boolean) ?? [], [form])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || !experience) return
    setSaving(true)
    setError(null)
    try {
      await updateExperience(supabase, experience.id, {
        title: form.title,
        location: form.location,
        country: form.country,
        description: form.description,
        duration: form.duration,
        price: Number.parseFloat(form.price),
        category: form.category,
        image_url: form.image_url,
        highlights: highlightsList,
        inclusions: inclusionsList,
        cancellation_policy: form.cancellation_policy,
      })
      toast.success("Experience updated successfully")
      router.push("/admin/experiences")
    } catch (err) {
      console.error("Failed to update experience", err)
      setError("Unable to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/experiences">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-center text-red-700">{error}</CardContent>
        </Card>
      </div>
    )
  }

  if (!experience || !form) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/experiences">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">Experience not found.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/experiences">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Experience</h1>
          <p className="text-muted-foreground">Update experience details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Experience Title</Label>
              <Input id="title" value={form.title} onChange={handleChange("title")} required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={handleChange("location")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <CountryCombobox
                  value={form.country}
                  onValueChange={handleSelectChange("country")}
                  placeholder="Select country"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={handleChange("description")}
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={handleSelectChange("category")} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" value={form.duration} onChange={handleChange("duration")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" type="number" value={form.price} onChange={handleChange("price")} min="0" step="1" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image src={form.image_url || "/placeholder.svg"} alt={form.title} fill className="object-cover" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                placeholder="https://..."
                value={form.image_url}
                onChange={handleChange("image_url")}
              />
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Image uploads coming soon</p>
              <p className="text-xs text-muted-foreground">Use the image URL field above to update imagery.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="highlights">Highlights (one per line)</Label>
              <Textarea id="highlights" value={form.highlights} onChange={handleChange("highlights")} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inclusions">Inclusions (one per line)</Label>
              <Textarea id="inclusions" value={form.inclusions} onChange={handleChange("inclusions")} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation">Cancellation Policy</Label>
              <Input
                id="cancellation"
                value={form.cancellation_policy}
                onChange={handleChange("cancellation_policy")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/experiences">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
