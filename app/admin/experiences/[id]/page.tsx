"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getExperienceById } from "@/lib/data/experiences"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function EditExperiencePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const experience = getExperienceById(params.id)

  if (!experience) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Experience not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/experiences">Back to Experiences</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setLoading(false)
    router.push("/admin/experiences")
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
              <Input id="title" defaultValue={experience.title} required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" defaultValue={experience.location} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select defaultValue={experience.country}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indonesia">Indonesia</SelectItem>
                    <SelectItem value="Thailand">Thailand</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                    <SelectItem value="Greece">Greece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" defaultValue={experience.description} rows={4} required />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select defaultValue={experience.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adventure">Adventure</SelectItem>
                    <SelectItem value="Culture">Culture</SelectItem>
                    <SelectItem value="Relaxation">Relaxation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" defaultValue={experience.duration} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" type="number" defaultValue={experience.price} required />
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
              <Image
                src={experience.image || "/placeholder.svg"}
                alt={experience.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Click to upload new image</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
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
              <Textarea id="highlights" defaultValue={experience.highlights.join("\n")} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inclusions">Inclusions (one per line)</Label>
              <Textarea id="inclusions" defaultValue={experience.inclusions.join("\n")} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation">Cancellation Policy</Label>
              <Input id="cancellation" defaultValue={experience.cancellationPolicy} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/experiences">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
