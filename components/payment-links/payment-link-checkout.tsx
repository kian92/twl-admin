"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  MapPin,
  DollarSign,
  User,
  Mail,
  CreditCard,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type PaymentLinkRow = Database["public"]["Tables"]["payment_links"]["Row"];

const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().min(6, "Valid phone number is required"),
  travelDate: z.string().min(1, "Travel date is required"),
  travelers: z.number().min(1, "At least 1 traveler required"),
  notes: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface PaymentLinkCheckoutProps {
  paymentLink: PaymentLinkRow;
}

export function PaymentLinkCheckout({ paymentLink }: PaymentLinkCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      travelers: 1,
      agreeToTerms: false,
      phoneCountryCode: "+1",
      phoneNumber: "",
    },
  });

  const travelers = watch("travelers");

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: paymentLink.currency || "USD",
  });

  const totalPrice = paymentLink.price * (travelers || 1);

  const onSubmit = async (data: CheckoutFormData) => {
    if (!agreeToTerms) {
      toast.error("You must agree to the terms and conditions");
      return;
    }

    setIsProcessing(true);

    try {
      console.log("Payment link data:", paymentLink);
      console.log("Form data:", data);

      // Create checkout session with Stripe
      const response = await fetch("/api/payment-links/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentLinkId: paymentLink.id,
          ...data,
          totalAmount: totalPrice,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // For now, show message about Stripe setup
      if (result.error) {
        toast.error(result.message || result.error);
        setIsProcessing(false);
        return;
      }

      // Redirect to Stripe Checkout when ready
      if (result.sessionUrl) {
        window.location.href = result.sessionUrl;
      } else {
        toast.success("Booking created! (Stripe integration pending)");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your booking. You will receive a confirmation email shortly.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking:</span>
                <span className="font-semibold">{paymentLink.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-semibold">{paymentLink.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="font-semibold text-green-600">{currency.format(totalPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 py-8 px-4">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Left Column - Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Complete Your Booking</h1>
            <p className="text-muted-foreground">
              Fill in your details to secure your spot for this experience
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...register("firstName")} />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...register("lastName")} />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-10" {...register("email")} />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <PhoneInput
                    value={watch("phoneNumber")}
                    onChange={(value) => setValue("phoneNumber", value)}
                    countryCode={watch("phoneCountryCode")}
                    onCountryCodeChange={(code) => setValue("phoneCountryCode", code)}
                    placeholder="Enter phone number"
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                  )}
                  {errors.phoneCountryCode && (
                    <p className="text-sm text-destructive">{errors.phoneCountryCode.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Travel Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Travel Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="travelDate">Preferred Travel Date</Label>
                  <Input
                    id="travelDate"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    {...register("travelDate")}
                  />
                  {errors.travelDate && (
                    <p className="text-sm text-destructive">{errors.travelDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Requests (Optional)</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    placeholder="Any dietary restrictions, accessibility needs, or special requests..."
                    {...register("notes")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Secure Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to Stripe's secure checkout page to complete your payment
                    with credit or debit card.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Badge variant="outline" className="gap-1">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 10h18M3 14h18M7 18h10M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                    Visa
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 10h18M3 14h18M7 18h10M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                    Mastercard
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 10h18M3 14h18M7 18h10M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                    Amex
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Submit */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => {
                      setAgreeToTerms(checked === true);
                      setValue("agreeToTerms", checked === true);
                    }}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I agree to the terms and conditions, cancellation policy, and privacy policy. I
                    understand that all bookings are subject to availability.
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing || !agreeToTerms}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Continue to Payment - ${currency.format(totalPrice)}`
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secured by Stripe • Your payment information is encrypted and secure
                </p>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentLink.image_url && (
                <img
                  src={paymentLink.image_url}
                  alt={paymentLink.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <div>
                <h3 className="font-semibold text-lg mb-2">{paymentLink.title}</h3>
                {paymentLink.description && (
                  <p className="text-sm text-muted-foreground mb-4">{paymentLink.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{paymentLink.destination}</p>
                      {paymentLink.destination_description && (
                        <p className="text-muted-foreground text-xs mt-1">
                          {paymentLink.destination_description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">{currency.format(paymentLink.price)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{currency.format(totalPrice)}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  By completing this booking, you agree to our cancellation policy and terms of
                  service. A confirmation email will be sent to your email address.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
