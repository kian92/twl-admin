"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { ArrowLeft, Plus, X, Upload } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/database"
import { toast } from "sonner"

type ExperienceInsert = Omit<Database["public"]["Tables"]["experiences"]["Insert"], "slug"> & {
  slug?: string
}

interface ItineraryItem {
  day: number
  time: string
  activity: string
}

interface FAQItem {
  question: string
  answer: string
}

const initialForm: ExperienceInsert = {
  slug: "", 
  title: "",
  location: "",
  country: "Indonesia",
  duration: "",
  price: 0,
  category: "Adventure",
  description: "",
  // image_url: "",
  highlights: [],
  inclusions: [],
  exclusions: [],
  not_suitable_for: [],
  meeting_point: "",
  what_to_bring: [],
  cancellation_policy: "",
  itinerary: null,
  gallery: [],
  faqs: null,
}

const categories = ["Adventure", "Culture", "Relaxation", "Wellness", "Nature"]

export default function NewExperiencePage() {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [highlightsText, setHighlightsText] = useState("")
  const [inclusionsText, setInclusionsText] = useState("")
  const [exclusionsText, setExclusionsText] = useState("")
  const [notSuitableForText, setNotSuitableForText] = useState("")
  const [whatToBringText, setWhatToBringText] = useState("")
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [faqs, setFaqs] = useState<FAQItem[]>([{ question: "", answer: "" }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof ExperienceInsert) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "price" ? Number.parseFloat(event.target.value) : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSelectChange = (field: keyof ExperienceInsert) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addItineraryItem = () => {
    setItinerary([...itinerary, { day: 1, time: "", activity: "" }])
  }

  const removeItineraryItem = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index))
  }

  const updateItineraryItem = <K extends keyof ItineraryItem>(
    index: number,
    field: K,
    value: ItineraryItem[K]
  ) => {
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

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
  
    const newFiles = Array.from(files);
    
    setGalleryFiles(prev => [...prev, ...newFiles]);
    setGalleryPreviewUrls(prev => [
      ...prev,
      ...newFiles.map(file => URL.createObjectURL(file))
    ]);
  };

  const removeImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted - handleSubmit called")
    setLoading(true)
    setError(null)

    try {
      //  Upload images here
      const uploadedUrls: string[] = [];
      for (const file of galleryFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/bunny/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }

      const payload: ExperienceInsert = {
        ...form,
        price: Number.isFinite(form.price) ? form.price : 0,
        highlights: highlightsText.split("\n").filter(Boolean),
        inclusions: inclusionsText.split("\n").filter(Boolean),
        exclusions: exclusionsText.split("\n").filter(Boolean),
        not_suitable_for: notSuitableForText.split("\n").filter(Boolean),
        what_to_bring: whatToBringText.split("\n").filter(Boolean),
        gallery: uploadedUrls,

        itinerary: itinerary.filter(item => item.day && item.time && item.activity).length > 0
          ? (itinerary.filter(item => item.day && item.time && item.activity) as any)
          : null,
        faqs: faqs.filter(item => item.question && item.answer).length > 0
          ? (faqs.filter(item => item.question && item.answer) as any)
          : null,
      }

      const response = await fetch("/api/admin/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => ({}))) as { error?: string; id?: string }
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create experience. Please try again.")
      }

      toast.success("Experience created")
      router.push("/admin/experiences")
    } catch (err: any) {
      console.error("Failed to create experience - Full error:", err)
      const errorMessage = err?.message || err?.toString() || "Unable to create experience. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
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
        {/* Basic Information */}
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
                <CountryCombobox
                  value={form.country ?? ""}
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

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">

              {/* Section Header */}
              <div>
                <Label>Upload Images</Label>
                <p className="text-sm text-muted-foreground">
                  Add multiple images for the gallery
                </p>
              </div>

              {/* Thumbnails (only if images exist) */}
              {galleryPreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryPreviewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg overflow-hidden border group"
                    >
                      <img
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="object-cover w-full h-full"
                      />

                      {/* Labels */}
                      {index === 0 ? (
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      ) : (
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          Image {index + 1}
                        </div>
                      )}

                      <Button
                        type="button"
                        size="icon"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2
                        bg-red-500 text-white 
                        w-8 h-8 rounded flex items-center justify-center
                        hover:bg-red-500
                        opacity-0 group-hover:opacity-100 
                        transition-opacity duration-200"
                      >
                        <X className="w-6 h-6" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Box */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB (multiple files allowed)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectFiles}
                />
              </div>

              {/* No images message */}
              {galleryPreviewUrls.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No images uploaded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Highlights & Inclusions */}
        <Card>
          <CardHeader>
            <CardTitle>Highlights & Inclusions</CardTitle>
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
              <Label htmlFor="exclusions">Exclusions (one per line)</Label>
              <Textarea
                id="exclusions"
                placeholder="Personal expenses&#10;Travel insurance&#10;Gratuities"
                rows={3}
                value={exclusionsText}
                onChange={(event) => setExclusionsText(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Itinerary */}
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
            { 
              itinerary.length === 0 ? 
                (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-sm text-muted-foreground text-center">
                      No itinerary items yet. Click "Add Item" to create one.
                    </p>
                  </div>
                )
              :
                itinerary.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1 grid gap-4 md:grid-cols-3">
                      {/* Day Field */}
                      <div className="space-y-2">
                        <Label htmlFor={`day-${index}`}>Day</Label>
                        <Input
                          id={`day-${index}`}
                          type="number"
                          min={1}
                          value={item.day.toString()} // Convert number -> string
                          onChange={(e) =>
                            updateItineraryItem(index, "day", Number(e.target.value))
                          }
                        />
                      </div>
                      {/* Time Field */}
                      <div className="space-y-2">
                        <Label htmlFor={`time-${index}`}>Time</Label>
                        <Input
                          id={`time-${index}`}
                          placeholder="e.g., 02:00 AM"
                          value={item.time}
                          onChange={(e) => updateItineraryItem(index, "time", e.target.value)}
                        />
                      </div>
                      {/* Activity Field */}
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItineraryItem(index)}
                      className="mt-5"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
            }
          </CardContent>
        </Card>

        {/* Additional Details */}
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
                rows={4}
                value={whatToBringText}
                onChange={(event) => setWhatToBringText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="not_suitable_for">Not Suitable For (one per line)</Label>
              <Textarea
                id="not_suitable_for"
                placeholder="Pregnant women&#10;People with mobility issues&#10;Children under 5"
                rows={3}
                value={notSuitableForText}
                onChange={(event) => setNotSuitableForText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_point">Meeting Point</Label>
              <Input
                id="meeting_point"
                placeholder="e.g., Hotel lobby or specific address"
                value={form.meeting_point ?? ""}
                onChange={handleInputChange("meeting_point")}
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

        {/* FAQs */}
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
