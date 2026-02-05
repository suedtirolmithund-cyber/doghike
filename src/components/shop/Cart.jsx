import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart({ open, onClose, cart, onRemove, onUpdateQuantity }) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = cart.some(item => item.type === "physical") ? 4.99 : 0;
  const total = subtotal + shipping;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Cart Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-stone-800 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Warenkorb
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              {cart.length > 0 && (
                <p className="text-sm text-stone-500 mt-1">
                  {cart.length} {cart.length === 1 ? "Artikel" : "Artikel"}
                </p>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500 mb-2">Dein Warenkorb ist leer</p>
                  <Button onClick={onClose} variant="outline">
                    Weiter einkaufen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-stone-50 rounded-xl"
                    >
                      <img
                        src={item.image_url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&q=80"}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-stone-800 text-sm mb-1 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-stone-600 mb-2">
                          €{item.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-stone-300 rounded-lg">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-stone-100 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-stone-600" />
                            </button>
                            <span className="px-3 text-sm font-medium text-stone-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-stone-100 transition-colors"
                              disabled={item.type === "physical" && item.quantity >= item.stock}
                            >
                              <Plus className="w-3 h-3 text-stone-600" />
                            </button>
                          </div>
                          <button
                            onClick={() => onRemove(item.id)}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-stone-200 space-y-4">
                <div className="space-y-2 text-sm">
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
                <Link to={createPageUrl("Checkout")} onClick={onClose}>
                  <Button className="w-full bg-slate-800 hover:bg-slate-700">
                    Zur Kasse
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}