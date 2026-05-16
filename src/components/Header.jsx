import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Info, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Header({
  eyebrow,
  title,
  titleAccent = ".",
  onMenuClick,
  infoModal,
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur-md border-b border-line/60">
        <div className="mx-auto max-w-page px-5 pt-2.5 pb-2 animate-fade-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              {onMenuClick && (
                <button
                  type="button"
                  onClick={onMenuClick}
                  aria-label="Open menu"
                  className="focus-ring press mt-0.5 inline-flex items-center justify-center
                             w-8 h-8 rounded-md text-ink-soft hover:text-wine
                             hover:bg-cream-2/60 border border-line/70 bg-cream/80"
                >
                  <Menu size={15} />
                </button>
              )}
              <div className="min-w-0">
                {eyebrow && <div className="eyebrow">{eyebrow}</div>}
                <h1
                  className="font-display text-[1.55rem] leading-[1.05] mt-0.5 text-ink"
                  style={{
                    fontVariationSettings: "'opsz' 96, 'SOFT' 80, 'wght' 420",
                  }}
                >
                  {title}
                  {titleAccent && (
                    <span
                      className="text-wine"
                      style={{
                        fontVariationSettings:
                          "'opsz' 96, 'SOFT' 100, 'wght' 460",
                      }}
                    >
                      {titleAccent}
                    </span>
                  )}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              {infoModal && (
                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  aria-label="About this page"
                  className="focus-ring press mt-1 inline-flex items-center justify-center
                             w-8 h-8 rounded-full border border-line/70 text-ink-soft
                             hover:text-wine hover:border-wine/60 bg-cream/80"
                >
                  <Info size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-line/40" aria-hidden />
      </header>

      {infoOpen && infoModal && (
        <InfoModal onClose={() => setInfoOpen(false)} title={infoModal.title}>
          {infoModal.body}
        </InfoModal>
      )}
    </>
  );
}

function InfoModal({ onClose, title, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade-up"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-cream border border-line rounded-md
                   shadow-[0_10px_40px_rgba(27,20,16,0.25)] p-5 sm:p-6 animate-fade-up-delayed"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-ring absolute top-2.5 right-2.5 inline-flex items-center justify-center
                     w-7 h-7 rounded-md text-ink-soft hover:text-wine hover:bg-cream-2/60"
        >
          <X size={15} />
        </button>

        <div className="eyebrow">About</div>
        <h2
          id="info-title"
          className="font-display text-[1.3rem] mt-1 leading-tight text-ink"
          style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 80, 'wght' 440" }}
        >
          {title}
        </h2>

        <div className="mt-4 space-y-3 text-[13.5px] text-ink-soft leading-relaxed">
          {children}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="focus-ring press mt-5 w-full inline-flex items-center justify-center
                     px-3 py-2 rounded-md bg-wine text-cream
                     font-mono text-[10px] tracking-[0.18em] uppercase"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body,
  );
}
