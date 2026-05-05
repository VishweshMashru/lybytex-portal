"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") ?? "/cart"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push(callbackUrl)
    } else {
      setError("Invalid email or password.")
    }
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px 36px" }}>
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", color: "var(--coral)", margin: "0 0 4px", letterSpacing: "1px" }}>Sign In</h1>
            <p style={{ color: "var(--gray)", fontSize: "14px", margin: 0 }}>Access your LybyTex order account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--black)", display: "block", marginBottom: "6px" }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--black)", display: "block", marginBottom: "6px" }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }}
              />
            </div>
            {error && <p style={{ color: "var(--coral)", fontSize: "13px", margin: 0 }}>{error}</p>}
            <button type="submit" className="btn-coral" disabled={loading} style={{ width: "100%", padding: "12px", marginTop: "4px", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--gray)", margin: "0 0 10px" }}>Don't have an account?</p>
            <a href="https://wa.me/919537517519?text=Hi%20Vishwesh%2C%20I%20need%20access%20to%20the%20LybyTex%20catalog"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "13px", color: "var(--coral)", fontWeight: 500, textDecoration: "none" }}>
              Contact us on WhatsApp to get access ↗
            </a>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--gray)" }}>
          <Link href="/" style={{ color: "var(--coral)", textDecoration: "none" }}>← Back to catalog</Link>
        </p>
      </div>
    </div>
  )
}
