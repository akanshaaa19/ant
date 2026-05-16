import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
import Header from "../components/Header.jsx";
import OverviewMap from "../components/OverviewMap.jsx";
import { useGalleries } from "../hooks/useGalleries.js";
import { useThursdays } from "../hooks/useThursdays.js";
import { useLayoutContext } from "../components/Layout.jsx";

export default function Home() {
  const { openMenu, headerWrapRef } = useLayoutContext();
  const { galleries } = useGalleries();
  const { upcoming } = useThursdays();

  return (
    <>
      <div ref={headerWrapRef}>
        <Header title="Mumbai Galleries" onMenuClick={openMenu} />
      </div>

      <main className="mx-auto max-w-page px-5">
        <section className="mt-5 animate-fade-up">
          <div className="h-[360px] rounded-md overflow-hidden border border-line/70">
            <OverviewMap galleries={galleries} mode="browse" />
          </div>
          <p
            className="mt-3 italic font-display text-[13.5px] text-ink-soft leading-snug text-center"
            style={{
              fontVariationSettings: "'opsz' 14, 'SOFT' 100, 'wght' 380",
            }}
          >
            {galleries.length} galleries, pinned. Tap a dot for what's showing.
          </p>
        </section>

        <section className="mt-8 grid gap-3 animate-fade-up-delayed">
          <CTAThursday upcoming={upcoming} />
          <CTACard
            to="/curate"
            icon={MapPin}
            eyebrow="Anytime"
            title="Curate your own walk"
            blurb="Pick the galleries that interest you, set the order, and build a one-off route."
          />
        </section>

        <footer className="mt-16 mb-12 text-center">
          <div
            className="font-display text-wine text-2xl"
            style={{ fontVariationSettings: "'opsz' 60, 'wght' 400" }}
            aria-hidden
          >
            ❦
          </div>
        </footer>
      </main>
    </>
  );
}

function CTAThursday({ upcoming }) {
  if (!upcoming) {
    return (
      <div
        className="block w-full rounded-md border border-line/70 bg-cream-2/30 p-4 sm:p-5"
        aria-disabled="true"
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-md
                       border border-line/70 text-ink-soft/70 bg-cream/80"
          >
            <CalendarClock size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="eyebrow text-ink-soft/70">Coming soon</div>
            <div
              className="font-display text-[1.2rem] leading-tight mt-0.5 text-ink-soft/70"
              style={{
                fontVariationSettings: "'opsz' 60, 'SOFT' 80, 'wght' 440",
              }}
            >
              Next Art Night Thursday
            </div>
            <p className="mt-1 text-[12.5px] text-ink-soft/70 leading-snug">
              No walk planned yet — check back closer to the next Thursday.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CTACard
      to={`/thursday/${upcoming.slug}`}
      icon={CalendarClock}
      eyebrow={upcoming.label}
      title="Explore next Art Night Thursday"
      blurb={upcoming.blurb || "A curated walk through this week’s galleries."}
    />
  );
}

function CTACard({ to, icon: Icon, eyebrow, title, blurb }) {
  return (
    <Link
      to={to}
      className="focus-ring press group block w-full rounded-md border border-line/70
                 bg-cream-2/40 hover:bg-cream-2/70 hover:border-wine/40
                 p-4 sm:p-5 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-md
                     border border-line/70 text-wine bg-cream/80"
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="eyebrow">{eyebrow}</div>
          <div
            className="font-display text-[1.2rem] leading-tight mt-0.5 text-ink"
            style={{
              fontVariationSettings: "'opsz' 60, 'SOFT' 80, 'wght' 440",
            }}
          >
            {title}
          </div>
          <p className="mt-1 text-[12.5px] text-ink-soft leading-snug">
            {blurb}
          </p>
        </div>
        <ArrowRight
          size={16}
          className="mt-2 text-ink-soft/70 group-hover:text-wine group-hover:translate-x-1
                     transition-transform"
        />
      </div>
    </Link>
  );
}
