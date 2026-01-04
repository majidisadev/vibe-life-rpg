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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Checkbox } from "../components/ui/checkbox";
import {
  Plus,
  Trash2,
  Download,
  ExternalLink,
  Table,
  Grid,
  Image,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ArrowUp,
  ArrowDown,
  Map,
  Globe,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component for Map View
function MapView({ media, onCountryClick, selectedCountry }) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loadingGeoJson, setLoadingGeoJson] = useState(true);

  useEffect(() => {
    // Load GeoJSON data from a CDN
    const loadGeoJson = async () => {
      try {
        // Using Natural Earth data via a reliable CDN
        const response = await fetch(
          "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
        );
        if (!response.ok) {
          throw new Error("Failed to load GeoJSON");
        }
        const data = await response.json();
        setGeoJsonData(data);
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
        // Fallback: try alternative source
        try {
          const response = await fetch(
            "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
          );
          if (response.ok) {
            const data = await response.json();
            setGeoJsonData(data);
          } else {
            throw new Error("Fallback also failed");
          }
        } catch (fallbackError) {
          console.error("Fallback GeoJSON also failed:", fallbackError);
          // Last fallback: try another source
          try {
            const response = await fetch(
              "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
            );
            if (response.ok) {
              const data = await response.json();
              setGeoJsonData(data);
            }
          } catch (lastError) {
            console.error("All GeoJSON sources failed:", lastError);
          }
        }
      } finally {
        setLoadingGeoJson(false);
      }
    };

    loadGeoJson();
  }, []);

  const getCountryMediaCount = (countryName) => {
    if (!countryName) return 0;
    return media.filter(
      (item) =>
        item.countryOrigin &&
        item.countryOrigin.toLowerCase() === countryName.toLowerCase()
    ).length;
  };

  const getCountryColor = (countryName) => {
    const count = getCountryMediaCount(countryName);
    if (count > 0) {
      return "#22c55e"; // green-500
    } else {
      return "#94a3b8"; // slate-400
    }
  };

  const onEachFeature = (feature, layer) => {
    const countryName =
      feature.properties.NAME ||
      feature.properties.name ||
      feature.properties.NAME_EN ||
      feature.properties.ADMIN ||
      feature.properties.NAME_LONG;
    const mediaCount = getCountryMediaCount(countryName);

    // Style function
    const style = {
      fillColor: getCountryColor(countryName),
      fillOpacity: mediaCount > 0 ? 0.7 : 0.3,
      color: "#ffffff",
      weight: 1,
      opacity: 0.8,
    };

    layer.setStyle(style);

    // Hover effects
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          fillOpacity: 0.9,
          weight: 2,
          color: "#3b82f6",
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        const style = {
          fillColor: getCountryColor(countryName),
          fillOpacity: mediaCount > 0 ? 0.7 : 0.3,
          color: "#ffffff",
          weight: 1,
          opacity: 0.8,
        };
        layer.setStyle(style);
      },
      click: () => {
        if (countryName) {
          onCountryClick(countryName);
        }
      },
    });

    // Tooltip
    layer.bindTooltip(
      `${countryName}${
        mediaCount > 0 ? ` (${mediaCount} media)` : " (no media)"
      }`,
      {
        permanent: false,
        direction: "top",
      }
    );
  };

  if (loadingGeoJson) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Loading map...</div>
          <div className="text-xs text-muted-foreground">Please wait...</div>
        </div>
      </div>
    );
  }

  if (!geoJsonData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-destructive mb-2">Failed to load map data</div>
          <div className="text-xs text-muted-foreground">
            Please check your connection
          </div>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        data={geoJsonData}
        onEachFeature={onEachFeature}
        style={(feature) => {
          const countryName =
            feature.properties.NAME ||
            feature.properties.name ||
            feature.properties.NAME_EN ||
            feature.properties.ADMIN ||
            feature.properties.NAME_LONG;
          return {
            fillColor: getCountryColor(countryName),
            fillOpacity: getCountryMediaCount(countryName) > 0 ? 0.7 : 0.3,
            color: "#ffffff",
            weight: 1,
            opacity: 0.8,
          };
        }}
      />
    </MapContainer>
  );
}

