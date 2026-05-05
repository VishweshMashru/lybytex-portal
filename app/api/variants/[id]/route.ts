import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { productVariants } from "@/lib/schema"
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

  const [updated] = await db.update(productVariants).set(updates).where(eq(productVariants.id, parseInt(id))).returning()
  return NextResponse.json(updated)
}