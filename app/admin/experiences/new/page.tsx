"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { ArrowLeft, X, Upload, Loader2, FileText, Check, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from "next/link"
import type { Database } from "@/types/database"
import { toast } from "sonner"
import { PackageFormSection, PackageFormData } from "@/components/admin/PackageFormSection"
import { RichTextEditor } from "@/components/admin/RichTextEditor"
import { DualLanguageInput } from "@/components/admin/DualLanguageInput"
import { DualLanguageItinerary } from "@/components/admin/DualLanguageItinerary"
import { DualLanguageFAQ } from "@/components/admin/DualLanguageFAQ"
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

  // Age(child and adult)
  adult_min_age: 18,
  adult_max_age: null,
  child_min_age: 3,
  child_max_age: 17,

  category: "Adventure",
  description: "",
  // image_url: "",
  highlights: "",
  inclusions: "",
  exclusions: "",
  not_suitable_for: [],
  meeting_point: "",
  what_to_bring: [],
  cancellation_policy: "",
  pick_up_information: "",
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

interface SortableImageItemProps {
  id: string
  url: string
  index: number
  onRemove: (index: number) => void
}

function SortableImageItem({ id, url, index, onRemove }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-video rounded-lg overflow-hidden border group bg-white"
    >
      <img
        src={url}
        alt={`Image ${index + 1}`}
        className="object-cover w-full h-full"
      />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-black/70 text-white p-1 rounded cursor-move hover:bg-black/90 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>

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
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2
        bg-red-500 text-white
        w-8 h-8 rounded flex items-center justify-center
        hover:bg-red-600
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200"
      >
        <X className="w-6 h-6" />
      </Button>
    </div>
  )
}

