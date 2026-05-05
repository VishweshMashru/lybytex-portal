import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, email, password, company, country, whatsappNumber } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password required" }, { status: 400 })
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 12)

  const [user] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      name,
      email,
      passwordHash,
      role: "buyer",
      company: company || null,
      country: country || null,
      whatsappNumber: whatsappNumber || null,
      isApproved: true,
    })
    .returning({ id: users.id, name: users.name, email: users.email })

  return NextResponse.json(user)
}

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const buyers = await db.query.users.findMany({
    where: eq(users.role, "buyer"),
    columns: { passwordHash: false },
    orderBy: (u, { asc }) => [asc(u.name)],
  })

  return NextResponse.json(buyers)
}
