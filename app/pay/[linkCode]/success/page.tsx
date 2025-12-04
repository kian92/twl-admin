import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Calendar, Mail } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface PaymentSuccessPageProps {
  params: Promise<{ linkCode: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

async function getPaymentLink(linkCode: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/payment-links/${linkCode}`, {
      cache: "no-store",
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function getSubmissionBySessionId(sessionId: string): Promise<{ receipt_url?: string } | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("payment_submissions")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .single();

    if (error) {
      console.error("Error fetching submission:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching submission:", error);
    return null;
  }
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: PaymentSuccessPageProps) {
  const { linkCode } = await params;
  const { session_id } = await searchParams;
  const paymentLink = await getPaymentLink(linkCode);

  if (!paymentLink) {
    notFound();
  }

  // Fetch submission details if we have a session ID
  const submission = session_id ? await getSubmissionBySessionId(session_id) : null;

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: paymentLink.currency || "USD",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Card */}
        <Card>
          <CardContent className="pt-12 pb-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Payment Successful!</h1>
              <p className="text-muted-foreground text-lg mb-8">
                Thank you for your booking. We've sent a confirmation email with all the details.
              </p>

              {/* Booking Details */}
              <div className="bg-muted/50 p-6 rounded-lg text-left space-y-4 mb-8">
                <h2 className="font-semibold text-lg mb-4">Booking Details</h2>
                <div className="grid gap-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-semibold text-right">{paymentLink.title}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-semibold">{paymentLink.destination}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Booking Type</span>
                    <span className="font-semibold">
                      {paymentLink.billing_type === "recurring"
                        ? `Recurring - ${paymentLink.recurring_interval === "year" ? "Yearly" : "Monthly"}`
                        : "One-time Payment"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg text-green-600">
                      {currency.format(paymentLink.price)}
                      {paymentLink.billing_type === "recurring" &&
                        `/${paymentLink.recurring_interval === "year" ? "year" : "month"}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {submission?.receipt_url ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    asChild
                  >
                    <a href={submission.receipt_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download Receipt
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="gap-2" disabled>
                    <Download className="h-4 w-4" />
                    Receipt Processing...
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              What Happens Next?
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Check your email</strong> - We've sent a
                  confirmation with your booking details and receipt.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Prepare for your trip</strong> - Review the
                  details and start planning your adventure.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">3</span>
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">We'll be in touch</strong> - Our team will
                  contact you 48 hours before your experience.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Questions? Contact us at{" "}
            <a href="mailto:support@thewanderinglens.com" className="text-primary hover:underline">
              support@thewanderinglens.com
            </a>
          </p>
          <div className="mt-4">
            <Link href="/">
              <Button variant="ghost">Return to Homepage</Button>
            </Link>
          </div>
        </div>

        {session_id && (
          <p className="text-center text-xs text-muted-foreground">
            Session ID: {session_id}
          </p>
        )}
      </div>
    </div>
  );
}
