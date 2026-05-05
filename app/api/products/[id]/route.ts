import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products, productVariants, orderItems } from "@/lib/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const updates: Record<string, any> = {}
  if (body.isActive !== undefined) updates.isActive = body.isActive
  if (body.cloudinaryImageId !== undefined) updates.cloudinaryImageId = body.cloudinaryImageId

  const [updated] = await db.update(products).set(updates).where(eq(products.id, parseInt(id))).returning()
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const productId = parseInt(id)
  const body = await req.json().catch(() => ({}))
  
  if (body.hard) {
    // Hard delete — only if no orders reference this product
    const referenced = await db.select().from(orderItems).where(eq(orderItems.productId, productId))
    if (referenced.length > 0) {
      return NextResponse.json({ error: "Cannot delete — this product exists in past orders. Shelf it instead." }, { status: 409 })
    }
    await db.delete(productVariants).where(eq(productVariants.productId, productId))
    await db.delete(products).where(eq(products.id, productId))
    return NextResponse.json({ ok: true, deleted: true })
  }

  // Soft delete by default
  const [updated] = await db.update(products).set({ isActive: false }).where(eq(products.id, productId)).returning()
  return NextResponse.json(updated)
}