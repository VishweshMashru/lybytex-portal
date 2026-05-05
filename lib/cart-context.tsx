"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface CartItem {
  productId: number
  variantId?: number | null
  productName: string
  variantName?: string | null
  categoryName: string
  imageUrl?: string | null
  quantity: number
  unit: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: number, variantId?: number | null) => void
  updateQuantity: (productId: number, variantId: number | null | undefined, quantity: number) => void
  clearCart: () => void
  totalItems: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("lybytex_cart")
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem("lybytex_cart", JSON.stringify(items))
  }, [items])

  const key = (productId: number, variantId?: number | null) =>
    `${productId}-${variantId ?? "none"}`

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => key(i.productId, i.variantId) === key(item.productId, item.variantId)
      )
      if (existing) {
        return prev.map((i) =>
          key(i.productId, i.variantId) === key(item.productId, item.variantId)
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }

  const removeItem = (productId: number, variantId?: number | null) => {
    setItems((prev) =>
      prev.filter((i) => key(i.productId, i.variantId) !== key(productId, variantId))
    )
  }

  const updateQuantity = (productId: number, variantId: number | null | undefined, quantity: number) => {
    if (quantity <= 0) { removeItem(productId, variantId); return }
    setItems((prev) =>
      prev.map((i) =>
        key(i.productId, i.variantId) === key(productId, variantId) ? { ...i, quantity } : i
      )
    )
  }

  const clearCart = () => setItems([])
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
