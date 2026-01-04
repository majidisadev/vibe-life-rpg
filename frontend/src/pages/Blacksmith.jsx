import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Sword, Check, ArrowLeft, Coins, Loader2, X, Save, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";
import ImageUpload from "../components/ImageUpload";

export default function Blacksmith() {
  const { user, refreshUser } = useUser();
  const [weapons, setWeapons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [weaponToDelete, setWeaponToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    damageBonus: 0,
    cost: {
      coins: 0,
      resources: { meat: 0, wood: 0, stone: 0, iron: 0, crystal: 0 },
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/weapons");
      setWeapons(res.data || []);
    } catch (error) {
      console.error("Error loading weapons:", error);
      toast.error("Error loading weapons");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalResources = () => {
    const resources = formData.cost.resources;
    return (resources.meat || 0) + 
           (resources.wood || 0) + 
           (resources.stone || 0) + 
           (resources.iron || 0) + 
           (resources.crystal || 0);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      image: "",
      cost: {
        resources: { meat: 0, wood: 0, stone: 0, iron: 0, crystal: 0 },
      },
    });
    setEditingWeapon(null);
  };

  const openEditDialog = (weapon) => {
    setEditingWeapon(weapon);
    setFormData({
      name: weapon.name || "",
      image: weapon.image || "",
      cost: {
        resources: {
          meat: weapon.cost?.resources?.meat || 0,
          wood: weapon.cost?.resources?.wood || 0,
          stone: weapon.cost?.resources?.stone || 0,
          iron: weapon.cost?.resources?.iron || 0,
          crystal: weapon.cost?.resources?.crystal || 0,
        },
      },
    });
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const totalResources = calculateTotalResources();
      const submitData = {
        ...formData,
        damageBonus: totalResources,
        cost: {
          coins: totalResources,
          resources: formData.cost.resources,
        },
      };
      
      if (editingWeapon) {
        await api.put(`/weapons/${editingWeapon._id}`, submitData);
        toast.success("Weapon updated!");
      } else {
        await api.post("/weapons", submitData);
        toast.success("Weapon created!");
      }
      setOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving weapon:", error);
      toast.error(error.response?.data?.error || "Error saving weapon");
    }
  };

  const handleDelete = (weaponId) => {
    setWeaponToDelete(weaponId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!weaponToDelete) return;
    try {
      await api.delete(`/weapons/${weaponToDelete}`);
      toast.success("Weapon deleted!");
      setShowDeleteDialog(false);
      setWeaponToDelete(null);
      loadData();
      await refreshUser();
    } catch (error) {
      console.error("Error deleting weapon:", error);
      toast.error(error.response?.data?.error || "Error deleting weapon");
    }
  };

  const handleEquip = async (weaponId) => {
    try {
      await api.post(`/weapons/${weaponId}/equip`);
      const isEquipped = user?.equippedWeapon === weaponId;
      toast.success(isEquipped ? "Weapon unequipped!" : "Weapon equipped!");
      await refreshUser();
    } catch (error) {
      console.error("Error equipping/unequipping weapon:", error);
      toast.error("Error equipping/unequipping weapon");
    }
  };

  const getTotalDamage = () => {
    const weapon = weapons.find((w) => w._id === user?.equippedWeapon);
    return (user?.baseAttack || 1) + (weapon?.damageBonus || 0);
  };

  const resourceEmojis = {
    meat: "🥩",
    wood: "🪵",
    stone: "🪨",
    iron: "⚙️",
    crystal: "💎",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/fantasy-world">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Blacksmith</h1>
        </div>
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
              Create Weapon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWeapon ? "Edit Weapon" : "Create Weapon"}</DialogTitle>
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
                <Label>Damage Bonus (Auto-calculated)</Label>
                <Input
                  type="number"
                  value={calculateTotalResources()}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated from total of all resource costs
                </p>
              </div>
              <div>
                <Label>Cost - Coins (Auto-calculated)</Label>
                <Input
                  type="number"
                  value={calculateTotalResources()}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated from total of all resource costs
                </p>
              </div>
              <div>
                <Label>Cost - Resources</Label>
                <div className="grid grid-cols-5 gap-4 mt-2">
                  {["meat", "wood", "stone", "iron", "crystal"].map(
                    (resource) => (
                      <div key={resource}>
                        <Label htmlFor={`resource-${resource}`} className="flex items-center gap-1">
                          <span>{resourceEmojis[resource]}</span>
                          <span className="capitalize text-xs">{resource}</span>
                        </Label>
                        <Input
                          id={`resource-${resource}`}
                          type="number"
                          min="0"
                          value={formData.cost.resources[resource]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cost: {
                                ...formData.cost,
                                resources: {
                                  ...formData.cost.resources,
                                  [resource]: parseInt(e.target.value) || 0,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    )
                  )}
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
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingWeapon ? "Update Weapon" : "Create Weapon"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Resources Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Coins className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-xs text-muted-foreground">Coins</div>
                <div className="text-lg font-bold">{user?.coins || 0}</div>
              </div>
            </div>
            {Object.entries(resourceEmojis).map(([resource, emoji]) => (
              <div key={resource} className="flex items-center gap-2 p-3 border rounded-lg">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <div className="text-xs text-muted-foreground capitalize">{resource}</div>
                  <div className="text-lg font-bold">{user?.resources?.[resource] || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Base Attack</div>
              <div className="text-2xl font-bold">{user?.baseAttack || 1}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Damage</div>
              <div className="text-2xl font-bold">{getTotalDamage()}</div>
            </div>
            {user?.equippedWeapon && (
              <div className="col-span-2">
                <div className="text-sm text-muted-foreground">Equipped Weapon</div>
                <div className="font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {weapons.find((w) => w._id === user.equippedWeapon)?.name || "None"}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weapons List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <div className="text-muted-foreground">Loading weapons...</div>
            </div>
          </CardContent>
        </Card>
      ) : weapons.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Sword className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="text-muted-foreground">
                No weapons available. Create your first weapon!
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weapons.map((weapon) => {
            const isEquipped = user?.equippedWeapon === weapon._id;
            
            return (
              <Card 
                key={weapon._id} 
                className={isEquipped ? "ring-2 ring-green-500" : ""}
              >
                {weapon.image && (
                  <div className="w-full h-32 overflow-hidden relative">
                    <img
                      src={weapon.image}
                      alt={weapon.name}
                      className="w-full h-full object-cover"
                    />
                    {isEquipped && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Equipped
                      </div>
                    )}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{weapon.name}</CardTitle>
                      <CardDescription>+{weapon.damageBonus} Damage</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(weapon)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(weapon._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Cost Display */}
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Cost:</div>
                      {weapon.cost.coins > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span>Coins</span>
                          </div>
                          <span>{weapon.cost.coins}</span>
                        </div>
                      )}
                      {Object.entries(weapon.cost.resources).map(([resource, value]) =>
                        value > 0 ? (
                          <div key={resource} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span>{resourceEmojis[resource]}</span>
                              <span className="capitalize">{resource}</span>
                            </div>
                            <span>{value}</span>
                          </div>
                        ) : null
                      )}
                    </div>

                    {/* Equip Button */}
                    <div className="pt-2 border-t">
                      <Button
                        size="sm"
                        variant={isEquipped ? "default" : "outline"}
                        onClick={() => handleEquip(weapon._id)}
                        className="w-full"
                      >
                        {isEquipped ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Unequip
                          </>
                        ) : (
                          <>
                            <Sword className="h-4 w-4 mr-2" />
                            Equip
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Weapon?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this weapon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setWeaponToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
