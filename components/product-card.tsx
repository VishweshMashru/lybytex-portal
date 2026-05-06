"use client"
import { useState, useEffect } from "react"
import { useCart } from "@/lib/cart-context"
import { getCloudinaryUrl } from "@/lib/utils"
import { ShoppingCart, Check, ChevronDown } from "lucide-react"

interface Variant { id: number; colorName: string; cloudinaryImageId?: string | null }
interface Product {
  id: number; name: string; description?: string | null
  cloudinaryImageId?: string | null; unit: string
  badge?: string | null
  category: { name: string }; variants: Variant[]
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart()
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(product.variants[0] ?? null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [cycleIndex, setCycleIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const allImages = [
    ...(product.cloudinaryImageId ? [{ id: null as null, colorName: null, cloudinaryImageId: product.cloudinaryImageId }] : []),
    ...product.variants.filter(v => v.cloudinaryImageId),
  ]

  const usePills = allImages.length <= 3

  useEffect(() => {
    if (allImages.length <= 1 || hovered) return
    const interval = setInterval(() => {
      setCycleIndex(prev => (prev + 1) % allImages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [allImages.length, hovered])

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant)
    const idx = allImages.findIndex(img => img.id === variant.id)
    if (idx !== -1) setCycleIndex(idx)
    setDropdownOpen(false)
  }

  const cyclingImage = allImages[cycleIndex]
  const displayImageId = cyclingImage?.cloudinaryImageId ?? product.cloudinaryImageId
  const imageUrl = displayImageId ? getCloudinaryUrl(displayImageId, 400) : null
  const inCart = items.some(i => i.productId === product.id && i.variantId === (selectedVariant?.id ?? null))

  const handleAdd = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      productName: product.name,
      variantName: selectedVariant?.colorName ?? null,
      categoryName: product.category.name,
      imageUrl,
      quantity: qty,
      unit: product.unit,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div
      style={{ background: "white", border: "1px solid var(--border)", borderRadius: "14px", overflow: "visible", display: "flex", flexDirection: "column", transition: "box-shadow 0.15s, transform 0.15s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDropdownOpen(false) }}
    >
      {/* Image — rounded top corners only, overflow hidden for image crop */}
      <div style={{ aspectRatio: "1", background: "var(--cream2)", overflow: "hidden", position: "relative", borderRadius: "14px 14px 0 0" }}>
        {imageUrl ? (
          <img key={displayImageId} src={imageUrl} alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", animation: "fadeIn 0.4s ease" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px" }}>🧵</div>
        )}

        {/* Category pill */}
        <span style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(255,255,255,0.92)", color: "var(--coral)", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>
          {product.category.name}
        </span>

        {/* Badge */}
        {product.badge && (
          <span style={{
            position: "absolute", top: "10px", right: "10px",
            background: product.badge === "new_arrival" ? "#DCFCE7" : "#FEF9C3",
            color: product.badge === "new_arrival" ? "#166534" : "#854D0E",
            fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px",
          }}>
            {product.badge === "new_arrival" ? "🆕 New" : "⭐ Best Seller"}
          </span>
        )}

        {/* Dot indicators */}
        {allImages.length > 1 && (
          <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }}>
            {allImages.map((_, i) => (
              <div key={i} style={{ width: i === cycleIndex ? "16px" : "6px", height: "6px", borderRadius: "3px", background: i === cycleIndex ? "white" : "rgba(255,255,255,0.5)", transition: "all 0.3s" }} />
            ))}
          </div>
        )}

        {/* Colorway label — hide on hover */}
        {cyclingImage?.colorName && !hovered && (
          <div style={{ position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.55)", color: "white", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
            {cyclingImage.colorName}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", letterSpacing: "0.5px", margin: "0 0 4px", lineHeight: 1.1 }}>{product.name}</h3>
          {product.description && <p style={{ fontSize: "14px", color: "var(--gray)", margin: 0, lineHeight: 1.5 }}>{product.description}</p>}
        </div>

        {/* Variants */}
        {product.variants.length > 0 && (
          <div>
            <p style={{ fontSize: "12px", color: "var(--gray)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Colorway</p>

            {usePills ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {product.variants.map(v => (
                  <button key={v.id} onClick={() => handleVariantSelect(v)}
                    style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", border: selectedVariant?.id === v.id ? "1.5px solid var(--coral)" : "1px solid var(--border)", background: selectedVariant?.id === v.id ? "#FFF0ED" : "transparent", color: selectedVariant?.id === v.id ? "var(--coral)" : "var(--black)", fontWeight: selectedVariant?.id === v.id ? 600 : 400, WebkitTapHighlightColor: "transparent" }}>
                    {v.colorName}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <button onClick={() => setDropdownOpen(p => !p)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", border: "1.5px solid var(--border)", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "var(--black)", WebkitTapHighlightColor: "transparent" }}>
                  <span style={{ fontWeight: 500 }}>{selectedVariant?.colorName ?? "Select colorway"}</span>
                  <ChevronDown size={16} style={{ color: "var(--gray)", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {dropdownOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1.5px solid var(--border)", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden", maxHeight: "220px", overflowY: "auto" }}>
                    {product.variants.map(v => (
                      <button key={v.id} onClick={() => handleVariantSelect(v)}
                        style={{ width: "100%", padding: "10px 14px", border: "none", background: selectedVariant?.id === v.id ? "#FFF0ED" : "transparent", cursor: "pointer", fontSize: "14px", textAlign: "left", fontFamily: "'DM Sans', sans-serif", color: selectedVariant?.id === v.id ? "var(--coral)" : "var(--black)", fontWeight: selectedVariant?.id === v.id ? 600 : 400, WebkitTapHighlightColor: "transparent", display: "flex", alignItems: "center", gap: "8px" }}>
                        {v.cloudinaryImageId && (
                          <img src={getCloudinaryUrl(v.cloudinaryImageId, 32)} style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} />
                        )}
                        {v.colorName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Qty + Add */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            <button onClick={() => setQty(Math.max(1, qty - 1))}
              style={{ width: "40px", height: "44px", border: "none", background: "transparent", cursor: "pointer", fontSize: "20px", color: "var(--gray)", WebkitTapHighlightColor: "transparent" }}>−</button>
            <span style={{ minWidth: "36px", textAlign: "center", fontSize: "16px", fontWeight: 600 }}>{qty}</span>
            <button onClick={() => setQty(qty + 1)}
              style={{ width: "40px", height: "44px", border: "none", background: "transparent", cursor: "pointer", fontSize: "20px", color: "var(--gray)", WebkitTapHighlightColor: "transparent" }}>+</button>
          </div>
          <span style={{ fontSize: "13px", color: "var(--gray)" }}>{product.unit}</span>
          <button onClick={handleAdd} className="btn-coral"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 14px", fontSize: "15px" }}>
            {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            {added ? "Added!" : inCart ? "Add more" : "Add"}
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--gray)", textAlign: "center", margin: 0 }}>
          Wholesale pricing?{" "}
          <a href="https://wa.me/919825124751" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--coral)", textDecoration: "none", fontWeight: 600 }}>Chat with us ↗</a>
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0.5; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}