export default function NewExperiencePage() {
  const t = useTranslations('experiences')
  const tForm = useTranslations('experiences.form')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { profile } = useAdmin()
  const [form, setForm] = useState(initialForm)
  const [highlights, setHighlights] = useState("")
  const [inclusions, setInclusions] = useState("")
  const [exclusions, setExclusions] = useState("")
  const [notSuitableForText, setNotSuitableForText] = useState("")
  const [whatToBringText, setWhatToBringText] = useState("")
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [faqs, setFaqs] = useState<FAQItem[]>([{ question: "", answer: "" }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chinese language state
  const [highlightsZh, setHighlightsZh] = useState("")
  const [inclusionsZh, setInclusionsZh] = useState("")
  const [exclusionsZh, setExclusionsZh] = useState("")
  const [notSuitableForTextZh, setNotSuitableForTextZh] = useState("")
  const [whatToBringTextZh, setWhatToBringTextZh] = useState("")
  const [itineraryZh, setItineraryZh] = useState<ItineraryItem[]>([])
  const [faqsZh, setFaqsZh] = useState<FAQItem[]>([{ question: "", answer: "" }])

  // Package management state
  const [packages, setPackages] = useState<PackageFormData[]>([])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = galleryPreviewUrls.findIndex((_, i) => `image-${i}` === active.id)
      const newIndex = galleryPreviewUrls.findIndex((_, i) => `image-${i}` === over.id)

      // Reorder both preview URLs and files
      setGalleryPreviewUrls((items) => arrayMove(items, oldIndex, newIndex))
      setGalleryFiles((items) => arrayMove(items, oldIndex, newIndex))
    }
  }

  const handleInputChange = (field: keyof ExperienceInsert) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericField =
      field === "price" || field === "adult_price" || field === "child_price" || field === "min_group_size" || field === "max_group_size" || field === "adult_min_age" || field === "adult_max_age" || field === "child_min_age" || field === "child_max_age";

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
        max_group_size: Number.isFinite(firstPackage.max_group_size) ? firstPackage.max_group_size : null,
        available_from: firstPackage.available_from || null,
        available_to: firstPackage.available_to || null,
        highlights: highlights || "",
        inclusions: inclusions || "",
        exclusions: exclusions || "",
        not_suitable_for: notSuitableForText.split("\n").filter(Boolean),
        what_to_bring: whatToBringText.split("\n").filter(Boolean),
        gallery: uploadedUrls,
        pick_up_information: form.pick_up_information || "",

        itinerary: itinerary.filter(item => item.day && item.activity).length > 0
          ? (itinerary.filter(item => item.day && item.activity) as any)
          : null,
        faqs: faqs.filter(item => item.question && item.answer).length > 0
          ? (faqs.filter(item => item.question && item.answer) as any)
          : null,
        status: finalStatus,

        // Chinese language fields
        highlights_zh: highlightsZh || null,
        inclusions_zh: inclusionsZh || null,
        exclusions_zh: exclusionsZh || null,
        not_suitable_for_zh: notSuitableForTextZh ? notSuitableForTextZh.split("\n").filter(Boolean) : null,
        what_to_bring_zh: whatToBringTextZh ? whatToBringTextZh.split("\n").filter(Boolean) : null,
        itinerary_zh: itineraryZh.filter(item => item.day && item.activity).length > 0
          ? (itineraryZh.filter(item => item.day && item.activity) as any)
          : null,
        faqs_zh: faqsZh.filter(item => item.question && item.answer).length > 0
          ? (faqsZh.filter(item => item.question && item.answer) as any)
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

      const experienceId = result.id;

      // Create packages
      if (experienceId) {
        for (const pkg of packages) {
          const packagePayload = {
            experience_id: experienceId,
            package_name: pkg.package_name?.trim() || 'Standard Package',
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

            // Chinese language fields
            package_name_zh: pkg.package_name_zh || null,
            description_zh: pkg.description_zh || null,
            inclusions_zh: pkg.inclusions_zh || null,
            exclusions_zh: pkg.exclusions_zh || null,

            // Markup configuration
            markup_type: pkg.markup_type || 'none',
            markup_value: pkg.markup_value || 0,

            // Base prices (cost from supplier)
            base_adult_price: Math.floor(pkg.base_adult_price || 0),
            base_child_price: Math.floor(pkg.base_child_price || 0),
            base_infant_price: Math.floor(pkg.base_infant_price || 0),
            base_senior_price: Math.floor(pkg.base_senior_price || 0),
            base_vehicle_price: Math.floor(pkg.base_vehicle_price || 0),

            // Supplier currency fields
            supplier_currency: pkg.supplier_currency || 'USD',
            supplier_cost_adult: pkg.supplier_cost_adult,
            supplier_cost_child: pkg.supplier_cost_child,
            supplier_cost_infant: pkg.supplier_cost_infant,
            supplier_cost_senior: pkg.supplier_cost_senior,
            supplier_cost_vehicle: pkg.supplier_cost_vehicle,
            exchange_rate: pkg.exchange_rate || 1.0,

            // Selling prices (what customer pays)
            adult_price: Math.floor(pkg.adult_price),
            child_price: Math.floor(pkg.child_price),
            infant_price: Math.floor(pkg.infant_price || 0),
            senior_price: Math.floor(pkg.senior_price || 0),
            vehicle_price: Math.floor(pkg.vehicle_price || 0),

            // Age (child and adult)
            adult_min_age: pkg.adult_min_age,
            adult_max_age: pkg.adult_max_age,
            child_min_age: pkg.child_min_age,
            child_max_age: pkg.child_max_age,

            // Custom pricing tiers
            use_custom_tiers: pkg.use_custom_tiers || false,
            ...(pkg.use_custom_tiers && pkg.custom_pricing_tiers && { custom_pricing_tiers: pkg.custom_pricing_tiers }),

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
        ? tForm('experienceSavedDraft')
        : finalStatus === "review"
        ? tForm('experienceSubmittedReview')
        : tForm('experiencePublished')
      toast.success(statusMessage)
      router.push("/admin/experiences")
    } catch (err: any) {
      console.error("Failed to create experience - Full error:", err)
      const errorMessage = err?.message || err?.toString() || tForm('failedToCreate')
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
          <h1 className="text-3xl font-bold">{tForm('addNewExperience')}</h1>
          <p className="text-muted-foreground">{tForm('createNewExperience')}</p>
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
            <CardTitle>{tForm('basicInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DualLanguageInput
              label={tForm('title')}
              id="title"
              type="text"
              valueEn={form.title}
              valueZh={(form as any).title_zh || ""}
              onChangeEn={(value) => setForm((prev) => ({ ...prev, title: value }))}
              onChangeZh={(value) => setForm((prev) => ({ ...prev, title_zh: value } as any))}
              placeholder={tForm('titlePlaceholder')}
              placeholderZh="例如：巴厘岛冒险之旅"
              required
            />

            <div className="grid gap-4 md:grid-cols-2">
              <DualLanguageInput
                label={tForm('location')}
                id="location"
                type="text"
                valueEn={form.location}
                valueZh={(form as any).location_zh || ""}
                onChangeEn={(value) => setForm((prev) => ({ ...prev, location: value }))}
                onChangeZh={(value) => setForm((prev) => ({ ...prev, location_zh: value } as any))}
                placeholder={tForm('locationPlaceholder')}
                placeholderZh="例如：巴厘岛"
                required
              />
              <div className="space-y-2">
                <Label htmlFor="country">{tForm('country')}</Label>
                <CountryCombobox
                  value={form.country ?? ""}
                  onValueChange={handleSelectChange("country")}
                  placeholder={tForm('countryPlaceholder')}
                  required
                />
              </div>
            </div>

            <DualLanguageInput
              label={tForm('description')}
              id="description"
              type="richtext"
              valueEn={form.description ?? ""}
              valueZh={(form as any).description_zh || ""}
              onChangeEn={(html) => setForm((prev) => ({ ...prev, description: html }))}
              onChangeZh={(html) => setForm((prev) => ({ ...prev, description_zh: html } as any))}
              placeholder={tForm('descriptionPlaceholder')}
              placeholderZh="输入体验的详细描述..."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">{tForm('category')}</Label>
                <Select value={form.category ?? ""} onValueChange={handleSelectChange("category")} required>
                  <SelectTrigger>
                    <SelectValue placeholder={tForm('categoryPlaceholder')} />
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
                <Label htmlFor="duration">{tForm('duration')}</Label>
                <Input
                  id="duration"
                  placeholder={tForm('durationPlaceholder')}
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
            <CardTitle>{tForm('images')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">

              {/* Section Header */}
              <div>
                <Label>{tForm('uploadImages')}</Label>
                <p className="text-sm text-muted-foreground">
                  {tForm('gallery')}
                </p>
              </div>

              {/* Thumbnails (only if images exist) */}
              {galleryPreviewUrls.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={galleryPreviewUrls.map((_, i) => `image-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {galleryPreviewUrls.map((url, index) => (
                        <SortableImageItem
                          key={`image-${index}`}
                          id={`image-${index}`}
                          url={url}
                          index={index}
                          onRemove={removeImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Upload Box */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {tForm('clickToUpload')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tForm('imageFormat')}
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
                  {tForm('noImagesUploaded')}
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
                    <span className="font-medium">{tForm('useAsDestination')}</span>
                    <span className="text-muted-foreground ml-2">
                      {tForm('destinationImageDesc', { country: form.country })}
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
            <CardTitle>{tForm('highlightsAndInclusions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DualLanguageInput
              label={tForm('highlights')}
              id="highlights"
              type="richtext"
              valueEn={highlights}
              valueZh={highlightsZh}
              onChangeEn={setHighlights}
              onChangeZh={setHighlightsZh}
              placeholder={tForm('highlightsPlaceholder')}
              placeholderZh="输入体验亮点..."
            />

            <DualLanguageInput
              label={tForm('inclusions')}
              id="inclusions"
              type="richtext"
              valueEn={inclusions}
              valueZh={inclusionsZh}
              onChangeEn={setInclusions}
              onChangeZh={setInclusionsZh}
              placeholder={tForm('inclusionsPlaceholder')}
              placeholderZh="输入包含的项目..."
            />

            <DualLanguageInput
              label={tForm('exclusions')}
              id="exclusions"
              type="richtext"
              valueEn={exclusions}
              valueZh={exclusionsZh}
              onChangeEn={setExclusions}
              onChangeZh={setExclusionsZh}
              placeholder={tForm('exclusionsPlaceholder')}
              placeholderZh="输入不包含的项目..."
            />
          </CardContent>
        </Card>

        {/* Itinerary */}
        <DualLanguageItinerary
          itineraryEn={itinerary}
          itineraryZh={itineraryZh}
          onChangeEn={setItinerary}
          onChangeZh={setItineraryZh}
          t={tForm}
        />

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>{tForm('additionalDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DualLanguageInput
              label={tForm('whatToBring')}
              id="what_to_bring"
              type="textarea"
              valueEn={whatToBringText}
              valueZh={whatToBringTextZh}
              onChangeEn={setWhatToBringText}
              onChangeZh={setWhatToBringTextZh}
              placeholder={tForm('whatToBringPlaceholder')}
              placeholderZh="每行输入一项（例如：防晒霜）"
              rows={4}
            />

            <DualLanguageInput
              label="Pick Up Information"
              id="pick_up_information"
              type="richtext"
              valueEn={form.pick_up_information ?? ""}
              valueZh={(form as any).pick_up_information_zh || ""}
              onChangeEn={(html) => setForm((prev) => ({ ...prev, pick_up_information: html }))}
              onChangeZh={(html) => setForm((prev) => ({ ...prev, pick_up_information_zh: html } as any))}
              placeholder="Enter pick up details, instructions, and locations..."
              placeholderZh="输入接送信息、说明和地点..."
            />

            <DualLanguageInput
              label={tForm('notSuitableFor')}
              id="not_suitable_for"
              type="textarea"
              valueEn={notSuitableForText}
              valueZh={notSuitableForTextZh}
              onChangeEn={setNotSuitableForText}
              onChangeZh={setNotSuitableForTextZh}
              placeholder={tForm('notSuitableForPlaceholder')}
              placeholderZh="每行输入一项（例如：孕妇）"
              rows={3}
            />

            <DualLanguageInput
              label={tForm('meetingPoint')}
              id="meeting_point"
              type="text"
              valueEn={form.meeting_point ?? ""}
              valueZh={(form as any).meeting_point_zh || ""}
              onChangeEn={(value) => setForm((prev) => ({ ...prev, meeting_point: value }))}
              onChangeZh={(value) => setForm((prev) => ({ ...prev, meeting_point_zh: value } as any))}
              placeholder={tForm('meetingPointPlaceholder')}
              placeholderZh="例如：酒店大堂"
            />

            <DualLanguageInput
              label={tForm('cancellationPolicy')}
              id="cancellation"
              type="richtext"
              valueEn={form.cancellation_policy ?? ""}
              valueZh={(form as any).cancellation_policy_zh || ""}
              onChangeEn={(html) => setForm((prev) => ({ ...prev, cancellation_policy: html }))}
              onChangeZh={(html) => setForm((prev) => ({ ...prev, cancellation_policy_zh: html } as any))}
              placeholder={tForm('cancellationPolicyPlaceholder')}
              placeholderZh="输入取消政策..."
            />
          </CardContent>
        </Card>

        {/* FAQs */}
        <DualLanguageFAQ
          faqsEn={faqs}
          faqsZh={faqsZh}
          onChangeEn={setFaqs}
          onChangeZh={setFaqsZh}
          t={tForm}
        />

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
                {profile?.role === 'supplier' ? tForm('submitForReview') : tForm('publish')}
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
            {tForm('saveAsDraft')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/experiences">{tCommon('cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
