"use client"

import React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { ArrowLeft, Upload, Plus, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"
import { toast } from "sonner"

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"]

interface ItineraryItem {
  time: string
  activity: string
}

interface FAQItem {
  question: string
  answer: string
}

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
  exclusions: string
  not_suitable_for: string
  meeting_point: string
  what_to_bring: string
  gallery: string
  cancellation_policy: string
}

const categories = ["Adventure", "Culture", "Relaxation", "Wellness", "Nature"]

export default function EditExperiencePage({ params }: { params: Promise<{ slug: string; id: string }> }) {

  const router = useRouter()
  const [experience, setExperience] = useState<ExperienceRow | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([{ time: "", activity: "" }])
  const [faqs, setFaqs] = useState<FAQItem[]>([{ question: "", answer: "" }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { slug, id } = React.use(params) 

  useEffect(() => {
    let isMounted = true

    const loadExperience = async () => {
      setLoading(true)
      setError(null)
      try {
        
        const response = await fetch(`/api/admin/experiences/${slug}/${id}`)
        const payload = (await response.json().catch(() => null)) as ExperienceRow | { error?: string } | null
        if (!response.ok) {
          throw new Error((payload as { error?: string } | null)?.error ?? "Experience not found.")
        }
        const data = payload as ExperienceRow
        if (!isMounted) return
        if (!data) {
          setError("Experience not found.")
          setExperience(null)
          setForm(null)
          return
        }

        const experienceData = data as ExperienceRow
        setExperience(experienceData)
        setForm({
          title: experienceData.title,
          location: experienceData.location,
          country: experienceData.country,
          description: experienceData.description ?? "",
          duration: experienceData.duration,
          price: experienceData.price.toString(),
          category: experienceData.category,
          image_url: experienceData.image_url ?? "",
          highlights: (experienceData.highlights ?? []).join("\n"),
          inclusions: (experienceData.inclusions ?? []).join("\n"),
          exclusions: (experienceData.exclusions ?? []).join("\n"),
          not_suitable_for: (experienceData.not_suitable_for ?? []).join("\n"),
          meeting_point: experienceData.meeting_point ?? "",
          what_to_bring: (experienceData.what_to_bring ?? []).join("\n"),
          gallery: (experienceData.gallery ?? []).join("\n"),
          cancellation_policy: experienceData.cancellation_policy ?? "",
        })

        // Load itinerary if exists
        if (experienceData.itinerary && Array.isArray(experienceData.itinerary)) {
          const itineraryData = experienceData.itinerary as unknown as ItineraryItem[]
          setItinerary(itineraryData.length > 0 ? itineraryData : [{ time: "", activity: "" }])
        }

        // Load FAQs if exists
        if (experienceData.faqs && Array.isArray(experienceData.faqs)) {
          const faqsData = experienceData.faqs as unknown as FAQItem[]
          setFaqs(faqsData.length > 0 ? faqsData : [{ question: "", answer: "" }])
        }
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
  }, [params])

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleSelectChange = (field: keyof FormState) => (value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const addItineraryItem = () => {
    setItinerary([...itinerary, { time: "", activity: "" }])
  }

  const removeItineraryItem = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index))
  }

  const updateItineraryItem = (index: number, field: keyof ItineraryItem, value: string) => {
    const updated = [...itinerary]
    updated[index][field] = value
    setItinerary(updated)
  }

  const addFAQItem = () => {
    setFaqs([...faqs, { question: "", answer: "" }])
  }

  const removeFAQItem = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index))
  }

  const updateFAQItem = (index: number, field: keyof FAQItem, value: string) => {
    const updated = [...faqs]
    updated[index][field] = value
    setFaqs(updated)
  }

  const highlightsList = useMemo(() => form?.highlights.split("\n").filter(Boolean) ?? [], [form])
  const inclusionsList = useMemo(() => form?.inclusions.split("\n").filter(Boolean) ?? [], [form])
  const exclusionsList = useMemo(() => form?.exclusions.split("\n").filter(Boolean) ?? [], [form])
  const notSuitableForList = useMemo(() => form?.not_suitable_for.split("\n").filter(Boolean) ?? [], [form])
  const whatToBringList = useMemo(() => form?.what_to_bring.split("\n").filter(Boolean) ?? [], [form])
  const galleryList = useMemo(() => form?.gallery.split("\n").filter(Boolean) ?? [], [form])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || !experience) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
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
        exclusions: exclusionsList,
        not_suitable_for: notSuitableForList,
        meeting_point: form.meeting_point,
        what_to_bring: whatToBringList,
        gallery: galleryList,
        cancellation_policy: form.cancellation_policy,
        itinerary:
          itinerary.filter((item) => item.time && item.activity).length > 0
            ? itinerary.filter((item) => item.time && item.activity)
            : null,
        faqs:
          faqs.filter((item) => item.question && item.answer).length > 0 ? faqs.filter((item) => item.question && item.answer) : null,
      }

      const response = await fetch(`/api/admin/experiences/${experience.slug}/${experience.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save changes. Please try again.")
      }

      toast.success("Experience updated successfully")
      router.push("/admin/experiences")
    } catch (err) {
      console.error("Failed to update experience", err)
      const errorMessage = (err as any)?.message || "Unable to save changes. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
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
            <CardTitle>Gallery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gallery">Gallery URLs (one per line)</Label>
              <Textarea
                id="gallery"
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                rows={4}
                value={form.gallery}
                onChange={handleChange("gallery")}
              />
              <p className="text-xs text-muted-foreground">Enter multiple image URLs, one per line</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Highlights & Inclusions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="highlights">Highlights (one per line)</Label>
              <Textarea
                id="highlights"
                placeholder="Trek to the summit of an active volcano&#10;Witness spectacular sunrise views"
                value={form.highlights}
                onChange={handleChange("highlights")}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inclusions">Inclusions (one per line)</Label>
              <Textarea
                id="inclusions"
                placeholder="Hotel pickup&#10;Professional guide&#10;Breakfast"
                value={form.inclusions}
                onChange={handleChange("inclusions")}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exclusions">Exclusions (one per line)</Label>
              <Textarea
                id="exclusions"
                placeholder="Personal expenses&#10;Travel insurance&#10;Gratuities"
                value={form.exclusions}
                onChange={handleChange("exclusions")}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Itinerary</CardTitle>
              <Button type="button" size="sm" onClick={addItineraryItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {itinerary.map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`time-${index}`}>Time</Label>
                    <Input
                      id={`time-${index}`}
                      placeholder="e.g., 02:00 AM"
                      value={item.time}
                      onChange={(e) => updateItineraryItem(index, "time", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`activity-${index}`}>Activity</Label>
                    <Input
                      id={`activity-${index}`}
                      placeholder="e.g., Hotel pickup"
                      value={item.activity}
                      onChange={(e) => updateItineraryItem(index, "activity", e.target.value)}
                    />
                  </div>
                </div>
                {itinerary.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItineraryItem(index)}
                    className="mt-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="what_to_bring">What to Bring (one per line)</Label>
              <Textarea
                id="what_to_bring"
                placeholder="Hiking shoes&#10;Warm jacket&#10;Camera&#10;Water bottle"
                value={form.what_to_bring}
                onChange={handleChange("what_to_bring")}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="not_suitable_for">Not Suitable For (one per line)</Label>
              <Textarea
                id="not_suitable_for"
                placeholder="Pregnant women&#10;People with mobility issues&#10;Children under 5"
                value={form.not_suitable_for}
                onChange={handleChange("not_suitable_for")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_point">Meeting Point</Label>
              <Input
                id="meeting_point"
                placeholder="e.g., Hotel lobby or specific address"
                value={form.meeting_point}
                onChange={handleChange("meeting_point")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation">Cancellation Policy</Label>
              <Input
                id="cancellation"
                placeholder="e.g., Free cancellation up to 24 hours before"
                value={form.cancellation_policy}
                onChange={handleChange("cancellation_policy")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>FAQs</CardTitle>
              <Button type="button" size="sm" onClick={addFAQItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((item, index) => (
              <div key={index} className="space-y-4 pb-4 border-b last:border-0">
                <div className="flex justify-between items-start">
                  <Label htmlFor={`faq-question-${index}`}>FAQ #{index + 1}</Label>
                  {faqs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFAQItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-question-${index}`}>Question</Label>
                  <Input
                    id={`faq-question-${index}`}
                    placeholder="e.g., What is the difficulty level of this trek?"
                    value={item.question}
                    onChange={(e) => updateFAQItem(index, "question", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-answer-${index}`}>Answer</Label>
                  <Textarea
                    id={`faq-answer-${index}`}
                    placeholder="Provide a detailed answer..."
                    rows={3}
                    value={item.answer}
                    onChange={(e) => updateFAQItem(index, "answer", e.target.value)}
                  />
                </div>
              </div>
            ))}
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
