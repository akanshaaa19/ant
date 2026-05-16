import { Check, ExternalLink } from "lucide-react";
import { formatEndsOn } from "../lib/date.js";

const toneClass = {
  urgent: "text-rust font-medium",
  soon: "text-wine",
  normal: "text-ink-soft/85",
  past: "text-ink-soft/60 line-through",
};

export default function GalleryRow({ gallery, visited, onToggle }) {
  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onToggle(gallery.id);
  };

  const num = String(gallery.n).padStart(2, "0");
  const ariaLabel = visited
    ? `Mark ${gallery.name} as not visited`
    : `Mark ${gallery.name} as visited`;

  const ends = gallery.show ? formatEndsOn(gallery.show.endsOn) : null;

  return (
    <div className="group grid grid-cols-[44px_1fr_auto] items-stretch press">
      {/* checkbox / number — its own click target */}
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={visited}
        aria-label={ariaLabel}
        className="focus-ring flex items-start justify-center pt-3.5 -ml-1 rounded-md hover:bg-cream-2/50"
      >
        {visited ? (
          <span className="flex items-center justify-center w-[22px] h-[22px] rounded-[5px] bg-wine text-cream shadow-sm">
            <Check size={13} strokeWidth={3} />
          </span>
        ) : (
          <span className="block w-[22px] h-[22px] rounded-[5px] border border-line bg-cream-2/40" />
        )}
      </button>

      {/* link — separate click target */}
      <a
        href={gallery.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring flex flex-col justify-center py-3 pl-1 pr-2 rounded-md hover:bg-cream-2/40"
      >
        {/* gallery name */}
        <div
          className={`font-display text-[17px] leading-tight ${
            visited ? "line-through opacity-50" : ""
          }`}
          style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 50, 'wght' 460" }}
        >
          {gallery.name}
        </div>

        {/* show title (italic, slightly smaller, ink-soft) + NEW pill */}
        {gallery.show?.title && (
          <div
            className={`mt-1 flex items-baseline gap-1.5 flex-wrap ${
              visited ? "opacity-50" : ""
            }`}
          >
            <span
              className="italic font-display text-[13.5px] text-ink-soft leading-snug"
              style={{
                fontVariationSettings: "'opsz' 18, 'SOFT' 80, 'wght' 420",
              }}
            >
              {gallery.show.title}
            </span>
            {gallery.show.isNew && (
              <span className="font-mono text-[8.5px] tracking-[0.18em] uppercase px-1 py-0.5 rounded-sm bg-wine text-cream leading-none">
                New
              </span>
            )}
          </div>
        )}

        {/* artist (if any) */}
        {gallery.show?.artist && (
          <div
            className={`text-[12px] text-ink-soft/85 leading-snug ${
              visited ? "opacity-50" : ""
            }`}
          >
            {gallery.show.artist}
          </div>
        )}

        {/* AREA · sub · ends DATE */}
        <div
          className={`mt-1 text-[11px] text-ink-soft flex flex-wrap items-center ${
            visited ? "opacity-50" : ""
          }`}
        >
          <span className="font-mono tracking-wider text-[10px] text-ink-soft/70">
            {num}
          </span>
          <span className="mx-1.5 text-line">·</span>
          <span className="font-mono uppercase tracking-wider text-[10px]">
            {gallery.area}
          </span>
          <span className="mx-1.5 text-line">·</span>
          <span className="italic">{gallery.sub}</span>
          {ends && (
            <>
              <span className="mx-1.5 text-line">·</span>
              <span
                className={`font-mono uppercase tracking-wider text-[10px] ${
                  toneClass[ends.tone]
                }`}
              >
                {ends.text}
              </span>
            </>
          )}
        </div>
      </a>

      <a
        href={gallery.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${gallery.name} in Google Maps`}
        className="focus-ring flex items-center justify-center px-2 text-ink-soft/60 hover:text-wine"
      >
        <ExternalLink
          size={14}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </a>
    </div>
  );
}
