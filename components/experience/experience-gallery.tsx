"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react"

interface ExperienceGalleryProps {
  images: string[]
  title: string
}

export function ExperienceGallery({ images, title }: ExperienceGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const previewImages = images.slice(0, 5)
  const remainingCount = Math.max(0, images.length - 5)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      <div className="relative">
        <div className="grid grid-cols-4 gap-2 h-[400px] md:h-[500px]">
          {/* Main large image */}
          <div
            className="col-span-4 md:col-span-2 md:row-span-2 relative overflow-hidden rounded-lg cursor-pointer group"
            onClick={() => setIsOpen(true)}
          >
            <img
              src={previewImages[0] || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>

          {/* Thumbnail images */}
          {previewImages.slice(1, 5).map((image, index) => (
            <div
              key={index}
              className="col-span-2 md:col-span-1 relative overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => {
                setCurrentIndex(index + 1)
                setIsOpen(true)
              }}
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`${title} ${index + 2}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Show remaining count on last image */}
              {index === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Images className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-lg font-semibold">+{remainingCount} more</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <div className="relative h-full flex items-center justify-center bg-black">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
              onClick={prevImage}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <img
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`${title} ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
              onClick={nextImage}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
