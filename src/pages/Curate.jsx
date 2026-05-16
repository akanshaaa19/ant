import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  Clock,
  Footprints,
  GripVertical,
  Link2,
  Plus,
  RotateCcw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import Header from "../components/Header.jsx";
import OverviewMap from "../components/OverviewMap.jsx";
import { useLayoutContext } from "../components/Layout.jsx";
import { useGalleries } from "../hooks/useGalleries.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import {
  cabMinutesFromKm,
  formatKm,
  formatMinutes,
  haversineKm,
  walkMinutesFromKm,
} from "../lib/distance.js";
import { isConfigured, saveWalk } from "../lib/supabase.js";

const STORAGE_KEY = "mga-curated-walk";
const VISITED_KEY = "mga-curated-visited";
const WALK_THRESHOLD_KM = 1.2;

const defaultState = {
  selectedIds: [],
};

const infoModal = {
  title: "Curate your own walk",
  body: (
    <>
      <p>
        <span className="text-ink font-medium">Step 1</span> — tick the
        galleries you want to visit.
      </p>
      <p>
        <span className="text-ink font-medium">Step 2</span> — drag the ☰
        handle to set the order. The map shows your route, and each card lists
        opening hours so you can plan around them.
      </p>
      <p>Your walk is saved on this device.</p>
    </>
  ),
};

