import { Header } from "@/components/header"
import { Breadcrumb } from "@/components/breadcrumb"
import { TripPlaylist } from "@/components/trip/trip-playlist"
import { TripSummary } from "@/components/trip/trip-summary"

export default function MyTripPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <Breadcrumb items={[{ label: "My Trip" }]} />
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Trip Playlist</h1>
            <p className="text-lg text-muted-foreground">Curate your perfect journey</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TripPlaylist />
            </div>
            <div>
              <TripSummary />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
