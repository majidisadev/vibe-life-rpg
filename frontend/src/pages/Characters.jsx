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
import { Checkbox } from "../components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Plus,
  Trash2,
  Table,
  Grid,
  Image as ImageIcon,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ArrowUp,
  ArrowDown,
  Map,
  Check,
  ChevronDown,
  X,
  Save,
  Upload,
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

// Japan prefectures list - will be loaded dynamically from GeoJSON
const DEFAULT_JAPAN_PREFECTURES = [
  "Aichi", "Akita", "Aomori", "Chiba", "Ehime", "Fukui", "Fukuoka",
  "Fukushima", "Gifu", "Gunma", "Hiroshima", "Hokkaido", "Hyogo",
  "Ibaraki", "Ishikawa", "Iwate", "Kagawa", "Kagoshima", "Kanagawa",
  "Kochi", "Kumamoto", "Kyoto", "Mie", "Miyagi", "Miyazaki", "Nagano",
  "Nagasaki", "Nara", "Niigata", "Oita", "Okayama", "Okinawa", "Osaka",
  "Saga", "Saitama", "Shiga", "Shimane", "Shizuoka", "Tochigi",
  "Tokushima", "Tokyo", "Tottori", "Toyama", "Wakayama", "Yamagata",
  "Yamaguchi", "Yamanashi"
];

// Component for World Map View
function WorldMapView({ characters, onCountryClick, selectedCountry }) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loadingGeoJson, setLoadingGeoJson] = useState(true);

  useEffect(() => {
    const loadGeoJson = async () => {
      try {
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
        try {
          const response = await fetch(
            "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
          );
          if (response.ok) {
            const data = await response.json();
            setGeoJsonData(data);
          }
        } catch (fallbackError) {
          console.error("Fallback GeoJSON also failed:", fallbackError);
        }
      } finally {
        setLoadingGeoJson(false);
      }
    };

    loadGeoJson();
  }, []);

  const getCountryCharacterCount = (countryName) => {
    if (!countryName) return 0;
    return characters.filter(
      (item) =>
        item.countryOrigin &&
        item.countryOrigin.toLowerCase() === countryName.toLowerCase()
    ).length;
  };

  const getCountryColor = (countryName) => {
    const count = getCountryCharacterCount(countryName);
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
    const characterCount = getCountryCharacterCount(countryName);

    const style = {
      fillColor: getCountryColor(countryName),
      fillOpacity: characterCount > 0 ? 0.7 : 0.3,
      color: "#ffffff",
      weight: 1,
      opacity: 0.8,
    };

    layer.setStyle(style);

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
          fillOpacity: characterCount > 0 ? 0.7 : 0.3,
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

    layer.bindTooltip(
      `${countryName}${characterCount > 0 ? ` (${characterCount} Characters)` : " (no Characters)"}`,
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
            fillOpacity: getCountryCharacterCount(countryName) > 0 ? 0.7 : 0.3,
            color: "#ffffff",
            weight: 1,
            opacity: 0.8,
          };
        }}
      />
    </MapContainer>
  );
}

