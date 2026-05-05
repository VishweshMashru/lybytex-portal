"use client"
import { useState, useEffect, useCallback } from "react"
import { ProductCard } from "@/components/product-card"
import { Search } from "lucide-react"

interface Category { id: number; name: string; slug: string }
interface Product {
  id: number; name: string; description?: string | null
  cloudinaryImageId?: string | null; unit: string
  category: { name: string }
  variants: { id: number; colorName: string; cloudinaryImageId?: string | null }[]
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories)
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeCategory !== "all") params.set("category", activeCategory)
    if (search) params.set("search", search)
    const data = await fetch(`/api/products?${params}`).then(r => r.json())
    setProducts(data)
    setLoading(false)
  }, [activeCategory, search])

  useEffect(() => {
    const t = setTimeout(fetchProducts, 250)
    return () => clearTimeout(t)
  }, [fetchProducts])

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 16px 60px" }}>

      {/* Hero */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px, 8vw, 80px)", lineHeight: 0.95, color: "var(--black)", margin: "0 0 12px" }}>
          African Fabrics,<br />
          <span style={{ color: "var(--coral)" }}>Straight from the Source</span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--gray)", maxWidth: "480px", lineHeight: 1.6, margin: 0 }}>
          Browse our full catalog. Add what you need and place your order — we'll confirm everything with you directly.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "480px", marginBottom: "20px" }}>
        <Search size={20} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray)" }} />
        <input
          type="text"
          placeholder="Search fabrics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "14px 14px 14px 46px", border: "1.5px solid var(--border)", borderRadius: "10px", fontSize: "16px", background: "white", color: "var(--black)", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px", overflowX: "auto", paddingBottom: "4px" }}>
        {[{ id: 0, name: "All Products", slug: "all" }, ...categories].map((cat) => (
          <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
            style={{ padding: "10px 20px", borderRadius: "24px", fontSize: "15px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, border: activeCategory === cat.slug ? "1.5px solid var(--coral)" : "1.5px solid var(--border)", background: activeCategory === cat.slug ? "var(--coral)" : "white", color: activeCategory === cat.slug ? "white" : "var(--black)", transition: "all 0.15s", WebkitTapHighlightColor: "transparent" }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--gray)", fontSize: "16px" }}>Loading catalog...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "18px", color: "var(--gray)" }}>No products found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Wholesale banner */}
      <div style={{ marginTop: "60px", background: "var(--black)", borderRadius: "16px", padding: "28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(22px, 4vw, 30px)", color: "white", margin: "0 0 4px" }}>Need wholesale pricing or MOQ info?</h2>
          <p style={{ color: "#A09880", fontSize: "15px", margin: 0 }}>Talk directly to our team on WhatsApp for bulk rates.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href="https://wa.me/919825124751" target="_blank" rel="noopener noreferrer"
            style={{ background: "#25D366", color: "white", padding: "12px 20px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>
            WhatsApp — Mr. Dharmesh
          </a>
          <a href="https://wa.me/919537517519" target="_blank" rel="noopener noreferrer"
            style={{ background: "#25D366", color: "white", padding: "12px 20px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>
            WhatsApp — Vishwesh
          </a>
        </div>
      </div>
    </div>
  )
}