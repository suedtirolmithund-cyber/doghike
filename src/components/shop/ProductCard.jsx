import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Download, BookOpen } from "lucide-react";

const categoryLabels = {
  ebook: "E-Book",
  guide: "Guide",
  map: "Karte",
  book: "Buch",
  merchandise: "Merchandise"
};

const typeIcons = {
  digital: Download,
  physical: BookOpen
};

export default function ProductCard({ product, onAddToCart, index }) {
  const Icon = typeIcons[product.type];
  const isOutOfStock = product.type === "physical" && product.stock <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-stone-100">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80"}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
            <h3 className="font-medium text-stone-800 hover:text-slate-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.featured && (
            <Badge className="bg-amber-100 text-amber-700 text-xs">
              ⭐ Beliebt
            </Badge>
          )}
        </div>

        <p className="text-sm text-stone-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="text-xs">
            <Icon className="w-3 h-3 mr-1" />
            {product.type === "digital" ? "Digital" : "Physisch"}
          </Badge>
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {categoryLabels[product.category]}
            </Badge>
          )}
          {product.type === "physical" && (
            <Badge variant="outline" className="text-xs">
              {product.stock > 0 ? `${product.stock} verfügbar` : "Ausverkauft"}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-light text-slate-800">
            €{product.price.toFixed(2)}
          </div>
          <Button 
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="bg-slate-800 hover:bg-slate-700"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isOutOfStock ? "Ausverkauft" : "In den Warenkorb"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}