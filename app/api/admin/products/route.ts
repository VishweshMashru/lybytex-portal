import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products, productVariants } from "@/lib/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const rows = await db.query.products.findMany({
    with: { category: true, variants: true },
    orderBy: (p, { asc }) => [asc(p.categoryId), asc(p.name)],
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { categoryId, name, description, cloudinaryImageId, unit, variants } = await req.json()

  if (!categoryId || !name) {
    return NextResponse.json({ error: "Category and name required" }, { status: 400 })
  }

  const [product] = await db
    .insert(products)
    .values({ categoryId, name, description, cloudinaryImageId, unit: unit ?? "dozen" })
    .returning()

  if (variants?.length) {
    await db.insert(productVariants).values(
      variants.map((v: any) => ({
        productId: product.id,
        colorName: v.colorName,
        cloudinaryImageId: v.cloudinaryImageId ?? null,
      }))
    )
  }

  const full = await db.query.products.findFirst({
    where: eq(products.id, product.id),
    with: { category: true, variants: true },
  })

  return NextResponse.json(full)
}