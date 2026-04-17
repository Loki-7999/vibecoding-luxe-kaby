"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
});

export default function MapClientWrapper({
  latitude,
  longitude,
  location,
}: {
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
}) {
  return <PropertyMap latitude={latitude} location={location} longitude={longitude} />;
}
