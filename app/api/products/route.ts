import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products, categories, productVariants } from "@/lib/schema"
import { eq, ilike, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categorySlug = searchParams.get("category")
  const search = searchParams.get("search")

  const conditions = [eq(products.isActive, true)]

  if (categorySlug && categorySlug !== "all") {
    const cat = await db.query.categories.findFirst({
      where: eq(categories.slug, categorySlug),
    })
    if (cat) conditions.push(eq(products.categoryId, cat.id))
  }

  if (search) {
    conditions.push(ilike(products.name, `%${search}%`))
  }

  const rows = await db.query.products.findMany({
    where: and(...conditions),
    with: {
      category: true,
      variants: { where: eq(productVariants.isActive, true) },
    },
    orderBy: (p, { asc }) => [asc(p.categoryId), asc(p.name)],
  })

  return NextResponse.json(rows)
}
