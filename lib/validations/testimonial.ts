import { z } from "zod"
import type { Database } from "@/types/database"

const trimString = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export const testimonialPayloadSchema = z.object({
  author_name: z.string().min(1, "Author name is required"),
  author_location: z.string().optional().nullable(),
  tour_name: z.string().optional().nullable(),
  tour_date: z.string().optional().nullable(),
  content: z.string().min(1, "Testimonial content is required"),
  platform: z
    .enum(["instagram", "facebook", "twitter", "google", "website", "email", "other"])
    .optional()
    .nullable(),
  social_media_url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  image_url: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  is_featured: z.boolean().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  display_order: z.number().int().nonnegative().optional().nullable(),
  experience_id: z.string().uuid().optional().nullable(),
})

type TestimonialInsert = Database["public"]["Tables"]["testimonials"]["Insert"]

export type TestimonialPayload = z.infer<typeof testimonialPayloadSchema>

export function normalizeTestimonialPayload(payload: TestimonialPayload): TestimonialInsert {
  return {
    author_name: payload.author_name.trim(),
    author_location: trimString(payload.author_location),
    tour_name: trimString(payload.tour_name),
    tour_date: trimString(payload.tour_date),
    content: payload.content.trim(),
    platform: payload.platform ?? null,
    social_media_url: trimString(payload.social_media_url),
    image_url: trimString(payload.image_url),
    is_featured: payload.is_featured ?? false,
    is_active: payload.is_active ?? true,
    display_order: payload.display_order ?? 0,
    experience_id: payload.experience_id ?? null,
  }
}
