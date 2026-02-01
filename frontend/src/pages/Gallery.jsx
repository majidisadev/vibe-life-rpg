import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Calendar,
  ImageIcon,
  ArrowLeft,
  X,
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

function CharacterMultiSelect({ characterIds, setCharacterIds, characterOptions, onApply }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedSet = new Set(characterIds);
  const filteredOptions = search.trim()
    ? characterOptions.filter(
        (opt) =>
          !selectedSet.has(opt.value) &&
          opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addCharacter = (value) => {
    setCharacterIds((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setSearch("");
    setOpen(false);
  };

  const removeCharacter = (value) => {
    setCharacterIds((prev) => prev.filter((id) => id !== value));
  };

  const selectedOptions = characterOptions.filter((opt) => selectedSet.has(opt.value));

  return (
    <div className="flex items-start gap-2">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 pt-2">
        <User className="h-3.5 w-3.5" />
        Character
      </label>
      <div ref={containerRef} className="relative min-w-[200px] max-w-[280px]">
        <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 min-h-[36px]">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-xs"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => removeCharacter(opt.value)}
                className="hover:bg-muted-foreground/20 rounded p-0.5"
                aria-label={`Remove ${opt.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => search.trim() && setOpen(true)}
            placeholder={characterIds.length ? "" : "Type to search characters..."}
            className="flex-1 min-w-[120px] border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {open && search.trim() && (
          <ul className="absolute z-50 mt-1 max-h-[200px] w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No characters found</li>
            ) : (
              filteredOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => addCharacter(opt.value)}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function GalleryFilters({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  locationId,
  setLocationId,
  characterIds,
  setCharacterIds,
  locationOptions,
  characterOptions,
  onApply,
}) {
  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 shrink-0">
              <Calendar className="h-3.5 w-3.5" />
              Date range
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-[140px]"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-[140px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 shrink-0">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </label>
            <Select value={locationId || "all"} onValueChange={(v) => setLocationId(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <CharacterMultiSelect
            characterIds={characterIds}
            setCharacterIds={setCharacterIds}
            characterOptions={characterOptions}
          />
          <Button onClick={onApply} size="sm" className="shrink-0">
            Apply filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusSidebar({ entry, locationNames, characterMap }) {
  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const locName = entry?.locationTag?.refId
    ? locationNames[entry.locationTag.refId] || "Unknown"
    : null;
  const charTags = (entry?.characterTags || [])
    .map((id) => ({ id, ...(characterMap[id] || { name: "Unknown", cover: null }) }))
    .filter((c) => c.name);

  if (!entry) return null;
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</div>
      <div className="whitespace-pre-wrap break-words">{entry.content || "—"}</div>
      {locName && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          {locName}
        </div>
      )}
      {charTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {charTags.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs"
            >
              {c.cover ? (
                <img src={c.cover} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <User className="h-3 w-3" />
              )}
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Gallery() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [locationId, setLocationId] = useState("");
  const [characterIds, setCharacterIds] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [statusEntry, setStatusEntry] = useState(null);
  const [dungeons, setDungeons] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [characters, setCharacters] = useState([]);
  const sentinelRef = useRef(null);
  const locationNames = {};
  dungeons.forEach((d) => (locationNames[d._id] = d.name));
  buildings.forEach((b) => {
    const label = b.type === "house" ? (b.name || "House") : (b.name || "Leisure Zone");
    locationNames[b._id] = label;
  });
  const characterMap = {};
  characters.forEach((c) => {
    if (c?._id) characterMap[c._id] = { name: c.name, cover: c.cover || null };
  });
  const locationOptions = [
    ...dungeons.filter((d) => d.unlocked).map((d) => ({ value: d._id, label: d.name })),
    ...buildings
      .filter((b) => b.built)
      .map((b) => ({
        value: b._id,
        label: b.type === "house" ? (b.name || "House") : (b.name || "Leisure Zone"),
      })),
  ];
  const characterOptions = characters.map((c) => ({ value: c._id, label: c.name }));

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ page: 1, limit: 24 });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (locationId) params.set("locationRefId", locationId);
    if (characterIds.length > 0) params.set("characterIds", characterIds.join(","));
    return params;
  }, [dateFrom, dateTo, locationId, characterIds]);

  const loadPage = useCallback(
    async (pageNum, append = false) => {
      const params = new URLSearchParams({ page: pageNum, limit: 24 });
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (locationId) params.set("locationRefId", locationId);
      if (characterIds.length > 0) params.set("characterIds", characterIds.join(","));
      const isFirst = pageNum === 1;
      if (isFirst && !append) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await api.get(`/journal/gallery?${params}`);
        const data = res.data.data || [];
        const pagination = res.data.pagination || {};
        setHasMore(pagination.page < pagination.totalPages);
        if (append) setItems((prev) => [...prev, ...data]);
        else setItems(data);
        setPage(pagination.page);
      } catch (e) {
        toast.error("Failed to load gallery");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [dateFrom, dateTo, locationId, characterIds]
  );

  const applyFilters = useCallback(() => {
    setPage(1);
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    Promise.all([
      api.get("/dungeons").then((r) => r.data || []),
      api.get("/buildings").then((r) => r.data || []),
      api.get("/characters?limit=200").then((r) => (r.data?.data || r.data || [])),
    ])
      .then(([d, b, c]) => {
        setDungeons(Array.isArray(d) ? d : []);
        setBuildings(Array.isArray(b) ? b : []);
        setCharacters(Array.isArray(c) ? c : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPage(1, false);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadPage(page + 1, true);
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, loadPage]);

  const openPreview = async (index) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
    const item = items[index];
    if (!item?.journalId) {
      setStatusEntry(null);
      return;
    }
    try {
      const res = await api.get(`/journal/${item.journalId}`);
      setStatusEntry(res.data);
    } catch {
      setStatusEntry(null);
    }
  };

  const goPrev = () => {
    const next = previewIndex <= 0 ? items.length - 1 : previewIndex - 1;
    setPreviewIndex(next);
    const item = items[next];
    if (item?.journalId) {
      api.get(`/journal/${item.journalId}`).then((r) => setStatusEntry(r.data)).catch(() => setStatusEntry(null));
    } else setStatusEntry(null);
  };

  const goNext = () => {
    const next = previewIndex >= items.length - 1 ? 0 : previewIndex + 1;
    setPreviewIndex(next);
    const item = items[next];
    if (item?.journalId) {
      api.get(`/journal/${item.journalId}`).then((r) => setStatusEntry(r.data)).catch(() => setStatusEntry(null));
    } else setStatusEntry(null);
  };

  const currentSrc = items[previewIndex]?.src;

  return (
    <div className="space-y-6 -mt-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/fantasy-world")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Gallery</h1>
      </div>

      <GalleryFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        locationId={locationId}
        setLocationId={setLocationId}
        characterIds={characterIds}
        setCharacterIds={setCharacterIds}
        locationOptions={locationOptions}
        characterOptions={characterOptions}
        onApply={applyFilters}
      />

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
            {items.length > 0 ? `${items.length} photo(s)` : "No photos"}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ImageIcon className="h-14 w-14 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No photos yet</p>
                <p className="text-sm text-muted-foreground mt-1">Upload photos in your status on Fantasy World</p>
                <Button className="mt-4" variant="outline" onClick={() => navigate("/fantasy-world")}>
                  Go to Fantasy World
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {items.map((item, i) => (
                  <button
                    key={`${item.journalId}-${i}-${item.src}`}
                    type="button"
                    className="aspect-square rounded-lg overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-ring hover:opacity-90 transition-opacity w-full"
                    onClick={() => openPreview(i)}
                  >
                    <img
                      src={item.src}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
            </>
          )}
      </div>

      {/* Image preview dialog with sidebar and prev/next */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 border-0 bg-black/90 overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo preview</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 flex items-center justify-center relative p-4">
              {currentSrc && (
                <>
                  <img
                    src={currentSrc}
                    alt=""
                    className="max-w-full max-h-[85vh] object-contain"
                  />
                  {items.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                        onClick={goPrev}
                      >
                        <ChevronLeft className="h-8 w-8" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                        onClick={goNext}
                      >
                        <ChevronRight className="h-8 w-8" />
                      </Button>
                    </>
                  )}
                </>
              )}
              <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {items.length > 0 && `${previewIndex + 1} / ${items.length}`}
              </p>
            </div>
            <aside className="w-72 border-l border-white/10 bg-background/95 overflow-y-auto p-4 flex-shrink-0">
              <h3 className="font-semibold text-sm mb-3">Related status</h3>
              {statusEntry ? (
                <StatusSidebar
                  entry={statusEntry}
                  locationNames={locationNames}
                  characterMap={characterMap}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
