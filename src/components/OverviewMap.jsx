import { useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, ExternalLink, LocateFixed } from "lucide-react";
import { formatEndsOn } from "../lib/date.js";

const popupToneClass = {
  urgent: "text-rust",
  soon: "text-wine",
  normal: "text-ink-soft",
  past: "text-ink-soft/60 line-through",
};

function buildIcon(n, visited, mode) {
  if (mode === "browse") {
    return L.divIcon({
      className: "pin-wrap",
      html: `<div class="pin-dot"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -10],
    });
  }
  return L.divIcon({
    className: "pin-wrap",
    html: `<div class="pin ${visited ? "pin--visited" : ""}"><span>${n}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

export default function OverviewMap({
  galleries,
  visited,
  onToggle,
  mode = "route",
}) {
  const isBrowse = mode === "browse";

  const route = useMemo(
    () => galleries.map((g) => [g.lat, g.lng]),
    [galleries],
  );
  const bounds =
    route.length > 0
      ? route
      : [
          [19.0632, 72.8299],
          [18.9144, 72.8262],
        ];

  const maxBounds = useMemo(() => L.latLngBounds(bounds).pad(0.3), [bounds]);

  const mapRef = useRef(null);
  const recenter = () => {
    mapRef.current?.fitBounds(bounds, { padding: [12, 12] });
  };

  return (
    <div className="h-full px-4 lg:px-0 animate-fade-up-delayed">
      <div
        className="relative h-full overflow-hidden border border-line/70 rounded-md
                   lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l
                   shadow-[0_1px_0_rgba(27,20,16,0.04)]"
      >
        <MapContainer
          ref={mapRef}
          bounds={bounds}
          boundsOptions={{ padding: [12, 12] }}
          maxBounds={maxBounds}
          maxBoundsViscosity={1.0}
          minZoom={14}
          scrollWheelZoom={false}
          zoomControl={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {!isBrowse && (
            <Polyline
              positions={route}
              pathOptions={{
                color: "#7A1E2A",
                weight: 2,
                dashArray: "5 5",
                opacity: 0.7,
              }}
            />
          )}

          {galleries.map((g) => {
            const isVisited = !isBrowse && !!visited?.[g.id];
            const ends = g.show ? formatEndsOn(g.show.endsOn) : null;
            return (
              <Marker
                key={g.id}
                position={[g.lat, g.lng]}
                icon={buildIcon(g.n, isVisited, mode)}
              >
                <Popup>
                  <div className="min-w-[200px] max-w-[240px]">
                    {!isBrowse && onToggle && (
                      <button
                        type="button"
                        onClick={() => onToggle(g.id)}
                        aria-pressed={isVisited}
                        aria-label={
                          isVisited
                            ? `Mark ${g.name} as not visited`
                            : `Mark ${g.name} as visited`
                        }
                        className="focus-ring -mx-1 -mt-1 mb-0.5 inline-flex items-center gap-2 px-1 py-1 rounded-md "
                      >
                        {isVisited ? (
                          <span className="flex items-center justify-center w-[18px] h-[18px] rounded-[5px] bg-wine text-cream">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border border-line bg-cream" />
                        )}
                        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft/85">
                          {String(g.n).padStart(2, "0")} · {g.area}
                        </span>
                      </button>
                    )}

                    {isBrowse && (
                      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft/85 mb-0.5">
                        {g.area}
                      </div>
                    )}

                    <div
                      className={`font-display text-[16px] leading-tight text-ink mt-0.5 ${
                        isVisited ? "line-through opacity-50" : ""
                      }`}
                      style={{
                        fontVariationSettings:
                          "'opsz' 36, 'SOFT' 50, 'wght' 480",
                      }}
                    >
                      {g.name}
                    </div>

                    {g.show?.title && (
                      <div
                        className={`mt-1.5 flex items-baseline gap-1.5 flex-wrap ${
                          isVisited ? "opacity-50" : ""
                        }`}
                      >
                        <span
                          className="italic font-display text-[13px] text-ink-soft leading-snug"
                          style={{
                            fontVariationSettings:
                              "'opsz' 18, 'SOFT' 80, 'wght' 420",
                          }}
                        >
                          {g.show.title}
                        </span>
                        {g.show.isNew && (
                          <span className="font-mono text-[8.5px] tracking-[0.18em] uppercase px-1 py-0.5 rounded-sm bg-wine text-cream leading-none">
                            New
                          </span>
                        )}
                      </div>
                    )}
                    {g.show?.artist && (
                      <div
                        className={`text-[11.5px] text-ink-soft/85 leading-snug ${
                          isVisited ? "opacity-50" : ""
                        }`}
                      >
                        {g.show.artist}
                      </div>
                    )}
                    {ends && (
                      <div
                        className={`mt-1 font-mono text-[10px] tracking-wider uppercase ${popupToneClass[ends.tone]}`}
                      >
                        {ends.text}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <a
                      href={g.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] tracking-wider uppercase border border-line/70 text-ink hover:text-wine hover:border-wine/60"
                    >
                      Maps <ExternalLink size={10} />
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <button
          type="button"
          onClick={recenter}
          aria-label="Recenter map"
          className="absolute top-3 right-3 z-[1000] focus-ring inline-flex items-center gap-1.5
                     px-2.5 py-1.5 rounded-md
                     bg-cream/95 backdrop-blur-sm border border-line/80
                     text-ink-soft hover:text-wine hover:border-wine/60
                     font-mono text-[10px] tracking-[0.18em] uppercase
                     shadow-[0_1px_4px_rgba(27,20,16,0.12)]"
        >
          <LocateFixed size={12} />
          Recenter
        </button>
      </div>
    </div>
  );
}
