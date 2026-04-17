"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSyncExternalStore } from "react";

export default function PropertyMap({
  latitude,
  longitude,
  location,
}: {
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const hasCoordinates = latitude != null && longitude != null;
  const position: [number, number] = hasCoordinates
    ? [Number(latitude), Number(longitude)]
    : [37.4419, -122.143];

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <span className="material-icons text-mosque animate-pulse text-4xl">map</span>
      </div>
    );
  }

  const customIcon = L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div class="w-8 h-8 bg-mosque rounded-full border-4 border-white shadow-lg animate-bounce flex items-center justify-center">
            <span class="material-icons text-white text-[12px]">home</span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={position} icon={customIcon}>
          <Popup>{location || "Property location"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
