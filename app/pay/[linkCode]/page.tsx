import { notFound } from "next/navigation";
import { PaymentLinkCheckout } from "@/components/payment-links/payment-link-checkout";

interface PaymentLinkPageProps {
  params: Promise<{ linkCode: string }>;
}

async function getPaymentLink(linkCode: string) {
  try {
    // In production, this would fetch from your database
    // For now, we'll return the structure expected
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

export default async function PaymentLinkPage({ params }: PaymentLinkPageProps) {
  const { linkCode } = await params;
  const paymentLink = await getPaymentLink(linkCode);

  if (!paymentLink) {
    notFound();
  }

  // Check if link is expired or inactive
  if (paymentLink.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card p-8 rounded-lg shadow-lg text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Link Inactive</h1>
            <p className="text-muted-foreground">
              This payment link is no longer active. Please contact the organizer for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if link is expired
  if (paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card p-8 rounded-lg shadow-lg text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Link Expired</h1>
            <p className="text-muted-foreground">
              This payment link has expired. Please contact the organizer for a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if max uses reached
  if (
    paymentLink.max_uses &&
    paymentLink.current_uses >= paymentLink.max_uses
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card p-8 rounded-lg shadow-lg text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Maximum Uses Reached</h1>
            <p className="text-muted-foreground">
              This payment link has reached its maximum number of uses. Please contact the
              organizer for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <PaymentLinkCheckout paymentLink={paymentLink} />;
}
