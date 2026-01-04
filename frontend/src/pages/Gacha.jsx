import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Sparkles, Zap, Users, Info, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";

export default function Gacha() {
  const { user, refreshUser } = useUser();
  const [pool, setPool] = useState([]);
  const [collected, setCollected] = useState([]);
  const [activeCharacters, setActiveCharacters] = useState([]);
  const [pulledCharacter, setPulledCharacter] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [poolRes, charactersRes] = await Promise.all([
        api.get("/gacha/pool"),
        api.get("/characters?limit=1000"),
      ]);
      setPool(poolRes.data || []);
      
      // Handle both old format (array) and new format (object with data and pagination)
      let characters = [];
      if (charactersRes && charactersRes.data) {
        if (Array.isArray(charactersRes.data)) {
          characters = charactersRes.data;
        } else if (charactersRes.data.data && Array.isArray(charactersRes.data.data)) {
          characters = charactersRes.data.data;
        }
      }
      
      if (user?.collectedCharacters) {
        const collectedList = characters.filter((c) =>
          user.collectedCharacters.includes(c._id)
        );
        setCollected(collectedList);
      }
      
      if (user?.activeCharacters) {
        const activeList = characters.filter((c) =>
          user.activeCharacters.includes(c._id)
        );
        setActiveCharacters(activeList);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handlePull = async () => {
    try {
      if (!user || user.energy < 1) {
        toast.error("Not enough energy");
        return;
      }

      const res = await api.post("/gacha/pull");
      setPulledCharacter(res.data.character);
      toast.success(`Pulled ${res.data.character.name}!`);
      await refreshUser();
      loadData();
    } catch (error) {
      console.error("Error pulling:", error);
      toast.error(error.response?.data?.error || "Error pulling");
    }
  };

  const handleToggleActive = async (characterId) => {
    try {
      const currentActive = user?.activeCharacters || [];
      let newActive;
      
      if (currentActive.includes(characterId)) {
        newActive = currentActive.filter((id) => id !== characterId);
      } else {
        if (currentActive.length >= (user?.maxPopulation || 5)) {
          toast.error(`Cannot exceed max population (${user?.maxPopulation || 5})`);
          return;
        }
        newActive = [...currentActive, characterId];
      }

      await api.put("/user/active-characters", { activeCharacters: newActive });
      await refreshUser();
      loadData();
      toast.success("Active characters updated");
    } catch (error) {
      console.error("Error updating active characters:", error);
      toast.error(error.response?.data?.error || "Error updating");
    }
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
          <h1 className="text-3xl font-bold">Gacha</h1>
        </div>
      </div>

      {/* Pull Section */}
      <Card>
        <CardHeader>
          <CardTitle>Gacha Pull</CardTitle>
          <CardDescription>
            Pull a supporting character (1 Energy)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
                <span>Available in pool: {pool.length}</span>
                {pool.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSheetOpen(true)}
                    className="h-6 px-2 text-xs"
                  >
                    <Info className="h-3 w-3 mr-1" />
                    Detail
                  </Button>
                )}
              </div>
              <Button
                onClick={handlePull}
                disabled={!user || user.energy < 1 || pool.length === 0}
                size="lg"
                className="w-full"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Pull (1 Energy)
              </Button>
              {(!user || user.energy < 1) && (
                <div className="text-xs text-muted-foreground mt-2">
                  <Zap className="h-3 w-3 inline mr-1" />
                  Not enough energy
                </div>
              )}
            </div>
            {pulledCharacter && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Pulled Character!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {pulledCharacter.cover && (
                      <img
                        src={pulledCharacter.cover}
                        alt={pulledCharacter.name}
                        className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                      />
                    )}
                    <div className="font-semibold text-lg">{pulledCharacter.name}</div>
                    {pulledCharacter.media && (
                      <div className="text-sm text-muted-foreground">
                        {pulledCharacter.media.title}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Characters Management */}
      <Card>
        <CardHeader>
          <CardTitle>Active Characters</CardTitle>
          <CardDescription>
            {activeCharacters.length} / {user?.maxPopulation || 5} (for Album)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {collected.map((character) => {
              const isActive = activeCharacters.some((c) => c._id === character._id);
              return (
                <Card
                  key={character._id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                    isActive ? "border-primary" : ""
                  }`}
                  onClick={() => handleToggleActive(character._id)}
                >
                  {character.cover && (
                    <div className="w-full h-24 overflow-hidden">
                      <img
                        src={character.cover}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-2">
                    <div className="text-xs font-semibold text-center line-clamp-2">
                      {character.name}
                    </div>
                    <div className="flex items-center justify-center mt-1">
                      <Checkbox checked={isActive} readOnly />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pool Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gacha Pool Details</SheetTitle>
            <SheetDescription>
              List of characters available in the gacha pool with their pull rates
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {pool.length > 0 ? (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Total characters: {pool.length} | Pull rate per character:{" "}
                  {(100 / pool.length).toFixed(2)}%
                </div>
                <div className="space-y-3">
                  {pool.map((character) => {
                    const pullRate = (100 / pool.length).toFixed(2);
                    return (
                      <Card key={character._id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {character.cover && (
                              <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                                <img
                                  src={character.cover}
                                  alt={character.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base mb-1">
                                {character.name}
                              </div>
                              {character.media && (
                                <div className="text-sm text-muted-foreground mb-2">
                                  {character.media.title}
                                </div>
                              )}
                              <div className="text-sm font-medium text-primary">
                                Pull Rate: {pullRate}%
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No characters available in the pool
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

