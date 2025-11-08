"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { createExperience } from "@/lib/supabase/admin-data"
import type { Database } from "@/types/database"
import { toast } from "sonner"

type ExperienceInsert = Database["public"]["Tables"]["experiences"]["Insert"]

const initialForm: ExperienceInsert = {
  title: "",
  location: "",
  country: "Indonesia",
  duration: "",
  price: 0,
  category: "Adventure",
  description: "",
  image_url: "",
  highlights: [],
  inclusions: [],
  cancellation_policy: "",
}

const countries = ["Indonesia", "Thailand", "Japan", "Greece"]
const categories = ["Adventure", "Culture", "Relaxation", "Wellness", "Nature"]

export default function NewExperiencePage() {
  const router = useRouter()
  const { supabase } = useAdmin()
  const [form, setForm] = useState(initialForm)
  const [highlightsText, setHighlightsText] = useState("")
  const [inclusionsText, setInclusionsText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof ExperienceInsert) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "price" ? Number.parseFloat(event.target.value) : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSelectChange = (field: keyof ExperienceInsert) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: ExperienceInsert = {
        ...form,
        price: Number.isFinite(form.price) ? form.price : 0,
        highlights: highlightsText.split("\n").filter(Boolean),
        inclusions: inclusionsText.split("\n").filter(Boolean),
      }

      await createExperience(supabase, payload)
      toast.success("Experience created")
      router.push("/admin/experiences")
    } catch (err) {
      console.error("Failed to create experience", err)
      setError("Unable to create experience. Please try again.")
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Add New Experience</h1>
          <p className="text-muted-foreground">Create a new travel experience or package</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Experience Title</Label>
              <Input
                id="title"
                placeholder="e.g., Sunrise at Mount Batur"
                value={form.title}
                onChange={handleInputChange("title")}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Bali, Indonesia"
                  value={form.location}
                  onChange={handleInputChange("location")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={form.country ?? ""} onValueChange={handleSelectChange("country")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the experience..."
                rows={4}
                value={form.description ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category ?? ""} onValueChange={handleSelectChange("category")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <Input
                  id="duration"
                  placeholder="e.g., 8h"
                  value={form.duration}
                  onChange={handleInputChange("duration")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="85"
                  value={Number.isFinite(form.price) ? form.price : ""}
                  onChange={handleInputChange("price")}
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                placeholder="https://..."
                value={form.image_url ?? ""}
                onChange={handleInputChange("image_url")}
              />
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Image uploads coming soon</p>
              <p className="text-xs text-muted-foreground">Provide a public image URL for now.</p>
              <Input type="file" className="hidden" accept="image/*" />
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
              <Textarea
                id="highlights"
                placeholder="Trek to the summit of an active volcano&#10;Witness spectacular sunrise views&#10;Enjoy breakfast cooked by volcanic steam"
                rows={4}
                value={highlightsText}
                onChange={(event) => setHighlightsText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inclusions">Inclusions (one per line)</Label>
              <Textarea
                id="inclusions"
                placeholder="Hotel pickup&#10;Professional guide&#10;Breakfast&#10;Trekking equipment"
                rows={4}
                value={inclusionsText}
                onChange={(event) => setInclusionsText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation">Cancellation Policy</Label>
              <Input
                id="cancellation"
                placeholder="e.g., Free cancellation up to 24 hours before"
                value={form.cancellation_policy ?? ""}
                onChange={handleInputChange("cancellation_policy")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Experience"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/experiences">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
