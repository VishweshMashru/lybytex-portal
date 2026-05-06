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
  if (body.badge !== undefined) updates.badge = body.badge === "" ? null : body.badge
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

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
  await db.delete(orderItems).where(eq(orderItems.productId, productId))
  await db.delete(productVariants).where(eq(productVariants.productId, productId))
  await db.delete(products).where(eq(products.id, productId))

  return NextResponse.json({ ok: true })
}