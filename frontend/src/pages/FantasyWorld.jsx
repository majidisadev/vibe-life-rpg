import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Sword,
  Building2,
  Hammer,
  ShoppingCart,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";

export default function FantasyWorld() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [resources, setResources] = useState({
    meat: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    crystal: 0,
  });
  const [buildings, setBuildings] = useState([]);
  const [dungeons, setDungeons] = useState([]);

  // Resource emoji mapping
  const resourceEmojis = {
    meat: "🥩",
    wood: "🪵",
    stone: "🪨",
    iron: "⚙️",
    crystal: "💎",
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (user) {
        const userResources = user.resources || {
          meat: 0,
          wood: 0,
          stone: 0,
          iron: 0,
          crystal: 0,
        };
        setResources(userResources);
      }

      const [buildingsRes, dungeonsRes] = await Promise.all([
        api.get("/buildings"),
        api.get("/dungeons"),
      ]);
      setBuildings(buildingsRes.data || []);
      setDungeons(dungeonsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Calculate dungeon stats
  const totalDungeons = dungeons.length;
  const completedDungeons = dungeons.filter((d) => d.completed).length;

  // Calculate building stats
  const builtBuildings = buildings.filter((b) => b.built);
  const builtBuildingsCount = builtBuildings.length;
  const notBuiltBuildingsCount = buildings.filter((b) => !b.built).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fantasy World</h1>
      </div>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">{resourceEmojis.meat}</div>
              <div className="text-2xl font-bold">{resources.meat || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{resourceEmojis.wood}</div>
              <div className="text-2xl font-bold">{resources.wood || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{resourceEmojis.stone}</div>
              <div className="text-2xl font-bold">{resources.stone || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{resourceEmojis.iron}</div>
              <div className="text-2xl font-bold">{resources.iron || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{resourceEmojis.crystal}</div>
              <div className="text-2xl font-bold">{resources.crystal || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="min-h-[140px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
            <CardTitle className="text-base font-medium">Dungeons</CardTitle>
            <Sword className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-bold">
              {completedDungeons}/{totalDungeons}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[140px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
            <CardTitle className="text-base font-medium">Buildings</CardTitle>
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-bold">
              {builtBuildingsCount}/{notBuiltBuildingsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/dungeons")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sword className="h-5 w-5" />
              Dungeons
            </CardTitle>
            <CardDescription>Fight enemies in dungeons</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/town")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Town
            </CardTitle>
            <CardDescription>Manage your buildings</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/gacha")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Gacha
            </CardTitle>
            <CardDescription>Collect supporting characters</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/market")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Market
            </CardTitle>
            <CardDescription>Exchange resources for coins</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/blacksmith")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hammer className="h-5 w-5" />
              Blacksmith
            </CardTitle>
            <CardDescription>Craft and equip weapons</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/album")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Album
            </CardTitle>
            <CardDescription>Upload and manage photos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
