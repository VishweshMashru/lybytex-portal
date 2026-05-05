import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, orderItems, orderLogs } from "@/lib/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdmin = (session.user as any).role === "admin"
  const body = await req.json()
  const orderId = parseInt(id)

  if (body.status !== undefined && isAdmin) {
    const [prev] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId))
    await db.update(orders).set({ status: body.status, updatedAt: new Date() }).where(eq(orders.id, orderId))
    await db.insert(orderLogs).values({ orderId, actor: "admin", actorName: session.user!.name ?? "Admin", action: "status_changed", message: `Status changed from "${prev.status}" to "${body.status}"` })
  }

  if (body.adminNotes !== undefined && isAdmin) {
    await db.update(orders).set({ adminNotes: body.adminNotes, updatedAt: new Date() }).where(eq(orders.id, orderId))
    await db.insert(orderLogs).values({ orderId, actor: "admin", actorName: session.user!.name ?? "Admin", action: "admin_note", message: body.adminNotes })
  }

  if (body.changeRequest !== undefined && !isAdmin) {
    await db.insert(orderLogs).values({ orderId, actor: "buyer", actorName: session.user!.name ?? "Buyer", action: "change_requested", message: body.changeRequest })
  }

  if (body.items !== undefined && isAdmin) {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId))
    await db.insert(orderItems).values(
      body.items.map((item: any) => ({ orderId, productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity, unit: item.unit, notes: item.notes ?? null }))
    )
    await db.update(orders).set({ updatedAt: new Date() }).where(eq(orders.id, orderId))
    await db.insert(orderLogs).values({ orderId, actor: "admin", actorName: session.user!.name ?? "Admin", action: "items_modified", message: `Order items updated: ${body.items.map((i: any) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} × ${i.quantity} ${i.unit}`).join(", ")}` })
  }

  const updated = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      buyer: { columns: { name: true, company: true, email: true, whatsappNumber: true } },
      items: { with: { product: { columns: { name: true } }, variant: { columns: { colorName: true } } } },
      logs: { orderBy: (l, { asc }) => [asc(l.createdAt)] },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orderId = parseInt(id)
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId))
  await db.delete(orderLogs).where(eq(orderLogs.orderId, orderId))
  await db.delete(orders).where(eq(orders.id, orderId))
  return NextResponse.json({ ok: true })
}