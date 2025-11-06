"use client"

import type React from "react"

import { useTrip } from "@/components/trip-context"
import { EmptyTrip } from "@/components/trip/empty-trip"
import { PlaylistItem } from "@/components/trip/playlist-item"
import { Card } from "@/components/ui/card"
import { Music } from "lucide-react"
import { useState } from "react"

export function TripPlaylist() {
  const { tripItems, reorderTrip } = useTrip()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  if (tripItems.length === 0) {
    return <EmptyTrip />
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newItems = [...tripItems]
    const draggedItem = newItems[draggedIndex]
    newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, draggedItem)

    reorderTrip(newItems)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2">
        <div className="flex items-center gap-3 mb-2">
          <Music className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Your Journey</h2>
        </div>
        <p className="text-muted-foreground">
          Drag and drop to reorder your experiences. Build your perfect itinerary day by day.
        </p>
      </Card>

      <div className="space-y-3">
        {tripItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-all ${draggedIndex === index ? "opacity-50 scale-95" : ""}`}
          >
            <PlaylistItem experience={item} index={index} />
          </div>
        ))}
      </div>
    </div>
  )
}