export default function Curate() {
  const { openMenu, headerWrapRef } = useLayoutContext();
  const { galleries, byId } = useGalleries();
  const [state, setState] = useLocalStorage(STORAGE_KEY, defaultState);
  const [visited, setVisited] = useLocalStorage(VISITED_KEY, {});

  // Two-step flow. Default to 'order' if user already has a saved walk,
  // otherwise start at 'pick'. Ephemeral — fresh load returns here.
  const [step, setStep] = useState(() =>
    state.selectedIds.length > 0 ? "order" : "pick",
  );

  // When the user clears the walk in step 2, bounce back to picking.
  useEffect(() => {
    if (step === "order" && state.selectedIds.length === 0) setStep("pick");
  }, [step, state.selectedIds.length]);

  const setSelected = (updater) =>
    setState((s) => ({
      ...s,
      selectedIds:
        typeof updater === "function" ? updater(s.selectedIds) : updater,
    }));

  const selectedSet = useMemo(
    () => new Set(state.selectedIds),
    [state.selectedIds],
  );

  const selected = useMemo(
    () =>
      state.selectedIds
        .map((id, i) => (byId[id] ? { ...byId[id], n: i + 1 } : null))
        .filter(Boolean),
    [state.selectedIds, byId],
  );

  const totalKm = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < selected.length - 1; i++) {
      sum += haversineKm(selected[i], selected[i + 1]);
    }
    return sum;
  }, [selected]);

  const visitedCount = useMemo(
    () => selected.filter((g) => visited[g.id]).length,
    [selected, visited],
  );

  const toggleVisited = (id) => {
    setVisited((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const resetVisited = () => {
    if (typeof window === "undefined") return;
    if (window.confirm("Clear all visited marks? This cannot be undone.")) {
      setVisited({});
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelected((ids) => {
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      if (oldIndex < 0 || newIndex < 0) return ids;
      return arrayMove(ids, oldIndex, newIndex);
    });
  };

  const add = (id) =>
    setSelected((ids) => (ids.includes(id) ? ids : [...ids, id]));
  const remove = (id) => setSelected((ids) => ids.filter((x) => x !== id));
  const clear = () => {
    if (typeof window === "undefined") return;
    if (state.selectedIds.length === 0) return;
    if (window.confirm("Clear your curated walk?")) {
      setSelected([]);
      setStep("pick");
    }
  };

  const buildWalk = () => {
    if (state.selectedIds.length === 0) return;
    setStep("order");
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const editSelection = () => {
    setStep("pick");
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div ref={headerWrapRef}>
        <Header
          title="Curate your walk"
          onMenuClick={openMenu}
          infoModal={infoModal}
        />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:max-w-[1280px] lg:mx-auto lg:items-start">
        {/* MAP */}
        <aside
          className="h-[360px] lg:h-[calc(100svh-var(--header-h,120px))]
                     lg:order-2 lg:sticky lg:self-start"
          style={{ top: "var(--header-h, 120px)" }}
        >
          {step === "order" && selected.length > 0 ? (
            <OverviewMap
              galleries={selected}
              visited={visited}
              onToggle={toggleVisited}
            />
          ) : (
            <OverviewMap galleries={galleries} mode="browse" />
          )}
        </aside>

        <main className="lg:order-1 lg:min-w-0 pb-32 lg:pb-10">
          {step === "pick" ? (
            <PickStep
              galleries={galleries}
              selectedSet={selectedSet}
              add={add}
              remove={remove}
            />
          ) : (
            <OrderStep
              state={state}
              selected={selected}
              totalKm={totalKm}
              visited={visited}
              visitedCount={visitedCount}
              onToggleVisited={toggleVisited}
              onResetVisited={resetVisited}
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onEditSelection={editSelection}
              onRemove={remove}
              onClear={clear}
            />
          )}
        </main>
      </div>

      {/* Sticky footer for step 1 — primary CTA to advance */}
      {step === "pick" && (
        <div
          className="fixed bottom-0 inset-x-0 z-20 border-t border-line/70
                     bg-cream/95 backdrop-blur-md"
        >
          <div className="mx-auto max-w-[1280px] px-5 py-3 flex items-center justify-between gap-3">
            <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-soft">
              {state.selectedIds.length} picked
            </div>
            <button
              type="button"
              onClick={buildWalk}
              disabled={state.selectedIds.length === 0}
              className="focus-ring press inline-flex items-center gap-2 px-4 py-2 rounded-md
                         bg-wine text-cream font-mono text-[10.5px] tracking-[0.18em] uppercase
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Build my walk
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function PickStep({ galleries, selectedSet, add, remove }) {
  return (
    <section className="mx-auto max-w-page px-5 mt-5 animate-fade-up">
      <div className="flex items-baseline justify-between border-b border-line/70 pb-2.5">
        <h2
          className="font-display text-[1.3rem] leading-tight text-ink"
          style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 70, 'wght' 460" }}
        >
          Pick galleries
        </h2>
        <div className="font-mono text-[10px] tracking-wider uppercase text-ink-soft/80">
          {selectedSet.size} of {galleries.length}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {galleries.map((g) => (
          <li key={g.id}>
            <PickerRow
              gallery={g}
              selected={selectedSet.has(g.id)}
              onAdd={() => add(g.id)}
              onRemove={() => remove(g.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrderStep({
  state,
  selected,
  totalKm,
  visited,
  visitedCount,
  onToggleVisited,
  onResetVisited,
  sensors,
  onDragEnd,
  onEditSelection,
  onRemove,
  onClear,
}) {
  return (
    <>
      <section className="mx-auto max-w-page px-5 mt-5 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between">
          <button
            type="button"
            onClick={onEditSelection}
            className="focus-ring press inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                       border border-line/70 text-ink-soft hover:text-wine hover:border-wine/60
                       font-mono text-[10px] tracking-[0.18em] uppercase"
          >
            <ArrowLeft size={12} />
            Edit selection
          </button>
          <button
            type="button"
            onClick={onClear}
            className="focus-ring press inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                       border border-line/70 text-ink-soft hover:text-rust hover:border-rust/60
                       font-mono text-[10px] tracking-[0.18em] uppercase"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </section>

      {/* stats strip — matches the Thursday page */}
      <section className="mx-auto max-w-page px-5 mt-5 animate-fade-up">
        <div className="grid grid-cols-3 border-y border-line/70 bg-cream-2/40 divide-x divide-line/60">
          <Stat value={String(selected.length)} label="Galleries" />
          <Stat value={`~${formatKm(totalKm)}`} label="End to end" />
          <Stat
            value={`${visitedCount}/${selected.length}`}
            label="Visited"
            accent
          />
        </div>
      </section>

      <section className="mx-auto max-w-page px-5 mt-6 animate-fade-up-delayed">
        <div className="flex items-baseline justify-between border-b border-line/70 pb-2.5">
          <h2
            className="font-display text-[1.3rem] leading-tight text-ink"
            style={{
              fontVariationSettings: "'opsz' 60, 'SOFT' 70, 'wght' 460",
            }}
          >
            Your walk
          </h2>
          <div className="font-mono text-[10px] tracking-wider uppercase text-ink-soft/80">
            Drag ☰ to reorder
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={state.selectedIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className="mt-3 space-y-1.5">
              {selected.map((g, i) => {
                const next = selected[i + 1];
                return (
                  <li key={g.id}>
                    <SortableRow
                      gallery={g}
                      visited={!!visited[g.id]}
                      onToggleVisited={() => onToggleVisited(g.id)}
                      onRemove={() => onRemove(g.id)}
                    />
                    {next && <Segment from={g} to={next} />}
                  </li>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>

        {isConfigured && (
          <ShareWalkPanel galleryIds={state.selectedIds} />
        )}

        {visitedCount > 0 && (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onResetVisited}
              className="focus-ring press inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                         border border-line/70 text-ink-soft hover:text-wine hover:border-wine/60
                         font-mono text-[10px] tracking-[0.18em] uppercase"
            >
              <RotateCcw size={12} />
              Reset visited
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function ShareWalkPanel({ galleryIds }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'
  const [shareUrl, setShareUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || galleryIds.length === 0 || status === "saving") return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const id = await saveWalk({ name, galleryIds });
      const url = `${window.location.origin}/walk/${id}`;
      setShareUrl(url);
      setStatus("saved");
    } catch (err) {
      setErrorMsg(err.message || "Couldn't save walk");
      setStatus("error");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  };

  const reset = () => {
    setName("");
    setShareUrl("");
    setStatus("idle");
    setErrorMsg("");
  };

  if (status === "saved") {
    return (
      <div className="mt-6 rounded-md border border-moss/40 bg-moss/5 p-4">
        <div className="eyebrow text-moss">Saved</div>
        <p
          className="mt-1 font-display text-[14px] text-ink leading-snug"
          style={{ fontVariationSettings: "'opsz' 18, 'SOFT' 80, 'wght' 440" }}
        >
          Your walk is live at this link.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.target.select()}
            className="focus-ring flex-1 min-w-0 px-2 py-1.5 rounded-md border border-line/70
                       bg-cream text-ink font-mono text-[11px]"
          />
          <button
            type="button"
            onClick={copy}
            className="focus-ring press shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                       bg-wine text-cream font-mono text-[10px] tracking-[0.16em] uppercase"
          >
            {copied ? <Check size={12} /> : <Link2 size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="focus-ring mt-3 text-ink-soft hover:text-wine font-mono text-[10px] tracking-[0.16em] uppercase"
        >
          Save another version
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-md border border-line/70 bg-cream-2/40 p-4">
      <label
        htmlFor="walk-name"
        className="eyebrow"
      >
        Name your walk
      </label>
      <input
        id="walk-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Sunday Colaba crawl"
        maxLength={60}
        className="focus-ring mt-1 w-full px-2.5 py-2 rounded-md border border-line/70
                   bg-cream text-ink text-[14px]"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p
          className="text-[11.5px] text-ink-soft italic font-display leading-snug"
          style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 100, 'wght' 380" }}
        >
          Anyone with the link can view your walk.
        </p>
        <button
          type="submit"
          disabled={!name.trim() || galleryIds.length === 0 || status === "saving"}
          className="focus-ring press shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                     bg-wine text-cream font-mono text-[10px] tracking-[0.18em] uppercase
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Share2 size={12} />
          {status === "saving" ? "Saving…" : "Save & share"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 font-mono text-[10.5px] text-rust">
          {errorMsg}
        </p>
      )}
    </form>
  );
}

function Stat({ value, label, accent }) {
  return (
    <div className="px-3 py-3 text-center">
      <div
        className={`font-display text-[1.5rem] leading-none ${
          accent ? "text-wine" : "text-ink"
        }`}
        style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 70, 'wght' 460" }}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[9.5px] tracking-[0.2em] uppercase text-ink-soft/80">
        {label}
      </div>
    </div>
  );
}

function SortableRow({ gallery, visited, onToggleVisited, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gallery.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const num = String(gallery.n).padStart(2, "0");
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[28px_28px_1fr_28px] items-stretch gap-1.5 rounded-md
                  border border-line/60 bg-cream-2/40 ${isDragging ? "opacity-70 shadow-md" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${gallery.name}`}
        className="focus-ring touch-none cursor-grab active:cursor-grabbing
                   flex items-center justify-center text-ink-soft/60 hover:text-wine
                   rounded-l-md hover:bg-cream-2/80"
      >
        <GripVertical size={14} />
      </button>

      <button
        type="button"
        onClick={onToggleVisited}
        aria-pressed={visited}
        aria-label={
          visited
            ? `Mark ${gallery.name} as not visited`
            : `Mark ${gallery.name} as visited`
        }
        className="focus-ring flex items-center justify-center  rounded"
      >
        {visited ? (
          <span className="flex items-center justify-center w-[22px] h-[22px] rounded-[5px] bg-wine text-cream shadow-sm">
            <Check size={12} strokeWidth={3} />
          </span>
        ) : (
          <span className="block w-[22px] h-[22px] rounded-[5px] border border-line bg-cream-2/40" />
        )}
      </button>

      <GalleryBody gallery={gallery} num={num} dim={visited} />

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${gallery.name}`}
        className="focus-ring flex items-center justify-center text-ink-soft/60 hover:text-rust
                   rounded-r-md hover:bg-cream-2/80"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function PickerRow({ gallery, selected, onAdd, onRemove }) {
  return (
    <div
      className={`grid grid-cols-[28px_1fr] items-stretch gap-1.5 rounded-md border
                  ${
                    selected
                      ? "border-wine/40 bg-wine/5"
                      : "border-line/60 bg-cream-2/30 hover:bg-cream-2/60"
                  }`}
    >
      <button
        type="button"
        onClick={selected ? onRemove : onAdd}
        aria-pressed={selected}
        aria-label={selected ? `Remove ${gallery.name}` : `Add ${gallery.name}`}
        className="focus-ring flex items-center justify-center rounded-l-md
                   text-ink-soft hover:text-wine"
      >
        {selected ? (
          <span className="flex items-center justify-center w-[20px] h-[20px] rounded-[5px] bg-wine text-cream">
            <Check size={11} strokeWidth={3} />
          </span>
        ) : (
          <Plus size={14} />
        )}
      </button>

      <button
        type="button"
        onClick={selected ? onRemove : onAdd}
        className="focus-ring text-left py-2 pr-2 rounded-r-md"
      >
        <GalleryBody gallery={gallery} dim={selected} />
      </button>
    </div>
  );
}

function GalleryBody({ gallery, dim, num }) {
  return (
    <div className={`min-w-0 py-2 pr-1 ${dim ? "opacity-50" : ""}`}>
      <div
        className={`font-display text-[15px] leading-tight text-ink truncate ${
          dim ? "line-through" : ""
        }`}
        style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 50, 'wght' 460" }}
      >
        {gallery.name}
      </div>

      <div className="mt-0.5 flex flex-wrap items-center text-[11px] text-ink-soft">
        {num && (
          <>
            <span className="font-mono tracking-wider text-[10px] text-ink-soft/70">
              {num}
            </span>
            <span className="mx-1.5 text-line">·</span>
          </>
        )}
        <span className="font-mono uppercase tracking-wider text-[10px]">
          {gallery.area}
        </span>
        <span className="mx-1.5 text-line">·</span>
        <span className="italic">{gallery.sub}</span>
      </div>

      {gallery.hours && (
        <div className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-moss/90">
          <Clock size={10} className="opacity-80" />
          <span className="uppercase">{gallery.hours}</span>
        </div>
      )}
    </div>
  );
}

function Segment({ from, to }) {
  const km = haversineKm(from, to);
  const isWalk = km <= WALK_THRESHOLD_KM;
  const min = isWalk ? walkMinutesFromKm(km) : cabMinutesFromKm(km);
  const Icon = isWalk ? Footprints : Car;
  const tone = isWalk ? "text-moss" : "text-rust";
  return (
    <div className="grid grid-cols-[28px_1fr] items-center py-0.5 pl-1">
      <span className="block w-px h-5 bg-line/60 mx-auto" />
      <div
        className={`flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase ${tone}`}
      >
        <Icon size={10} className="opacity-80" />
        <span>
          {formatKm(km)} · {formatMinutes(min)} {isWalk ? "on foot" : "by cab"}
        </span>
      </div>
    </div>
  );
}
