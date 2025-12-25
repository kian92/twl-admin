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
import { ArrowLeft, Plus, X, Upload, Loader2, FileText, Check } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/database"
import { toast } from "sonner"
import { PackageFormSection, PackageFormData } from "@/components/admin/PackageFormSection"
import { RichTextEditor } from "@/components/admin/RichTextEditor"
import { useAdmin } from "@/components/admin-context"
import { useTranslations } from 'next-intl'

type ExperienceInsert = Omit<Database["public"]["Tables"]["experiences"]["Insert"], "slug"> & {
  slug?: string
  is_destination_featured?: boolean
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
  available_from: null,
  available_to: null,
  min_group_size: 1,
  max_group_size: null,
  is_destination_featured: false,
  status: "active",
}

const categories = ["Adventure", "Culture", "Relaxation", "Wellness", "Nature"]

export default function NewExperiencePage() {
  const t = useTranslations()
  const router = useRouter()
  const { profile } = useAdmin()
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

  // Package management state
  const [packages, setPackages] = useState<PackageFormData[]>([])

  const handleInputChange = (field: keyof ExperienceInsert) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericField =
      field === "price" || field === "adult_price" || field === "child_price" || field === "min_group_size" || field === "max_group_size"

    let value: string | number | null
    if (numericField) {
      // For max_group_size, allow null (empty = unlimited)
      if (field === "max_group_size" && event.target.value === "") {
        value = null
      } else {
        value = Number.parseFloat(event.target.value)
      }
    } else {
      value = event.target.value
    }

    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "adult_price") {
        next.price = Number.isFinite(value as number) ? (value as number) : 0
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
      // Prevent duplicate filenames (same name + same size)
      const alreadyExists =
        galleryFiles.some(
          (f) => f.name === file.name && f.size === file.size
        );
  
      if (alreadyExists) {
        toast.error(t('experiences.messages.imageAlreadyAdded', { name: file.name }));
        continue;
      }

      // Type validation
      if (!acceptedTypes.includes(file.type)) {
        toast.error(t('experiences.messages.invalidImageType', { name: file.name }));
        continue;
      }

      //  Size validation
      if (file.size > maxSize) {
        toast.error(t('experiences.messages.imageTooLarge', { name: file.name }));
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
  
  const removeImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  

  const handleSubmit = async (e: React.FormEvent, status: "draft" | "review" | "active" = "active") => {
    e.preventDefault()
    console.log("Form submitted - handleSubmit called with status:", status)
    setLoading(true)
    setError(null)

    try {
      // For suppliers, allow draft but override 'active' to 'review'
      const finalStatus = profile?.role === 'supplier' && status === 'active' ? 'review' : status;
      //  Upload images here
      const uploadedUrls: string[] = [];
      for (const file of galleryFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/bunny/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }

      // Use first package pricing for experience base fields (backwards compatibility)
      const firstPackage = packages[0]
      const adultPrice = Number.isFinite(firstPackage.adult_price) ? firstPackage.adult_price : 0
      const childPrice = Number.isFinite(firstPackage.child_price) ? firstPackage.child_price : 0

      const payload: ExperienceInsert = {
        ...form,
        price: adultPrice,
        adult_price: adultPrice,
        child_price: childPrice,
        min_group_size: Number.isFinite(firstPackage.min_group_size) ? firstPackage.min_group_size : 1,
        max_group_size: Number.isFinite(firstPackage.max_group_size) ? firstPackage.max_group_size : null,
        available_from: firstPackage.available_from || null,
        available_to: firstPackage.available_to || null,
        highlights: highlightsText.split("\n").filter(Boolean),
        inclusions: inclusionsText.split("\n").filter(Boolean),
        exclusions: exclusionsText.split("\n").filter(Boolean),
        not_suitable_for: notSuitableForText.split("\n").filter(Boolean),
        what_to_bring: whatToBringText.split("\n").filter(Boolean),
        gallery: uploadedUrls,

        itinerary: itinerary.filter(item => item.day && item.activity).length > 0
          ? (itinerary.filter(item => item.day && item.activity) as any)
          : null,
        faqs: faqs.filter(item => item.question && item.answer).length > 0
          ? (faqs.filter(item => item.question && item.answer) as any)
          : null,
        status: finalStatus,
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

      const experienceId = result.id;

      // Create packages
      if (experienceId) {
        for (const pkg of packages) {
          const packagePayload = {
            experience_id: experienceId,
            package_name: pkg.package_name,
            package_code: pkg.package_code,
            description: pkg.description,
            tour_type: pkg.tour_type || 'group',
            min_group_size: pkg.min_group_size,
            max_group_size: pkg.max_group_size,
            available_from: pkg.available_from || null,
            available_to: pkg.available_to || null,
            inclusions: pkg.inclusions,
            exclusions: pkg.exclusions,
            display_order: pkg.display_order,
            is_active: pkg.is_active,
            requires_full_payment: pkg.requires_full_payment || false,

            // Markup configuration
            markup_type: pkg.markup_type || 'none',
            markup_value: pkg.markup_value || 0,

            // Base prices (cost from supplier)
            base_adult_price: pkg.base_adult_price || 0,
            base_child_price: pkg.base_child_price || 0,
            base_infant_price: pkg.base_infant_price,
            base_senior_price: pkg.base_senior_price,

            // Supplier currency fields
            supplier_currency: pkg.supplier_currency || 'USD',
            supplier_cost_adult: pkg.supplier_cost_adult,
            supplier_cost_child: pkg.supplier_cost_child,
            supplier_cost_infant: pkg.supplier_cost_infant,
            supplier_cost_senior: pkg.supplier_cost_senior,
            exchange_rate: pkg.exchange_rate || 1.0,

            // Selling prices (what customer pays)
            adult_price: pkg.adult_price,
            child_price: pkg.child_price,
            infant_price: pkg.infant_price,
            senior_price: pkg.senior_price,

            addons: pkg.addons || [],
          };

          await fetch("/api/admin/packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(packagePayload),
          });
        }
      }

      const statusMessage = finalStatus === "draft"
        ? t('experiences.form.experienceSavedDraft')
        : finalStatus === "review"
        ? t('experiences.form.experienceSubmittedReview')
        : t('experiences.form.experiencePublished')
      toast.success(statusMessage)
      router.push("/admin/experiences")
    } catch (err: any) {
      console.error("Failed to create experience - Full error:", err)
      const errorMessage = err?.message || err?.toString() || t('experiences.form.failedToCreate')
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
          <h1 className="text-3xl font-bold">{t('experiences.form.addNewExperience')}</h1>
          <p className="text-muted-foreground">{t('experiences.form.createNewExperience')}</p>
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
            <CardTitle>{t('experiences.form.basicInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('experiences.form.title')}</Label>
              <Input
                id="title"
                placeholder={t('experiences.form.titlePlaceholder')}
                value={form.title}
                onChange={handleInputChange("title")}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">{t('experiences.form.location')}</Label>
                <Input
                  id="location"
                  placeholder={t('experiences.form.locationPlaceholder')}
                  value={form.location}
                  onChange={handleInputChange("location")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t('experiences.form.country')}</Label>
                <CountryCombobox
                  value={form.country ?? ""}
                  onValueChange={handleSelectChange("country")}
                  placeholder={t('experiences.form.countryPlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('experiences.form.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('experiences.form.descriptionPlaceholder')}
                rows={4}
                value={form.description ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">{t('experiences.form.category')}</Label>
                <Select value={form.category ?? ""} onValueChange={handleSelectChange("category")} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('experiences.form.categoryPlaceholder')} />
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
                <Label htmlFor="duration">{t('experiences.form.duration')}</Label>
                <Input
                  id="duration"
                  placeholder={t('experiences.form.durationPlaceholder')}
                  value={form.duration}
                  onChange={handleInputChange("duration")}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packages & Pricing */}
        <PackageFormSection
          packages={packages}
          onChange={setPackages}
          userRole={profile?.role}
        />

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>{t('experiences.form.images')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">

              {/* Section Header */}
              <div>
                <Label>{t('experiences.form.uploadImages')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('experiences.form.gallery')}
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
                  {t('experiences.form.clickToUpload')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('experiences.form.imageFormat')}
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
                  {t('experiences.form.noImagesUploaded')}
                </p>
              )}

              {/* Featured Destination Image */}
              {galleryPreviewUrls.length > 0 && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <input
                    type="checkbox"
                    id="is_destination_featured"
                    checked={form.is_destination_featured || false}
                    onChange={(e) => setForm({ ...form, is_destination_featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="is_destination_featured" className="text-sm">
                    <span className="font-medium">{t('experiences.form.useAsDestination')}</span>
                    <span className="text-muted-foreground ml-2">
                      {t('experiences.form.destinationImageDesc', { country: form.country })}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Highlights & Inclusions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('experiences.form.highlightsAndInclusions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="highlights">{t('experiences.form.highlights')}</Label>
              <Textarea
                id="highlights"
                placeholder={t('experiences.form.highlightsPlaceholder')}
                rows={4}
                value={highlightsText}
                onChange={(event) => setHighlightsText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inclusions">{t('experiences.form.inclusions')}</Label>
              <Textarea
                id="inclusions"
                placeholder={t('experiences.form.inclusionsPlaceholder')}
                rows={4}
                value={inclusionsText}
                onChange={(event) => setInclusionsText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exclusions">{t('experiences.form.exclusions')}</Label>
              <Textarea
                id="exclusions"
                placeholder={t('experiences.form.exclusionsPlaceholder')}
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
              <CardTitle>{t('experiences.form.itinerary')}</CardTitle>
              <Button type="button" size="sm" onClick={addItineraryItem}>
                <Plus className="w-4 h-4 mr-2" />
                {t('experiences.form.addItineraryItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {
              itinerary.length === 0 ?
                (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-sm text-muted-foreground text-center">
                      {t('experiences.form.noItineraryItems')}
                    </p>
                  </div>
                )
              :
                itinerary.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* Day Field */}
                        <div className="space-y-2">
                          <Label htmlFor={`day-${index}`}>{t('experiences.form.day')}</Label>
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
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`time-${index}`}>{t('experiences.form.time')} <span className="text-muted-foreground text-xs">(optional)</span></Label>
                          <Input
                            id={`time-${index}`}
                            placeholder="e.g., 02:00 AM or leave empty"
                            value={item.time || ""}
                            onChange={(e) => updateItineraryItem(index, "time", e.target.value)}
                          />
                        </div>
                      </div>
                      {/* Activity Field */}
                      <div className="space-y-2">
                        <Label htmlFor={`activity-${index}`}>{t('experiences.form.activity')}</Label>
                        <RichTextEditor
                          content={item.activity}
                          onChange={(html) => updateItineraryItem(index, "activity", html)}
                          placeholder="e.g., Hotel pickup, breakfast at the lodge, guided tour..."
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
            <CardTitle>{t('experiences.form.additionalDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="what_to_bring">{t('experiences.form.whatToBring')}</Label>
              <Textarea
                id="what_to_bring"
                placeholder={t('experiences.form.whatToBringPlaceholder')}
                rows={4}
                value={whatToBringText}
                onChange={(event) => setWhatToBringText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="not_suitable_for">{t('experiences.form.notSuitableFor')}</Label>
              <Textarea
                id="not_suitable_for"
                placeholder={t('experiences.form.notSuitableForPlaceholder')}
                rows={3}
                value={notSuitableForText}
                onChange={(event) => setNotSuitableForText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_point">{t('experiences.form.meetingPoint')}</Label>
              <Input
                id="meeting_point"
                placeholder={t('experiences.form.meetingPointPlaceholder')}
                value={form.meeting_point ?? ""}
                onChange={handleInputChange("meeting_point")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation">{t('experiences.form.cancellationPolicy')}</Label>
              <Input
                id="cancellation"
                placeholder={t('experiences.form.cancellationPolicyPlaceholder')}
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
              <CardTitle>{t('experiences.form.faqs')}</CardTitle>
              <Button type="button" size="sm" onClick={addFAQItem}>
                <Plus className="w-4 h-4 mr-2" />
                {t('experiences.form.addFaq')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((item, index) => (
              <div key={index} className="space-y-4 pb-4 border-b last:border-0">
                <div className="flex justify-between items-start">
                  <Label htmlFor={`faq-question-${index}`}>{t('experiences.form.faqNumber', { number: index + 1 })}</Label>
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
                  <Label htmlFor={`faq-question-${index}`}>{t('experiences.form.question')}</Label>
                  <Input
                    id={`faq-question-${index}`}
                    placeholder={t('experiences.form.faqQuestionPlaceholder')}
                    value={item.question}
                    onChange={(e) => updateFAQItem(index, "question", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-answer-${index}`}>{t('experiences.form.answer')}</Label>
                  <Textarea
                    id={`faq-answer-${index}`}
                    placeholder={t('experiences.form.faqAnswerPlaceholder')}
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
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {profile?.role === 'supplier' ? 'Submitting...' : 'Creating...'}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {profile?.role === 'supplier' ? t('experiences.form.submitForReview') : t('experiences.form.publish')}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e as any, "draft")}
            disabled={loading}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t('experiences.form.saveAsDraft')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/experiences">{t('common.cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
