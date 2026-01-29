import { useState, useEffect, useRef } from "react";
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
  Plus,
  Building2,
  Trash2,
  Hammer,
  Home,
  ShoppingCart,
  Heart,
  ArrowLeft,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";
import ImageUpload from "../components/ImageUpload";
import anime from "animejs";

export default function Town() {
  const { user, refreshUser } = useUser();
  const [buildings, setBuildings] = useState([]);
  const [open, setOpen] = useState(false);
  const [houseDialogOpen, setHouseDialogOpen] = useState(false);
  const [buildConfirmOpen, setBuildConfirmOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [formData, setFormData] = useState({
    type: "lewd_location",
    name: "",
    image: "",
    buildPowerRequired: 0,
    resourcesRequired: {
      meat: 0,
      wood: 0,
      stone: 0,
      iron: 0,
      crystal: 0,
    },
  });
  const [houseFormData, setHouseFormData] = useState({
    type: "house",
    name: "",
    image: "",
    buildPowerRequired: 0,
    bonusPopulation: 5,
    resourcesRequired: {
      meat: 0,
      wood: 0,
      stone: 0,
      iron: 0,
      crystal: 0,
    },
  });
  const [recentlyBuiltId, setRecentlyBuiltId] = useState(null);
  const housesGridRef = useRef(null);
  const leisureGridRef = useRef(null);
  const buildConfirmContentRef = useRef(null);
  const confirmBuildBtnRef = useRef(null);
  const hasStaggeredRef = useRef(false);
  const buildPowerBadgeRef = useRef(null);
  const hasBuildPowerAnimatedRef = useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/buildings");
      setBuildings(res.data || []);
    } catch (error) {
      console.error("Error loading buildings:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData, deletable: true };
      // Ensure buildPowerRequired is a number
      dataToSend.buildPowerRequired = Number(formData.buildPowerRequired) || 0;
      await api.post("/buildings", dataToSend);
      setOpen(false);
      resetForm();
      loadData();
      toast.success("Building created");
    } catch (error) {
      console.error("Error creating building:", error);
      toast.error("Error creating building");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "lewd_location",
      name: "",
      image: "",
      buildPowerRequired: 0,
      resourcesRequired: {
        meat: 0,
        wood: 0,
        stone: 0,
        iron: 0,
        crystal: 0,
      },
    });
  };

  const resetHouseForm = () => {
    setHouseFormData({
      type: "house",
      name: "",
      image: "",
      buildPowerRequired: 0,
      bonusPopulation: 5,
      resourcesRequired: {
        meat: 0,
        wood: 0,
        stone: 0,
        iron: 0,
        crystal: 0,
      },
    });
  };

  const handleHouseSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...houseFormData, deletable: false };
      // Ensure buildPowerRequired is a number
      dataToSend.buildPowerRequired =
        Number(houseFormData.buildPowerRequired) || 0;
      // Ensure bonusPopulation is a number
      dataToSend.bonusPopulation = Number(houseFormData.bonusPopulation) || 5;
      await api.post("/buildings", dataToSend);
      setHouseDialogOpen(false);
      resetHouseForm();
      loadData();
      toast.success("House created");
    } catch (error) {
      console.error("Error creating house:", error);
      toast.error("Error creating house");
    }
  };

  const handleStartBuildClick = (building) => {
    setSelectedBuilding(building);
    setBuildConfirmOpen(true);
  };

  const handleConfirmBuild = async () => {
    if (!selectedBuilding) return;

    if (confirmBuildBtnRef.current) {
      anime({
        targets: confirmBuildBtnRef.current,
        scale: [1, 1.06, 1],
        duration: 220,
        easing: "easeOutExpo",
      });
    }

    try {
      await api.post(`/buildings/${selectedBuilding._id}/start-build`);
      const builtId = selectedBuilding._id;
      setBuildConfirmOpen(false);
      setSelectedBuilding(null);
      await refreshUser();
      await loadData();
      setRecentlyBuiltId(builtId);
      toast.success("Building completed!");
    } catch (error) {
      console.error("Error updating build:", error);
      toast.error(error.response?.data?.error || "Error updating build");
    }
  };

  const handleDelete = async (buildingId) => {
    try {
      await api.delete(`/buildings/${buildingId}`);
      toast.success("Building deleted");
      loadData();
    } catch (error) {
      console.error("Error deleting building:", error);
      toast.error(error.response?.data?.error || "Error deleting building");
    }
  };

  const getBuildingIcon = (type) => {
    switch (type) {
      case "blacksmith":
        return <Hammer className="h-5 w-5" />;
      case "house":
        return <Home className="h-5 w-5" />;
      case "market":
        return <ShoppingCart className="h-5 w-5" />;
      case "lewd_location":
        return <Heart className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const houses = buildings.filter((b) => !b.deletable && b.type === "house");
  const leisureZones = buildings.filter((b) => b.deletable);

  // Stagger building cards on initial load only
  useEffect(() => {
    if (buildings.length === 0 || hasStaggeredRef.current) return;
    hasStaggeredRef.current = true;
    const houseCards = housesGridRef.current?.querySelectorAll(".town-building-card");
    const leisureCards = leisureGridRef.current?.querySelectorAll(".town-building-card");
    const cards = [...(houseCards || []), ...(leisureCards || [])];
    if (cards.length === 0) return;
    anime.set(cards, { opacity: 0, translateY: 20 });
    anime({
      targets: cards,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 450,
      delay: anime.stagger(50, { start: 80 }),
      easing: "easeOutExpo",
    });
  }, [buildings.length]);

  // Build confirm dialog: scale-in when open
  useEffect(() => {
    if (!buildConfirmOpen || !buildConfirmContentRef.current) return;
    const el = buildConfirmContentRef.current;
    anime.set(el, { opacity: 0, scale: 0.92 });
    anime({
      targets: el,
      opacity: [0, 1],
      scale: [0.92, 1],
      duration: 280,
      easing: "easeOutExpo",
    });
  }, [buildConfirmOpen]);

  // Build power badge: subtle scale-in once when user is available
  useEffect(() => {
    if (!user || !buildPowerBadgeRef.current || hasBuildPowerAnimatedRef.current) return;
    hasBuildPowerAnimatedRef.current = true;
    anime.set(buildPowerBadgeRef.current, { scale: 0.92, opacity: 0 });
    anime({
      targets: buildPowerBadgeRef.current,
      scale: [0.92, 1],
      opacity: [0, 1],
      duration: 400,
      easing: "easeOutExpo",
    });
  }, [user]);

  // After build success: bounce the card that was just built
  useEffect(() => {
    if (!recentlyBuiltId || buildings.length === 0) return;
    const id = recentlyBuiltId;
    const t = setTimeout(() => {
      const card = document.querySelector(`[data-building-id="${id}"]`);
      if (!card) {
        setRecentlyBuiltId(null);
        return;
      }
      anime({
        targets: card,
        scale: [1, 1.08, 1],
        duration: 600,
        easing: "easeOutElastic(1, 0.5)",
        complete: () => setRecentlyBuiltId(null),
      });
    }, 50);
    return () => clearTimeout(t);
  }, [recentlyBuiltId, buildings.length]);

  // Check if requirements are met
  const checkRequirements = (building) => {
    if (!user || !building) return { valid: false, issues: [] };

    const issues = [];

    // Check build power (only if building requires build power)
    if (building.buildPowerRequired > 0) {
      if (user.buildPower < building.buildPowerRequired) {
        issues.push(
          `Not enough build power (need ${building.buildPowerRequired}, have ${
            user.buildPower || 0
          })`
        );
      }
    }

    // Check resources
    if (building.resourcesRequired) {
      if (user.resources.meat < building.resourcesRequired.meat) {
        issues.push(
          `Not enough meat (need ${building.resourcesRequired.meat}, have ${
            user.resources.meat || 0
          })`
        );
      }
      if (user.resources.wood < building.resourcesRequired.wood) {
        issues.push(
          `Not enough wood (need ${building.resourcesRequired.wood}, have ${
            user.resources.wood || 0
          })`
        );
      }
      if (user.resources.stone < building.resourcesRequired.stone) {
        issues.push(
          `Not enough stone (need ${building.resourcesRequired.stone}, have ${
            user.resources.stone || 0
          })`
        );
      }
      if (user.resources.iron < building.resourcesRequired.iron) {
        issues.push(
          `Not enough iron (need ${building.resourcesRequired.iron}, have ${
            user.resources.iron || 0
          })`
        );
      }
      if (user.resources.crystal < building.resourcesRequired.crystal) {
        issues.push(
          `Not enough crystal (need ${
            building.resourcesRequired.crystal
          }, have ${user.resources.crystal || 0})`
        );
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  };

  const requirementsCheck = selectedBuilding
    ? checkRequirements(selectedBuilding)
    : { valid: false, issues: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/fantasy-world">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Town</h1>
        </div>
        {user && (
          <div
            ref={buildPowerBadgeRef}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-border/50"
          >
            <span className="text-lg">⚡</span>
            <span className="text-sm font-medium">
              Build Power:{" "}
              <span className="font-semibold">{user.buildPower || 0}</span>
            </span>
          </div>
        )}
      </div>

      {/* Houses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Houses</CardTitle>
            <Dialog
              open={houseDialogOpen}
              onOpenChange={(isOpen) => {
                setHouseDialogOpen(isOpen);
                if (!isOpen) resetHouseForm();
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => resetHouseForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Build a House
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Build a House</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleHouseSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="house-name">Name</Label>
                    <Input
                      id="house-name"
                      value={houseFormData.name}
                      onChange={(e) =>
                        setHouseFormData({
                          ...houseFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="House name (optional)"
                    />
                  </div>
                  <ImageUpload
                    value={houseFormData.image}
                    onChange={(value) =>
                      setHouseFormData({ ...houseFormData, image: value })
                    }
                  />
                  <div>
                    <Label htmlFor="house-buildPower">
                      Build Power Required
                    </Label>
                    <Input
                      id="house-buildPower"
                      type="number"
                      value={houseFormData.buildPowerRequired}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          value === null ||
                          value === undefined
                        ) {
                          setHouseFormData({
                            ...houseFormData,
                            buildPowerRequired: 0,
                          });
                        } else {
                          const numValue = parseInt(value, 10);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setHouseFormData({
                              ...houseFormData,
                              buildPowerRequired: numValue,
                            });
                          }
                        }
                      }}
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      1 pomodoro session (25 min) = 25 build power
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="house-bonusPopulation">
                      Population Bonus
                    </Label>
                    <Input
                      id="house-bonusPopulation"
                      type="number"
                      value={
                        houseFormData.bonusPopulation === 0
                          ? ""
                          : houseFormData.bonusPopulation
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : parseInt(value, 10);
                        setHouseFormData({
                          ...houseFormData,
                          bonusPopulation: isNaN(numValue) ? 5 : numValue,
                        });
                      }}
                      min="0"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {["meat", "wood", "stone", "iron", "crystal"].map(
                      (resource) => (
                        <div key={resource}>
                          <Label htmlFor={`house-${resource}`}>
                            {resource.charAt(0).toUpperCase() +
                              resource.slice(1)}
                          </Label>
                          <Input
                            id={`house-${resource}`}
                            type="number"
                            value={houseFormData.resourcesRequired[resource]}
                            onChange={(e) =>
                              setHouseFormData({
                                ...houseFormData,
                                resourcesRequired: {
                                  ...houseFormData.resourcesRequired,
                                  [resource]: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            min="0"
                          />
                        </div>
                      )
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setHouseDialogOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={housesGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {houses.map((building) => (
              <Card
                key={building._id}
                className="town-building-card"
                data-building-id={building._id}
              >
                {building.image && (
                  <div className="w-full h-32 overflow-hidden rounded-t-lg">
                    <img
                      src={building.image}
                      alt={building.name || building.type}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getBuildingIcon(building.type)}
                    {building.name || building.type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Population Bonus Info */}
                  {building.bonusPopulation !== undefined &&
                    building.bonusPopulation > 0 && (
                      <div className="mb-3 flex items-center gap-2 text-sm">
                        <span className="text-lg">👥</span>
                        <span className="text-muted-foreground">
                          Population Bonus:
                        </span>
                        <span className="font-semibold">
                          +{building.bonusPopulation || 5}
                        </span>
                      </div>
                    )}
                  {building.built ? (
                    <div
                      className={`text-green-500 font-semibold transition-opacity duration-500 ${
                        recentlyBuiltId === building._id ? "animate-in fade-in" : ""
                      }`}
                    >
                      Built
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {building.buildPowerRequired === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No build power required
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStartBuildClick(building)}
                          className="flex-1"
                        >
                          <Hammer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(building._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leisure Zones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leisure Zones</CardTitle>
            <Dialog
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Leisure Zone
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Leisure Zone</DialogTitle>
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
                  <ImageUpload
                    value={formData.image}
                    onChange={(value) =>
                      setFormData({ ...formData, image: value })
                    }
                  />
                  <div>
                    <Label htmlFor="buildPower">Build Power Required</Label>
                    <Input
                      id="buildPower"
                      type="number"
                      value={formData.buildPowerRequired}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          value === null ||
                          value === undefined
                        ) {
                          setFormData({
                            ...formData,
                            buildPowerRequired: 0,
                          });
                        } else {
                          const numValue = parseInt(value, 10);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setFormData({
                              ...formData,
                              buildPowerRequired: numValue,
                            });
                          }
                        }
                      }}
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      1 pomodoro session (25 min) = 25 build power
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {["meat", "wood", "stone", "iron", "crystal"].map(
                      (resource) => (
                        <div key={resource}>
                          <Label htmlFor={resource}>
                            {resource.charAt(0).toUpperCase() +
                              resource.slice(1)}
                          </Label>
                          <Input
                            id={resource}
                            type="number"
                            value={formData.resourcesRequired[resource]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                resourcesRequired: {
                                  ...formData.resourcesRequired,
                                  [resource]: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            min="0"
                          />
                        </div>
                      )
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={leisureGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leisureZones.map((building) => (
              <Card
                key={building._id}
                className="town-building-card"
                data-building-id={building._id}
              >
                {building.image && (
                  <div className="w-full h-32 overflow-hidden rounded-t-lg">
                    <img
                      src={building.image}
                      alt={building.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{building.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Build Requirements */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Build Requirements
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <span>⚡</span>
                        <span className="font-medium">Build Power:</span>{" "}
                        {building.buildPowerRequired}
                      </div>
                      {building.resourcesRequired && (
                        <div className="text-sm space-y-1">
                          <span className="font-medium">Resources:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(building.resourcesRequired)
                              .filter(([_, value]) => value > 0)
                              .map(([resource, value]) => {
                                const emojiMap = {
                                  meat: "🥩",
                                  wood: "🪵",
                                  stone: "🪨",
                                  iron: "⚙️",
                                  crystal: "💎",
                                };
                                return (
                                  <span
                                    key={resource}
                                    className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs"
                                  >
                                    <span className="mr-1">
                                      {emojiMap[resource] || "📦"}
                                    </span>
                                    {resource.charAt(0).toUpperCase() +
                                      resource.slice(1)}
                                    : {value}
                                  </span>
                                );
                              })}
                          </div>
                          {Object.values(building.resourcesRequired).every(
                            (v) => v === 0
                          ) && (
                            <span className="text-muted-foreground text-xs">
                              No resources required
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Build Status */}
                    {building.built ? (
                      <div
                        className={`text-green-500 font-semibold transition-opacity duration-500 ${
                          recentlyBuiltId === building._id ? "animate-in fade-in" : ""
                        }`}
                      >
                        Built
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {building.buildPowerRequired === 0 && (
                          <div className="text-sm text-muted-foreground">
                            No build power required
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStartBuildClick(building)}
                            className="flex-1"
                          >
                            <Hammer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDelete(building._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Build Confirmation Dialog */}
      <Dialog open={buildConfirmOpen} onOpenChange={setBuildConfirmOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <div ref={buildConfirmContentRef} className="flex flex-col flex-1 min-h-0">
          <DialogHeader>
            <DialogTitle>Confirm Build</DialogTitle>
            <DialogDescription>
              Review requirements before starting the build
            </DialogDescription>
          </DialogHeader>

          {selectedBuilding && (
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
              {/* Building Info */}
              <div>
                <h3 className="font-semibold mb-2">Building</h3>
                <div className="flex items-center gap-2">
                  {getBuildingIcon(selectedBuilding.type)}
                  <span>{selectedBuilding.name || selectedBuilding.type}</span>
                </div>
              </div>

              {/* Build Power */}
              {selectedBuilding.buildPowerRequired > 0 ? (
                <div>
                  <h3 className="font-semibold mb-2">Build Power</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Build requirement:</span>
                      <span className="font-semibold">
                        {selectedBuilding.buildPowerRequired} ⚡
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Your build power:</span>
                      <span
                        className={`font-semibold ${
                          (user?.buildPower || 0) >=
                          selectedBuilding.buildPowerRequired
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {user?.buildPower || 0} ⚡
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold mb-2">Build Power</h3>
                  <div className="p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground">
                      No build power required
                    </span>
                  </div>
                </div>
              )}

              {/* Resources Required */}
              {selectedBuilding.resourcesRequired && (
                <div>
                  <h3 className="font-semibold mb-2">Resources Required</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedBuilding.resourcesRequired)
                      .filter(([_, value]) => value > 0)
                      .map(([resource, required]) => {
                        const emojiMap = {
                          meat: "🥩",
                          wood: "🪵",
                          stone: "🪨",
                          iron: "⚙️",
                          crystal: "💎",
                        };
                        const userAmount = user?.resources?.[resource] || 0;
                        const hasEnough = userAmount >= required;

                        return (
                          <div
                            key={resource}
                            className={`flex items-center justify-between p-2 rounded ${
                              hasEnough
                                ? "bg-muted"
                                : "bg-red-50 dark:bg-red-950/20"
                            }`}
                          >
                            <span className="text-sm flex items-center gap-2">
                              <span>{emojiMap[resource] || "📦"}</span>
                              <span className="capitalize">{resource}:</span>
                              <span className="font-semibold">{required}</span>
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                hasEnough ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              You have: {userAmount}
                            </span>
                          </div>
                        );
                      })}
                    {Object.values(selectedBuilding.resourcesRequired).every(
                      (v) => v === 0
                    ) && (
                      <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                        No resources required
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Requirements Check */}
              {!requirementsCheck.valid && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    Requirements Not Met:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400">
                    {requirementsCheck.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Build Status */}
              {selectedBuilding.buildPowerRequired > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Build Status</h3>
                  <div className="text-sm text-muted-foreground">
                    {requirementsCheck.valid
                      ? "Building will be completed immediately if you confirm."
                      : "You need to meet all requirements to build."}
                  </div>
                </div>
              )}
              {selectedBuilding.buildPowerRequired === 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Build Status</h3>
                  <div className="text-sm text-muted-foreground">
                    No build power required. Building will be completed
                    immediately.
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBuildConfirmOpen(false);
                setSelectedBuilding(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              ref={confirmBuildBtnRef}
              onClick={handleConfirmBuild}
              disabled={!requirementsCheck.valid}
            >
              Confirm Build
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
