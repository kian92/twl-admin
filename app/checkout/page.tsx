import { Header } from "@/components/header"
import { Breadcrumb } from "@/components/breadcrumb"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { CheckoutSummary } from "@/components/checkout/checkout-summary"

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <Breadcrumb items={[{ label: "My Trip", href: "/my-trip" }, { label: "Checkout" }]} />

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Checkout</h1>
            <p className="text-lg text-muted-foreground">Complete your booking and start your adventure</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CheckoutForm />
            </div>
            <div>
              <CheckoutSummary />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
