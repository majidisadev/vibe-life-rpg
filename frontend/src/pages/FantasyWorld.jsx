import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import anime from "animejs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sword,
  Building2,
  Hammer,
  ShoppingCart,
  Sparkles,
  Camera,
  MapPin,
  User,
  Pencil,
  Trash2,
  ChevronRight,
  ImageIcon,
  MessageSquare,
  Search,
  X,
  Calendar,
} from "lucide-react";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";
import ImageUpload from "../components/ImageUpload";
import ImageUploadMulti from "../components/ImageUploadMulti";
import { toast } from "sonner";

const resourceEmojis = {
  meat: "🥩",
  wood: "🪵",
  stone: "🪨",
  iron: "⚙️",
  crystal: "💎",
};

// Cover + Profile Section
function CoverSection({ user, onCoverChange, coverRef }) {
  const [editOpen, setEditOpen] = useState(false);
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || "");

  useEffect(() => {
    setCoverPreview(user?.coverImage || "");
  }, [user?.coverImage]);

  const handleSaveCover = async () => {
    try {
      await api.put("/user", { coverImage: coverPreview });
      onCoverChange?.();
      setEditOpen(false);
      toast.success("Cover updated", { description: "Your cover photo has been saved" });
    } catch (e) {
      toast.error("Failed to update cover");
    }
  };

  const resources = user?.resources || {
    meat: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    crystal: 0,
  };

  return (
    <div ref={coverRef} className="mb-6 group">
      {/* Cover */}
      <div
        className="relative h-48 md:h-64 w-full rounded-t-lg overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-muted"
        style={{
          backgroundImage: coverPreview ? `url(${coverPreview})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={() => setEditOpen(true)}
        >
          <Camera className="h-4 w-4 mr-1" />
          Edit Cover
        </Button>
      </div>
      {/* Profile row */}
      <div className="relative px-4 -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-background bg-card overflow-hidden shadow-lg flex-shrink-0">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <User className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 pb-2 flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">{user?.name || "Player"}</h1>
          <div className="flex flex-wrap gap-3 text-sm">
            {Object.entries(resources).map(([key, val]) => (
              <span key={key} className="flex items-center gap-1">
                <span>{resourceEmojis[key]}</span>
                <span className="font-medium">{val ?? 0}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cover Photo</DialogTitle>
          </DialogHeader>
          <ImageUpload
            value={coverPreview}
            onChange={setCoverPreview}
            maxWidth={1200}
            maxHeight={400}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCover}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Bento Menu
function BentoMenu({ navigate, menuRef }) {
  const items = [
    { label: "Dungeons", desc: "Fight enemies", icon: Sword, path: "/dungeons" },
    { label: "Town", desc: "Manage buildings", icon: Building2, path: "/town" },
    { label: "Gacha", desc: "Collect characters", icon: Sparkles, path: "/gacha" },
    { label: "Market", desc: "Exchange resources", icon: ShoppingCart, path: "/market" },
    { label: "Blacksmith", desc: "Craft weapons", icon: Hammer, path: "/blacksmith" },
  ];

  return (
    <Card ref={menuRef}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Access</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className="quick-access-card cursor-pointer rounded-lg border bg-card p-3 hover:bg-muted/50 hover:scale-[1.02] transition-all duration-200 flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{item.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.desc}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for gallery
function GallerySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Gallery Section
function GallerySection({ images, loading, onImageClick, galleryRef }) {
  const nav = useNavigate();
  const preview = (images || []).slice(0, 9);
  if (loading) return <GallerySkeleton />;
  return (
    <Card ref={galleryRef}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Gallery</CardTitle>
          {images?.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => nav("/fantasy-world/gallery")}>
              See All Photos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {preview.length === 0 ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-3">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No photos yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload your first photo by adding images to a status</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {preview.map((img, i) => (
              <button
                key={i}
                type="button"
                className="aspect-square rounded-md overflow-hidden bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => onImageClick?.(i)}
              >
                <img
                  src={img.src || img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Status Card
function StatusCard({ entry, user, locationNames, characterMap, onEdit, onDelete, onHashtagClick, onLocationClick, onCharacterClick, onImageClick }) {
  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const locRefId = entry.locationTag?.refId;
  const locName = locRefId ? locationNames[locRefId] || "Unknown" : null;
  const charTags = (entry.characterTags || [])
    .map((id) => ({ id, ...(characterMap?.[id] || { name: "Unknown", cover: null }) }))
    .filter((c) => c.name);

  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+)/g);
    return parts.map((p, i) =>
      p.startsWith("#") ? (
        <button
          key={i}
          type="button"
          className="text-primary hover:underline font-medium"
          onClick={() => onHashtagClick(p.slice(1))}
        >
          {p}
        </button>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-semibold">{user?.name || "Player"}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(entry.createdAt)}
                {entry.updatedAt &&
                  new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime() && (
                    <> • Edited {formatDate(entry.updatedAt)}</>
                  )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(entry)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="whitespace-pre-wrap break-words">{renderContent(entry.content)}</div>
        {entry.images?.length > 0 && (
          <div
            className={`grid gap-2 ${
              entry.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {entry.images.map((src, i) => (
              <button
                key={i}
                type="button"
                className="rounded-lg overflow-hidden max-h-80 w-full focus:outline-none focus:ring-2 focus:ring-ring hover:opacity-95 transition-opacity text-left"
                onClick={() => onImageClick?.(entry.images, i)}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {locName && locRefId && (
            <button
              type="button"
              onClick={() => onLocationClick?.(locRefId)}
              className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded cursor-pointer transition-colors"
            >
              <MapPin className="h-3 w-3" />
              {locName}
            </button>
          )}
          {charTags.map((char, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onCharacterClick?.(char.id)}
              className="inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded cursor-pointer transition-colors"
            >
              {char.cover ? (
                <img src={char.cover} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <User className="h-3 w-3 flex-shrink-0" />
              )}
              {char.name}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FantasyWorld() {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  const [journal, setJournal] = useState({ data: [], pagination: {} });
  const [galleryImages, setGalleryImages] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [dungeons, setDungeons] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [activeChars, setActiveChars] = useState([]);
  const [tagCharacters, setTagCharacters] = useState([]);
  const [page, setPage] = useState(1);
  const [hashtagFilter, setHashtagFilter] = useState(null);
  const [locationFilter, setLocationFilter] = useState(null);
  const [characterFilter, setCharacterFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [journalLoading, setJournalLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const coverRef = useRef(null);
  const menuRef = useRef(null);
  const galleryRef = useRef(null);
  const journalRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  const loadJournal = async () => {
    setJournalLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (hashtagFilter) params.set("hashtag", hashtagFilter);
      if (locationFilter) params.set("locationRefId", locationFilter);
      if (characterFilter) params.set("characterId", characterFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await api.get(`/journal?${params}`);
      setJournal(res.data);
    } catch (e) {
      toast.error("Failed to load journal");
    } finally {
      setJournalLoading(false);
    }
  };

  const loadGalleryPreview = async () => {
    setGalleryLoading(true);
    try {
      const res = await api.get("/journal/gallery?limit=9&page=1");
      setGalleryImages(res.data.data);
    } catch (e) {
      console.error("Failed to load gallery", e);
    } finally {
      setGalleryLoading(false);
    }
  };

  const openLightbox = (images, index) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const loadHashtags = async () => {
    try {
      const res = await api.get("/journal/hashtags");
      setHashtags(res.data || []);
    } catch (e) {
      console.error("Failed to load hashtags", e);
    }
  };

  const loadOptions = async () => {
    try {
      const [dRes, bRes] = await Promise.all([
        api.get("/dungeons"),
        api.get("/buildings"),
      ]);
      setDungeons(dRes.data || []);
      setBuildings(bRes.data || []);
      if (user?.activeCharacters?.length) {
        const chars = await Promise.all(
          user.activeCharacters.map((id) => api.get(`/characters/${id}`))
        );
        setActiveChars(chars.map((r) => r.data).filter(Boolean));
      } else {
        setActiveChars([]);
      }
    } catch (e) {
      console.error("Failed to load options", e);
    }
  };

  useEffect(() => {
    loadJournal();
  }, [page, hashtagFilter, locationFilter, characterFilter, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    if (hasAnimatedRef.current || !user) return;
    hasAnimatedRef.current = true;
    const targets = [
      coverRef.current,
      menuRef.current,
      galleryRef.current,
      journalRef.current,
    ].filter(Boolean);
    if (targets.length === 0) return;
    anime.set(targets, { opacity: 0, translateY: 20 });
    anime({
      targets,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 450,
      delay: anime.stagger(80, { start: 100 }),
      easing: "easeOutExpo",
    });
  }, [user]);

  useEffect(() => {
    loadGalleryPreview();
    loadHashtags();
  }, [journal.data]);

  useEffect(() => {
    loadOptions();
  }, [user?.activeCharacters]);

  useEffect(() => {
    const activeIds = new Set((activeChars || []).map((c) => String(c._id)));
    const tagIds = [...new Set((journal.data || []).flatMap((e) => (e.characterTags || []).map(String)))].filter(
      (id) => !activeIds.has(id)
    );
    if (tagIds.length === 0) {
      setTagCharacters([]);
      return;
    }
    Promise.all(tagIds.map((id) => api.get(`/characters/${id}`)))
      .then((ress) => ress.map((r) => r.data).filter(Boolean))
      .then(setTagCharacters)
      .catch(() => setTagCharacters([]));
  }, [journal.data, activeChars]);

  const locationNames = {};
  dungeons.forEach((d) => (locationNames[d._id] = d.name));
  buildings.forEach((b) => {
    const label = b.type === "house" ? (b.name || "House") : (b.name || "Leisure Zone");
    locationNames[b._id] = label;
  });
  const characterMap = {};
  [...(activeChars || []), ...(tagCharacters || [])].forEach((c) => {
    if (c?._id) characterMap[c._id] = { name: c.name, cover: c.cover || null };
  });

  const handleSubmitStatus = async (form) => {
    try {
      const payload = {
        content: form.content,
        images: form.images || [],
        locationTag: form.locationTag?.refId
          ? { locType: form.locationTag.locType, refId: form.locationTag.refId }
          : null,
        characterTags: form.characterTags || [],
      };
      if (editingEntry) {
        await api.put(`/journal/${editingEntry._id}`, payload);
        toast.success("Status updated", { description: "Your changes have been saved" });
      } else {
        await api.post("/journal", payload);
        toast.success("Status posted", { description: "Your status is now live" });
      }
      setComposerOpen(false);
      setEditingEntry(null);
      loadJournal();
      loadGalleryPreview();
      loadHashtags();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to save");
    }
  };

  const handleDelete = async (entry) => {
    try {
      await api.delete(`/journal/${entry._id}`);
      toast.success("Status deleted", { description: "The status has been removed" });
      setDeleteConfirm(null);
      loadJournal();
      loadGalleryPreview();
      loadHashtags();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const pagination = journal.pagination || {};
  const totalPages = pagination.totalPages || 1;

  return (
    <div className="space-y-6 -mt-4">
      <CoverSection user={user} onCoverChange={refreshUser} coverRef={coverRef} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
          <BentoMenu navigate={navigate} menuRef={menuRef} />
          <GallerySection
            images={galleryImages}
            loading={galleryLoading}
            galleryRef={galleryRef}
            onImageClick={(i) => openLightbox(galleryImages.map((img) => img.src || img), i)}
          />
        </div>

        {/* Right column - Journal */}
        <div ref={journalRef} className="lg:col-span-8 space-y-4 order-1 lg:order-2">
          <JournalComposer
            user={user}
            open={composerOpen}
            onOpenChange={(o) => {
              setComposerOpen(o);
              if (!o) setEditingEntry(null);
            }}
            editingEntry={editingEntry}
            dungeons={dungeons}
            buildings={buildings}
            activeChars={activeChars}
            onSubmit={handleSubmitStatus}
          />

          {/* Search and Date Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search status..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchQuery(searchInput);
                    setPage(1);
                  }
                }}
                className="pl-9 pr-8"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-[130px] h-9"
                  placeholder="From"
                />
                <span className="text-muted-foreground text-sm">-</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-[130px] h-9"
                />
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={!hashtagFilter && !locationFilter && !characterFilter && !searchQuery && !dateFrom && !dateTo ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setHashtagFilter(null);
                setLocationFilter(null);
                setCharacterFilter(null);
                setSearchQuery("");
                setSearchInput("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            >
              All
            </Button>
            {searchQuery && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSearchInput("");
                  setPage(1);
                }}
              >
                <Search className="h-3.5 w-3.5 mr-1" />
                &quot;{searchQuery.length > 15 ? searchQuery.slice(0, 15) + "..." : searchQuery}&quot;
              </Button>
            )}
            {(dateFrom || dateTo) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {dateFrom || "..."} - {dateTo || "..."}
              </Button>
            )}
            {locationFilter && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLocationFilter(null);
                  setPage(1);
                }}
              >
                <MapPin className="h-3.5 w-3.5 mr-1" />
                {locationNames[locationFilter] || "Location"}
              </Button>
            )}
            {characterFilter && characterMap[characterFilter] && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCharacterFilter(null);
                  setPage(1);
                }}
              >
                <User className="h-3.5 w-3.5 mr-1" />
                {characterMap[characterFilter].name}
              </Button>
            )}
            {hashtags.map((tag) => (
              <Button
                key={tag}
                variant={hashtagFilter === tag ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setHashtagFilter(hashtagFilter === tag ? null : tag);
                  setPage(1);
                }}
              >
                #{tag}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {journalLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-full" />
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    </div>
                  </Card>
                ))}
              </>
            ) : (
            journal.data.map((entry) => (
              <StatusCard
                key={entry._id}
                entry={entry}
                user={user}
                locationNames={locationNames}
                characterMap={characterMap}
                onEdit={(e) => {
                  setEditingEntry(e);
                  setComposerOpen(true);
                }}
                onDelete={(e) => setDeleteConfirm(e)}
                onHashtagClick={(tag) => {
                  setHashtagFilter(tag);
                  setPage(1);
                }}
                onLocationClick={(refId) => {
                  setLocationFilter(refId);
                  setPage(1);
                }}
                onCharacterClick={(charId) => {
                  setCharacterFilter(charId);
                  setPage(1);
                }}
                onImageClick={(images, index) => openLightbox(images, index)}
              />
            ))
            )}
            {!journalLoading && journal.data.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="flex justify-center mb-3">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No status yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Share what&apos;s on your mind with your first post</p>
                  <Button onClick={() => setComposerOpen(true)}>Create Status</Button>
                </CardContent>
              </Card>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete status?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/20 backdrop-blur-md overflow-hidden">
          <div className="relative flex items-center justify-center min-h-[80vh]">
            {lightboxImages.length > 0 && lightboxIndex >= 0 && (
              <>
                <img
                  src={lightboxImages[lightboxIndex]?.src || lightboxImages[lightboxIndex]}
                  alt=""
                  className="max-w-full max-h-[85vh] object-contain"
                />
                {lightboxImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={() => setLightboxIndex((i) => (i <= 0 ? lightboxImages.length - 1 : i - 1))}
                    >
                      <ChevronRight className="h-8 w-8 rotate-180" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={() => setLightboxIndex((i) => (i >= lightboxImages.length - 1 ? 0 : i + 1))}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
          {lightboxImages.length > 1 && (
            <p className="text-center text-sm text-white/80 py-2">
              {lightboxIndex + 1} / {lightboxImages.length}
            </p>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Journal Composer (modal)
function JournalComposer({
  user,
  open,
  onOpenChange,
  editingEntry,
  dungeons,
  buildings,
  activeChars,
  onSubmit,
}) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [locationTag, setLocationTag] = useState({ locType: null, refId: null });
  const [charTags, setCharTags] = useState([]);

  useEffect(() => {
    if (editingEntry) {
      setContent(editingEntry.content || "");
      setImages(editingEntry.images || []);
      setLocationTag(
        editingEntry.locationTag?.refId
          ? {
              locType: editingEntry.locationTag.locType,
              refId: editingEntry.locationTag.refId,
            }
          : { locType: null, refId: null }
      );
      setCharTags(editingEntry.characterTags || []);
    } else {
      setContent("");
      setImages([]);
      setLocationTag({ locType: null, refId: null });
      setCharTags([]);
    }
  }, [editingEntry, open]);

  const houses = buildings.filter((b) => b.type === "house" && b.built);
  const leisureZones = buildings.filter((b) => b.type === "lewd_location" && b.built);

  const locationOptions = [
    ...dungeons.filter((d) => d.unlocked).map((d) => ({ label: d.name, locType: "dungeon", refId: d._id })),
    ...houses.map((b) => ({ label: b.name || "House", locType: "house", refId: b._id })),
    ...leisureZones.map((b) => ({ label: b.name || "Leisure Zone", locType: "leisure", refId: b._id })),
  ];

  const toggleChar = (id) => {
    setCharTags((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onSubmit({
      content,
      images,
      locationTag: locationTag.refId ? locationTag : null,
      characterTags: charTags,
    });
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, content, images, locationTag, charTags]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-muted/50"
          onClick={() => onOpenChange(true)}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <Input
            placeholder={`What's on your mind, ${user?.name || "Player"}?`}
            className="flex-1 bg-muted/50 border-0 cursor-pointer"
            readOnly
          />
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Status" : "Create Status"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </div>
            <div>
              <ImageUploadMulti value={images} onChange={setImages} maxImages={10} showLabel={false} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select
                value={
                  locationTag.refId
                    ? `${locationTag.locType}-${String(locationTag.refId)}`
                    : "none"
                }
                onValueChange={(v) => {
                  if (v === "none") setLocationTag({ locType: null, refId: null });
                  else {
                    const [locType, refId] = v.split("-");
                    setLocationTag({ locType, refId });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {locationOptions.map((opt) => (
                    <SelectItem
                      key={String(opt.refId)}
                      value={`${opt.locType}-${String(opt.refId)}`}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeChars.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Tag Characters</label>
                <div className="flex flex-wrap gap-2">
                  {activeChars.map((c) => (
                    <Button
                      key={c._id}
                      type="button"
                      variant={charTags.includes(c._id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleChar(c._id)}
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingEntry ? "Update" : "Post"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
