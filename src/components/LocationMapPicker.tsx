import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { Crosshair, LocateFixed, MapPinned, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCoordinatePair, STORE_COORDINATES, type MapCoordinates } from "@/lib/transport";

type LocationMapPickerProps = {
  value: MapCoordinates | null;
  onChange: (value: MapCoordinates | null) => void;
};

const DEFAULT_ZOOM = 13;
const FOCUSED_ZOOM = 15;
const STORE_POSITION: LatLngTuple = [STORE_COORDINATES.lat, STORE_COORDINATES.lng];

const MapEvents = ({
  position,
  onPick,
}: {
  position: MapCoordinates | null;
  onPick: (value: MapCoordinates) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    const nextPosition = position ? ([position.lat, position.lng] as LatLngTuple) : STORE_POSITION;
    map.flyTo(nextPosition, position ? FOCUSED_ZOOM : DEFAULT_ZOOM, { duration: 0.75 });
  }, [map, position]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [map]);

  useMapEvents({
    click(event) {
      onPick({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
};

const LocationMapPicker = ({ value, onChange }: LocationMapPickerProps) => {
  const [open, setOpen] = useState(false);
  const [draftSelection, setDraftSelection] = useState<MapCoordinates | null>(value);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (open) {
      setDraftSelection(value);
      setLocationError("");
    }
  }, [open, value]);

  const selectedLabel = useMemo(
    () => (draftSelection ? formatCoordinatePair(draftSelection) : "No map pin selected yet."),
    [draftSelection],
  );

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location access is not available in this browser.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraftSelection({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setIsLocating(false);
      },
      () => {
        setLocationError("We couldn't read your current location. You can still tap the map to drop a pin.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
      >
        <MapPinned className="h-4 w-4" />
        Pick on map
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-0 shadow-[0_40px_120px_-64px_rgba(15,23,42,0.45)]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-h-[24rem] border-b border-border/70 lg:min-h-[32rem] lg:border-b-0 lg:border-r">
              <MapContainer
                center={STORE_POSITION}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom
                className="h-full min-h-[24rem] w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents position={draftSelection} onPick={setDraftSelection} />

                <CircleMarker
                  center={STORE_POSITION}
                  radius={8}
                  pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.95, weight: 2 }}
                >
                  <Tooltip direction="top" offset={[0, -10]}>
                    Dubai Shopping Centre
                  </Tooltip>
                </CircleMarker>

                {draftSelection ? (
                  <CircleMarker
                    center={[draftSelection.lat, draftSelection.lng]}
                    radius={11}
                    pathOptions={{ color: "#0f172a", fillColor: "#0891b2", fillOpacity: 0.96, weight: 3 }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                      Delivery pin
                    </Tooltip>
                  </CircleMarker>
                ) : null}
              </MapContainer>
            </div>

            <div className="flex flex-col p-6">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl text-foreground">Select your location</DialogTitle>
                <DialogDescription className="text-sm leading-6 text-muted-foreground">
                  Tap the map to drop a delivery pin. The selected point will be used for a more precise transport estimate.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 rounded-[1.35rem] border border-border/70 bg-background/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Selected pin</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{selectedLabel}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Orange marker: store location. Blue marker: your delivery pin.
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
                >
                  <LocateFixed className="h-4 w-4" />
                  {isLocating ? "Finding location..." : "Use current location"}
                </button>

                <button
                  type="button"
                  onClick={() => setDraftSelection(null)}
                  disabled={!draftSelection}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-border bg-background px-4 text-sm font-semibold text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear pin
                </button>
              </div>

              {locationError ? (
                <p className="mt-4 rounded-[1rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {locationError}
                </p>
              ) : null}

              <div className="mt-6 rounded-[1.35rem] border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Crosshair className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Keep your typed address for delivery instructions, then use the pin to show the exact spot for transport.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(draftSelection);
                    setOpen(false);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-[1rem] bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Use selected pin
                </button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LocationMapPicker;
