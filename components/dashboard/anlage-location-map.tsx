"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMapsLibrary,
  useMap,
  useApiLoadingStatus,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

const GERMANY_CENTER = { lat: 51.1657, lng: 10.4515 };
const DEFAULT_ZOOM = 6;
const DETAIL_ZOOM = 17;

/** Google Maps API keys always start with "AIza" and are ~39 chars. */
function isValidKeyFormat(key: string): boolean {
  return key.startsWith("AIza") && key.length > 20;
}

function parseCoord(s: string): number | null {
  if (!s.trim()) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export interface ReverseGeocodedAddress {
  strasse: string;
  hausnr: string;
  plz: string;
  ort: string;
  laenderkennung: string;
  ortsteil: string;
}

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): ReverseGeocodedAddress {
  const get = (type: string, form: "long_name" | "short_name" = "long_name") =>
    components.find((c) => c.types.includes(type))?.[form] ?? "";
  return {
    strasse: get("route"),
    hausnr: get("street_number"),
    plz: get("postal_code"),
    ort:
      get("locality") ||
      get("administrative_area_level_3") ||
      get("administrative_area_level_2"),
    laenderkennung: get("country", "short_name"),
    ortsteil: get("sublocality_level_1") || get("sublocality"),
  };
}

function MapPlaceholder({ message }: { message: string }) {
  return (
    <div className="rounded-md border bg-muted/30 h-[200px] flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <MapPin className="h-5 w-5 opacity-40" />
      <span>{message}</span>
    </div>
  );
}

interface LocationMapInnerProps {
  lat: string;
  lng: string;
  address: string;
  onCoordsChange: (lat: string, lng: string) => void;
  onAddressChange?: (address: ReverseGeocodedAddress) => void;
}

function LocationMapInner({
  lat,
  lng,
  address,
  onCoordsChange,
  onAddressChange,
}: LocationMapInnerProps) {
  const status = useApiLoadingStatus();
  const map = useMap();
  const geocodingLib = useMapsLibrary("geocoding");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // After a drag-based reverse geocode we suppress the forward geocoding for 3 s
  // to avoid a circular update (drag → reverse geocode updates address → address
  // effect fires → forward geocodes address → coords update again).
  const skipForwardGeocodeUntilRef = useRef(0);

  // Stable callback refs so effects don't re-run on every parent render
  const onCoordsChangeRef = useRef(onCoordsChange);
  const onAddressChangeRef = useRef(onAddressChange);
  useEffect(() => { onCoordsChangeRef.current = onCoordsChange; });
  useEffect(() => { onAddressChangeRef.current = onAddressChange; });

  const parsedLat = parseCoord(lat);
  const parsedLng = parseCoord(lng);
  const validLat = parsedLat !== null && parsedLat >= -90 && parsedLat <= 90 ? parsedLat : null;
  const validLng = parsedLng !== null && parsedLng >= -180 && parsedLng <= 180 ? parsedLng : null;
  const hasCoords = validLat !== null && validLng !== null;

  // Init Geocoder once the geocoding library is loaded
  useEffect(() => {
    if (geocodingLib) geocoderRef.current = new geocodingLib.Geocoder();
  }, [geocodingLib]);

  // Pan to coordinates whenever they change to valid values
  useEffect(() => {
    if (!map || !hasCoords) return;
    map.panTo({ lat: validLat!, lng: validLng! });
    if ((map.getZoom() ?? 0) < DETAIL_ZOOM) map.setZoom(DETAIL_ZOOM);
  }, [map, validLat, validLng, hasCoords]);

  // Debounced forward geocoding: address → coords (suppressed after a drag)
  useEffect(() => {
    const trimmed = address.trim();
    if (!trimmed) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (Date.now() < skipForwardGeocodeUntilRef.current) return;
      geocoderRef.current?.geocode({ address: trimmed }, (results, geoStatus) => {
        if (geoStatus === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          onCoordsChangeRef.current(loc.lat().toFixed(6), loc.lng().toFixed(6));
        }
      });
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address]);

  // Shared: place marker at given coords, update form, reverse geocode address
  const placeMarkerAt = useCallback((newLat: number, newLng: number) => {
    onCoordsChangeRef.current(newLat.toFixed(6), newLng.toFixed(6));
    // Suppress forward geocoding for 3 s to avoid circular address → coords → address loop
    skipForwardGeocodeUntilRef.current = Date.now() + 3000;
    geocoderRef.current?.geocode(
      { location: { lat: newLat, lng: newLng } },
      (results, geoStatus) => {
        if (geoStatus === "OK" && results?.[0]?.address_components) {
          onAddressChangeRef.current?.(parseAddressComponents(results[0].address_components));
        }
      }
    );
  }, []);

  // Drag end on existing marker (google.maps.MapMouseEvent — latLng is a LatLng object)
  const handleDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    const newLat = e.latLng?.lat();
    const newLng = e.latLng?.lng();
    if (newLat != null && newLng != null) placeMarkerAt(newLat, newLng);
  }, [placeMarkerAt]);

  // Right-click on map canvas (MapMouseEvent — latLng is a LatLngLiteral { lat, lng })
  const handleContextMenu = useCallback((e: MapMouseEvent) => {
    const { latLng } = e.detail;
    if (latLng) placeMarkerAt(latLng.lat, latLng.lng);
  }, [placeMarkerAt]);

  if (status === "AUTH_FAILURE" || status === "FAILED") {
    return (
      <MapPlaceholder message="Karte konnte nicht geladen werden – API-Schlüssel prüfen." />
    );
  }

  return (
    <div className="rounded-md overflow-hidden border" style={{ height: "200px" }}>
      <Map
        defaultCenter={GERMANY_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId="DEMO_MAP_ID"
        gestureHandling="cooperative"
        disableDefaultUI={false}
        zoomControl={true}
        style={{ width: "100%", height: "100%" }}
        onContextmenu={handleContextMenu}
      >
        {hasCoords && validLat !== null && validLng !== null && (
          <AdvancedMarker
            position={{ lat: validLat, lng: validLng }}
            draggable
            onDragEnd={handleDragEnd}
          />
        )}
      </Map>
    </div>
  );
}

export interface AnlageLocationMapProps {
  apiKey: string;
  lat: string;
  lng: string;
  /** Full address string derived from the address fields — triggers forward geocoding on change */
  address: string;
  onCoordsChange: (lat: string, lng: string) => void;
  /** Called after a marker drag with the reverse-geocoded address components */
  onAddressChange?: (address: ReverseGeocodedAddress) => void;
}

export function AnlageLocationMap({ apiKey, ...props }: AnlageLocationMapProps) {
  if (!isValidKeyFormat(apiKey)) {
    return (
      <MapPlaceholder message="Google Maps API-Schlüssel nicht konfiguriert." />
    );
  }
  return (
    <APIProvider apiKey={apiKey}>
      <LocationMapInner {...props} />
    </APIProvider>
  );
}
