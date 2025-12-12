"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { User, MapPin, MessageSquare, Calendar, Image as ImageIcon, Upload } from "lucide-react"
import { toast } from "sonner"
import type { Database } from "@/types/database"

type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"]

const testimonialSchema = z.object({
  author_name: z.string().min(1, "Author name is required"),
  author_location: z.string().optional(),
  tour_name: z.string().optional(),
  tour_date: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  platform: z.enum(["instagram", "facebook", "twitter", "google", "website", "email", "other"]).optional(),
  social_media_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  image_url: z.string().url("Invalid image URL").optional().or(z.literal("")),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  display_order: z.number().int().nonnegative(),
})

type TestimonialFormData = z.infer<typeof testimonialSchema>

interface TestimonialFormProps {
  testimonial?: TestimonialRow
  onSuccess: (testimonial: TestimonialRow) => void
}

export function TestimonialForm({ testimonial, onSuccess }: TestimonialFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(testimonial?.image_url || "")
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      author_name: testimonial?.author_name || "",
      author_location: testimonial?.author_location || "",
      tour_name: testimonial?.tour_name || "",
      tour_date: testimonial?.tour_date || "",
      content: testimonial?.content || "",
      platform: (testimonial?.platform as any) || undefined,
      social_media_url: testimonial?.social_media_url || "",
      image_url: testimonial?.image_url || "",
      is_featured: testimonial?.is_featured ?? false,
      is_active: testimonial?.is_active ?? true,
      display_order: testimonial?.display_order ?? 0,
    },
  })

  const platform = watch("platform")
  const isFeatured = watch("is_featured")
  const isActive = watch("is_active")

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/admin/bunny/upload-image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await response.json()
    return data.url
  }

  const onSubmit = async (data: TestimonialFormData) => {
    setIsSubmitting(true)

    try {
      let imageUrl = data.image_url

      // Upload image if a new file was selected
      if (imageFile) {
        setIsUploadingImage(true)
        try {
          imageUrl = await uploadImage(imageFile)
        } catch (error) {
          toast.error("Failed to upload image")
          setIsSubmitting(false)
          setIsUploadingImage(false)
          return
        }
        setIsUploadingImage(false)
      }

      // Prepare payload
      const payload = {
        ...data,
        image_url: imageUrl || null,
        author_location: data.author_location || null,
        tour_name: data.tour_name || null,
        tour_date: data.tour_date || null,
        platform: data.platform || null,
        social_media_url: data.social_media_url || null,
      }

      const url = testimonial ? `/api/admin/testimonials/${testimonial.id}` : "/api/admin/testimonials"
      const method = testimonial ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save testimonial")
      }

      const result = await response.json()

      // Fetch the full testimonial data if we only got the ID
      if (result.id && !testimonial) {
        const fetchResponse = await fetch(`/api/admin/testimonials/${result.id}`)
        if (fetchResponse.ok) {
          const fullTestimonial = await fetchResponse.json()
          onSuccess(fullTestimonial)
        }
      } else if (result.id || result.author_name) {
        onSuccess(result)
      }

      toast.success(testimonial ? "Testimonial updated successfully" : "Testimonial created successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Author Information */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Author Name *
            </Label>
            <Input id="author_name" placeholder="e.g., Hannah" {...register("author_name")} />
            {errors.author_name && <p className="text-sm text-destructive">{errors.author_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="author_location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location (Optional)
            </Label>
            <Input
              id="author_location"
              placeholder="e.g., New York, USA"
              {...register("author_location")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tour_name">Tour Name (Optional)</Label>
            <Input
              id="tour_name"
              placeholder="e.g., Tibet Tour - Dec 2024"
              {...register("tour_name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tour_date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tour Date (Optional)
            </Label>
            <Input id="tour_date" placeholder="e.g., Dec 2024" {...register("tour_date")} />
          </div>
        </CardContent>
      </Card>

      {/* Testimonial Content */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Testimonial Content *
            </Label>
            <Textarea
              id="content"
              placeholder="Enter the testimonial content here..."
              rows={6}
              {...register("content")}
            />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={platform}
              onValueChange={(value) => setValue("platform", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_media_url">Social Media URL (Optional)</Label>
            <Input
              id="social_media_url"
              type="url"
              placeholder="https://instagram.com/p/..."
              {...register("social_media_url")}
            />
            {errors.social_media_url && (
              <p className="text-sm text-destructive">{errors.social_media_url.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Profile/Screenshot Image (Optional)
            </Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image-input")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {imageFile ? "Change Image" : "Upload Image"}
              </Button>
              <input
                id="image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imageFile && <span className="text-sm text-muted-foreground">{imageFile.name}</span>}
            </div>

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs max-h-48 object-cover rounded-lg border"
                />
              </div>
            )}

            <div className="space-y-2 mt-4">
              <Label htmlFor="image_url">Or enter image URL</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                {...register("image_url")}
                onChange={(e) => {
                  setValue("image_url", e.target.value)
                  if (e.target.value && !imageFile) {
                    setImagePreview(e.target.value)
                  }
                }}
              />
              {errors.image_url && (
                <p className="text-sm text-destructive">{errors.image_url.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_featured">Featured Testimonial</Label>
              <p className="text-sm text-muted-foreground">Show this testimonial prominently</p>
            </div>
            <Switch
              id="is_featured"
              checked={isFeatured}
              onCheckedChange={(checked) => setValue("is_featured", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">Show this testimonial on the website</p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              placeholder="0"
              {...register("display_order", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">Lower numbers appear first</p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting || isUploadingImage}>
          {isSubmitting ? (isUploadingImage ? "Uploading Image..." : "Saving...") : "Save Testimonial"}
        </Button>
      </div>
    </form>
  )
}
