"use client"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trash2, ShoppingBag, ArrowRight, MessageCircle, Mail, X } from "lucide-react"

interface PlacedOrder {
  orderId: string
  items: { productName: string; variantName?: string | null; quantity: number; unit: string }[]
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart()
  const { data: session } = useSession()
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)

  const buildWhatsApp = (orderId: string, orderItems: PlacedOrder["items"], to: string) => {
    const itemList = orderItems.map(i => `• ${i.productName}${i.variantName ? ` (${i.variantName})` : ""} × ${i.quantity} ${i.unit}`).join("\n")
    const text = `Hi LybyTex! I just placed an order.\n\nOrder ID: ${orderId}\nItems:\n${itemList}\n\nPlease confirm and advise on pricing.`
    return `https://wa.me/${to}?text=${encodeURIComponent(text)}`
  }

  const handlePlaceOrder = async () => {
    if (!session) { router.push("/login?callbackUrl=/cart"); return }
    if (!items.length) return
    setPlacing(true); setError("")
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPlacedOrder({ orderId: data.orderId, items: items.map(i => ({ productName: i.productName, variantName: i.variantName, quantity: i.quantity, unit: i.unit })) })
      clearCart()
    } catch (e: any) {
      setError(e.message ?? "Something went wrong")
    } finally {
      setPlacing(false)
    }
  }

  // ── POST ORDER MODAL ──
  if (placedOrder) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
        <div style={{ background: "white", borderRadius: "20px", maxWidth: "480px", width: "100%", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          {/* Header */}
          <div style={{ background: "var(--black)", padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>✅</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "white", margin: "0 0 4px", letterSpacing: "1px" }}>Order Placed!</h2>
            <p style={{ color: "#A09880", fontSize: "14px", margin: 0 }}>Order ID: <strong style={{ color: "var(--coral)" }}>{placedOrder.orderId}</strong></p>
          </div>

          <div style={{ padding: "24px" }}>
            {/* Email confirmation */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
              <Mail size={20} style={{ color: "#276749", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: "14px", margin: "0 0 2px", color: "#276749" }}>Confirmation email sent</p>
                <p style={{ fontSize: "13px", color: "#2F855A", margin: 0 }}>We've sent your order details to your email. Save your order ID for reference.</p>
              </div>
            </div>

            {/* Items summary */}
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Your order</p>
            <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {placedOrder.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span>{item.productName}{item.variantName && <span style={{ color: "var(--coral)", marginLeft: "6px" }}>({item.variantName})</span>}</span>
                  <span style={{ fontWeight: 600 }}>{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--black)", margin: "0 0 10px" }}>
              Also send on WhatsApp for faster response — just tap Send:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <a href={buildWhatsApp(placedOrder.orderId, placedOrder.items, "919825124751")}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "10px", background: "#25D366", color: "white", padding: "14px 18px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>
                <MessageCircle size={20} />
                <div>
                  <p style={{ margin: 0, fontSize: "15px" }}>WhatsApp — Dharmesh</p>
                  <p style={{ margin: 0, fontSize: "12px", opacity: 0.85 }}>Message is pre-filled, just hit Send</p>
                </div>
              </a>
              <a href={buildWhatsApp(placedOrder.orderId, placedOrder.items, "919537517519")}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "10px", background: "#25D366", color: "white", padding: "14px 18px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>
                <MessageCircle size={20} />
                <div>
                  <p style={{ margin: 0, fontSize: "15px" }}>WhatsApp — Vishwesh</p>
                  <p style={{ margin: 0, fontSize: "12px", opacity: 0.85 }}>Message is pre-filled, just hit Send</p>
                </div>
              </a>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => router.push("/orders")}
                className="btn-coral" style={{ flex: 1, fontSize: "15px" }}>
                View my orders
              </button>
              <button onClick={() => router.push("/")}
                className="btn-outline" style={{ flex: 1, fontSize: "15px" }}>
                Back to catalog
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── EMPTY CART ──
  if (!items.length) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
        <ShoppingBag size={52} style={{ color: "var(--gray)", marginBottom: "16px" }} />
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", color: "var(--black)", margin: "0 0 8px" }}>Your cart is empty</h2>
        <p style={{ color: "var(--gray)", marginBottom: "24px", fontSize: "16px" }}>Browse the catalog and add products to your order.</p>
        <Link href="/" className="btn-coral" style={{ textDecoration: "none", display: "inline-block" }}>Browse Catalog</Link>
      </div>
    )
  }

  // ── CART ──
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "28px 16px 60px" }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 7vw, 48px)", color: "var(--black)", margin: "0 0 24px" }}>Your Order</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`}
            style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.productName} style={{ width: "68px", height: "68px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
            ) : (
              <div style={{ width: "68px", height: "68px", background: "var(--cream2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>🧵</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: "16px", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.productName}</p>
              {item.variantName && <p style={{ fontSize: "14px", color: "var(--coral)", margin: "0 0 8px" }}>{item.variantName}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                  <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    style={{ width: "36px", height: "36px", border: "none", background: "transparent", cursor: "pointer", fontSize: "18px", color: "var(--gray)", WebkitTapHighlightColor: "transparent" }}>−</button>
                  <span style={{ minWidth: "32px", textAlign: "center", fontSize: "15px", fontWeight: 600 }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    style={{ width: "36px", height: "36px", border: "none", background: "transparent", cursor: "pointer", fontSize: "18px", color: "var(--gray)", WebkitTapHighlightColor: "transparent" }}>+</button>
                </div>
                <span style={{ fontSize: "14px", color: "var(--gray)" }}>{item.unit}</span>
              </div>
            </div>
            <button onClick={() => removeItem(item.productId, item.variantId)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray)", padding: "8px", flexShrink: 0 }}>
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
        <label style={{ fontSize: "15px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Order notes <span style={{ color: "var(--gray)", fontWeight: 400 }}>(optional)</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any specific requirements, delivery instructions, etc."
          rows={3}
          style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "8px", padding: "12px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none" }} />
      </div>

      {error && <p style={{ color: "var(--coral)", fontSize: "15px", marginBottom: "12px" }}>{error}</p>}

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/" className="btn-outline" style={{ textDecoration: "none" }}>← Add more</Link>
        <button onClick={handlePlaceOrder} disabled={placing} className="btn-coral"
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: placing ? 0.7 : 1 }}>
          {placing ? "Placing order..." : <>{session ? "Place Order" : "Login to Place Order"}<ArrowRight size={20} /></>}
        </button>
      </div>

      {!session && (
        <p style={{ textAlign: "center", marginTop: "12px", fontSize: "14px", color: "var(--gray)" }}>
          Your cart is saved — logging in won't clear it.
        </p>
      )}
    </div>
  )
}