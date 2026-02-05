import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    shipping_address: "",
    notes: ""
  });

  // Mock cart - in a real app this would come from state management
  const cart = [];
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = cart.some(item => item.type === "physical") ? 4.99 : 0;
  const total = subtotal + shipping;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      return await base44.entities.Order.create(orderData);
    },
    onSuccess: (order) => {
      toast.success("Bestellung erfolgreich aufgegeben!");
      navigate(createPageUrl("OrderConfirmation") + `?id=${order.id}`);
    },
    onError: () => {
      toast.error("Fehler beim Aufgeben der Bestellung");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_email) {
      toast.error("Bitte fülle alle Pflichtfelder aus");
      return;
    }

    const orderData = {
      order_number: `ORD-${Date.now()}`,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      shipping_address: formData.shipping_address,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total_amount: total,
      status: "pending",
      payment_method: "Manual",
      notes: formData.notes
    };

    createOrderMutation.mutate(orderData);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Dein Warenkorb ist leer</p>
          <Link to={createPageUrl("Shop")}>
            <Button>Zum Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to={createPageUrl("Shop")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Shop
          </Button>
        </Link>

        <h1 className="text-3xl font-light text-stone-800 mb-8">Kasse</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-stone-200/50"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-stone-800 mb-4">
                    Kontaktinformationen
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                {cart.some(item => item.type === "physical") && (
                  <div>
                    <h2 className="text-lg font-medium text-stone-800 mb-4">
                      Lieferadresse
                    </h2>
                    <Textarea
                      value={formData.shipping_address}
                      onChange={(e) => setFormData({...formData, shipping_address: e.target.value})}
                      placeholder="Straße, Hausnummer, PLZ, Stadt, Land"
                      rows={4}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Anmerkungen (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Besondere Wünsche oder Hinweise"
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-slate-800 hover:bg-slate-700 h-12"
                  disabled={createOrderMutation.isPending}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {createOrderMutation.isPending ? "Wird verarbeitet..." : "Kostenpflichtig bestellen"}
                </Button>

                <p className="text-xs text-stone-500 text-center">
                  Nach dem Absenden erhältst du eine Bestätigungs-E-Mail mit Zahlungsinformationen.
                </p>
              </form>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-stone-200/50 sticky top-6"
            >
              <h2 className="text-lg font-medium text-stone-800 mb-4">
                Bestellübersicht
              </h2>
              
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-stone-800">{item.name}</p>
                      <p className="text-stone-500">Menge: {item.quantity}</p>
                    </div>
                    <p className="text-stone-800 font-medium">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-stone-200 pt-4">
                <div className="flex justify-between text-stone-600">
                  <span>Zwischensumme</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Versand</span>
                    <span>€{shipping.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-medium text-stone-800 pt-2 border-t border-stone-200">
                  <span>Gesamt</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}