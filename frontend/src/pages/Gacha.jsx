import { useState, useEffect, useRef } from "react";
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
import anime from "animejs";

export default function Gacha() {
  const { user, refreshUser } = useUser();
  const [pool, setPool] = useState([]);
  const [collected, setCollected] = useState([]);
  const [activeCharacters, setActiveCharacters] = useState([]);
  const [pulledCharacter, setPulledCharacter] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const pullBtnRef = useRef(null);
  const pullMachineRef = useRef(null);
  const pulledCardRef = useRef(null);
  const activeGridRef = useRef(null);
  const poolListRef = useRef(null);
  const hasActiveStaggeredRef = useRef(false);

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

  // Stagger reveal when pulled character is set
  useEffect(() => {
    if (!pulledCharacter || !pulledCardRef.current) return;
    const card = pulledCardRef.current;
    const img = card.querySelector(".pulled-card-image");
    const nameEl = card.querySelector(".pulled-card-name");
    const mediaEl = card.querySelector(".pulled-card-media");
    const targets = [img, nameEl, mediaEl].filter(Boolean);
    if (targets.length === 0) return;
    anime.set(targets, { opacity: 0, translateY: 12 });
    anime({
      targets,
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 400,
      delay: anime.stagger(120, { start: 150 }),
      easing: "easeOutExpo",
    });
  }, [pulledCharacter?._id]);

  // Stagger active/collected character cards on initial load only
  useEffect(() => {
    if (collected.length === 0 || !activeGridRef.current || hasActiveStaggeredRef.current) return;
    hasActiveStaggeredRef.current = true;
    const cards = activeGridRef.current.querySelectorAll(".gacha-character-card");
    if (cards.length === 0) return;
    anime.set(cards, { opacity: 0, translateY: 16 });
    anime({
      targets: cards,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 400,
      delay: anime.stagger(45, { start: 100 }),
      easing: "easeOutExpo",
    });
  }, [collected.length]);

  // Stagger pool list when sheet opens
  useEffect(() => {
    if (!sheetOpen || !poolListRef.current || pool.length === 0) return;
    const items = poolListRef.current.querySelectorAll(".gacha-pool-item");
    if (items.length === 0) return;
    anime.set(items, { opacity: 0, translateX: 16 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateX: [16, 0],
      duration: 350,
      delay: anime.stagger(40, { start: 80 }),
      easing: "easeOutExpo",
    });
  }, [sheetOpen, pool.length]);

  const handlePull = async () => {
    if (!user || user.energy < 1) {
      toast.error("Not enough energy");
      return;
    }
    if (pool.length === 0) return;

    setIsPulling(true);
    if (pullBtnRef.current) {
      anime({
        targets: pullBtnRef.current,
        scale: [1.06, 1],
        duration: 200,
        easing: "easeOutExpo",
      });
    }
    if (pullMachineRef.current) {
      anime({
        targets: pullMachineRef.current,
        rotate: [-4, 4, -4, 4, 0],
        duration: 500,
        easing: "easeOutExpo",
      });
    }

    try {
      const res = await api.post("/gacha/pull");
      const character = res.data.character;
      await refreshUser();
      await loadData();
      setPulledCharacter(character);
      toast.success(`Pulled ${character.name}!`);
    } catch (error) {
      console.error("Error pulling:", error);
      toast.error(error.response?.data?.error || "Error pulling");
    } finally {
      setIsPulling(false);
    }
  };

  const handleToggleActive = async (characterId) => {
    const currentActive = user?.activeCharacters || [];
    if (!currentActive.includes(characterId) && currentActive.length >= (user?.maxPopulation || 5)) {
      toast.error(`Cannot exceed max population (${user?.maxPopulation || 5})`);
      return;
    }
    const card = document.querySelector(`[data-character-id="${characterId}"]`);
    if (card) {
      anime({
        targets: card,
        scale: [1.04, 1],
        duration: 280,
        easing: "easeOutExpo",
      });
    }
    try {
      let newActive;
      if (currentActive.includes(characterId)) {
        newActive = currentActive.filter((id) => id !== characterId);
      } else {
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
            <div ref={pullMachineRef} className="relative rounded-xl border-2 border-primary/30 bg-muted/20 p-6 transition-transform">
              {isPulling && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="h-10 w-10 animate-pulse text-primary" />
                    <span className="text-sm font-medium">Pulling...</span>
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
                  <span>Available in pool: {pool.length}</span>
                  {pool.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSheetOpen(true)}
                      className="h-6 px-2 text-xs"
                      disabled={isPulling}
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Detail
                    </Button>
                  )}
                </div>
                <Button
                  ref={pullBtnRef}
                  onClick={handlePull}
                  disabled={!user || user.energy < 1 || pool.length === 0 || isPulling}
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
            </div>
            {pulledCharacter && (
              <Card ref={pulledCardRef} className="mt-4 overflow-hidden border-primary/40 shadow-lg">
                <CardHeader>
                  <CardTitle>Pulled Character!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {pulledCharacter.cover && (
                      <div className="pulled-card-image mb-4">
                        <img
                          src={pulledCharacter.cover}
                          alt={pulledCharacter.name}
                          className="w-32 h-32 object-cover rounded-lg mx-auto ring-2 ring-primary/30"
                        />
                      </div>
                    )}
                    <div className="pulled-card-name font-semibold text-lg">
                      {pulledCharacter.name}
                    </div>
                    {pulledCharacter.media && (
                      <div className="pulled-card-media text-sm text-muted-foreground">
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
            {activeCharacters.length} / {user?.maxPopulation || 5}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={activeGridRef} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {collected.map((character) => {
              const isActive = activeCharacters.some((c) => c._id === character._id);
              return (
                <Card
                  key={character._id}
                  className={`gacha-character-card cursor-pointer hover:bg-muted/50 transition-colors ${
                    isActive ? "border-primary ring-1 ring-primary/30" : ""
                  }`}
                  data-character-id={character._id}
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
                <div ref={poolListRef} className="space-y-3">
                  {pool.map((character) => {
                    const pullRate = (100 / pool.length).toFixed(2);
                    return (
                      <Card key={character._id} className="gacha-pool-item">
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

