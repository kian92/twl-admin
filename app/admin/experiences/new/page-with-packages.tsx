"use client"

/**
 * Enhanced New Experience Page with Package Management
 *
 * This is an enhanced version of the experience creation form that includes
 * the new package-based pricing system. To use this:
 *
 * 1. Rename your current `page.tsx` to `page-old.tsx`
 * 2. Rename this file from `page-with-packages.tsx` to `page.tsx`
 * 3. Apply the database migration first: supabase db push
 */

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
import { PackageFormSection, PackageFormData } from "@/components/admin/PackageFormSection"

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
  adult_price: 0,
  child_price: 0,
  // Age(child and adult)
  adult_min_age: 18,
  adult_max_age: null,
  child_min_age: 3,
  child_max_age: 17,
  category: "Adventure",
  description: "",
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
  available_from: null,
  available_to: null,
  min_group_size: 1,
  max_group_size: 15,
}

const categories = ["Adventure", "Culture", "Relaxation", "Wellness", "Nature"]

export default function NewExperiencePageWithPackages() {
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

  // New: Package management state
  const [packages, setPackages] = useState<PackageFormData[]>([
    {
      package_name: 'Standard Package',
      package_code: 'STD',
      description: 'Our standard package with essential inclusions',
      min_group_size: 1,
      max_group_size: 15,
      available_from: '',
      available_to: '',
      inclusions: [],
      exclusions: [],
      display_order: 0,
      is_active: true,
      adult_price: 0,
      child_price: 0,
      // Age(child and adult)
      adult_min_age: 18,
      adult_max_age: null,
      child_min_age: 3,
      child_max_age: 17,
    }
  ]);

  const handleInputChange = (field: keyof ExperienceInsert) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericField =
      field === "price" || field === "adult_price" || field === "child_price" || field === "min_group_size" || field === "max_group_size" || field === "adult_min_age" || field === "adult_max_age" || field === "child_min_age" || field === "child_max_age";
    const value = numericField ? Number.parseFloat(event.target.value) : event.target.value
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Sync first package pricing with form pricing (for backwards compatibility)
      if (field === "adult_price" && packages.length > 0) {
        const updatedPackages = [...packages];
        updatedPackages[0].adult_price = Number.isFinite(value as number) ? (value as number) : 0;
        setPackages(updatedPackages);
        next.price = Number.isFinite(value as number) ? (value as number) : 0;
      }
      if (field === "child_price" && packages.length > 0) {
        const updatedPackages = [...packages];
        updatedPackages[0].child_price = Number.isFinite(value as number) ? (value as number) : 0;
        setPackages(updatedPackages);
      }
      //  AGE SYNC
      if (
        (field === "adult_min_age" ||
          field === "adult_max_age" ||
          field === "child_min_age" ||
          field === "child_max_age") &&
        packages.length > 0
      ) {
        const updatedPackages = [...packages]
        updatedPackages[0] = {
          ...updatedPackages[0],
          [field]: value,
        }
        setPackages(updatedPackages)
      }
      return next
    })
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

    const acceptedTypes = ["image/jpeg", "image/png"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles: File[] = [];

    for (const file of files) {
      const alreadyExists =
        galleryFiles.some(
          (f) => f.name === file.name && f.size === file.size
        );

      if (alreadyExists) {
        toast.error(`"${file.name}" is already added.`);
        continue;
      }

      if (!acceptedTypes.includes(file.type)) {
        toast.error(`"${file.name}" is not a valid image. Only PNG & JPG allowed.`);
        continue;
      }

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

    event.target.value = "";
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
      // Upload images
      const uploadedUrls: string[] = [];
      for (const file of galleryFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/bunny/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }

      // Use first package pricing for experience base fields (backwards compatibility)
      const firstPackage = packages[0];
      const adultPrice = Number.isFinite(firstPackage.adult_price) ? firstPackage.adult_price : 0;
      const childPrice = Number.isFinite(firstPackage.child_price) ? firstPackage.child_price : 0;
      const adultMinAge = typeof firstPackage.adult_min_age === "number"
        ? firstPackage.adult_min_age
        : 0

      const adultMaxAge = typeof firstPackage.adult_max_age === "number"
        ? firstPackage.adult_max_age
        : null

      const childMinAge = typeof firstPackage.child_min_age === "number"
        ? firstPackage.child_min_age
        : 0

      const childMaxAge = typeof firstPackage.child_max_age === "number"
        ? firstPackage.child_max_age
        : 0

      const payload: ExperienceInsert = {
        ...form,
        price: adultPrice,
        adult_price: adultPrice,
        child_price: childPrice,
        adult_min_age: adultMinAge,
        adult_max_age: adultMaxAge,
        child_min_age: childMinAge,
        child_max_age: childMaxAge,
        min_group_size: Number.isFinite(firstPackage.min_group_size) ? firstPackage.min_group_size : 1,
        max_group_size: Number.isFinite(firstPackage.max_group_size) ? firstPackage.max_group_size : 15,
        available_from: firstPackage.available_from || null,
        available_to: firstPackage.available_to || null,
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

      // Create experience
      const response = await fetch("/api/admin/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => ({}))) as { error?: string; id?: string }
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create experience. Please try again.")
      }

      const experienceId = result.id;

      // Create packages
      for (const pkg of packages) {
        const packagePayload = {
          experience_id: experienceId,
          package_name: pkg.package_name?.trim() || 'Standard Package',
          package_code: pkg.package_code,
          description: pkg.description,
          min_group_size: pkg.min_group_size,
          max_group_size: pkg.max_group_size,
          available_from: pkg.available_from || null,
          available_to: pkg.available_to || null,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          display_order: pkg.display_order,
          is_active: pkg.is_active,
          adult_price: pkg.adult_price,
          child_price: pkg.child_price,
          infant_price: pkg.infant_price,
          senior_price: pkg.senior_price,
          // Age (child and adult)
          adult_min_age: pkg.adult_min_age,
          adult_max_age: pkg.adult_max_age,
          child_min_age: pkg.child_min_age,
          child_max_age: pkg.child_max_age,
        };

        await fetch("/api/admin/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(packagePayload),
        });
      }

      toast.success("Experience and packages created")
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
          <p className="text-muted-foreground">Create a new travel experience with package options</p>
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

            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
          </CardContent>
        </Card>

        {/* NEW: Package Management Section */}
        <PackageFormSection
          packages={packages}
          onChange={setPackages}
        />

        {/* Images - (Keep existing image upload code) */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ... existing image upload code ... */}
          </CardContent>
        </Card>

        {/* Keep all other existing sections: Highlights, Itinerary, FAQs, etc. */}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Experience & Packages"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/experiences">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
