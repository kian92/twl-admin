"use client"

import React, { useRef } from "react"
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
  day: number
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
  // image_url: string
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
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])

  const [faqs, setFaqs] = useState<FAQItem[]>([{ question: "", answer: "" }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { slug, id } = React.use(params) 

  // Gallery
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [existingGallery, setExistingGallery] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)


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
          // image_url: experienceData.image_url ?? "",
          highlights: (experienceData.highlights ?? []).join("\n"),
          inclusions: (experienceData.inclusions ?? []).join("\n"),
          exclusions: (experienceData.exclusions ?? []).join("\n"),
          not_suitable_for: (experienceData.not_suitable_for ?? []).join("\n"),
          meeting_point: experienceData.meeting_point ?? "",
          what_to_bring: (experienceData.what_to_bring ?? []).join("\n"),
          gallery: (experienceData.gallery ?? []).join("\n"),
          cancellation_policy: experienceData.cancellation_policy ?? "",
        })

        // Load gallery (FULL URLs)
        if (Array.isArray(data.gallery)) {
          setGalleryPreviewUrls(data.gallery)
          setExistingGallery(data.gallery) // Full URLs
        }


        // Load itinerary if exists
        if (experienceData.itinerary && Array.isArray(experienceData.itinerary)) {
          const itineraryData = experienceData.itinerary as unknown as ItineraryItem[]
          setItinerary(itineraryData.length > 0 ? itineraryData : [{ day: 1, time: "", activity: "" }])
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
  
    const acceptedTypes = ["image/jpeg", "image/png"];
    const maxSize = 10 * 1024 * 1024; // 10MB
  
    const validFiles: File[] = [];
  
    for (const file of files) {
      // Prevent duplicate filenames (same name + same size)
      const alreadyExists =
        galleryFiles.some(
          (f) => f.name === file.name && f.size === file.size
        );
  
      if (alreadyExists) {
        toast.error(`"${file.name}" is already added.`);
        continue;
      }
  
      // Type validation
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`"${file.name}" is not a valid image. Only PNG & JPG allowed.`);
        continue;
      }
  
      //  Size validation
      if (file.size > maxSize) {
        toast.error(`"${file.name}" is too large. Max allowed size is 10MB.`);
        continue;
      }
  
      validFiles.push(file);
    }
  
    if (validFiles.length > 0) {
      setGalleryFiles((prev) => [...prev, ...validFiles]);
      setGalleryPreviewUrls((prev) => [
        ...prev,
        ...validFiles.map((file) => URL.createObjectURL(file)),
      ]);
    }
  
    // Reset input so choosing same file AGAIN works
    event.target.value = "";
  };
  // const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files
  //   if (!files) return

  //   const newFiles = Array.from(files)
  //   const newUrls = newFiles.map((file) => URL.createObjectURL(file))

  //   setGalleryFiles((prev) => [...prev, ...newFiles])
  //   setGalleryPreviewUrls((prev) => [...prev, ...newUrls])
  // }

  // Remove image
  const removeImage = async (index: number) => {
    const url = galleryPreviewUrls[index];
  
    // If it's an existing Bunny file, delete it
    if (!url.startsWith("blob:")) {
  
      // DELETE from Bunny
      try {
        await fetch("/api/admin/bunny/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      } catch (err) {
        console.error("Failed to delete image from Bunny:", err);
      }
  
      // Remove from existing gallery
      setExistingGallery(prev => prev.filter(item => item !== url));
    } else {
      // It's a new blob: image → remove from new file list
      setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    }
  
    // Remove preview entry
    setGalleryPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  
  

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
      // Upload new images
      const uploadedUrls: string[] = []

      for (const file of galleryFiles) {
        const fd = new FormData()
        fd.append("file", file)

        const res = await fetch("/api/admin/bunny/upload-image", {
          method: "POST",
          body: fd,
        })

        const data = await res.json()
        if (data.url) uploadedUrls.push(data.url) // full URL
      }

      // Combine full URLs
      const updatedGallery = [...existingGallery, ...uploadedUrls]


      // Step 2: Prepare payload with uploaded gallery filenames
      const payload = {
        title: form.title,
        location: form.location,
        country: form.country,
        description: form.description,
        duration: form.duration,
        price: Number.parseFloat(form.price),
        category: form.category,
        // image_url: form.image_url,
        highlights: highlightsList,
        inclusions: inclusionsList,
        exclusions: exclusionsList,
        not_suitable_for: notSuitableForList,
        meeting_point: form.meeting_point,
        what_to_bring: whatToBringList,
        gallery: updatedGallery,
        cancellation_policy: form.cancellation_policy,
        itinerary:
          itinerary.filter((item) => item.day && item.time && item.activity).length > 0
            ? itinerary.filter((item) => item.day && item.time && item.activity)
            : null,
        faqs:
          faqs.filter((item) => item.question && item.answer).length > 0 ? faqs.filter((item) => item.question && item.answer) : null,
      }

     // Step 3: Update experience
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

        {/* Gallery Section */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Upload Images</Label>
                <p className="text-sm text-muted-foreground">Add multiple images for the gallery</p>
              </div>

              {/* Thumbnails */}
              {galleryPreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border group">
                      <img src={url} alt={`Image ${index + 1}`} className="object-cover w-full h-full" />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index === 0 ? "Main" : `Image ${index + 1}`}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                <p className="text-sm text-muted-foreground mb-2">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB (multiple files allowed)</p>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleSelectFiles} />
              </div>

              {/* No images message */}
              {galleryPreviewUrls.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No images uploaded yet</p>
              )}
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
                        value={item.day}
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
