"use client";

interface PropertyGalleryProps {
  images: string[];
}

export default function PropertyGallery({ images }: PropertyGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x">
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`flex-none w-48 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer transition-opacity snap-start ${
            idx === 0
              ? "ring-2 ring-mosque ring-offset-2 ring-offset-clear-day"
              : "opacity-70 hover:opacity-100"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`Property gallery ${idx + 1}`}
            className="w-full h-full object-cover"
            src={img}
          />
        </div>
      ))}
    </div>
  );
}
