"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
});

export default function MapClientWrapper({
  latitude,
  longitude,
  location,
  variant,
}: {
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
  variant?: "default" | "admin-preview";
}) {
  return (
    <PropertyMap
      latitude={latitude}
      location={location}
      longitude={longitude}
      variant={variant}
    />
  );
}