// Component for external sources popover with hover
function ExternalSourcesPopover({ sources, itemId }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors inline-flex items-center gap-1"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <ExternalLink className="h-3 w-3" />
          {sources.length} external source(s)
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="start"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="space-y-2">
          <div className="font-semibold text-sm mb-2">External Sources</div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {sources.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
              >
                <ExternalLink className="h-3 w-3 inline mr-1" />
                {url}
              </a>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Media() {
  const [media, setMedia] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("gallery"); // 'gallery', 'table', or 'map'
  const [showCoverImage, setShowCoverImage] = useState(true);
  const [fitImage, setFitImage] = useState(true); // Default true
  const [cardSize, setCardSize] = useState(4); // Grid columns: 1-6
  const [imageError, setImageError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState(null); // 'title', 'type', 'status', 'year', 'countryOrigin', 'externalSourcesCount'
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' or 'desc'
  const [formData, setFormData] = useState({
    title: "",
    dbLinks: [],
    type: "anime movie",
    status: "backlog",
    year: "",
    coverImage: "",
    description: "",
    externalSources: [],
    countryOrigin: "",
  });
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    yearFrom: "",
    yearTo: "",
    title: "",
    description: "",
    externalSources: "",
    countryOrigin: "",
  });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryMedia, setCountryMedia] = useState([]);
  const [countryList, setCountryList] = useState([]);

  // Load country list from GeoJSON
  useEffect(() => {
    const loadCountryList = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
        );
        if (!response.ok) {
          throw new Error("Failed to load GeoJSON");
        }
        const data = await response.json();

        // Extract country names from GeoJSON
        const countries = new Set();
        if (data.features) {
          data.features.forEach((feature) => {
            const countryName =
              feature.properties.NAME ||
              feature.properties.name ||
              feature.properties.NAME_EN ||
              feature.properties.ADMIN ||
              feature.properties.NAME_LONG;
            if (countryName) {
              countries.add(countryName);
            }
          });
        }

        // Convert to array and sort alphabetically
        const sortedCountries = Array.from(countries).sort();
        setCountryList(sortedCountries);
      } catch (error) {
        console.error("Error loading country list:", error);
        // Fallback: try alternative source
        try {
          const response = await fetch(
            "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
          );
          if (response.ok) {
            const data = await response.json();
            const countries = new Set();
            if (data.features) {
              data.features.forEach((feature) => {
                const countryName =
                  feature.properties.NAME ||
                  feature.properties.name ||
                  feature.properties.NAME_EN ||
                  feature.properties.ADMIN ||
                  feature.properties.NAME_LONG;
                if (countryName) {
                  countries.add(countryName);
                }
              });
            }
            const sortedCountries = Array.from(countries).sort();
            setCountryList(sortedCountries);
          }
        } catch (fallbackError) {
          console.error("Fallback GeoJSON also failed:", fallbackError);
        }
      }
    };

    loadCountryList();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.type,
    filters.status,
    filters.yearFrom,
    filters.yearTo,
    filters.title,
    filters.description,
    filters.externalSources,
    filters.countryOrigin,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    filters.type,
    filters.status,
    filters.yearFrom,
    filters.yearTo,
    filters.title,
    filters.description,
    filters.externalSources,
    filters.countryOrigin,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      if (filters.yearFrom) params.append("yearFrom", filters.yearFrom);
      if (filters.yearTo) params.append("yearTo", filters.yearTo);
      if (filters.title) params.append("title", filters.title);
      if (filters.description)
        params.append("description", filters.description);
      if (filters.externalSources)
        params.append("externalSources", filters.externalSources);
      if (filters.countryOrigin)
        params.append("countryOrigin", filters.countryOrigin);
      
      // Add pagination params
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      const queryString = params.toString();
      const url = queryString ? `/media?${queryString}` : "/media";

      const res = await api.get(url);

      if (res && res.data) {
        // Handle both old format (array) and new format (object with data and pagination)
        if (Array.isArray(res.data)) {
          setMedia(res.data);
          // Calculate pagination from array length (fallback for old API)
          setTotalItems(res.data.length);
          setTotalPages(Math.ceil(res.data.length / itemsPerPage));
        } else {
          setMedia(res.data.data || []);
          // Update pagination info from response
          if (res.data.pagination) {
            setTotalItems(res.data.pagination.total);
            setTotalPages(res.data.pagination.totalPages);
          }
        }
      } else {
        setMedia([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to load media. Please check your connection and try again.";
      setError(errorMessage);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMedia) {
        await api.put(`/media/${editingMedia._id}`, {
          ...formData,
          year: formData.year ? parseInt(formData.year) : null,
        });
      } else {
        await api.post("/media", {
          ...formData,
          year: formData.year ? parseInt(formData.year) : null,
        });
      }
      setOpen(false);
      setEditingMedia(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving media:", error);
    }
  };

  const handleDelete = (id) => {
    setMediaToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (mediaToDelete) {
      try {
        await api.delete(`/media/${mediaToDelete}`);
        toast.success("Media deleted");
        loadData();
      } catch (error) {
        console.error("Error deleting media:", error);
        toast.error("Error deleting media");
      }
    }
    setShowDeleteDialog(false);
    setMediaToDelete(null);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      if (filters.yearFrom) params.append("yearFrom", filters.yearFrom);
      if (filters.yearTo) params.append("yearTo", filters.yearTo);
      if (filters.title) params.append("title", filters.title);
      if (filters.description)
        params.append("description", filters.description);

      const res = await api.get(`/media/export/json?${params.toString()}`);
      const dataStr = JSON.stringify(res.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "media-export.json";
      link.click();
    } catch (error) {
      console.error("Error exporting media:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      dbLinks: [],
      type: "anime movie",
      status: "backlog",
      year: "",
      coverImage: "",
      description: "",
      externalSources: [],
      countryOrigin: "",
    });
    setImageError(false);
  };

  const openEditDialog = (item) => {
    setEditingMedia(item);
    setFormData({
      title: item.title,
      dbLinks: item.dbLinks || [],
      type: item.type,
      status: item.status,
      year: item.year || "",
      coverImage: item.coverImage || "",
      description: item.description || "",
      externalSources: item.externalSources || [],
      countryOrigin: item.countryOrigin || "",
    });
    setImageError(false);
    setOpen(true);
  };

  // Handle country click
  const handleCountryClick = (countryName) => {
    setSelectedCountry(countryName);
  };

  // Update countryMedia when media or selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      const countryMediaList = media.filter(
        (item) =>
          item.countryOrigin &&
          item.countryOrigin.toLowerCase() === selectedCountry.toLowerCase()
      );
      setCountryMedia(countryMediaList);
    } else {
      setCountryMedia([]);
    }
  }, [media, selectedCountry]);

  const addExternalSource = () => {
    setUrlInput("");
    setShowUrlDialog(true);
  };

  const confirmAddUrl = () => {
    if (urlInput.trim()) {
      setFormData({
        ...formData,
        externalSources: [...formData.externalSources, urlInput.trim()],
      });
      setShowUrlDialog(false);
      setUrlInput("");
    }
  };

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };


  // Pagination calculations - data is already paginated from backend
  // But we still need to sort client-side if sortField is set
  const sortedMedia = sortField ? [...media].sort((a, b) => {
    if (!sortField) return 0;

    let aValue, bValue;

    // Handle externalSourcesCount as special case
    if (sortField === "externalSourcesCount") {
      aValue = (a.externalSources || []).length;
      bValue = (b.externalSources || []).length;
    } else if (sortField === "year") {
      // Handle year as number
      aValue = a.year != null ? parseInt(a.year) : -1;
      bValue = b.year != null ? parseInt(b.year) : -1;
    } else {
      aValue = a[sortField];
      bValue = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortDirection === "asc") {
      if (sortField === "year" || sortField === "externalSourcesCount") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      if (sortField === "year" || sortField === "externalSourcesCount") {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) : media;
  
  const paginatedMedia = sortedMedia; // Already paginated from backend

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getGridCols = () => {
    const cols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
      6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    };
    return cols[cardSize] || cols[4];
  };

  const handleExportWithoutId = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      if (filters.yearFrom) params.append("yearFrom", filters.yearFrom);
      if (filters.yearTo) params.append("yearTo", filters.yearTo);
      if (filters.title) params.append("title", filters.title);
      if (filters.description)
        params.append("description", filters.description);
      if (filters.externalSources)
        params.append("externalSources", filters.externalSources);

      const res = await api.get(`/media/export/json?${params.toString()}`);
      // Remove _id field from each media item
      const dataWithoutId = res.data.map(({ _id, ...rest }) => rest);
      const dataStr = JSON.stringify(dataWithoutId, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "media-export-without-id.json";
      link.click();
    } catch (error) {
      console.error("Error exporting media:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Media Management</h1>
        <div className="flex gap-2">
          <div className="relative group">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <div className="absolute right-0 mt-1 w-56 bg-popover border border-input rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center"
                  onClick={handleExportWithoutId}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON Without ID
                </button>
              </div>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingMedia(null);
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Media
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMedia ? "Edit Media" : "New Media"}
                </DialogTitle>
                <DialogDescription>
                  Add a new media item (anime, manga, book, game, movie, TV
                  show, etc.)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anime movie">Anime Movie</SelectItem>
                        <SelectItem value="anime tv serial">
                          Anime TV Serial
                        </SelectItem>
                        <SelectItem value="ero anime">Ero Anime</SelectItem>
                        <SelectItem value="ero manga">Ero Manga</SelectItem>
                        <SelectItem value="fiction book">
                          Fiction Book
                        </SelectItem>
                        <SelectItem value="game">Game</SelectItem>
                        <SelectItem value="manga">Manga</SelectItem>
                        <SelectItem value="manhwa">Manhwa</SelectItem>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="non fiction book">
                          Non Fiction Book
                        </SelectItem>
                        <SelectItem value="online game">Online Game</SelectItem>
                        <SelectItem value="tv serial">TV Serial</SelectItem>
                        <SelectItem value="vn game">VN Game</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="not started">Not Started</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="countryOrigin">Country Origin</Label>
                    <Select
                      value={formData.countryOrigin || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          countryOrigin: value === "none" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="none">None</SelectItem>
                        {countryList.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => {
                      setFormData({ ...formData, coverImage: e.target.value });
                      setImageError(false);
                    }}
                  />
                  {formData.coverImage && (
                    <div className="mt-2">
                      <Label className="text-sm text-muted-foreground">
                        Preview:
                      </Label>
                      <div className="mt-1 border rounded-md overflow-hidden">
                        {imageError ? (
                          <div className="w-full h-48 flex items-center justify-center text-sm text-muted-foreground bg-muted">
                            Failed to load image
                          </div>
                        ) : (
                          <img
                            src={formData.coverImage}
                            alt="Cover preview"
                            className="w-full h-48 object-contain bg-muted"
                            onError={() => setImageError(true)}
                            onLoad={() => setImageError(false)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>
                    External Sources ({formData.externalSources.length})
                  </Label>
                  <div className="space-y-2">
                    {formData.externalSources.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {url}
                        </a>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              externalSources: formData.externalSources.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addExternalSource}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Add External Source
                    </Button>
                  </div>
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
                    <X className="h-4 w-4" />
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4" />
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value === "all" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="anime movie">Anime Movie</SelectItem>
                  <SelectItem value="anime tv serial">
                    Anime TV Serial
                  </SelectItem>
                  <SelectItem value="ero anime">Ero Anime</SelectItem>
                  <SelectItem value="ero manga">Ero Manga</SelectItem>
                  <SelectItem value="fiction book">Fiction Book</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="manga">Manga</SelectItem>
                  <SelectItem value="manhwa">Manhwa</SelectItem>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="non fiction book">
                    Non Fiction Book
                  </SelectItem>
                  <SelectItem value="online game">Online Game</SelectItem>
                  <SelectItem value="tv serial">TV Serial</SelectItem>
                  <SelectItem value="vn game">VN Game</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="not started">Not Started</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year From</Label>
              <Input
                type="number"
                value={filters.yearFrom}
                onChange={(e) =>
                  setFilters({ ...filters, yearFrom: e.target.value })
                }
                placeholder="From"
              />
            </div>
            <div>
              <Label>Year To</Label>
              <Input
                type="number"
                value={filters.yearTo}
                onChange={(e) =>
                  setFilters({ ...filters, yearTo: e.target.value })
                }
                placeholder="To"
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={filters.title}
                onChange={(e) =>
                  setFilters({ ...filters, title: e.target.value })
                }
                placeholder="Search title..."
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={filters.description}
                onChange={(e) =>
                  setFilters({ ...filters, description: e.target.value })
                }
                placeholder="Search description..."
              />
            </div>
            <div>
              <Label>External Sources</Label>
              <Input
                value={filters.externalSources}
                onChange={(e) =>
                  setFilters({ ...filters, externalSources: e.target.value })
                }
                placeholder="Search external sources..."
              />
            </div>
            <div>
              <Label>Country Origin</Label>
              <Select
                value={filters.countryOrigin || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    countryOrigin: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All</SelectItem>
                  {countryList.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Items per page:</Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>View Mode:</Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "gallery" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("gallery")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {viewMode === "gallery" && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showCover"
                    checked={showCoverImage}
                    onCheckedChange={(checked) => setShowCoverImage(checked)}
                  />
                  <Label
                    htmlFor="showCover"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Image className="h-4 w-4" />
                    Show Cover
                  </Label>
                </div>
                {showCoverImage && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="fitImage"
                      checked={fitImage}
                      onCheckedChange={(checked) => setFitImage(checked)}
                    />
                    <Label htmlFor="fitImage" className="cursor-pointer">
                      Fit Image
                    </Label>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Label className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Card Size:
                  </Label>
                  <Input
                    type="range"
                    min="1"
                    max="6"
                    value={cardSize}
                    onChange={(e) => setCardSize(parseInt(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    {cardSize} cols
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Sort By:</Label>
                  <Select
                    value={sortField || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setSortField(null);
                      } else {
                        setSortField(value);
                        setSortDirection("asc");
                      }
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="countryOrigin">Country Origin</SelectItem>
                      <SelectItem value="externalSourcesCount">URL Counts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {sortField && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={sortDirection === "asc" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSortDirection("asc");
                        setCurrentPage(1);
                      }}
                    >
                      <ArrowUp className="h-4 w-4 mr-1" />
                      Asc
                    </Button>
                    <Button
                      variant={sortDirection === "desc" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSortDirection("desc");
                        setCurrentPage(1);
                      }}
                    >
                      <ArrowDown className="h-4 w-4 mr-1" />
                      Desc
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="text-muted-foreground mb-2">Loading media...</div>
              <div className="text-xs text-muted-foreground">
                Please wait...
              </div>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <div className="text-destructive font-semibold mb-2">
                  Error Loading Media
                </div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadData}>Retry</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    loadData();
                  }}
                >
                  Clear Error & Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                No media found. Create your first media item!
              </div>
              <Button
                onClick={() => {
                  setEditingMedia(null);
                  resetForm();
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Media
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "map" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="h-[600px] w-full relative">
                  <MapView
                    media={media}
                    onCountryClick={handleCountryClick}
                    selectedCountry={selectedCountry}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCountry
                    ? `Media from ${selectedCountry}`
                    : "Select a Country"}
                </CardTitle>
                <CardDescription>
                  {selectedCountry
                    ? `${countryMedia.length} media item(s) found`
                    : "Click on a country on the map to view its media"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCountry ? (
                  countryMedia.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {countryMedia.map((item) => (
                        <Card
                          key={item._id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-semibold text-sm mb-1 line-clamp-2">
                                  {item.title}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {item.type} • {item.status} •{" "}
                                  {item.year || "-"}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => openEditDialog(item)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-7 w-7"
                                  onClick={() => handleDelete(item._id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No media found for this country
                    </div>
                  )
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Click on a country on the map to view its media</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        {sortField === "title" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        {sortField === "type" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortField === "status" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("year")}
                    >
                      <div className="flex items-center gap-2">
                        Year
                        {sortField === "year" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("countryOrigin")}
                    >
                      <div className="flex items-center gap-2">
                        Country Origin
                        {sortField === "countryOrigin" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("externalSourcesCount")}
                    >
                      <div className="flex items-center gap-2">
                        URL
                        {sortField === "externalSourcesCount" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMedia.map((item) => (
                    <tr key={item._id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{item.title}</td>
                      <td className="p-4 capitalize">{item.type}</td>
                      <td className="p-4 capitalize">{item.status}</td>
                      <td className="p-4">{item.year || "-"}</td>
                      <td className="p-4">{item.countryOrigin || "-"}</td>
                      <td className="p-4">
                        {(item.externalSources || []).length}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(item._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-4 ${getGridCols()}`}>
          {paginatedMedia.map((item) => (
            <Card key={item._id} className="flex flex-col">
              {showCoverImage && item.coverImage && (
                <div
                  className={`w-full ${
                    fitImage ? "h-48" : "h-auto"
                  } overflow-hidden`}
                >
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className={`w-full ${
                      fitImage ? "h-full object-cover" : "h-auto object-contain"
                    }`}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="capitalize">
                      {item.type} • {item.status} • {item.year || "-"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  {item.externalSources && item.externalSources.length > 0 && (
                    <ExternalSourcesPopover
                      sources={item.externalSources}
                      itemId={item._id}
                    />
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && media.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
                items
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
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
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
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
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Media Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this media? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add URL Dialog */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter URL</DialogTitle>
            <DialogDescription>
              Add an external source URL to this media.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  confirmAddUrl();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUrlDialog(false);
                setUrlInput("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={confirmAddUrl}
              disabled={!urlInput.trim()}
            >
              Add URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
