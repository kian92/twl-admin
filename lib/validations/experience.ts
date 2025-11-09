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
  time: z.string().min(1),
  activity: z.string().min(1),
})

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
})

export const experiencePayloadSchema = z.object({
  title: z.string().min(1),
  location: z.string().min(1),
  country: z.string().min(1),
  duration: z.string().min(1),
  price: z.number().nonnegative(),
  category: z.string().min(1),
  description: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  highlights: z.array(z.string()).optional().nullable(),
  inclusions: z.array(z.string()).optional().nullable(),
  exclusions: z.array(z.string()).optional().nullable(),
  not_suitable_for: z.array(z.string()).optional().nullable(),
  meeting_point: z.string().optional().nullable(),
  what_to_bring: z.array(z.string()).optional().nullable(),
  cancellation_policy: z.string().optional().nullable(),
  itinerary: z.array(itineraryItemSchema).optional().nullable(),
  gallery: z.array(z.string()).optional().nullable(),
  faqs: z.array(faqItemSchema).optional().nullable(),
})

type ExperienceInsert = Database["public"]["Tables"]["experiences"]["Insert"]

export type ExperiencePayload = z.infer<typeof experiencePayloadSchema>

const normalizeItinerary = (values?: ExperiencePayload["itinerary"]) => {
  if (!values) return null
  const cleaned = values
    .map((item) => ({
      time: item.time.trim(),
      activity: item.activity.trim(),
    }))
    .filter((item) => item.time && item.activity)
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

export function normalizeExperiencePayload(payload: ExperiencePayload): ExperienceInsert {
  return {
    title: payload.title,
    location: payload.location,
    country: payload.country,
    duration: payload.duration,
    price: payload.price,
    category: payload.category,
    description: payload.description ?? null,
    image_url: trimString(payload.image_url),
    highlights: normalizeStringArray(payload.highlights),
    inclusions: normalizeStringArray(payload.inclusions),
    exclusions: normalizeStringArray(payload.exclusions),
    not_suitable_for: normalizeStringArray(payload.not_suitable_for),
    meeting_point: trimString(payload.meeting_point),
    what_to_bring: normalizeStringArray(payload.what_to_bring),
    cancellation_policy: payload.cancellation_policy ?? null,
    itinerary: normalizeItinerary(payload.itinerary),
    gallery: normalizeStringArray(payload.gallery),
    faqs: normalizeFaqs(payload.faqs),
  }
}
