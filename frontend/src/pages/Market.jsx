import { useState, useEffect } from "react";
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

  useEffect(() => {
    loadRates();
  }, []);

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
    try {
      if (amount <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }

      const res = await api.post("/market/exchange", {
        resource: selectedResource,
        amount,
      });

      toast.success(`Exchanged ${amount} ${selectedResource} for ${res.data.coins} coins`);
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(isEditingRates ? editingRates : rates).map(([resource, rate]) => (
              <div key={resource} className="text-center p-4 border rounded-lg">
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
      <Card>
        <CardHeader>
          <CardTitle>Exchange Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Resource</Label>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(rates).map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)} (Available: {getAvailableAmount()})
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
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">You will receive</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Coins className="h-5 w-5" />
                {getCoinsValue()} coins
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleExchange}
              disabled={amount <= 0 || amount > getAvailableAmount()}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Exchange
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

