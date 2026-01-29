import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ShoppingCart, Coins, Save, Edit2, ArrowLeft, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/api";
import { useUser } from "../contexts/UserContext";
import anime from "animejs";

export default function Market() {
  const { user, refreshUser } = useUser();
  const [rates, setRates] = useState({
    meat: 1,
    wood: 2,
    stone: 3,
    iron: 5,
    crystal: 10,
  });
  const [selectedResource, setSelectedResource] = useState("meat");
  const [amount, setAmount] = useState(0);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [editingRates, setEditingRates] = useState({
    meat: 1,
    wood: 2,
    stone: 3,
    iron: 5,
    crystal: 10,
  });
  const ratesGridRef = useRef(null);
  const exchangeCardRef = useRef(null);
  const exchangeBtnRef = useRef(null);
  const coinsResultRef = useRef(null);
  const headerBadgeRef = useRef(null);
  const hasRatesStaggeredRef = useRef(false);
  const hasExchangeStaggeredRef = useRef(false);
  const hasHeaderAnimatedRef = useRef(false);

  useEffect(() => {
    loadRates();
  }, []);

  // Stagger rate cards on load
  useEffect(() => {
    if (Object.keys(rates).length === 0 || !ratesGridRef.current || hasRatesStaggeredRef.current) return;
    hasRatesStaggeredRef.current = true;
    const cards = ratesGridRef.current.querySelectorAll(".market-rate-card");
    if (cards.length === 0) return;
    anime.set(cards, { opacity: 0, translateY: 16 });
    anime({
      targets: cards,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 380,
      delay: anime.stagger(50, { start: 80 }),
      easing: "easeOutExpo",
    });
  }, [rates]);

  // Stagger exchange card sections on load
  useEffect(() => {
    if (!exchangeCardRef.current || hasExchangeStaggeredRef.current) return;
    hasExchangeStaggeredRef.current = true;
    const sections = exchangeCardRef.current.querySelectorAll(".market-exchange-section");
    if (sections.length === 0) return;
    anime.set(sections, { opacity: 0, translateY: 12 });
    anime({
      targets: sections,
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 350,
      delay: anime.stagger(80, { start: 120 }),
      easing: "easeOutExpo",
    });
  }, [user]);

  // Header coins badge scale-in once
  useEffect(() => {
    if (!user || !headerBadgeRef.current || hasHeaderAnimatedRef.current) return;
    hasHeaderAnimatedRef.current = true;
    anime.set(headerBadgeRef.current, { scale: 0.92, opacity: 0 });
    anime({
      targets: headerBadgeRef.current,
      scale: [0.92, 1],
      opacity: [0, 1],
      duration: 400,
      easing: "easeOutExpo",
    });
  }, [user]);

  const loadRates = async () => {
    try {
      const res = await api.get("/market/rates");
      setRates(res.data);
      setEditingRates(res.data);
    } catch (error) {
      console.error("Error loading rates:", error);
    }
  };

  const handleSaveRates = async () => {
    try {
      // Validate rates
      for (const [resource, rate] of Object.entries(editingRates)) {
        if (rate < 0 || !Number.isInteger(rate)) {
          toast.error(`Rate for ${resource} must be a positive integer`);
          return;
        }
      }

      await api.put("/market/rates", editingRates);
      setRates(editingRates);
      setIsEditingRates(false);
      toast.success("Exchange rates updated successfully");
    } catch (error) {
      console.error("Error saving rates:", error);
      toast.error(error.response?.data?.error || "Error saving exchange rates");
    }
  };

  const handleCancelEdit = () => {
    setEditingRates(rates);
    setIsEditingRates(false);
  };

  const handleRateChange = (resource, value) => {
    const numValue = parseInt(value) || 0;
    setEditingRates({
      ...editingRates,
      [resource]: numValue,
    });
  };

  const handleExchange = async () => {
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (amount > getAvailableAmount()) {
      toast.error("Amount exceeds available");
      return;
    }

    if (exchangeBtnRef.current) {
      anime({
        targets: exchangeBtnRef.current,
        scale: [1.05, 1],
        duration: 220,
        easing: "easeOutExpo",
      });
    }

    try {
      const res = await api.post("/market/exchange", {
        resource: selectedResource,
        amount,
      });
      const coinsReceived = res.data.coins;

      if (coinsResultRef.current) {
        anime({
          targets: coinsResultRef.current,
          scale: [1.02, 1.08, 1],
          duration: 500,
          easing: "easeOutElastic(1, 0.6)",
        });
      }

      toast.success(`Exchanged ${amount} ${selectedResource} for ${coinsReceived} coins`);
      await refreshUser();
      setAmount(0);
    } catch (error) {
      console.error("Error exchanging:", error);
      toast.error(error.response?.data?.error || "Error exchanging");
    }
  };

  const getAvailableAmount = () => {
    return user?.resources?.[selectedResource] || 0;
  };

  const getCoinsValue = () => {
    return amount * (rates[selectedResource] || 0);
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
          <h1 className="text-3xl font-bold">Market</h1>
        </div>
        {user && (
          <div
            ref={headerBadgeRef}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-border/50"
          >
            <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <span className="text-sm font-medium">
              <span className="font-semibold">{user.coins ?? 0}</span> coins
            </span>
          </div>
        )}
      </div>

      {/* Exchange Rates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exchange Rates</CardTitle>
              <CardDescription>1 resource = X coins</CardDescription>
            </div>
            {!isEditingRates ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingRates(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Rates
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveRates}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div ref={ratesGridRef} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(isEditingRates ? editingRates : rates).map(([resource, rate]) => (
              <div key={resource} className="market-rate-card text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">{resourceEmojis[resource]}</div>
                {isEditingRates ? (
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => handleRateChange(resource, e.target.value)}
                    min="0"
                    className="text-center text-2xl font-bold"
                  />
                ) : (
                  <div className="text-2xl font-bold">{rate}</div>
                )}
                <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Coins className="h-3 w-3" />
                  coins
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exchange */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Exchange Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={exchangeCardRef} className="space-y-4">
            <div className="market-exchange-section grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Resource</Label>
                <Select value={selectedResource} onValueChange={setSelectedResource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(rates).map((resource) => (
                      <SelectItem key={resource} value={resource}>
                        {resource.charAt(0).toUpperCase() + resource.slice(1)} (Available: {user?.resources?.[resource] ?? 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  min="0"
                  max={getAvailableAmount()}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  Available: {getAvailableAmount()}
                </div>
              </div>
            </div>
            <div
              ref={coinsResultRef}
              className="market-exchange-section p-4 rounded-lg bg-muted/80 border-2 border-primary/20"
            >
              <div className="text-sm text-muted-foreground">You will receive</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                {getCoinsValue()} coins
              </div>
            </div>
            <div className="market-exchange-section">
              <Button
                ref={exchangeBtnRef}
                className="w-full"
                onClick={handleExchange}
                disabled={amount <= 0 || amount > getAvailableAmount()}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Exchange
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

