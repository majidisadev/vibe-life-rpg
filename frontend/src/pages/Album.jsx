import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "../components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Zap,
  Tag,
  ChevronLeft,
  ChevronRight,
  Grid,
  LayoutGrid,
  Columns,
  Filter,
  X,
  ArrowLeft,
  Users,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";
import ImageUpload from "../components/ImageUpload";

export default function Album() {
  const { user, refreshUser } = useUser();
  const [photos, setPhotos] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeCharacters, setActiveCharacters] = useState([]);
  const [lewdLocations, setLewdLocations] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    tags: [],
    characters: [],
    location: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [layout, setLayout] = useState("grid"); // "grid", "waterfall", "justified"
  const [searchQuery, setSearchQuery] = useState({
    title: "",
    location: "",
    characters: "",
  });
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  // Get all unique tags from photos
  const allTags = Array.from(
    new Set(photos.flatMap((photo) => photo.tags || [])),
  ).sort();

  // Filter photos by selected tags and search query
  const filteredPhotos = photos.filter((photo) => {
    // Filter by tags
    if (selectedTags.length > 0) {
      const photoTags = photo.tags || [];
      const hasSelectedTag = selectedTags.some((tag) =>
        photoTags.includes(tag),
      );
      if (!hasSelectedTag) return false;
    }

    // Filter by search query
    const titleMatch =
      !searchQuery.title ||
      (photo.title || "")
        .toLowerCase()
        .includes(searchQuery.title.toLowerCase());

    const locationMatch =
      !searchQuery.location ||
      (photo.location?.name || "")
        .toLowerCase()
        .includes(searchQuery.location.toLowerCase());

    const charactersMatch =
      !searchQuery.characters ||
      (photo.characters || []).some((char) =>
        (char.name || "")
          .toLowerCase()
          .includes(searchQuery.characters.toLowerCase()),
      );

    return titleMatch && locationMatch && charactersMatch;
  });

  // Pagination calculations - data is already paginated from backend
  // But we still need to filter client-side for tags and search
  const paginatedPhotos = filteredPhotos; // Already paginated from backend, but filtered client-side

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage, itemsPerPage]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTags, searchQuery]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      // Add pagination params
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      // Add filter params if needed (for future use)
      // if (selectedTags.length > 0) {
      //   selectedTags.forEach(tag => params.append("tags", tag));
      // }

      const queryString = params.toString();
      const url = queryString ? `/album?${queryString}` : "/album";

      const [photosRes, charactersRes, buildingsRes] = await Promise.all([
        api.get(url),
        api.get("/characters?limit=1000"),
        api.get("/buildings"),
      ]);

      // Handle both old format (array) and new format (object with data and pagination)
      if (Array.isArray(photosRes.data)) {
        setPhotos(photosRes.data || []);
        setTotalItems(photosRes.data.length);
        setTotalPages(Math.ceil(photosRes.data.length / itemsPerPage));
      } else {
        setPhotos(photosRes.data.data || []);
        if (photosRes.data.pagination) {
          setTotalItems(photosRes.data.pagination.total);
          setTotalPages(photosRes.data.pagination.totalPages);
        }
      }

      // Handle both old format (array) and new format (object with data and pagination)
      let characters = [];
      if (charactersRes && charactersRes.data) {
        if (Array.isArray(charactersRes.data)) {
          characters = charactersRes.data;
        } else if (
          charactersRes.data.data &&
          Array.isArray(charactersRes.data.data)
        ) {
          characters = charactersRes.data.data;
        }
      }

      if (user?.activeCharacters) {
        const activeList = characters.filter((c) =>
          user.activeCharacters.includes(c._id),
        );
        setActiveCharacters(activeList);
      }

      const builtLewdLocations = buildingsRes.data.filter(
        (b) => b.type === "lewd_location" && b.built,
      );
      setLewdLocations(builtLewdLocations);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user || user.energy < 1) {
        toast.error("Not enough energy");
        return;
      }
      await api.post("/album", formData);
      toast.success("Photo uploaded!");
      setOpen(false);
      resetForm();
      await refreshUser();
      loadData();
    } catch (error) {
      console.error("Error saving photo:", error);
      toast.error(error.response?.data?.error || "Error saving photo");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      image: "",
      tags: [],
      characters: [],
      location: "",
    });
    setTagInput("");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleDelete = async (photoId) => {
    try {
      await api.delete(`/album/${photoId}`);
      toast.success("Photo deleted");
      loadData();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Error deleting photo");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/fantasy-world">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Album</h1>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
              }}
              disabled={!user || user.energy < 1}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Photo (1 Energy)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Photo</DialogTitle>
              <DialogDescription>
                Upload a photo (consumes 1 energy)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter photo title..."
                  className="mt-2"
                />
              </div>
              <ImageUpload
                value={formData.image}
                onChange={(value) => setFormData({ ...formData, image: value })}
              />
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag..."
                  />
                  <Button type="button" onClick={handleAddTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-muted"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Characters (from active characters)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 overflow-y-auto max-h-40">
                  {activeCharacters.map((character) => (
                    <div
                      key={character._id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        checked={formData.characters.includes(character._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              characters: [
                                ...formData.characters,
                                character._id,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              characters: formData.characters.filter(
                                (id) => id !== character._id,
                              ),
                            });
                          }
                        }}
                      />
                      <Label className="text-sm">{character.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Select
                  value={formData.location || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      location: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {lewdLocations.map((location) => (
                      <SelectItem key={location._id} value={location._id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.image || !user || user.energy < 1}
                >
                  Upload
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="search-title">Title</Label>
            <div className="relative mt-2">
              <Input
                id="search-title"
                value={searchQuery.title}
                onChange={(e) =>
                  setSearchQuery({ ...searchQuery, title: e.target.value })
                }
                placeholder="Search by title..."
                className="pr-8"
              />
              {searchQuery.title && (
                <button
                  type="button"
                  onClick={() => setSearchQuery({ ...searchQuery, title: "" })}
                  className="absolute -translate-y-1/2 right-2 top-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="search-location">Location</Label>
            <div className="relative mt-2">
              <Input
                id="search-location"
                value={searchQuery.location}
                onChange={(e) =>
                  setSearchQuery({ ...searchQuery, location: e.target.value })
                }
                placeholder="Search by location..."
                className="pr-8"
              />
              {searchQuery.location && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery({ ...searchQuery, location: "" })
                  }
                  className="absolute -translate-y-1/2 right-2 top-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="search-characters">Characters</Label>
            <div className="relative mt-2">
              <Input
                id="search-characters"
                value={searchQuery.characters}
                onChange={(e) =>
                  setSearchQuery({ ...searchQuery, characters: e.target.value })
                }
                placeholder="Search by character name..."
                className="pr-8"
              />
              {searchQuery.characters && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery({ ...searchQuery, characters: "" })
                  }
                  className="absolute -translate-y-1/2 right-2 top-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        {(searchQuery.title ||
          searchQuery.location ||
          searchQuery.characters) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setSearchQuery({ title: "", location: "", characters: "" })
            }
          >
            <X className="w-4 h-4 mr-2" />
            Clear search
          </Button>
        )}
      </div>

      {/* Filters and Layout Controls */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex-1">
            <Label className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4" />
              Filter by Tags:
            </Label>
            <div className="flex flex-wrap gap-2 p-2 overflow-y-auto border rounded-md max-h-32">
              {allTags.map((tag) => (
                <div key={tag} className="flex items-center gap-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTags([...selectedTags, tag]);
                      } else {
                        setSelectedTags(selectedTags.filter((t) => t !== tag));
                      }
                    }}
                  />
                  <Label
                    htmlFor={`tag-${tag}`}
                    className="text-sm cursor-pointer"
                  >
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Layout Toggle */}
        <div className="flex items-center gap-2">
          <Label>Layout:</Label>
          <div className="flex gap-2">
            <Button
              variant={layout === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setLayout("grid")}
              title="Grid Layout"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={layout === "waterfall" ? "default" : "outline"}
              size="sm"
              onClick={() => setLayout("waterfall")}
              title="Waterfall Layout"
            >
              <Columns className="w-4 h-4" />
            </Button>
            <Button
              variant={layout === "justified" ? "default" : "outline"}
              size="sm"
              onClick={() => setLayout("justified")}
              title="Justified Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div
        className={
          layout === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : layout === "waterfall"
              ? "columns-1 md:columns-2 lg:columns-3 gap-4"
              : "flex flex-wrap gap-4"
        }
      >
        {paginatedPhotos.map((photo) => (
          <Card
            key={photo._id}
            className={
              layout === "waterfall"
                ? "break-inside-avoid mb-4"
                : layout === "justified"
                  ? "flex-1 min-w-[300px] max-w-[400px]"
                  : ""
            }
          >
            <div
              className={
                layout === "waterfall"
                  ? "w-full overflow-hidden cursor-pointer relative group"
                  : layout === "justified"
                    ? "w-full h-64 overflow-hidden cursor-pointer relative group"
                    : "w-full h-64 overflow-hidden cursor-pointer relative group"
              }
              onClick={() => setZoomedPhoto(photo)}
            >
              <img
                src={photo.image}
                alt={photo.title || "Photo"}
                className={
                  layout === "waterfall"
                    ? "w-full h-auto object-cover"
                    : "w-full h-full object-cover"
                }
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo._id);
                }}
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {filteredPhotos.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
            items
            {(selectedTags.length > 0 ||
              searchQuery.title ||
              searchQuery.location ||
              searchQuery.characters) &&
              ` (filtered)`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Zoom Dialog */}
      <Dialog
        open={!!zoomedPhoto}
        onOpenChange={(open) => !open && setZoomedPhoto(null)}
      >
        <DialogPortal>
          <DialogOverlay className="bg-background/90 backdrop-blur-md" />
          {zoomedPhoto && (
            <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg overflow-hidden">
              <div className="flex flex-col">
                {/* Title above image */}
                <div className="px-6 pt-6 pb-4">
                  <DialogTitle className="text-xl font-semibold text-center">
                    {zoomedPhoto.title || "Photo"}
                  </DialogTitle>
                </div>

                {/* Image */}
                <div className="flex items-center justify-center flex-1 p-4 overflow-auto bg-muted/30">
                  <img
                    src={zoomedPhoto.image}
                    alt={zoomedPhoto.title || "Photo"}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  />
                </div>

                {/* Tags, Characters, Location below image */}
                <div className="px-6 pt-4 pb-6 border-t">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {zoomedPhoto.tags && zoomedPhoto.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Tags:
                        </span>
                        {zoomedPhoto.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs rounded-md bg-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {zoomedPhoto.characters &&
                      zoomedPhoto.characters.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Characters:
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {zoomedPhoto.characters
                              .map((c) => c.name || c)
                              .join(", ")}
                          </span>
                        </div>
                      )}

                    {zoomedPhoto.location && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Location:
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {zoomedPhoto.location.name || zoomedPhoto.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50">
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          )}
        </DialogPortal>
      </Dialog>
    </div>
  );
}
