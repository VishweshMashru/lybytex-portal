import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { categories } from "@/lib/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function GET() {
  const rows = await db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const [cat] = await db.insert(categories).values({ name, slug, description }).returning()
  return NextResponse.json(cat)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await req.json()
  await db.delete(categories).where(eq(categories.id, id))
  return NextResponse.json({ ok: true })
}
