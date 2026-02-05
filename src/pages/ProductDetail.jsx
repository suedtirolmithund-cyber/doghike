import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Download, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categoryLabels = {
  ebook: "E-Book",
  guide: "Guide",
  map: "Karte",
  book: "Buch",
  merchandise: "Merchandise"
};

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId
  });

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Lädt...</div>
      </div>
    );
  }

  const isOutOfStock = product.type === "physical" && product.stock <= 0;
  const Icon = product.type === "digital" ? Download : BookOpen;

  const handleAddToCart = () => {
    // In a real app, this would add to cart state management
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link to={createPageUrl("Shop")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Shop
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100">
              <img
                src={product.image_url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&q=80"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                <Icon className="w-3 h-3 mr-1" />
                {product.type === "digital" ? "Digital" : "Physisch"}
              </Badge>
              {product.category && (
                <Badge variant="outline">
                  {categoryLabels[product.category]}
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-amber-100 text-amber-700">
                  ⭐ Beliebt
                </Badge>
              )}
              {product.type === "physical" && (
                <Badge variant={isOutOfStock ? "destructive" : "outline"}>
                  {isOutOfStock ? "Ausverkauft" : `${product.stock} verfügbar`}
                </Badge>
              )}
            </div>

            {/* Title & Price */}
            <div>
              <h1 className="text-3xl font-light text-stone-800 mb-2">
                {product.name}
              </h1>
              <div className="text-4xl font-light text-slate-800">
                €{product.price.toFixed(2)}
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-stone">
              <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Features */}
            {product.type === "digital" && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Check className="w-4 h-4" />
                  <span>Sofortiger Download nach dem Kauf</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Check className="w-4 h-4" />
                  <span>Alle Geräte kompatibel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Check className="w-4 h-4" />
                  <span>Lebenslanger Zugang</span>
                </div>
              </div>
            )}

            {product.type === "physical" && (
              <div className="bg-green-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="w-4 h-4" />
                  <span>Kostenloser Versand ab €50</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="w-4 h-4" />
                  <span>Lieferung in 3-5 Werktagen</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="w-4 h-4" />
                  <span>30 Tage Rückgaberecht</span>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-4 pt-4">
              {product.type === "physical" && !isOutOfStock && (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-stone-700">
                    Menge:
                  </label>
                  <div className="flex items-center border border-stone-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-stone-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-2 hover:bg-stone-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full bg-slate-800 hover:bg-slate-700 h-12 text-base"
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Zum Warenkorb hinzugefügt
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {isOutOfStock ? "Ausverkauft" : "In den Warenkorb"}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}