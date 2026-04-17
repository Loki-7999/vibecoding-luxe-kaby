"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSyncExternalStore } from "react";

export default function PropertyMap({
  latitude,
  longitude,
  location,
  variant = "default",
}: {
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
  variant?: "default" | "admin-preview";
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 &&
    Number(latitude) <= 90 &&
    Number(longitude) >= -180 &&
    Number(longitude) <= 180;
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

  const markerIcon =
    variant === "admin-preview"
      ? L.icon({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      : L.divIcon({
          className: "custom-leaflet-icon",
          html: `<div class="w-8 h-8 bg-mosque rounded-full border-4 border-white shadow-lg animate-bounce flex items-center justify-center">
                  <span class="material-icons text-white text-[12px]">home</span>
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

  const zoom = variant === "admin-preview" ? 10 : 13;
  const tileUrl =
    variant === "admin-preview"
      ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const attribution =
    variant === "admin-preview"
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      : '&copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        key={`${position[0]}-${position[1]}`}
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer attribution={attribution} url={tileUrl} />
        <Marker position={position} icon={markerIcon}>
          <Popup>{location || "Property location"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
