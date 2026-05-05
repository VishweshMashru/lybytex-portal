import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "../lib/schema"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

async function seed() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  const email = process.env.ADMIN_EMAIL || "admin@lybytex.com"
  const password = process.env.ADMIN_PASSWORD || "changeme123"
  const name = process.env.ADMIN_NAME || "Vish"

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(schema.users).values({
    id: randomUUID(),
    name,
    email,
    passwordHash,
    role: "admin",
    isApproved: true,
  }).onConflictDoNothing()

  console.log(`✅ Admin created: ${email} / ${password}`)
  process.exit(0)
}

seed().catch(console.error)
