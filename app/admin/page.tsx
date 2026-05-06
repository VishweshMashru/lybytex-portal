"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Plus, Users, Tag, ShoppingBag, Upload, X, ChevronDown, ChevronUp, Trash2, Save, Settings } from "lucide-react"

type Tab = "orders" | "products" | "manage" | "categories" | "buyers"

interface Log { id: number; actor: string; actorName: string; action: string; message: string; createdAt: string }
interface OrderItem { id?: number; quantity: number; unit: string; product: { name: string }; variant?: { colorName: string } | null }
interface Order { id: number; orderId: string; status: string; createdAt: string; updatedAt: string; adminNotes?: string | null; notes?: string | null; buyer: { name: string; company?: string; email?: string; whatsappNumber?: string }; items: OrderItem[]; logs: Log[] }
interface Category { id: number; name: string; slug: string }
interface ProductVariant { id: number; colorName: string; cloudinaryImageId?: string | null; isActive: boolean }
interface Product { id: number; name: string; description?: string | null; cloudinaryImageId?: string | null; unit: string; isActive: boolean; sortOrder: number; badge?: string | null; category: { name: string }; variants: ProductVariant[] }

const STATUS_OPTIONS = ["pending","confirmed","processing","shipped","delivered","cancelled"]
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

const ACTION_LABELS: Record<string, string> = {
  order_placed: "Order placed",
  status_changed: "Status updated",
  admin_note: "Admin note",
  change_requested: "Buyer requested change",
  items_modified: "Items modified",
}
const ACTION_COLORS: Record<string, string> = {
  order_placed: "#1A6B3A",
  status_changed: "#1565C0",
  admin_note: "#6A1B9A",
  change_requested: "#E65100",
  items_modified: "#E8452A",
}