// Component for Japan Prefectures Map View
function JapanPrefecturesMapView({ characters, onPrefectureClick, selectedPrefecture }) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loadingGeoJson, setLoadingGeoJson] = useState(true);

  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        // Try multiple sources for Japan prefectures GeoJSON
        const sources = [
          "https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson",
          "https://raw.githubusercontent.com/niiyz/JapanCityGeoJson/master/geojson/prefectures.geojson",
          "https://raw.githubusercontent.com/piuccio/open-data-jp-prefectures-geojson/master/47都道府県.geojson",
        ];

        let loaded = false;
        for (const source of sources) {
          try {
            const response = await fetch(source);
            if (response.ok) {
              const data = await response.json();
              setGeoJsonData(data);
              loaded = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        if (!loaded) {
          throw new Error("All sources failed");
        }
      } catch (error) {
        console.error("Error loading Japan GeoJSON:", error);
      } finally {
        setLoadingGeoJson(false);
      }
    };

    loadGeoJson();
  }, []);

  const getPrefectureCharacterCount = (prefectureName) => {
    if (!prefectureName) return 0;
    return characters.filter(
      (item) =>
        item.japanPrefecture &&
        item.japanPrefecture.toLowerCase() === prefectureName.toLowerCase()
    ).length;
  };

  const getPrefectureColor = (prefectureName) => {
    const count = getPrefectureCharacterCount(prefectureName);
    if (count > 0) {
      return "#22c55e"; // green-500
    } else {
      return "#94a3b8"; // slate-400
    }
  };

  const onEachFeature = (feature, layer) => {
    // Try multiple possible property names for prefecture name
    const prefectureName =
      feature.properties.NAME ||
      feature.properties.name ||
      feature.properties.NAME_ENG ||
      feature.properties.NAME_EN ||
      feature.properties.nam ||
      feature.properties.prefecture ||
      feature.properties.PREF ||
      feature.properties.都道府県名 ||
      feature.properties.都道府県;
    const characterCount = getPrefectureCharacterCount(prefectureName);

    const style = {
      fillColor: getPrefectureColor(prefectureName),
      fillOpacity: characterCount > 0 ? 0.7 : 0.3,
      color: "#ffffff",
      weight: 1,
      opacity: 0.8,
    };

    layer.setStyle(style);

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
          fillColor: getPrefectureColor(prefectureName),
          fillOpacity: characterCount > 0 ? 0.7 : 0.3,
          color: "#ffffff",
          weight: 1,
          opacity: 0.8,
        };
        layer.setStyle(style);
      },
      click: () => {
        if (prefectureName) {
          onPrefectureClick(prefectureName);
        }
      },
    });

    layer.bindTooltip(
      `${prefectureName}${characterCount > 0 ? ` (${characterCount} Characters)` : " (no Characters)"}`,
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
      center={[36.5, 139.5]}
      zoom={6}
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
          const prefectureName =
            feature.properties.NAME ||
            feature.properties.name ||
            feature.properties.NAME_ENG ||
            feature.properties.NAME_EN ||
            feature.properties.nam ||
            feature.properties.prefecture ||
            feature.properties.PREF ||
            feature.properties.都道府県名 ||
            feature.properties.都道府県;
          return {
            fillColor: getPrefectureColor(prefectureName),
            fillOpacity: getPrefectureCharacterCount(prefectureName) > 0 ? 0.7 : 0.3,
            color: "#ffffff",
            weight: 1,
            opacity: 0.8,
          };
        }}
      />
    </MapContainer>
  );
}

