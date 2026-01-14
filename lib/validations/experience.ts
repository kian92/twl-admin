import { z } from "zod"
import type { Database } from "@/types/database"

const trimString = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const normalizeStringArray = (values?: string[] | null) => {
  if (!values) return []
  return values.map((value) => value.trim()).filter(Boolean)
}

const itineraryItemSchema = z.object({
  day: z.number().min(1),
  time: z.string().optional(),
  activity: z.string().min(1),
})

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
})

export const experiencePayloadSchema = z.object({
  title: z.string().min(1).or(z.literal("")),
  location: z.string().min(1).or(z.literal("")),
  country: z.string().min(1).or(z.literal("")),
  duration: z.string().min(1).or(z.literal("")),
  adult_price: z.number().nonnegative(),
  child_price: z.number().nonnegative(),
  adult_min_age: z.number().int().nonnegative().optional().default(18),
  adult_max_age: z.number().int().nonnegative().optional().nullable(),
  child_min_age: z.number().int().nonnegative().optional().default(3),
  child_max_age: z.number().int().nonnegative().optional().default(17),
  available_from: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Invalid start date" }),
  available_to: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Invalid end date" }),
  min_group_size: z.number().int().positive().optional(),
  max_group_size: z.number().int().positive().optional().nullable(),
  category: z.string().min(1).or(z.literal("")),
  description: z.string().optional().nullable(),
  // image_url: z.string().url().optional().nullable(),
  highlights: z.string().optional().nullable(),
  inclusions: z.string().optional().nullable(),
  exclusions: z.string().optional().nullable(),
  not_suitable_for: z.array(z.string()).optional().nullable(),
  meeting_point: z.string().optional().nullable(),
  what_to_bring: z.array(z.string()).optional().nullable(),
  pick_up_information: z.string().optional().nullable(),
  cancellation_policy: z.string().optional().nullable(),
  itinerary: z.array(itineraryItemSchema).optional().nullable(),
  gallery: z.array(z.string()).optional().nullable(),
  faqs: z.array(faqItemSchema).optional().nullable(),
  is_destination_featured: z.boolean().optional().nullable(),
  status: z.enum(["draft", "review", "active"]).optional().default("active"),
})
  .refine(
    (data) => {
      if (!data.available_from || !data.available_to) return true
      return new Date(data.available_from) <= new Date(data.available_to)
    },
    { message: "Availability end date must be on or after start date", path: ["available_to"] },
  )
  .refine(
    (data) => {
      if (data.min_group_size === undefined || data.max_group_size === undefined || data.max_group_size === null) return true
      return data.min_group_size <= data.max_group_size
    },
    { message: "Max group size must be greater than or equal to min group size", path: ["max_group_size"] },
  )

type ExperienceInsert = Database["public"]["Tables"]["experiences"]["Insert"]

export type ExperiencePayload = z.infer<typeof experiencePayloadSchema>

const normalizeItinerary = (values?: ExperiencePayload["itinerary"]) => {
  if (!values) return null
  const cleaned = values
    .map((item) => ({
      day: item.day,
      time: item.time?.trim() || undefined,
      activity: item.activity.trim(),
    }))
    .filter((item) => item.activity)
  return cleaned.length > 0 ? cleaned : null
}

const normalizeFaqs = (values?: ExperiencePayload["faqs"]) => {
  if (!values) return null
  const cleaned = values
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer)
  return cleaned.length > 0 ? cleaned : null
}

export function normalizeExperiencePayload(payload: ExperiencePayload): Omit<ExperienceInsert, 'slug'> {
  return {
    title: payload.title || "Untitled Experience",
    location: payload.location || "",
    country: payload.country || "",
    duration: payload.duration || "",
    price: payload.adult_price,
    adult_price: payload.adult_price,
    child_price: payload.child_price,
    adult_min_age: payload.adult_min_age ?? 18,
    adult_max_age: payload.adult_max_age ?? null,
    child_min_age: payload.child_min_age ?? 3,
    child_max_age: payload.child_max_age ?? 17,
    available_from: payload.available_from ?? null,
    available_to: payload.available_to ?? null,
    min_group_size: payload.min_group_size ?? 1,
    max_group_size: payload.max_group_size ?? null,
    category: payload.category || "",
    description: payload.description ?? null,
    // image_url: trimString(payload.image_url),
    highlights: trimString(payload.highlights),
    inclusions: trimString(payload.inclusions),
    exclusions: trimString(payload.exclusions),
    not_suitable_for: normalizeStringArray(payload.not_suitable_for),
    meeting_point: trimString(payload.meeting_point),
    what_to_bring: normalizeStringArray(payload.what_to_bring),
    pick_up_information: trimString(payload.pick_up_information),
    cancellation_policy: payload.cancellation_policy ?? null,
    itinerary: normalizeItinerary(payload.itinerary),
    gallery: normalizeStringArray(payload.gallery),
    faqs: normalizeFaqs(payload.faqs),
    is_destination_featured: payload.is_destination_featured ?? false,
    status: payload.status ?? "active",
  }
}
