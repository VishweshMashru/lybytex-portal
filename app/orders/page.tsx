"use client"
import { useEffect, useState, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, Package, ChevronDown, ChevronUp, MessageCircle, Send } from "lucide-react"

interface Log { id: number; actor: string; actorName: string; action: string; message: string; createdAt: string }
interface OrderItem { quantity: number; unit: string; product: { name: string }; variant?: { colorName: string } | null }
interface Order {
  id: number; orderId: string; status: string; notes?: string | null
  createdAt: string; updatedAt: string
  buyer: { name: string; company?: string; whatsappNumber?: string }
  items: OrderItem[]
  logs: Log[]
}

const ACTION_LABELS: Record<string, string> = {
  order_placed: "Order placed",
  status_changed: "Status updated",
  admin_note: "Note from LybyTex",
  change_requested: "Change requested",
  items_modified: "Order updated by LybyTex",
}
const ACTION_COLORS: Record<string, string> = {
  order_placed: "#1A6B3A",
  status_changed: "#1565C0",
  admin_note: "#6A1B9A",
  change_requested: "#E65100",
  items_modified: "#E8452A",
}

function buildWhatsAppLink(order: Order) {
  const itemList = order.items.map(i => `• ${i.product.name}${i.variant ? ` (${i.variant.colorName})` : ""} × ${i.quantity} ${i.unit}`).join("\n")
  const text = `Hi LybyTex, I placed an order and would like to discuss it.\n\nOrder ID: ${order.orderId}\nItems:\n${itemList}\n\nPlease advise on pricing and next steps.`
  return `https://wa.me/919825124751?text=${encodeURIComponent(text)}`
}

function buildChangeRequestLink(order: Order, changeText: string) {
  const text = `Hi LybyTex, I'd like to request a change on my order.\n\nOrder ID: ${order.orderId}\nChange requested: ${changeText}`
  return `https://wa.me/919825124751?text=${encodeURIComponent(text)}`
}

function OrdersContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useSearchParams()
  const newOrderId = params.get("new")
  const [ordersList, setOrdersList] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [changeText, setChangeText] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/orders")
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch("/api/orders").then(r => r.json()).then(data => {
        setOrdersList(data)
        setLoading(false)
        if (newOrderId) {
          const found = data.find((o: Order) => o.orderId === newOrderId)
          if (found) setExpandedId(found.id)
        }
      })
    }
  }, [session, newOrderId])

  const submitChangeRequest = async (order: Order) => {
    const text = changeText[order.id]
    if (!text?.trim()) return
    setSubmitting(order.id)
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changeRequest: text }),
    })
    const updated = await fetch("/api/orders").then(r => r.json())
    setOrdersList(updated)
    setChangeText(prev => ({ ...prev, [order.id]: "" }))
    setSubmitted(prev => ({ ...prev, [order.id]: true }))
    setSubmitting(null)
  }

  const filtered = ordersList.filter(o =>
    o.orderId.toLowerCase().includes(search.toLowerCase()) ||
    o.items.some(i => i.product.name.toLowerCase().includes(search.toLowerCase()))
  )

  if (status === "loading" || loading) {
    return <div style={{ textAlign: "center", padding: "80px 16px", color: "var(--gray)", fontSize: "16px" }}>Loading your orders...</div>
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "28px 16px 60px" }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 7vw, 48px)", color: "var(--black)", margin: "0 0 6px" }}>My Orders</h1>
      <p style={{ color: "var(--gray)", fontSize: "16px", marginBottom: "28px" }}>
        Hi {session?.user?.name?.split(" ")[0]} — all your LybyTex orders in one place.
      </p>

      {newOrderId && ordersList.find(o => o.orderId === newOrderId) && (
        <div style={{ background: "#F0FFF4", border: "1.5px solid #68D391", borderRadius: "12px", padding: "16px 18px", marginBottom: "24px" }}>
          <p style={{ fontWeight: 700, fontSize: "16px", margin: "0 0 4px", color: "#276749" }}>✅ Order placed successfully!</p>
          <p style={{ fontSize: "14px", color: "#2F855A", margin: "0 0 12px" }}>Order ID: <strong>{newOrderId}</strong> — save this for reference. We'll be in touch.</p>
          <a href={buildWhatsAppLink(ordersList.find(o => o.orderId === newOrderId)!)}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#25D366", color: "white", padding: "10px 18px", borderRadius: "8px", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>
            <MessageCircle size={18} /> Chat on WhatsApp — just tap Send
          </a>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: "24px" }}>
        <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray)" }} />
        <input type="text" placeholder="Search by order ID or product..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", maxWidth: "400px", padding: "12px 12px 12px 44px", border: "1.5px solid var(--border)", borderRadius: "10px", fontSize: "16px", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Package size={48} style={{ color: "var(--gray)", marginBottom: "14px" }} />
          <p style={{ color: "var(--gray)", fontSize: "18px", marginBottom: "20px" }}>No orders yet.</p>
          <Link href="/" className="btn-coral" style={{ textDecoration: "none", display: "inline-block" }}>Browse Catalog</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filtered.map((order) => {
            const isExpanded = expandedId === order.id
            return (
              <div key={order.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", margin: 0 }}>{order.orderId}</p>
                      <span className={`status-badge status-${order.status}`}>{order.status}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--gray)", margin: 0 }}>
                      Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={22} color="var(--gray)" /> : <ChevronDown size={22} color="var(--gray)" />}
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "18px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Items</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "22px" }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                          <span>{item.product.name}{item.variant && <span style={{ color: "var(--coral)", marginLeft: "6px" }}>({item.variant.colorName})</span>}</span>
                          <span style={{ fontWeight: 700 }}>{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 14px" }}>Timeline</p>
                    <div style={{ position: "relative", paddingLeft: "22px", marginBottom: "22px" }}>
                      <div style={{ position: "absolute", left: "6px", top: 0, bottom: 0, width: "1.5px", background: "var(--border)" }} />
                      {order.logs.map((log, i) => (
                        <div key={log.id} style={{ position: "relative", marginBottom: i === order.logs.length - 1 ? 0 : "18px" }}>
                          <div style={{ position: "absolute", left: "-19px", top: "5px", width: "10px", height: "10px", borderRadius: "50%", background: ACTION_COLORS[log.action] ?? "var(--gray)", border: "2px solid white" }} />
                          <p style={{ fontSize: "12px", fontWeight: 700, color: ACTION_COLORS[log.action] ?? "var(--gray)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                            {ACTION_LABELS[log.action] ?? log.action}
                          </p>
                          <p style={{ fontSize: "14px", color: "var(--black)", margin: "0 0 2px" }}>{log.message}</p>
                          <p style={{ fontSize: "12px", color: "var(--gray-light)", margin: 0 }}>
                            {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                      <a href={buildWhatsAppLink(order)} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#25D366", color: "white", padding: "12px 18px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", fontWeight: 600, width: "fit-content" }}>
                        <MessageCircle size={18} /> Chat about this order — just tap Send
                      </a>

                      {submitted[order.id] ? (
                        <p style={{ fontSize: "14px", color: "#276749", fontWeight: 600 }}>✅ Change request logged. Please also tap the WhatsApp button above so we see it right away.</p>
                      ) : (
                        <div>
                          <p style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 8px" }}>Request a change</p>
                          <textarea value={changeText[order.id] ?? ""} onChange={e => setChangeText(prev => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder="Describe what you'd like to change..." rows={3}
                            style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "10px", padding: "12px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", marginBottom: "10px" }} />
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <button onClick={() => submitChangeRequest(order)}
                              disabled={submitting === order.id || !changeText[order.id]?.trim()}
                              className="btn-coral"
                              style={{ display: "flex", alignItems: "center", gap: "6px", opacity: !changeText[order.id]?.trim() ? 0.5 : 1 }}>
                              <Send size={16} />{submitting === order.id ? "Sending..." : "Submit request"}
                            </button>
                            {changeText[order.id]?.trim() && (
                              <a href={buildChangeRequestLink(order, changeText[order.id])} target="_blank" rel="noopener noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#25D366", color: "white", padding: "14px 18px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>
                                <MessageCircle size={16} /> Also send on WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "80vh" }} />}>
      <OrdersContent />
    </Suspense>
  )
}