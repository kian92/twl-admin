"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign, Link as LinkIcon, Calendar, Hash, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type PaymentLinkRow = Database["public"]["Tables"]["payment_links"]["Row"];

const paymentLinkSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  destination: z.string().min(2, "Destination is required"),
  destination_description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().default("USD"),
  link_code: z
    .string()
    .min(4, "Link code must be at least 4 characters")
    .regex(/^[a-zA-Z0-9-_]+$/, "Only letters, numbers, hyphens, and underscores allowed"),
  status: z.enum(["active", "inactive"]),
  expires_at: z.string().optional(),
  max_uses: z.number().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  billing_type: z.enum(["one_time", "recurring"]).default("one_time"),
  recurring_interval: z.enum(["month", "year"]).optional(),
});

type PaymentLinkFormData = z.infer<typeof paymentLinkSchema>;

interface PaymentLinkFormProps {
  link?: PaymentLinkRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentLinkForm({ link, onSuccess, onCancel }: PaymentLinkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(!!link?.expires_at);
  const [hasMaxUses, setHasMaxUses] = useState(!!link?.max_uses);
  const [isRecurring, setIsRecurring] = useState(link?.billing_type === "recurring");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentLinkFormData>({
    resolver: zodResolver(paymentLinkSchema),
    defaultValues: {
      title: link?.title || "",
      description: link?.description || "",
      destination: link?.destination || "",
      destination_description: link?.destination_description || "",
      price: link?.price || 0,
      currency: link?.currency || "USD",
      link_code: link?.link_code || "",
      status: link?.status === "active" ? "active" : "inactive",
      expires_at: link?.expires_at ? new Date(link.expires_at).toISOString().split("T")[0] : "",
      max_uses: link?.max_uses || undefined,
      image_url: link?.image_url || "",
      billing_type: (link?.billing_type === "recurring" ? "recurring" : "one_time") as "one_time" | "recurring",
      recurring_interval: (link?.recurring_interval as "month" | "year" | undefined) || undefined,
    },
  });

  const status = watch("status");
  const billingType = watch("billing_type");

  const generateLinkCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    setValue("link_code", randomCode);
  };

  const onSubmit = async (data: PaymentLinkFormData) => {
    setIsSubmitting(true);

    try {
      // Clean up data
      const payload = {
        ...data,
        expires_at: hasExpiration && data.expires_at ? data.expires_at : null,
        max_uses: hasMaxUses ? data.max_uses : null,
        image_url: data.image_url || null,
      };

      const url = link ? `/api/admin/payment-links/${link.id}` : "/api/admin/payment-links";
      const method = link ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save payment link");
      }

      toast.success(link ? "Payment link updated successfully" : "Payment link created successfully");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Payment Link Title
            </Label>
            <Input
              id="title"
              placeholder="e.g., Private Photography Tour - Paris"
              {...register("title")}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this payment is for..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url" className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Image URL (Optional)
            </Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...register("image_url")}
            />
            {errors.image_url && (
              <p className="text-sm text-destructive">{errors.image_url.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Destination Information */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Destination
            </Label>
            <Input
              id="destination"
              placeholder="e.g., Paris, France"
              {...register("destination")}
            />
            {errors.destination && (
              <p className="text-sm text-destructive">{errors.destination.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_description">Destination Description (Optional)</Label>
            <Textarea
              id="destination_description"
              placeholder="Describe the destination, what makes it special, what to expect..."
              rows={4}
              {...register("destination_description")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                defaultValue={link?.currency || "USD"}
                onValueChange={(value) => setValue("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="SGD">SGD (S$)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Billing Type */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="billing_type">Billing Type</Label>
              <Select
                value={billingType}
                onValueChange={(value) => {
                  setValue("billing_type", value as "one_time" | "recurring");
                  setIsRecurring(value === "recurring");
                  if (value === "one_time") {
                    setValue("recurring_interval", undefined);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-time Payment</SelectItem>
                  <SelectItem value="recurring">Recurring Subscription</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                One-time for single payments, Recurring for monthly/yearly subscriptions
              </p>
            </div>

            {billingType === "recurring" && (
              <div className="space-y-2">
                <Label htmlFor="recurring_interval">Recurring Interval</Label>
                <Select
                  defaultValue={link?.recurring_interval || "month"}
                  onValueChange={(value) => setValue("recurring_interval", value as "month" | "year")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Customer will be charged automatically every {watch("recurring_interval") === "year" ? "year" : "month"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link Configuration */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link_code" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Link Code (URL Path)
            </Label>
            <div className="flex gap-2">
              <Input
                id="link_code"
                placeholder="custom-link-code"
                {...register("link_code")}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={generateLinkCode}>
                Generate
              </Button>
            </div>
            {errors.link_code && (
              <p className="text-sm text-destructive">{errors.link_code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your payment link will be:{" "}
              <code className="bg-muted px-2 py-0.5 rounded">
                {typeof window !== "undefined" ? window.location.origin : "yourdomain.com"}/pay/
                {watch("link_code") || "your-code"}
              </code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue={status}
              onValueChange={(value) => setValue("status", value as "active" | "inactive")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="has-expiration" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Set Expiration Date
                </Label>
                <p className="text-xs text-muted-foreground">Link will expire after this date</p>
              </div>
              <Switch
                id="has-expiration"
                checked={hasExpiration}
                onCheckedChange={setHasExpiration}
              />
            </div>

            {hasExpiration && (
              <div className="space-y-2">
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  {...register("expires_at")}
                />
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="has-max-uses">Limit Number of Uses</Label>
                <p className="text-xs text-muted-foreground">
                  Link will become inactive after max uses
                </p>
              </div>
              <Switch id="has-max-uses" checked={hasMaxUses} onCheckedChange={setHasMaxUses} />
            </div>

            {hasMaxUses && (
              <div className="space-y-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 10"
                  {...register("max_uses", { valueAsNumber: true })}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              {link ? "Updating..." : "Creating..."}
            </>
          ) : link ? (
            "Update Payment Link"
          ) : (
            "Create Payment Link"
          )}
        </Button>
      </div>
    </form>
  );
}
