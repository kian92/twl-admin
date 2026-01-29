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
import { ArrowLeft, Upload, Plus, X, Loader2, FileText, Check, GripVertical } from "lucide-react"
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
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"
import { toast } from "sonner"
import { PackageFormSection, PackageFormData } from "@/components/admin/PackageFormSection"
import { RichTextEditor } from "@/components/admin/RichTextEditor"
import { DualLanguageInput } from "@/components/admin/DualLanguageInput"
import { DualLanguageItinerary } from "@/components/admin/DualLanguageItinerary"
import { DualLanguageFAQ } from "@/components/admin/DualLanguageFAQ"
import { useAdmin } from "@/components/admin-context"
import { useTranslations } from 'next-intl'

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
  pick_up_information: string
  gallery: string
  cancellation_policy: string
  is_destination_featured?: boolean
  status: "draft" | "review" | "active"
  // Chinese language fields
  title_zh?: string
  location_zh?: string
  description_zh?: string
  highlights_zh?: string
  inclusions_zh?: string
  exclusions_zh?: string
  not_suitable_for_zh?: string
  meeting_point_zh?: string
  what_to_bring_zh?: string
  pick_up_information_zh?: string
  cancellation_policy_zh?: string
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

export default function EditExperiencePage({ params }: { params: Promise<{ slug: string; id: string }> }) {

  const router = useRouter()
  const { profile } = useAdmin()
  const t = useTranslations('experiences')
  const tForm = useTranslations('experiences.form')
  const [experience, setExperience] = useState<ExperienceRow | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [itineraryZh, setItineraryZh] = useState<ItineraryItem[]>([])
  const [faqs, setFaqs] = useState<FAQItem[]>([{ question: "", answer: "" }])
  const [faqsZh, setFaqsZh] = useState<FAQItem[]>([{ question: "", answer: "" }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { slug, id } = React.use(params)

  // Package management state
  const [packages, setPackages] = useState<PackageFormData[]>([{
    package_name: 'Standard Package',
    package_code: 'STD',
    description: '',
    tour_type: 'group',
    min_group_size: 1,
    max_group_size: null,
    adult_price: 0,
    child_price: 0,
    // Age(child and adult)
    adult_min_age: 18,
    adult_max_age: null,
    child_min_age: 3,
    child_max_age: 17,
    infant_price: 0,
    senior_price: 0,
    inclusions: [],
    exclusions: [],
    is_active: true,
    display_order: 1,
    available_from: '',
    available_to: '',
    use_custom_tiers: false,
    custom_pricing_tiers: []
  }]) 

  // Gallery
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [existingGallery, setExistingGallery] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // Reorder the preview URLs (which contains all images)
      setGalleryPreviewUrls((items) => arrayMove(items, oldIndex, newIndex))

      // Also update existingGallery since they should stay in sync
      setExistingGallery((items) => arrayMove(items, oldIndex, newIndex))
    }
  }

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
          highlights: Array.isArray(experienceData.highlights) ? experienceData.highlights.join("\n") : (experienceData.highlights ?? ""),
          inclusions: Array.isArray(experienceData.inclusions) ? experienceData.inclusions.join("\n") : (experienceData.inclusions ?? ""),
          exclusions: Array.isArray(experienceData.exclusions) ? experienceData.exclusions.join("\n") : (experienceData.exclusions ?? ""),
          not_suitable_for: Array.isArray(experienceData.not_suitable_for) ? experienceData.not_suitable_for.join("\n") : "",
          meeting_point: experienceData.meeting_point ?? "",
          what_to_bring: Array.isArray(experienceData.what_to_bring) ? experienceData.what_to_bring.join("\n") : "",
          pick_up_information: experienceData.pick_up_information ?? "",
          gallery: Array.isArray(experienceData.gallery) ? experienceData.gallery.join("\n") : "",
          cancellation_policy: experienceData.cancellation_policy ?? "",
          is_destination_featured: (experienceData as any).is_destination_featured ?? false,
          status: experienceData.status ?? "active",
          // Chinese language fields
          title_zh: experienceData.title_zh ?? "",
          location_zh: experienceData.location_zh ?? "",
          description_zh: experienceData.description_zh ?? "",
          highlights_zh: Array.isArray(experienceData.highlights_zh) ? experienceData.highlights_zh.join("\n") : (experienceData.highlights_zh ?? ""),
          inclusions_zh: Array.isArray(experienceData.inclusions_zh) ? experienceData.inclusions_zh.join("\n") : (experienceData.inclusions_zh ?? ""),
          exclusions_zh: Array.isArray(experienceData.exclusions_zh) ? experienceData.exclusions_zh.join("\n") : (experienceData.exclusions_zh ?? ""),
          not_suitable_for_zh: Array.isArray(experienceData.not_suitable_for_zh) ? experienceData.not_suitable_for_zh.join("\n") : "",
          meeting_point_zh: experienceData.meeting_point_zh ?? "",
          what_to_bring_zh: Array.isArray(experienceData.what_to_bring_zh) ? experienceData.what_to_bring_zh.join("\n") : "",
          pick_up_information_zh: experienceData.pick_up_information_zh ?? "",
          cancellation_policy_zh: experienceData.cancellation_policy_zh ?? "",
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

        // Load Chinese itinerary if exists
        if (experienceData.itinerary_zh && Array.isArray(experienceData.itinerary_zh)) {
          const itineraryDataZh = experienceData.itinerary_zh as unknown as ItineraryItem[]
          setItineraryZh(itineraryDataZh.length > 0 ? itineraryDataZh : [])
        }

        // Load FAQs if exists
        if (experienceData.faqs && Array.isArray(experienceData.faqs)) {
          const faqsData = experienceData.faqs as unknown as FAQItem[]
          setFaqs(faqsData.length > 0 ? faqsData : [{ question: "", answer: "" }])
        }

        // Load Chinese FAQs if exists
        if (experienceData.faqs_zh && Array.isArray(experienceData.faqs_zh)) {
          const faqsDataZh = experienceData.faqs_zh as unknown as FAQItem[]
          setFaqsZh(faqsDataZh.length > 0 ? faqsDataZh : [])
        }

        // Load packages with pricing tiers
        try {
          const packagesResponse = await fetch(`/api/admin/packages?experience_id=${experienceData.id}`)
          if (packagesResponse.ok) {
            const responseData = await packagesResponse.json()
            const packagesData = responseData.packages || responseData // Handle both wrapped and unwrapped responses

            if (packagesData && Array.isArray(packagesData) && packagesData.length > 0) {
              const formattedPackages: PackageFormData[] = packagesData.map((pkg: any, index: number) => {
                // Check if this package has custom pricing tiers
                // Custom tiers are detected when:
                // 1. There are multiple tiers of the same type, OR
                // 2. Any tier has a custom label (not the default labels)
                const pricingTiers = pkg.pricing_tiers || [];
                const tierTypeCounts: Record<string, number> = {};
                pricingTiers.forEach((t: any) => {
                  tierTypeCounts[t.tier_type] = (tierTypeCounts[t.tier_type] || 0) + 1;
                });

                const hasMultipleTiersOfSameType = Object.values(tierTypeCounts).some(count => count > 1);
                const hasCustomLabels = pricingTiers.some((t: any) => {
                  const defaultLabels = ['Adult (18+ years)', 'Child (3-17 years)', 'Infant (0-2 years)', 'Senior (65+ years)', 'Vehicle Rental (per vehicle)'];
                  return t.tier_label && !defaultLabels.includes(t.tier_label);
                });

                const useCustomTiers = hasMultipleTiersOfSameType || hasCustomLabels;

                // Get first tier of each type for simple mode
                const adultTier = pricingTiers.find((t: any) => t.tier_type === 'adult');
                const childTier = pricingTiers.find((t: any) => t.tier_type === 'child');
                const infantTier = pricingTiers.find((t: any) => t.tier_type === 'infant');
                const seniorTier = pricingTiers.find((t: any) => t.tier_type === 'senior');
                const vehicleTier = pricingTiers.find((t: any) => t.tier_type === 'vehicle');

                // Get markup info from first tier (assuming all tiers have same markup settings)
                const firstTier = pricingTiers[0] || {};
                const markupType = firstTier.markup_type || 'none';
                const markupValue = firstTier.markup_value || 0;

                // Get supplier currency info from first tier (assuming all tiers use same currency)
                const supplierCurrency = firstTier.supplier_currency || 'USD';
                const exchangeRate = firstTier.exchange_rate || 1.0;

                // Build custom pricing tiers array if applicable
                const customPricingTiers = useCustomTiers ? pricingTiers.map((tier: any) => ({
                  id: tier.id,
                  tier_type: tier.tier_type,
                  tier_label: tier.tier_label,
                  min_age: tier.min_age,
                  max_age: tier.max_age,
                  base_price: Math.floor(tier.base_price) || 0,
                  selling_price: Math.floor(tier.selling_price) || Math.floor(tier.base_price) || 0,
                  supplier_cost: Math.floor(tier.supplier_cost) || 0,
                  description: tier.description || ''
                })) : undefined;

                return {
                  id: pkg.id,
                  package_name: pkg.package_name,
                  package_code: pkg.package_code || '',
                  description: pkg.description || '',

                  // Chinese language fields
                  package_name_zh: pkg.package_name_zh || '',
                  description_zh: pkg.description_zh || '',

                  tour_type: pkg.tour_type || 'group',
                  min_group_size: pkg.min_group_size,
                  max_group_size: pkg.max_group_size,
                  requires_full_payment: pkg.requires_full_payment || false,

                  // Markup settings
                  markup_type: markupType,
                  markup_value: markupValue,

                  // Base prices (cost from supplier) - for simple mode
                  base_adult_price: Math.floor(adultTier?.base_price) || 0,
                  base_child_price: Math.floor(childTier?.base_price) || 0,
                  base_infant_price: Math.floor(infantTier?.base_price) || 0,
                  base_senior_price: Math.floor(seniorTier?.base_price) || 0,
                  base_vehicle_price: Math.floor(vehicleTier?.base_price) || 0,

                  // Supplier currency fields
                  supplier_currency: supplierCurrency,
                  supplier_cost_adult: Math.floor(adultTier?.supplier_cost) || 0,
                  supplier_cost_child: Math.floor(childTier?.supplier_cost) || 0,
                  supplier_cost_infant: Math.floor(infantTier?.supplier_cost) || 0,
                  supplier_cost_senior: Math.floor(seniorTier?.supplier_cost) || 0,
                  supplier_cost_vehicle: Math.floor(vehicleTier?.supplier_cost) || 0,
                  exchange_rate: exchangeRate,

                  // Selling prices (what customer pays) - for simple mode
                  adult_price: Math.floor(adultTier?.selling_price || adultTier?.base_price || 0),
                  child_price: Math.floor(childTier?.selling_price || childTier?.base_price || 0),
                  infant_price: Math.floor(infantTier?.selling_price || infantTier?.base_price || 0),
                  senior_price: Math.floor(seniorTier?.selling_price || seniorTier?.base_price || 0),
                  vehicle_price: Math.floor(vehicleTier?.selling_price || vehicleTier?.base_price || 0),

                  // Age(child and adult) - for simple mode
                  adult_min_age: adultTier?.min_age ?? 18,
                  adult_max_age: adultTier?.max_age ?? null,
                  child_min_age: childTier?.min_age ?? 3,
                  child_max_age: childTier?.max_age ?? 17,

                  // Custom pricing tiers
                  use_custom_tiers: useCustomTiers,
                  custom_pricing_tiers: customPricingTiers,

                  inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions : [],
                  exclusions: Array.isArray(pkg.exclusions) ? pkg.exclusions : [],
                  inclusions_zh: Array.isArray(pkg.inclusions_zh) ? pkg.inclusions_zh : [],
                  exclusions_zh: Array.isArray(pkg.exclusions_zh) ? pkg.exclusions_zh : [],
                  is_active: pkg.is_active ?? true,
                  display_order: pkg.display_order ?? index + 1,
                  available_from: pkg.available_from || '',
                  available_to: pkg.available_to || '',
                  addons: pkg.addons?.map((addon: any) => ({
                    id: addon.id,
                    name: addon.addon_name,
                    description: addon.description || '',
                    name_zh: addon.addon_name_zh || '',
                    description_zh: addon.description_zh || '',
                    price: Math.floor(addon.price),
                    is_required: addon.is_required || false,
                    max_quantity: addon.max_quantity || 1,
                    pricing_type: addon.pricing_type || 'per_person',
                    category: addon.category || 'Other',
                    supplier_currency: addon.supplier_currency || 'USD',
                    supplier_cost: addon.supplier_cost,
                    addon_exchange_rate: addon.addon_exchange_rate || 1.0
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
        toast.error(t('messages.imageAlreadyAdded', { name: file.name }));
        continue;
      }

      // Type validation
      if (!acceptedTypes.includes(file.type)) {
        toast.error(t('messages.invalidImageType', { name: file.name }));
        continue;
      }

      //  Size validation
      if (file.size > maxSize) {
        toast.error(t('messages.imageTooLarge', { name: file.name }));
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
  
  
  

  const highlightsList = useMemo(() => form?.highlights ?? "", [form])
  const inclusionsList = useMemo(() => form?.inclusions ?? "", [form])
  const exclusionsList = useMemo(() => form?.exclusions ?? "", [form])
  const notSuitableForList = useMemo(() => form?.not_suitable_for.split("\n").filter(Boolean) ?? [], [form])
  const whatToBringList = useMemo(() => form?.what_to_bring.split("\n").filter(Boolean) ?? [], [form])
  const galleryList = useMemo(() => form?.gallery.split("\n").filter(Boolean) ?? [], [form])

  const handleSubmit = async (e: React.FormEvent, status?: "draft" | "review" | "active") => {
    e.preventDefault()
    if (!form || !experience) return

    // For suppliers, override status to 'review' when trying to publish
    const finalStatus = profile?.role === 'supplier' && status === 'active' ? 'review' : (status || form.status);

    console.log('=== SAVE HANDLER START ===');
    console.log('Packages state at save time:', packages);
    console.log('Number of packages:', packages.length);
    console.log('Status:', finalStatus);
    packages.forEach((pkg, idx) => {
      console.log(`Package ${idx}:`, {
        name: pkg.package_name,
        adult_price: Math.floor(pkg.adult_price),
        child_price: Math.floor(pkg.child_price),
        code: pkg.package_code
      });
    });
    console.log('=========================');

    setSaving(true)
    setError(null)
    try {
      // Use first package pricing for experience base fields (backwards compatibility)
      const firstPackage = packages[0]
      const adultPrice = Number.isFinite(firstPackage.adult_price) ? Math.floor(firstPackage.adult_price) : 0
      const childPrice = Number.isFinite(firstPackage.child_price) ? Math.floor(firstPackage.child_price) : 0

      const adultMinAge = firstPackage.adult_min_age ?? 18

      const adultMaxAge = firstPackage.adult_max_age ?? null

      const childMinAge = firstPackage.child_min_age ?? 3

      const childMaxAge = firstPackage.child_max_age ?? 17



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
        price: Math.floor(adultPrice),
        adult_price: Math.floor(adultPrice),
        child_price: Math.floor(childPrice),
        adult_min_age: adultMinAge,
        adult_max_age: adultMaxAge,
        child_min_age: childMinAge,
        child_max_age: childMaxAge,
        available_from: firstPackage.available_from || null,
        available_to: firstPackage.available_to || null,
        min_group_size: Number.isFinite(firstPackage.min_group_size) ? firstPackage.min_group_size : 1,
        max_group_size: Number.isFinite(firstPackage.max_group_size) ? firstPackage.max_group_size : null,
        category: form.category,
        // image_url: form.image_url,
        highlights: highlightsList,
        inclusions: inclusionsList,
        exclusions: exclusionsList,
        not_suitable_for: notSuitableForList,
        meeting_point: form.meeting_point,
        what_to_bring: whatToBringList,
        pick_up_information: form.pick_up_information,
        gallery: updatedGallery,
        cancellation_policy: form.cancellation_policy,
        is_destination_featured: form.is_destination_featured ?? false,
        status: finalStatus,
        itinerary:
          itinerary.filter((item) => item.day && item.activity).length > 0
            ? itinerary.filter((item) => item.day && item.activity)
            : null,
        faqs:
          faqs.filter((item) => item.question && item.answer).length > 0 ? faqs.filter((item) => item.question && item.answer) : null,
        // Chinese language fields
        title_zh: form.title_zh || null,
        location_zh: form.location_zh || null,
        description_zh: form.description_zh || null,
        highlights_zh: form.highlights_zh || null,
        inclusions_zh: form.inclusions_zh || null,
        exclusions_zh: form.exclusions_zh || null,
        not_suitable_for_zh: form.not_suitable_for_zh ? form.not_suitable_for_zh.split("\n").filter(Boolean) : null,
        meeting_point_zh: form.meeting_point_zh || null,
        what_to_bring_zh: form.what_to_bring_zh ? form.what_to_bring_zh.split("\n").filter(Boolean) : null,
        pick_up_information_zh: form.pick_up_information_zh || null,
        cancellation_policy_zh: form.cancellation_policy_zh || null,
        itinerary_zh:
          itineraryZh.filter((item) => item.day && item.activity).length > 0
            ? itineraryZh.filter((item) => item.day && item.activity)
            : null,
        faqs_zh:
          faqsZh.filter((item) => item.question && item.answer).length > 0 ? faqsZh.filter((item) => item.question && item.answer) : null,
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

        // Age handling - convert to number if valid, otherwise use defaults
        const adultMinAge = pkg.adult_min_age !== undefined && pkg.adult_min_age !== null && pkg.adult_min_age !== ''
          ? Number(pkg.adult_min_age)
          : 18;
        const adultMaxAge = pkg.adult_max_age !== undefined && pkg.adult_max_age !== null && pkg.adult_max_age !== ''
          ? Number(pkg.adult_max_age)
          : null;
        const childMinAge = pkg.child_min_age !== undefined && pkg.child_min_age !== null && pkg.child_min_age !== ''
          ? Number(pkg.child_min_age)
          : 3;
        const childMaxAge = pkg.child_max_age !== undefined && pkg.child_max_age !== null && pkg.child_max_age !== ''
          ? Number(pkg.child_max_age)
          : 17;
        const infantPrice = pkg.infant_price ? Number(pkg.infant_price) : undefined;
        const seniorPrice = pkg.senior_price ? Number(pkg.senior_price) : undefined;
        const vehiclePrice = pkg.vehicle_price ? Number(pkg.vehicle_price) : undefined;

        // Base prices
        const baseAdultPrice = Number(pkg.base_adult_price) || 0;
        const baseChildPrice = Number(pkg.base_child_price) || 0;
        const baseInfantPrice = pkg.base_infant_price ? Number(pkg.base_infant_price) : undefined;
        const baseSeniorPrice = pkg.base_senior_price ? Number(pkg.base_senior_price) : undefined;
        const baseVehiclePrice = pkg.base_vehicle_price ? Number(pkg.base_vehicle_price) : undefined;

        const packagePayload: any = {
          experience_id: experience.id,
          package_name: pkg.package_name?.trim() || 'Standard Package',
          package_code: pkg.package_code,
          description: pkg.description,
          tour_type: pkg.tour_type || 'group',
          min_group_size: pkg.min_group_size,
          max_group_size: pkg.max_group_size,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          is_active: pkg.is_active,
          requires_full_payment: pkg.requires_full_payment || false,
          display_order: pkg.display_order,
          available_from: pkg.available_from || null,
          available_to: pkg.available_to || null,

          // Chinese language fields
          package_name_zh: pkg.package_name_zh || null,
          description_zh: pkg.description_zh || null,
          inclusions_zh: pkg.inclusions_zh || null,
          exclusions_zh: pkg.exclusions_zh || null,

          // Markup configuration
          markup_type: pkg.markup_type || 'none',
          markup_value: pkg.markup_value || 0,

          // Supplier currency fields
          supplier_currency: pkg.supplier_currency || 'USD',
          exchange_rate: pkg.exchange_rate || 1.0,

          // Custom pricing tiers
          use_custom_tiers: pkg.use_custom_tiers || false,

          addons: pkg.addons || []
        };

        // Only include standard pricing if NOT using custom tiers
        if (pkg.use_custom_tiers && pkg.custom_pricing_tiers) {
          // Custom tiers mode - send only custom tiers
          packagePayload.custom_pricing_tiers = pkg.custom_pricing_tiers;
        } else {
          // Standard mode - send standard pricing fields
          packagePayload.base_adult_price = baseAdultPrice;
          packagePayload.base_child_price = baseChildPrice;
          if (baseInfantPrice !== undefined) packagePayload.base_infant_price = baseInfantPrice;
          if (baseSeniorPrice !== undefined) packagePayload.base_senior_price = baseSeniorPrice;
          if (baseVehiclePrice !== undefined) packagePayload.base_vehicle_price = baseVehiclePrice;

          packagePayload.supplier_cost_adult = pkg.supplier_cost_adult;
          packagePayload.supplier_cost_child = pkg.supplier_cost_child;
          packagePayload.supplier_cost_infant = pkg.supplier_cost_infant;
          packagePayload.supplier_cost_senior = pkg.supplier_cost_senior;
          packagePayload.supplier_cost_vehicle = pkg.supplier_cost_vehicle;

          packagePayload.adult_price = adultPrice;
          packagePayload.child_price = childPrice;
          packagePayload.adult_min_age = adultMinAge;
          packagePayload.adult_max_age = adultMaxAge;
          packagePayload.child_min_age = childMinAge;
          packagePayload.child_max_age = childMaxAge;
          if (infantPrice !== undefined) packagePayload.infant_price = infantPrice;
          if (seniorPrice !== undefined) packagePayload.senior_price = seniorPrice;
          if (vehiclePrice !== undefined) packagePayload.vehicle_price = vehiclePrice;
        }

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
        toast.warning(t('messages.packageSaveWarning', { count: failCount }));
      }

      const statusMessage = finalStatus === "draft" ? t('messages.savedAsDraft') : finalStatus === "review" ? t('messages.submittedForReview') : t('messages.published')
      toast.success(t('messages.experienceStatusSuccess', { status: statusMessage }))
      router.push("/admin/experiences")
    } catch (err) {
      console.error("Failed to update experience", err)
      const errorMessage = (err as any)?.message || t('messages.unableToSaveChanges')
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
          <h1 className="text-3xl font-bold">{t('editExperience')}</h1>
          <p className="text-muted-foreground">{t('form.updateExperienceDetails')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('form.basicInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DualLanguageInput
              label={t('form.title')}
              id="title"
              type="text"
              valueEn={form.title}
              valueZh={form.title_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, title: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, title_zh: value } : prev))}
              placeholder={t('form.titlePlaceholder')}
              placeholderZh="例如：吴哥窟探险"
              required
            />

            <div className="grid gap-4 md:grid-cols-2">
              <DualLanguageInput
                label={t('form.location')}
                id="location"
                type="text"
                valueEn={form.location}
                valueZh={form.location_zh || ''}
                onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, location: value } : prev))}
                onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, location_zh: value } : prev))}
                placeholder={t('form.locationPlaceholder')}
                placeholderZh="例如：暹粒"
                required
              />
              <div className="space-y-2">
                <Label htmlFor="country">{t('form.country')}</Label>
                <CountryCombobox
                  value={form.country}
                  onValueChange={handleSelectChange("country")}
                  placeholder={t('form.countryPlaceholder')}
                  required
                />
              </div>
            </div>

            <DualLanguageInput
              label={t('form.description')}
              id="description"
              type="richtext"
              valueEn={form.description}
              valueZh={form.description_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, description: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, description_zh: value } : prev))}
              placeholder={t('form.descriptionPlaceholder')}
              placeholderZh="输入体验描述..."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">{t('form.category')}</Label>
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
                <Label htmlFor="duration">{t('form.duration')}</Label>
                <Input id="duration" value={form.duration} onChange={handleChange("duration")} required />
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

        {/* Gallery Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.images')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>{t('form.uploadImages')}</Label>
                <p className="text-sm text-muted-foreground">{t('form.addMultipleImages')}</p>
              </div>

              {/* Thumbnails */}
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
                <p className="text-sm text-muted-foreground mb-2">{t('form.clickToUpload')}</p>
                <p className="text-xs text-muted-foreground">{t('form.imageFormat')}</p>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleSelectFiles} />
              </div>

              {/* No images message */}
              {galleryPreviewUrls.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t('form.noImagesUploaded')}</p>
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
                    <span className="font-medium">{t('form.useAsDestination')}</span>
                    <span className="text-muted-foreground ml-2">
                      {t('form.destinationImageDesc', { country: form.country })}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('form.highlightsAndInclusions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DualLanguageInput
              label={t('form.highlights')}
              id="highlights"
              type="richtext"
              valueEn={form.highlights}
              valueZh={form.highlights_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, highlights: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, highlights_zh: value } : prev))}
              placeholder={t('form.highlightsPlaceholder')}
              placeholderZh="输入亮点..."
            />

            <DualLanguageInput
              label={t('form.inclusions')}
              id="inclusions"
              type="richtext"
              valueEn={form.inclusions}
              valueZh={form.inclusions_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, inclusions: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, inclusions_zh: value } : prev))}
              placeholder={t('form.inclusionsPlaceholder')}
              placeholderZh="输入包含内容..."
            />

            <DualLanguageInput
              label={t('form.exclusions')}
              id="exclusions"
              type="richtext"
              valueEn={form.exclusions}
              valueZh={form.exclusions_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, exclusions: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, exclusions_zh: value } : prev))}
              placeholder={t('form.exclusionsPlaceholder')}
              placeholderZh="输入不包含内容..."
            />
          </CardContent>
        </Card>

        <DualLanguageItinerary
          itineraryEn={itinerary}
          itineraryZh={itineraryZh}
          onChangeEn={setItinerary}
          onChangeZh={setItineraryZh}
          t={tForm}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t('form.additionalDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DualLanguageInput
              label={t('form.whatToBringOnePerLine')}
              id="what_to_bring"
              type="textarea"
              valueEn={form.what_to_bring}
              valueZh={form.what_to_bring_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, what_to_bring: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, what_to_bring_zh: value } : prev))}
              placeholder={t('form.whatToBringPlaceholder')}
              placeholderZh="输入需携带物品（每行一项）..."
              rows={4}
            />

            <DualLanguageInput
              label="Pick Up Information"
              id="pick_up_information"
              type="richtext"
              valueEn={form.pick_up_information}
              valueZh={form.pick_up_information_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, pick_up_information: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, pick_up_information_zh: value } : prev))}
              placeholder="Enter pick up details, instructions, and locations..."
              placeholderZh="输入接送详情、说明和地点..."
            />

            <DualLanguageInput
              label={t('form.notSuitableForOnePerLine')}
              id="not_suitable_for"
              type="textarea"
              valueEn={form.not_suitable_for}
              valueZh={form.not_suitable_for_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, not_suitable_for: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, not_suitable_for_zh: value } : prev))}
              placeholder={t('form.notSuitableForPlaceholder')}
              placeholderZh="输入不适合人群（每行一项）..."
              rows={3}
            />

            <DualLanguageInput
              label={t('form.meetingPoint')}
              id="meeting_point"
              type="text"
              valueEn={form.meeting_point}
              valueZh={form.meeting_point_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, meeting_point: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, meeting_point_zh: value } : prev))}
              placeholder={t('form.meetingPointPlaceholder')}
              placeholderZh="例如：酒店大堂"
            />

            <DualLanguageInput
              label={t('form.cancellationPolicy')}
              id="cancellation"
              type="richtext"
              valueEn={form.cancellation_policy}
              valueZh={form.cancellation_policy_zh || ''}
              onChangeEn={(value) => setForm((prev) => (prev ? { ...prev, cancellation_policy: value } : prev))}
              onChangeZh={(value) => setForm((prev) => (prev ? { ...prev, cancellation_policy_zh: value } : prev))}
              placeholder={t('form.cancellationPolicyPlaceholder')}
              placeholderZh="输入取消政策..."
            />
          </CardContent>
        </Card>

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
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('form.saving')}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {profile?.role === 'supplier' ? t('form.submitForReview') : (form?.status === "draft" ? t('form.publish') : t('form.saveAndPublish'))}
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
            {t('form.saveAsDraft')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/experiences">{t('form.cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
