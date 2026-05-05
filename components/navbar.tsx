"use client"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { ShoppingCart, User, LogOut, Settings, Globe } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useState } from "react"

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "sw", label: "Swahili" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
]

function triggerGoogleTranslate(langCode: string) {
  const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
  if (!select) return
  select.value = langCode
  select.dispatchEvent(new Event("change"))
}

export function Navbar() {
  const { totalItems } = useCart()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === "admin"
  const [langOpen, setLangOpen] = useState(false)
  const [activeLang, setActiveLang] = useState("en")

  const selectLang = (code: string) => {
    triggerGoogleTranslate(code)
    setActiveLang(code)
    setLangOpen(false)
  }

  return (
    <>
      <div className="kente-stripe" />
      <nav style={{
        background: "white", borderBottom: "1px solid var(--border)",
        padding: "0 20px", height: "64px", display: "flex", alignItems: "center",
        gap: "12px", position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: "6px", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "var(--coral)", letterSpacing: "1px" }}>LybyTex</span>
          <span style={{ fontSize: "13px", color: "var(--gray)", fontWeight: 400 }}>Catalog</span>
        </Link>

        <div style={{ flex: 1 }} />

        {/* lybytex.com link — hidden on mobile */}
        <a href="https://lybytex.com" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "13px", color: "var(--gray)", textDecoration: "none", flexShrink: 0, display: "var(--desktop-only, none)" }}
          className="desktop-only">
          lybytex.com ↗
        </a>

        {/* Language picker */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setLangOpen(p => !p)}
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "1.5px solid var(--border)", borderRadius: "8px", padding: "7px 10px", cursor: "pointer", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", color: "var(--black)", WebkitTapHighlightColor: "transparent" }}>
            <Globe size={15} />
            <span style={{ display: "none" }} className="desktop-lang">{LANGUAGES.find(l => l.code === activeLang)?.label}</span>
            <span style={{ fontSize: "10px" }}>▾</span>
          </button>
          {langOpen && (
            <>
              <div onClick={() => setLangOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                background: "white", border: "1px solid var(--border)", borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 20, minWidth: "140px", overflow: "hidden",
              }}>
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => selectLang(l.code)}
                    style={{
                      width: "100%", padding: "10px 16px", border: "none", background: activeLang === l.code ? "#FFF0ED" : "transparent",
                      cursor: "pointer", fontSize: "14px", textAlign: "left", fontFamily: "'DM Sans', sans-serif",
                      color: activeLang === l.code ? "var(--coral)" : "var(--black)", fontWeight: activeLang === l.code ? 600 : 400,
                      WebkitTapHighlightColor: "transparent",
                    }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cart */}
        <Link href="/cart" style={{ position: "relative", display: "flex", alignItems: "center", color: "var(--black)", textDecoration: "none", padding: "8px", flexShrink: 0 }}>
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span style={{ position: "absolute", top: "0px", right: "0px", background: "var(--coral)", color: "white", width: "20px", height: "20px", borderRadius: "50%", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </Link>

        {/* Auth */}
        {session ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            {isAdmin && (
              <Link href="/admin" style={{ color: "var(--gray)", display: "flex", alignItems: "center", padding: "8px" }}>
                <Settings size={22} />
              </Link>
            )}
            <Link href="/orders" style={{ display: "flex", alignItems: "center", gap: "5px", textDecoration: "none", fontSize: "15px", color: "var(--black)", padding: "8px" }}>
              <User size={20} />
              <span style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.user?.name?.split(" ")[0]}
              </span>
            </Link>
            <button onClick={() => signOut()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray)", display: "flex", alignItems: "center", padding: "8px" }}>
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn-coral" style={{ padding: "10px 18px", fontSize: "14px", textDecoration: "none", borderRadius: "8px", flexShrink: 0 }}>
            Login
          </Link>
        )}
      </nav>

      {/* Unregistered CTA banner */}
      {!session && (
        <div style={{ background: "var(--black)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap", textAlign: "center" }}>
          <p style={{ color: "#A09880", fontSize: "14px", margin: 0 }}>New to LybyTex? We'd love to work with you.</p>
          <a href="https://wa.me/919537517519?text=Hi%2C%20I%27d%20like%20to%20register%20as%20a%20buyer%20on%20the%20LybyTex%20catalog"
            target="_blank" rel="noopener noreferrer"
            style={{ background: "#25D366", color: "white", padding: "7px 16px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
            Get in touch ↗
          </a>
        </div>
      )}
    </>
  )
}