import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, orderItems, orderLogs, users } from "@/lib/schema"
import { auth } from "@/lib/auth"
import { eq, desc } from "drizzle-orm"
import { generateOrderId } from "@/lib/utils"
import { sendOrderNotification } from "@/lib/notify"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdmin = (session.user as any).role === "admin"

  const rows = await db.query.orders.findMany({
    where: isAdmin ? undefined : eq(orders.buyerId, session.user!.id!),
    with: {
      buyer: { columns: { name: true, company: true, email: true, whatsappNumber: true } },
      items: { with: { product: { columns: { name: true } }, variant: { columns: { colorName: true } } } },
      logs: { orderBy: (l, { asc }) => [asc(l.createdAt)] },
    },
    orderBy: [desc(orders.createdAt)],
  })

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { items, notes } = await req.json()
  if (!items?.length) return NextResponse.json({ error: "No items in order" }, { status: 400 })

  const orderId = generateOrderId()

  const [order] = await db
    .insert(orders)
    .values({ orderId, buyerId: session.user!.id!, notes, status: "pending" })
    .returning()

  await db.insert(orderItems).values(
    items.map((item: any) => ({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes ?? null,
    }))
  )

  await db.insert(orderLogs).values({
    orderId: order.id,
    actor: "buyer",
    actorName: session.user!.name ?? "Buyer",
    action: "order_placed",
    message: `Order placed with ${items.length} item${items.length !== 1 ? "s" : ""}: ${items.map((i: any) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} × ${i.quantity} ${i.unit}`).join(", ")}`,
  })

  const buyer = await db.query.users.findFirst({ where: eq(users.id, session.user!.id!) })

  try {
    await sendOrderNotification({
      orderId,
      buyerName: buyer?.name ?? session.user!.name ?? "Unknown",
      buyerCompany: buyer?.company,
      buyerWhatsapp: buyer?.whatsappNumber,
      buyerEmail: buyer?.email,
      items: items.map((i: any) => ({ productName: i.productName, variantName: i.variantName, quantity: i.quantity, unit: i.unit })),
    })
  } catch (e) {
    console.error("Email notification failed:", e)
  }

  return NextResponse.json({ orderId, id: order.id })
}