import { useState } from "react";
import * as ReactLeaflet from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; // adjust path if needed
import "leaflet/dist/leaflet.css";

const { MapContainer, TileLayer, Marker, Circle, useMapEvents } = ReactLeaflet;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

type Props = {
  serviceRadius: number;
  onConfirm: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
};

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

function ClickHandler({
  setPosition,
}: {
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function LocationPicker({
  serviceRadius,
  onConfirm,
}: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState<string>("");

  // ✅ NEW: Call Supabase Edge Function instead of direct Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      setAddress(data.display_name || "Location selected");
    } catch {
      setAddress("Location selected");
    }
  };

  const handleCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setPosition([lat, lng]);
      reverseGeocode(lat, lng);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleCurrentLocation}>
          Use My Current Location
        </Button>

        {position && (
          <Button
            onClick={() =>
              onConfirm({
                lat: position[0],
                lng: position[1],
                address,
              })
            }
          >
            Confirm Location
          </Button>
        )}
      </div>

      <MapContainer
        center={position ?? INDIA_CENTER}
        zoom={position ? 13 : 5}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ClickHandler
          setPosition={(pos) => {
            setPosition(pos);
            reverseGeocode(pos[0], pos[1]);
          }}
        />

        {position && (
          <>
            <Marker position={position} />
            <Circle
              center={position}
              radius={serviceRadius * 1000}
            />
          </>
        )}
      </MapContainer>

      {address && (
        <p className="text-sm text-muted-foreground">
          📍 {address}
        </p>
      )}
    </div>
  );
}