export default function Characters() {
  const [characters, setCharacters] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("gallery"); // 'gallery', 'table', or 'map'
  const [mapViewMode, setMapViewMode] = useState("world"); // 'world' or 'japan'
  const [showCoverImage, setShowCoverImage] = useState(true);
  const [fitImage, setFitImage] = useState(true);
  const [cardSize, setCardSize] = useState(4);
  const [imageError, setImageError] = useState(false);
  const [imageErrors, setImageErrors] = useState({}); // Track image errors per character ID
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [formData, setFormData] = useState({
    name: "",
    media: "",
    cover: "",
    countryOrigin: "",
    japanPrefecture: "",
    characterType: "",
    enemyStats: {
      hp: 10,
      baseReward: {
        xp: 5,
        coins: 5,
        resources: {
          meat: 0,
          wood: 0,
          stone: 0,
          iron: 0,
          crystal: 0,
        },
      },
    },
  });
  const [filters, setFilters] = useState({
    name: "",
    countryOrigin: "",
    japanPrefecture: "",
    media: "",
  });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);
  const [countryCharacters, setCountryCharacters] = useState([]);
  const [prefectureCharacters, setPrefectureCharacters] = useState([]);
  const [countryList, setCountryList] = useState([]);
  const [japanPrefectures, setJapanPrefectures] = useState(DEFAULT_JAPAN_PREFECTURES);
  const [mediaSearchOpen, setMediaSearchOpen] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [coverImageMode, setCoverImageMode] = useState("url"); // 'url' or 'upload'

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
      } catch (error) {
        console.error("Error loading country list:", error);
      }
    };

    loadCountryList();
  }, []);

  // Load Japan prefectures list from GeoJSON
  useEffect(() => {
    const loadJapanPrefectures = async () => {
      try {
        // Try multiple sources for Japan prefectures GeoJSON
        const sources = [
          "https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson",
          "https://raw.githubusercontent.com/niiyz/JapanCityGeoJson/master/geojson/prefectures.geojson",
          "https://raw.githubusercontent.com/piuccio/open-data-jp-prefectures-geojson/master/47都道府県.geojson",
        ];

        let loaded = false;
        for (const source of sources) {
          try {
            const response = await fetch(source);
            if (response.ok) {
              const data = await response.json();
              
              // Extract prefecture names from GeoJSON
              const prefectures = new Set();
              if (data.features) {
                data.features.forEach((feature) => {
                  // Try multiple possible property names for prefecture name
                  const prefectureName =
                    feature.properties.NAME ||
                    feature.properties.name ||
                    feature.properties.NAME_ENG ||
                    feature.properties.NAME_EN ||
                    feature.properties.nam ||
                    feature.properties.prefecture ||
                    feature.properties.PREF ||
                    feature.properties.都道府県名 ||
                    feature.properties.都道府県;
                  
                  if (prefectureName) {
                    prefectures.add(prefectureName);
                  }
                });
              }

              if (prefectures.size > 0) {
                const sortedPrefectures = Array.from(prefectures).sort();
                setJapanPrefectures(sortedPrefectures);
                loaded = true;
                break;
              }
            }
          } catch (err) {
            continue;
          }
        }

        if (!loaded) {
          console.warn("Failed to load prefectures from GeoJSON, using default list");
        }
      } catch (error) {
        console.error("Error loading Japan prefectures:", error);
      }
    };

    loadJapanPrefectures();
  }, []);

  // Load media list
  useEffect(() => {
    const loadMediaList = async () => {
      try {
        // Load all media for dropdown (use high limit to get all items)
        const res = await api.get("/media?limit=1000");
        if (res && res.data) {
          // Handle both old format (array) and new format (object with data and pagination)
          if (Array.isArray(res.data)) {
            setMediaList(res.data);
          } else if (res.data.data && Array.isArray(res.data.data)) {
            setMediaList(res.data.data);
          } else {
            setMediaList([]);
          }
        }
      } catch (error) {
        console.error("Error loading media list:", error);
        setMediaList([]);
      }
    };

    loadMediaList();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.name,
    filters.countryOrigin,
    filters.japanPrefecture,
    filters.media,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.name,
    filters.countryOrigin,
    filters.japanPrefecture,
    filters.media,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Reset image errors when loading new data
      setImageErrors({});
      const params = new URLSearchParams();
      if (filters.name) params.append("name", filters.name);
      if (filters.countryOrigin)
        params.append("countryOrigin", filters.countryOrigin);
      if (filters.japanPrefecture)
        params.append("japanPrefecture", filters.japanPrefecture);
      if (filters.media) params.append("media", filters.media);
      
      // Add pagination params
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      const queryString = params.toString();
      const url = queryString ? `/characters?${queryString}` : "/characters";

      const res = await api.get(url);

      if (res && res.data) {
        // Handle both old format (array) and new format (object with data and pagination)
        if (Array.isArray(res.data)) {
          setCharacters(res.data);
          setTotalItems(res.data.length);
          setTotalPages(Math.ceil(res.data.length / itemsPerPage));
        } else {
          setCharacters(res.data.data || []);
          if (res.data.pagination) {
            setTotalItems(res.data.pagination.total);
            setTotalPages(res.data.pagination.totalPages);
          }
        }
      } else {
        setCharacters([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to load Characters. Please check your connection and try again.";
      setError(errorMessage);
      setCharacters([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        media: formData.media || null,
        japanPrefecture: formData.countryOrigin === "Japan" ? formData.japanPrefecture : "",
        characterType: formData.characterType || null,
        // Only include enemyStats if characterType is enemy
        enemyStats: formData.characterType === "enemy"
          ? formData.enemyStats
          : undefined,
      };
      
      if (editingCharacter) {
        await api.put(`/characters/${editingCharacter._id}`, submitData);
      } else {
        await api.post("/characters", submitData);
      }
      setOpen(false);
      setEditingCharacter(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving Character:", error);
    }
  };

  const handleDelete = (id) => {
    setCharacterToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (characterToDelete) {
      try {
        await api.delete(`/characters/${characterToDelete}`);
        toast.success("Character deleted");
        loadData();
      } catch (error) {
        console.error("Error deleting Character:", error);
        toast.error("Error deleting Character");
      }
    }
    setShowDeleteDialog(false);
    setCharacterToDelete(null);
  };

  const compressImage = (
    file,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8
  ) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        e.target.value = ""; // Reset input
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        e.target.value = ""; // Reset input
        return;
      }

      try {
        // Compress image before converting to base64
        const compressedBase64 = await compressImage(file);
        setFormData({ ...formData, cover: compressedBase64 });
        setImageError(false);
        toast.success("Image uploaded successfully!");
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Error processing image", {
          description: "Please try again.",
        });
        e.target.value = ""; // Reset input
      }
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const resetForm = () => {
    setFormData({
      name: "",
      media: "",
      cover: "",
      countryOrigin: "",
      japanPrefecture: "",
      characterType: "",
      enemyStats: {
        hp: 10,
        baseReward: {
          xp: 5,
          coins: 5,
          resources: {
            meat: 0,
            wood: 0,
            stone: 0,
            iron: 0,
            crystal: 0,
          },
        },
      },
    });
    setImageError(false);
    setImageErrors({});
    setMediaSearchQuery("");
    setCoverImageMode("url");
  };

  const openEditDialog = (item) => {
    setEditingCharacter(item);
    const cover = item.cover || "";
    // Determine if cover is base64 (uploaded) or URL
    const isBase64 = cover.startsWith("data:image");
    setFormData({
      name: item.name,
      media: item.media?._id || item.media || "",
      cover: cover,
      countryOrigin: item.countryOrigin || "",
      japanPrefecture: item.japanPrefecture || "",
      characterType: item.characterType || "",
      enemyStats: item.enemyStats || {
        hp: 10,
        baseReward: {
          xp: 5,
          coins: 5,
          resources: {
            meat: 0,
            wood: 0,
            stone: 0,
            iron: 0,
            crystal: 0,
          },
        },
      },
    });
    setImageError(false);
    setMediaSearchQuery("");
    setCoverImageMode(isBase64 ? "upload" : "url");
    setOpen(true);
  };

  const handleCountryClick = (countryName) => {
    setSelectedCountry(countryName);
    setSelectedPrefecture(null);
    // Auto-switch to Japan prefectures view when Japan is selected
    if (countryName === "Japan") {
      setMapViewMode("japan");
    } else {
      setMapViewMode("world");
    }
  };

  const handlePrefectureClick = (prefectureName) => {
    setSelectedPrefecture(prefectureName);
  };

  useEffect(() => {
    if (selectedCountry) {
      const countryCharactersList = characters.filter(
        (item) =>
          item.countryOrigin &&
          item.countryOrigin.toLowerCase() === selectedCountry.toLowerCase()
      );
      setCountryCharacters(countryCharactersList);
    } else {
      setCountryCharacters([]);
    }
  }, [characters, selectedCountry]);

  useEffect(() => {
    if (selectedPrefecture) {
      const prefectureCharactersList = characters.filter(
        (item) =>
          item.japanPrefecture &&
          item.japanPrefecture.toLowerCase() === selectedPrefecture.toLowerCase()
      );
      setPrefectureCharacters(prefectureCharactersList);
    } else {
      setPrefectureCharacters([]);
    }
  }, [characters, selectedPrefecture]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedCharacters = [...characters].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle media field specially
    if (sortField === "media") {
      aValue = a.media?.title || "";
      bValue = b.media?.title || "";
    }

    if (aValue == null) aValue = "";
    if (bValue == null) bValue = "";

    aValue = String(aValue).toLowerCase();
    bValue = String(bValue).toLowerCase();

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination calculations - data is already paginated from backend
  // But we still need to sort client-side if sortField is set
  const paginatedCharacters = sortedCharacters; // Already paginated from backend

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Character Management</h1>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setMediaSearchQuery("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCharacter(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Character
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCharacter ? "Edit Character" : "New Character"}</DialogTitle>
              <DialogDescription>
                Add a new Character character
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="media">Media</Label>
                <Popover 
                  open={mediaSearchOpen} 
                  onOpenChange={(isOpen) => {
                    setMediaSearchOpen(isOpen);
                    if (isOpen) {
                      setMediaSearchQuery("");
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {formData.media
                        ? mediaList.find((m) => m._id === formData.media)?.title ||
                          "Select media..."
                        : "Select media..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="p-2">
                      <Input
                        placeholder="Search media..."
                        value={mediaSearchQuery}
                        onChange={(e) => setMediaSearchQuery(e.target.value)}
                        className="mb-2"
                        autoFocus
                      />
                    </div>
                    {!mediaSearchQuery.trim() ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        Type to search media...
                      </div>
                    ) : (
                      <div className="max-h-[300px] overflow-y-auto">
                        <div
                          className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                          onClick={() => {
                            setFormData({ ...formData, media: "" });
                            setMediaSearchOpen(false);
                            setMediaSearchQuery("");
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Check
                              className={`h-4 w-4 ${
                                !formData.media ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            None
                          </div>
                        </div>
                        {mediaList
                          .filter((media) =>
                            media.title
                              .toLowerCase()
                              .includes(mediaSearchQuery.toLowerCase())
                          )
                          .length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                            No results found
                          </div>
                        ) : (
                          mediaList
                            .filter((media) =>
                              media.title
                                .toLowerCase()
                                .includes(mediaSearchQuery.toLowerCase())
                            )
                            .map((media) => (
                              <div
                                key={media._id}
                                className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                                onClick={() => {
                                  setFormData({ ...formData, media: media._id });
                                  setMediaSearchOpen(false);
                                  setMediaSearchQuery("");
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <Check
                                    className={`h-4 w-4 ${
                                      formData.media === media._id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {media.title}
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="cover">Cover Image</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={coverImageMode === "url" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCoverImageMode("url");
                        // Only clear if current cover is base64 (uploaded image)
                        if (formData.cover?.startsWith("data:image")) {
                          setFormData({ ...formData, cover: "" });
                          setImageError(false);
                        }
                      }}
                    >
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={coverImageMode === "upload" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCoverImageMode("upload");
                        // Only clear if current cover is URL (not base64)
                        if (formData.cover && !formData.cover.startsWith("data:image")) {
                          setFormData({ ...formData, cover: "" });
                          setImageError(false);
                        }
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>
                {coverImageMode === "url" ? (
                  <>
                    <Input
                      id="cover"
                      placeholder="Enter image URL..."
                      value={formData.cover?.startsWith("data:image") ? "" : formData.cover}
                      onChange={(e) => {
                        setFormData({ ...formData, cover: e.target.value });
                        setImageError(false);
                      }}
                    />
                  </>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="cursor-pointer"
                    />
                    {formData.cover?.startsWith("data:image") && (
                      <div className="text-xs text-muted-foreground">
                        Image uploaded successfully
                      </div>
                    )}
                  </div>
                )}
                {formData.cover && (
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
                          src={formData.cover}
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
                <Label htmlFor="characterType">Character Type</Label>
                <Select
                  value={formData.characterType || "none"}
                  onValueChange={(value) => {
                    const newCharacterType = value === "none" ? "" : value;
                    setFormData({
                      ...formData,
                      characterType: newCharacterType,
                      // Reset enemyStats if not enemy
                      enemyStats: newCharacterType === "enemy"
                        ? formData.enemyStats
                        : {
                            hp: 10,
                            baseReward: {
                              xp: 5,
                              coins: 5,
                              resources: {
                                meat: 0,
                                wood: 0,
                                stone: 0,
                                iron: 0,
                                crystal: 0,
                              },
                            },
                          },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select character type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Regular Character)</SelectItem>
                    <SelectItem value="enemy">Enemy</SelectItem>
                    <SelectItem value="supporting_character">Supporting Character</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enemy Stats (only for enemy) */}
              {formData.characterType === "enemy" && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <Label className="text-base font-semibold">Enemy Stats</Label>
                  
                  <div>
                    <Label htmlFor="hp">HP</Label>
                    <Input
                      id="hp"
                      type="number"
                      min="1"
                      value={formData.enemyStats.hp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enemyStats: {
                            ...formData.enemyStats,
                            hp: parseInt(e.target.value) || 10,
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Base Reward</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="rewardXP" className="text-xs">XP</Label>
                        <Input
                          id="rewardXP"
                          type="number"
                          min="0"
                          value={formData.enemyStats.baseReward.xp}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              enemyStats: {
                                ...formData.enemyStats,
                                baseReward: {
                                  ...formData.enemyStats.baseReward,
                                  xp: parseInt(e.target.value) || 0,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="rewardCoins" className="text-xs">Coins</Label>
                        <Input
                          id="rewardCoins"
                          type="number"
                          min="0"
                          value={formData.enemyStats.baseReward.coins}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              enemyStats: {
                                ...formData.enemyStats,
                                baseReward: {
                                  ...formData.enemyStats.baseReward,
                                  coins: parseInt(e.target.value) || 0,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Resource Rewards</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                      {["meat", "wood", "stone", "iron", "crystal"].map((resource) => (
                        <div key={resource}>
                          <Label htmlFor={`resource-${resource}`} className="text-xs capitalize">
                            {resource}
                          </Label>
                          <Input
                            id={`resource-${resource}`}
                            type="number"
                            min="0"
                            value={formData.enemyStats.baseReward.resources[resource]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                enemyStats: {
                                  ...formData.enemyStats,
                                  baseReward: {
                                    ...formData.enemyStats.baseReward,
                                    resources: {
                                      ...formData.enemyStats.baseReward.resources,
                                      [resource]: parseInt(e.target.value) || 0,
                                    },
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="countryOrigin">Country Origin</Label>
                  <Select
                    value={formData.countryOrigin || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        countryOrigin: value === "none" ? "" : value,
                        japanPrefecture: value === "Japan" ? formData.japanPrefecture : "",
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
                {formData.countryOrigin === "Japan" && (
                  <div>
                    <Label htmlFor="japanPrefecture">Japan Prefecture</Label>
                    <Select
                      value={formData.japanPrefecture || "none"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          japanPrefecture: value === "none" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a prefecture..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="none">None</SelectItem>
                        {japanPrefectures.map((pref) => (
                          <SelectItem key={pref} value={pref}>
                            {pref}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
                placeholder="Search name..."
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
            <div>
              <Label>Japan Prefecture</Label>
              <Select
                value={filters.japanPrefecture || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    japanPrefecture: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All</SelectItem>
                  {japanPrefectures.map((pref) => (
                    <SelectItem key={pref} value={pref}>
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Media</Label>
              <Select
                value={filters.media || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    media: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All</SelectItem>
                  {mediaList.map((media) => (
                    <SelectItem key={media._id} value={media._id}>
                      {media.title}
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
                    <ImageIcon className="h-4 w-4" />
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
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="countryOrigin">Country Origin</SelectItem>
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
            {viewMode === "map" && selectedCountry === "Japan" && (
              <div className="flex items-center gap-2">
                <Label>Map View:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={mapViewMode === "world" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setMapViewMode("world");
                      setSelectedPrefecture(null);
                    }}
                  >
                    World
                  </Button>
                  <Button
                    variant={mapViewMode === "japan" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapViewMode("japan")}
                  >
                    Japan Prefectures
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Characters List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="text-muted-foreground mb-2">Loading Characters...</div>
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
                  Error Loading Characters
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
      ) : characters.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                No Characters found. Create your first Character!
              </div>
              <Button
                onClick={() => {
                  setEditingCharacter(null);
                  resetForm();
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Character
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
                  {mapViewMode === "japan" && selectedCountry === "Japan" ? (
                    <JapanPrefecturesMapView
                      characters={characters}
                      onPrefectureClick={handlePrefectureClick}
                      selectedPrefecture={selectedPrefecture}
                    />
                  ) : (
                    <WorldMapView
                      characters={characters}
                      onCountryClick={handleCountryClick}
                      selectedCountry={selectedCountry}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedPrefecture
                    ? `Characters from ${selectedPrefecture}`
                    : selectedCountry
                    ? `Characters from ${selectedCountry}`
                    : "Select a Location"}
                </CardTitle>
                <CardDescription>
                  {selectedPrefecture
                    ? `${prefectureCharacters.length} Character(s) found`
                    : selectedCountry
                    ? `${countryCharacters.length} Character(s) found`
                    : "Click on a country or prefecture on the map to view its Characters"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(selectedPrefecture ? prefectureCharacters : countryCharacters).length >
                0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {(selectedPrefecture
                      ? prefectureCharacters
                      : countryCharacters
                    ).map((item) => (
                      <Card
                        key={item._id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-semibold text-sm mb-1 line-clamp-2">
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.media?.title || "No media"} •{" "}
                                {item.countryOrigin || "-"}
                                {item.japanPrefecture
                                  ? ` • ${item.japanPrefecture}`
                                  : ""}
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
                    {selectedPrefecture || selectedCountry
                      ? "No Characters found for this location"
                      : "Click on a location on the map to view its Characters"}
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
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        {sortField === "name" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("media")}
                    >
                      <div className="flex items-center gap-2">
                        Media
                        {sortField === "media" &&
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
                      onClick={() => handleSort("japanPrefecture")}
                    >
                      <div className="flex items-center gap-2">
                        Japan Prefecture
                        {sortField === "japanPrefecture" &&
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
                  {paginatedCharacters.map((item) => (
                    <tr key={item._id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4">{item.media?.title || "-"}</td>
                      <td className="p-4">{item.countryOrigin || "-"}</td>
                      <td className="p-4">{item.japanPrefecture || "-"}</td>
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
          {paginatedCharacters.map((item) => (
            <Card key={item._id} className="flex flex-col">
              {showCoverImage && item.cover && (
                <div
                  className={`w-full ${
                    fitImage ? "h-48" : "h-auto"
                  } overflow-hidden bg-muted`}
                >
                  {imageErrors[item._id] ? (
                    <div className={`w-full ${fitImage ? "h-48" : "h-auto"} flex items-center justify-center text-sm text-muted-foreground`}>
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div>Failed to load image</div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.cover}
                      alt={item.name}
                      className={`w-full ${
                        fitImage
                          ? "h-full object-cover"
                          : "h-auto object-contain"
                      }`}
                      loading="lazy"
                      onError={(e) => {
                        console.error("Error loading cover image for character:", item._id, item.cover?.substring(0, 50));
                        setImageErrors((prev) => ({
                          ...prev,
                          [item._id]: true,
                        }));
                      }}
                      onLoad={() => {
                        setImageErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[item._id];
                          return newErrors;
                        });
                      }}
                    />
                  )}
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{item.name}</CardTitle>
                    <CardDescription>
                      {item.media?.title || "No media"}
                      {item.countryOrigin && ` • ${item.countryOrigin}`}
                      {item.japanPrefecture && ` • ${item.japanPrefecture}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
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
      {!loading && !error && characters.length > 0 && (
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

      {/* Delete Character Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Character?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this Character? This action cannot be undone.
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
    </div>
  );
}