function ImageUploader({ value, onChange, label }: { value: string; onChange: (id: string, url: string) => void; label: string }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", PRESET!)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: "POST", body: formData })
    const data = await res.json()
    setUploading(false)
    if (data.public_id) { setPreview(data.secure_url); onChange(data.public_id, data.secure_url) }
  }

  const clear = () => { setPreview(null); onChange("", "") }

  return (
    <div style={{ marginBottom: "10px" }}>
      <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--gray)", marginBottom: "6px" }}>{label}</p>
      {preview ? (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img src={preview} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }} />
          <button onClick={clear} style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--coral)", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}><X size={12} /></button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", border: "1.5px dashed var(--border)", borderRadius: "8px", background: "var(--cream2)", cursor: "pointer", fontSize: "13px", color: "var(--gray)", fontFamily: "'DM Sans', sans-serif" }}>
          <Upload size={15} />{uploading ? "Uploading..." : "Upload image"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("orders")
  const [ordersList, setOrdersList] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({})
  const [savingNote, setSavingNote] = useState<number | null>(null)
  const [newCatName, setNewCatName] = useState("")
  const [newCatDesc, setNewCatDesc] = useState("")
  const [buyerForm, setBuyerForm] = useState({ name: "", email: "", password: "", company: "", country: "", whatsappNumber: "" })
  const [buyerMsg, setBuyerMsg] = useState("")
  const [productForm, setProductForm] = useState({ categoryId: "", name: "", description: "", cloudinaryImageId: "", unit: "dozen", baseColorName: "" })
  const [productImageUrl, setProductImageUrl] = useState("")
  const [variants, setVariants] = useState([{ colorName: "", cloudinaryImageId: "", previewUrl: "" }])
  const [productMsg, setProductMsg] = useState("")
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status === "authenticated" && (session?.user as any)?.role !== "admin") { router.push("/"); return }
  }, [status, session, router])

  useEffect(() => {
    if ((session?.user as any)?.role === "admin") {
      Promise.all([
        fetch("/api/orders").then(r => r.json()),
        fetch("/api/categories").then(r => r.json()),
      ]).then(([o, c]) => {
        setOrdersList(o)
        const notes: Record<number, string> = {}
        o.forEach((order: Order) => { notes[order.id] = order.adminNotes ?? "" })
        setAdminNotes(notes)
        setCategories(c)
        setLoading(false)
      })
    }
  }, [session])

  const loadProducts = async () => {
    setProductsLoading(true)
    try {
      const res = await fetch("/api/admin/products")
      if (!res.ok) { setProductsLoading(false); return }
      const data = await res.json()
      setAllProducts(data)
    } catch (e) { console.error(e) }
    setProductsLoading(false)
  }

  const updateStatus = async (id: number, newStatus: string) => {
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) })
    const updated = await res.json()
    setOrdersList(prev => prev.map(o => o.id === id ? updated : o))
  }

  const saveNote = async (id: number) => {
    setSavingNote(id)
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminNotes: adminNotes[id] }) })
    const updated = await res.json()
    setOrdersList(prev => prev.map(o => o.id === id ? updated : o))
    setSavingNote(null)
  }

  const deleteOrder = async (id: number, orderId: string) => {
    if (!confirm(`Delete order ${orderId}? This cannot be undone.`)) return
    await fetch(`/api/orders/${id}`, { method: "DELETE" })
    setOrdersList(prev => prev.filter(o => o.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const addCategory = async () => {
    if (!newCatName) return
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCatName, description: newCatDesc }) })
    const cat = await res.json()
    setCategories(prev => [...prev, cat])
    setNewCatName(""); setNewCatDesc("")
  }

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return
    await fetch("/api/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const createBuyer = async () => {
    setBuyerMsg("")
    const res = await fetch("/api/admin/buyers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buyerForm) })
    const data = await res.json()
    if (!res.ok) { setBuyerMsg("Error: " + data.error); return }
    setBuyerMsg(`✅ Account created for ${data.name} (${data.email})`)
    setBuyerForm({ name: "", email: "", password: "", company: "", country: "", whatsappNumber: "" })
  }

  const createProduct = async () => {
    setProductMsg("")
    const baseVariant = productForm.baseColorName && productForm.cloudinaryImageId
      ? [{ colorName: productForm.baseColorName, cloudinaryImageId: productForm.cloudinaryImageId }]
      : []
    const allVariants = [...baseVariant, ...variants.filter(v => v.colorName).map(v => ({ colorName: v.colorName, cloudinaryImageId: v.cloudinaryImageId || null }))]
    const res = await fetch("/api/admin/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...productForm, categoryId: parseInt(productForm.categoryId), variants: allVariants }),
    })
    const data = await res.json()
    if (!res.ok) { setProductMsg("Error: " + data.error); return }
    setProductMsg(`✅ "${data.name}" added to catalog`)
    setProductForm({ categoryId: "", name: "", description: "", cloudinaryImageId: "", unit: "dozen", baseColorName: "" })
    setProductImageUrl(""); setVariants([{ colorName: "", cloudinaryImageId: "", previewUrl: "" }])
  }

  const toggleProduct = async (id: number, isActive: boolean) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) })
    if (res.ok) setAllProducts(prev => prev.map(p => p.id === id ? { ...p, isActive } : p))
  }

  const deleteProduct = async (id: number, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    setAllProducts(prev => prev.filter(p => p.id !== id))
  }

  const removeProductImage = async (id: number) => {
    if (!confirm("Remove this product image?")) return
    await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cloudinaryImageId: null }) })
    setAllProducts(prev => prev.map(p => p.id === id ? { ...p, cloudinaryImageId: null } : p))
  }

  const toggleVariant = async (id: number, isActive: boolean) => {
    await fetch(`/api/admin/variants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) })
    setAllProducts(prev => prev.map(p => ({ ...p, variants: p.variants.map(v => v.id === id ? { ...v, isActive } : v) })))
  }

  const removeVariantImage = async (id: number) => {
    if (!confirm("Remove this variant image?")) return
    await fetch(`/api/admin/variants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cloudinaryImageId: null }) })
    setAllProducts(prev => prev.map(p => ({ ...p, variants: p.variants.map(v => v.id === id ? { ...v, cloudinaryImageId: null } : v) })))
  }

  const updateProductMeta = async (id: number, updates: { badge?: string | null; sortOrder?: number }) => {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    setAllProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white", marginBottom: "10px" }

  if (loading) return <div style={{ textAlign: "center", padding: "80px", color: "var(--gray)" }}>Loading...</div>

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "orders", label: `Orders (${ordersList.length})`, icon: <ShoppingBag size={16} /> },
    { key: "products", label: "Add Product", icon: <Plus size={16} /> },
    { key: "manage", label: "Manage Products", icon: <Settings size={16} /> },
    { key: "categories", label: "Categories", icon: <Tag size={16} /> },
    { key: "buyers", label: "Add Buyer", icon: <Users size={16} /> },
  ]

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 16px 60px" }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 7vw, 48px)", color: "var(--black)", margin: "0 0 24px" }}>Admin Panel</h1>

      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key === "manage") loadProducts() }}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "8px", border: tab === t.key ? "1.5px solid var(--coral)" : "1.5px solid var(--border)", background: tab === t.key ? "var(--coral)" : "white", color: tab === t.key ? "white" : "var(--black)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "15px", WebkitTapHighlightColor: "transparent" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── ORDERS ── */}
      {tab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {ordersList.length === 0 && <p style={{ color: "var(--gray)", textAlign: "center", padding: "40px 0", fontSize: "16px" }}>No orders yet.</p>}
          {ordersList.map(order => {
            const isExpanded = expandedId === order.id
            const hasPendingChange = order.logs.some(l => l.action === "change_requested")
            return (
              <div key={order.id} style={{ background: "white", border: `1px solid ${hasPendingChange ? "#FBD38D" : "var(--border)"}`, borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", margin: 0 }}>{order.orderId}</p>
                      <span className={`status-badge status-${order.status}`}>{order.status}</span>
                      {hasPendingChange && <span style={{ fontSize: "12px", background: "#FEFCE8", color: "#92400E", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>⚠ Change requested</span>}
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--gray)", margin: "3px 0 0" }}>
                      {order.buyer.name}{order.buyer.company ? ` — ${order.buyer.company}` : ""}
                      {order.buyer.email ? ` · ${order.buyer.email}` : ""}
                      {" · "}{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={e => e.stopPropagation()}>
                    <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                      style={{ padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: "6px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", background: "white" }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <button onClick={() => deleteOrder(order.id, order.orderId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", padding: "6px" }}><Trash2 size={18} /></button>
                    {isExpanded ? <ChevronUp size={20} color="var(--gray)" /> : <ChevronDown size={20} color="var(--gray)" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "18px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Items</p>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", padding: "5px 0" }}>
                          <span>{item.product.name}{item.variant && <span style={{ color: "var(--coral)", marginLeft: "6px" }}>({item.variant.colorName})</span>}</span>
                          <span style={{ fontWeight: 700 }}>{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                      {order.notes && <p style={{ fontSize: "14px", color: "var(--gray)", marginTop: "10px", fontStyle: "italic" }}>Buyer note: {order.notes}</p>}
                    </div>

                    {order.buyer.whatsappNumber && (
                      <div>
                        <a href={`https://wa.me/${order.buyer.whatsappNumber.replace(/\D/g, "")}?text=Hi ${order.buyer.name}, regarding your LybyTex order ${order.orderId}:`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#25D366", color: "white", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
                          WhatsApp buyer
                        </a>
                      </div>
                    )}

                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Internal notes (buyer cannot see)</p>
                      <textarea value={adminNotes[order.id] ?? ""} onChange={e => setAdminNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                        placeholder="Pricing agreed, dispatch date, special instructions..." rows={3}
                        style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "8px", padding: "12px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", marginBottom: "10px", background: "#FFFBF0" }} />
                      <button onClick={() => saveNote(order.id)} disabled={savingNote === order.id}
                        className="btn-coral" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", fontSize: "14px" }}>
                        <Save size={15} />{savingNote === order.id ? "Saving..." : "Save note"}
                      </button>
                    </div>

                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 14px" }}>Full timeline</p>
                      <div style={{ position: "relative", paddingLeft: "22px" }}>
                        <div style={{ position: "absolute", left: "6px", top: 0, bottom: 0, width: "1.5px", background: "var(--border)" }} />
                        {order.logs.map((log, i) => (
                          <div key={log.id} style={{ position: "relative", marginBottom: i === order.logs.length - 1 ? 0 : "16px" }}>
                            <div style={{ position: "absolute", left: "-19px", top: "5px", width: "10px", height: "10px", borderRadius: "50%", background: ACTION_COLORS[log.action] ?? "var(--gray)", border: "2px solid white" }} />
                            <p style={{ fontSize: "12px", fontWeight: 700, color: ACTION_COLORS[log.action] ?? "var(--gray)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                              {ACTION_LABELS[log.action]} · {log.actorName}
                            </p>
                            <p style={{ fontSize: "14px", color: "var(--black)", margin: "0 0 2px" }}>{log.message}</p>
                            <p style={{ fontSize: "12px", color: "var(--gray-light)", margin: 0 }}>
                              {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ADD PRODUCT ── */}
      {tab === "products" && (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", maxWidth: "560px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", margin: "0 0 18px" }}>Add New Product</h2>
          <select value={productForm.categoryId} onChange={e => setProductForm(p => ({ ...p, categoryId: e.target.value }))} style={inputStyle}>
            <option value="">Select category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Product name" value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
          <input placeholder="Description (optional)" value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} style={inputStyle} />
          <select value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))} style={inputStyle}>
            <option value="dozen">Dozen</option><option value="yard">Yard</option><option value="meter">Meter</option>
            <option value="piece">Piece</option><option value="roll">Roll</option><option value="bundle">Bundle</option>
          </select>
          <ImageUploader label="Product image (main / base color)" value={productForm.cloudinaryImageId}
            onChange={(id, url) => { setProductForm(p => ({ ...p, cloudinaryImageId: id })); setProductImageUrl(url) }} />
          <input placeholder="Color name for this image (e.g. Royal Blue) — optional" value={productForm.baseColorName}
            onChange={e => setProductForm(p => ({ ...p, baseColorName: e.target.value }))} style={{ ...inputStyle, marginTop: "4px" }} />
          <p style={{ fontSize: "14px", fontWeight: 600, margin: "14px 0 10px" }}>Additional colorway variants</p>
          {variants.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "10px", padding: "12px", background: "var(--cream2)", borderRadius: "8px" }}>
              <div style={{ flex: 1 }}>
                <input placeholder="Color name (e.g. Red on Black)" value={v.colorName}
                  onChange={e => setVariants(prev => prev.map((vi, ii) => ii === i ? { ...vi, colorName: e.target.value } : vi))}
                  style={{ ...inputStyle, margin: "0 0 8px" }} />
                <ImageUploader label="Variant image (optional)" value={v.cloudinaryImageId}
                  onChange={(id, url) => setVariants(prev => prev.map((vi, ii) => ii === i ? { ...vi, cloudinaryImageId: id, previewUrl: url } : vi))} />
              </div>
              {variants.length > 1 && <button onClick={() => setVariants(prev => prev.filter((_, ii) => ii !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray)", marginTop: "4px" }}><X size={16} /></button>}
            </div>
          ))}
          <button onClick={() => setVariants(prev => [...prev, { colorName: "", cloudinaryImageId: "", previewUrl: "" }])}
            style={{ background: "none", border: "1px dashed var(--border)", borderRadius: "6px", padding: "8px 14px", fontSize: "14px", cursor: "pointer", color: "var(--gray)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px", fontFamily: "'DM Sans', sans-serif" }}>
            <Plus size={14} /> Add variant
          </button>
          {productMsg && <p style={{ fontSize: "14px", color: productMsg.startsWith("✅") ? "#276749" : "var(--coral)", marginBottom: "10px" }}>{productMsg}</p>}
          <button onClick={createProduct} className="btn-coral" style={{ width: "100%" }}>Add to Catalog</button>
        </div>
      )}

      {/* ── MANAGE PRODUCTS ── */}
      {tab === "manage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "14px", color: "var(--gray)", margin: "0 0 8px" }}>
            Shelf to hide from catalog. Set priority (lower number = shows first). Delete removes permanently.
          </p>
          {productsLoading && <p style={{ color: "var(--gray)", textAlign: "center", padding: "40px 0" }}>Loading products...</p>}
          {!productsLoading && allProducts.length === 0 && <p style={{ color: "var(--gray)", textAlign: "center", padding: "40px 0" }}>No products yet.</p>}
          {allProducts.map(product => (
            <div key={product.id} style={{ background: "white", border: `1px solid ${product.isActive ? "var(--border)" : "#FCA5A5"}`, borderRadius: "12px", padding: "16px 18px", opacity: product.isActive ? 1 : 0.75 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>

                {product.cloudinaryImageId ? (
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={`https://res.cloudinary.com/${CLOUD}/image/upload/w_64,h_64,c_fill/${product.cloudinaryImageId}`}
                      style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)", display: "block" }} />
                    <button onClick={() => removeProductImage(product.id)} title="Remove image"
                      style={{ position: "absolute", top: "-6px", right: "-6px", background: "#E53E3E", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: "60px", height: "60px", background: "var(--cream2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🧵</div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <p style={{ fontWeight: 700, fontSize: "15px", margin: 0 }}>{product.name}</p>
                    <span style={{ fontSize: "12px", color: "var(--coral)", background: "#FFF0ED", padding: "2px 8px", borderRadius: "20px" }}>{product.category.name}</span>
                    <span style={{ fontSize: "12px", color: "var(--gray)", background: "var(--cream2)", padding: "2px 8px", borderRadius: "20px" }}>{product.unit}</span>
                    {!product.isActive && <span style={{ fontSize: "12px", background: "#FEE2E2", color: "#B91C1C", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>Shelved</span>}
                    {product.badge && (
                      <span style={{ fontSize: "12px", background: product.badge === "new_arrival" ? "#DCFCE7" : "#FEF9C3", color: product.badge === "new_arrival" ? "#166534" : "#854D0E", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>
                        {product.badge === "new_arrival" ? "🆕 New Arrival" : "⭐ Best Seller"}
                      </span>
                    )}
                  </div>

                  {product.variants.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                      {product.variants.map(v => (
                        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "4px", background: v.isActive ? "var(--cream2)" : "#FEE2E2", padding: "3px 8px", borderRadius: "6px" }}>
                          {v.cloudinaryImageId && (
                            <div style={{ position: "relative" }}>
                              <img src={`https://res.cloudinary.com/${CLOUD}/image/upload/w_20,h_20,c_fill/${v.cloudinaryImageId}`}
                                style={{ width: "18px", height: "18px", borderRadius: "3px", display: "block" }} />
                              <button onClick={() => removeVariantImage(v.id)}
                                style={{ position: "absolute", top: "-4px", right: "-4px", background: "#E53E3E", border: "none", borderRadius: "50%", width: "10px", height: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", padding: 0 }}>
                                <X size={6} />
                              </button>
                            </div>
                          )}
                          <span style={{ fontSize: "12px", color: v.isActive ? "var(--black)" : "#B91C1C", textDecoration: v.isActive ? "none" : "line-through" }}>{v.colorName}</span>
                          <button onClick={() => toggleVariant(v.id, !v.isActive)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--gray)", padding: "0 2px", fontFamily: "'DM Sans', sans-serif" }}>
                            {v.isActive ? "hide" : "show"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Badge + Priority controls */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      value={product.badge ?? ""}
                      onChange={e => updateProductMeta(product.id, { badge: e.target.value || null })}
                      style={{ padding: "5px 10px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", background: "white", cursor: "pointer" }}>
                      <option value="">No badge</option>
                      <option value="new_arrival">🆕 New Arrival</option>
                      <option value="best_seller">⭐ Best Seller</option>
                    </select>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--gray)" }}>Priority:</span>
                      <input
                        type="number"
                        defaultValue={product.sortOrder}
                        min={1}
                        onBlur={e => updateProductMeta(product.id, { sortOrder: parseInt(e.target.value) || 999 })}
                        style={{ width: "60px", padding: "5px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }}
                      />
                      <span style={{ fontSize: "11px", color: "var(--gray)" }}>lower = first</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                  <button onClick={() => toggleProduct(product.id, !product.isActive)}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "13px", background: product.isActive ? "#FEE2E2" : "#DCFCE7", color: product.isActive ? "#B91C1C" : "#166534" }}>
                    {product.isActive ? "Shelf it" : "Restore"}
                  </button>
                  <button onClick={() => deleteProduct(product.id, product.name)}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #FCA5A5", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "13px", background: "white", color: "#B91C1C" }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CATEGORIES ── */}
      {tab === "categories" && (
        <div style={{ maxWidth: "560px" }}>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", margin: "0 0 16px" }}>Add Category</h2>
            <input placeholder="Category name (e.g. Desobo Duku)" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={inputStyle} />
            <input placeholder="Description (optional)" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} style={inputStyle} />
            <button onClick={addCategory} className="btn-coral" style={{ width: "100%" }}>Add Category</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {categories.map(c => (
              <div key={c.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><p style={{ fontWeight: 600, margin: 0, fontSize: "15px" }}>{c.name}</p><p style={{ fontSize: "13px", color: "var(--gray)", margin: 0 }}>/{c.slug}</p></div>
                <button onClick={() => deleteCategory(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", fontSize: "14px", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD BUYER ── */}
      {tab === "buyers" && (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", maxWidth: "480px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", margin: "0 0 18px" }}>Create Buyer Account</h2>
          {(["name","email","password","company","country","whatsappNumber"] as const).map(field => (
            <input key={field} type={field === "password" ? "password" : "text"}
              placeholder={field === "whatsappNumber" ? "WhatsApp number (optional)" : field === "company" ? "Company (optional)" : field === "country" ? "Country (optional)" : field.charAt(0).toUpperCase() + field.slice(1)}
              value={buyerForm[field]} onChange={e => setBuyerForm(p => ({ ...p, [field]: e.target.value }))} style={inputStyle} />
          ))}
          {buyerMsg && <p style={{ fontSize: "14px", color: buyerMsg.startsWith("✅") ? "#276749" : "var(--coral)", marginBottom: "10px" }}>{buyerMsg}</p>}
          <button onClick={createBuyer} className="btn-coral" style={{ width: "100%" }}>Create Account</button>
          <p style={{ fontSize: "13px", color: "var(--gray)", marginTop: "12px", textAlign: "center" }}>Share credentials with the buyer over WhatsApp.</p>
        </div>
      )}
    </div>
  )
}