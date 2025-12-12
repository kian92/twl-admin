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
import { ArrowLeft, Upload, Plus, X, Loader2, FileText, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"
import { toast } from "sonner"
import { PackageFormSection, PackageFormData } from "@/components/admin/PackageFormSection"

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
  is_destination_featured?: boolean
  status: "draft" | "active"
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

  // Package management state
  const [packages, setPackages] = useState<PackageFormData[]>([{
    package_name: 'Standard Package',
    package_code: 'STD',
    description: '',
    min_group_size: 1,
    max_group_size: 15,
    adult_price: 0,
    child_price: 0,
    infant_price: 0,
    senior_price: 0,
    inclusions: [],
    exclusions: [],
    is_active: true,
    display_order: 1,
    available_from: '',
    available_to: ''
  }]) 

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
          is_destination_featured: (experienceData as any).is_destination_featured ?? false,
          status: experienceData.status ?? "active",
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

        // Load packages with pricing tiers
        try {
          const packagesResponse = await fetch(`/api/admin/packages?experience_id=${experienceData.id}`)
          if (packagesResponse.ok) {
            const responseData = await packagesResponse.json()
            const packagesData = responseData.packages || responseData // Handle both wrapped and unwrapped responses

            if (packagesData && Array.isArray(packagesData) && packagesData.length > 0) {
              const formattedPackages: PackageFormData[] = packagesData.map((pkg: any, index: number) => {
                const adultTier = pkg.pricing_tiers?.find((t: any) => t.tier_type === 'adult');
                const childTier = pkg.pricing_tiers?.find((t: any) => t.tier_type === 'child');
                const infantTier = pkg.pricing_tiers?.find((t: any) => t.tier_type === 'infant');
                const seniorTier = pkg.pricing_tiers?.find((t: any) => t.tier_type === 'senior');

                // Get markup info from adult tier (assuming all tiers have same markup settings)
                const markupType = adultTier?.markup_type || 'none';
                const markupValue = adultTier?.markup_value || 0;

                return {
                  id: pkg.id,
                  package_name: pkg.package_name,
                  package_code: pkg.package_code || '',
                  description: pkg.description || '',
                  min_group_size: pkg.min_group_size,
                  max_group_size: pkg.max_group_size,

                  // Markup settings
                  markup_type: markupType,
                  markup_value: markupValue,

                  // Base prices (cost from supplier)
                  base_adult_price: adultTier?.base_price || 0,
                  base_child_price: childTier?.base_price || 0,
                  base_infant_price: infantTier?.base_price || 0,
                  base_senior_price: seniorTier?.base_price || 0,

                  // Selling prices (what customer pays)
                  adult_price: adultTier?.selling_price || adultTier?.base_price || 0,
                  child_price: childTier?.selling_price || childTier?.base_price || 0,
                  infant_price: infantTier?.selling_price || infantTier?.base_price || 0,
                  senior_price: seniorTier?.selling_price || seniorTier?.base_price || 0,

                  inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions : [],
                  exclusions: Array.isArray(pkg.exclusions) ? pkg.exclusions : [],
                  is_active: pkg.is_active ?? true,
                  display_order: pkg.display_order ?? index + 1,
                  available_from: pkg.available_from || '',
                  available_to: pkg.available_to || '',
                  addons: pkg.addons?.map((addon: any) => ({
                    id: addon.id,
                    name: addon.addon_name,
                    description: addon.description || '',
                    price: addon.price,
                    is_required: addon.is_required || false,
                    max_quantity: addon.max_quantity || 1,
                    pricing_type: addon.pricing_type || 'per_person',
                    category: addon.category || 'Other'
                  })) || []
                };
              })
              setPackages(formattedPackages)
            }
          }
        } catch (pkgErr) {
          console.error("Failed to load packages", pkgErr)
          // Don't fail the whole page if packages fail to load
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

  const handleSubmit = async (e: React.FormEvent, status?: "draft" | "active") => {
    e.preventDefault()
    if (!form || !experience) return

    console.log('=== SAVE HANDLER START ===');
    console.log('Packages state at save time:', packages);
    console.log('Number of packages:', packages.length);
    console.log('Status:', status || form.status);
    packages.forEach((pkg, idx) => {
      console.log(`Package ${idx}:`, {
        name: pkg.package_name,
        adult_price: pkg.adult_price,
        child_price: pkg.child_price,
        code: pkg.package_code
      });
    });
    console.log('=========================');

    setSaving(true)
    setError(null)
    try {
      // Use first package pricing for experience base fields (backwards compatibility)
      const firstPackage = packages[0]
      const adultPrice = Number.isFinite(firstPackage.adult_price) ? firstPackage.adult_price : 0
      const childPrice = Number.isFinite(firstPackage.child_price) ? firstPackage.child_price : 0

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
      console.log('is_destination_featured value from form:', form.is_destination_featured)

      const payload = {
        title: form.title,
        location: form.location,
        country: form.country,
        description: form.description,
        duration: form.duration,
        price: adultPrice,
        adult_price: adultPrice,
        child_price: childPrice,
        available_from: firstPackage.available_from || null,
        available_to: firstPackage.available_to || null,
        min_group_size: Number.isFinite(firstPackage.min_group_size) ? firstPackage.min_group_size : 1,
        max_group_size: Number.isFinite(firstPackage.max_group_size) ? firstPackage.max_group_size : 15,
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
        is_destination_featured: form.is_destination_featured ?? false,
        status: status || form.status,
        itinerary:
          itinerary.filter((item) => item.day && item.activity).length > 0
            ? itinerary.filter((item) => item.day && item.activity)
            : null,
        faqs:
          faqs.filter((item) => item.question && item.answer).length > 0 ? faqs.filter((item) => item.question && item.answer) : null,
      }

      console.log('Payload being sent:', JSON.stringify(payload, null, 2))

     // Step 3: Update experience
      const response = await fetch(`/api/admin/experiences/${experience.slug}/${experience.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }

      const result = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save changes. Please try again.")
      }

      // Step 4: Update packages
      console.log('Starting package update process. Current packages state:', packages);

      // First, delete existing packages for this experience
      const existingPackagesResponse = await fetch(`/api/admin/packages?experience_id=${experience.id}`)
      if (existingPackagesResponse.ok) {
        const existingPackages = await existingPackagesResponse.json()
        console.log('Existing packages to delete:', existingPackages);
        for (const pkg of existingPackages) {
          const deleteResponse = await fetch(`/api/admin/packages/${pkg.id}`, {
            method: "DELETE"
          })
          if (!deleteResponse.ok) {
            console.error('Failed to delete package:', pkg.id);
          }
        }
      }

      // Then create new packages
      let successCount = 0;
      let failCount = 0;

      for (const pkg of packages) {
        // Ensure prices are numbers
        const adultPrice = Number(pkg.adult_price) || 0;
        const childPrice = Number(pkg.child_price) || 0;
        const infantPrice = pkg.infant_price ? Number(pkg.infant_price) : undefined;
        const seniorPrice = pkg.senior_price ? Number(pkg.senior_price) : undefined;

        // Base prices
        const baseAdultPrice = Number(pkg.base_adult_price) || 0;
        const baseChildPrice = Number(pkg.base_child_price) || 0;
        const baseInfantPrice = pkg.base_infant_price ? Number(pkg.base_infant_price) : undefined;
        const baseSeniorPrice = pkg.base_senior_price ? Number(pkg.base_senior_price) : undefined;

        const packagePayload = {
          experience_id: experience.id,
          package_name: pkg.package_name,
          package_code: pkg.package_code,
          description: pkg.description,
          min_group_size: pkg.min_group_size,
          max_group_size: pkg.max_group_size,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          is_active: pkg.is_active,
          display_order: pkg.display_order,
          available_from: pkg.available_from || null,
          available_to: pkg.available_to || null,

          // Markup configuration
          markup_type: pkg.markup_type || 'none',
          markup_value: pkg.markup_value || 0,

          // Base prices (cost from supplier)
          base_adult_price: baseAdultPrice,
          base_child_price: baseChildPrice,
          ...(baseInfantPrice !== undefined && { base_infant_price: baseInfantPrice }),
          ...(baseSeniorPrice !== undefined && { base_senior_price: baseSeniorPrice }),

          // Selling prices (what customer pays)
          adult_price: adultPrice,
          child_price: childPrice,
          ...(infantPrice !== undefined && { infant_price: infantPrice }),
          ...(seniorPrice !== undefined && { senior_price: seniorPrice }),

          addons: pkg.addons || []
        }

        console.log('Creating package with payload:', packagePayload);

        const response = await fetch("/api/admin/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(packagePayload),
        })

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to create package:', errorText);
          failCount++;
        } else {
          const createdPackage = await response.json();
          console.log('Successfully created package:', createdPackage);
          successCount++;
        }
      }

      console.log(`Package creation complete. Success: ${successCount}, Failed: ${failCount}`);

      if (failCount > 0) {
        toast.warning(`Experience updated, but ${failCount} package(s) failed to save. Check console for details.`);
      }

      const statusMessage = (status || form.status) === "draft" ? "saved as draft" : "published"
      toast.success(`Experience ${statusMessage} successfully`)
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

            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
          </CardContent>
        </Card>

        {/* Packages & Pricing */}
        <PackageFormSection
          packages={packages}
          onChange={setPackages}
        />

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

              {/* Featured Destination Image */}
              {galleryPreviewUrls.length > 0 && form && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <input
                    type="checkbox"
                    id="is_destination_featured"
                    checked={Boolean(form.is_destination_featured)}
                    onChange={(e) => {
                      console.log('Checkbox changed to:', e.target.checked)
                      setForm({ ...form, is_destination_featured: e.target.checked })
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="is_destination_featured" className="text-sm">
                    <span className="font-medium">Use as destination image</span>
                    <span className="text-muted-foreground ml-2">
                      (First image will represent {form.country} on destination pages)
                    </span>
                  </label>
                </div>
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
                      <Label htmlFor={`time-${index}`}>Time <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        id={`time-${index}`}
                        placeholder="e.g., 02:00 AM or leave empty"
                        value={item.time || ""}
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
          <Button
            type="button"
            onClick={(e) => handleSubmit(e as any, "active")}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {form?.status === "draft" ? "Publish" : "Save & Publish"}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e as any, "draft")}
            disabled={saving}
          >
            <FileText className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/experiences">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
