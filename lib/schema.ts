import { pgTable, text, integer, timestamp, boolean, serial, pgEnum } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const userRoleEnum = pgEnum("user_role", ["admin", "buyer"])
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"])
export const unitEnum = pgEnum("unit", ["dozen", "yard", "meter", "piece", "roll", "bundle"])

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("buyer").notNull(),
  whatsappNumber: text("whatsapp_number"),
  company: text("company"),
  country: text("country"),
  isApproved: boolean("is_approved").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  cloudinaryImageId: text("cloudinary_image_id"),
  unit: unitEnum("unit").default("dozen").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(999).notNull(),
  badge: text("badge"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  colorName: text("color_name").notNull(),
  cloudinaryImageId: text("cloudinary_image_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  buyerId: text("buyer_id").references(() => users.id).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  whatsappNotified: boolean("whatsapp_notified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const logActorEnum = pgEnum("log_actor", ["admin", "buyer"])
export const logActionEnum = pgEnum("log_action", ["order_placed", "status_changed", "admin_note", "change_requested", "items_modified"])

export const orderLogs = pgTable("order_logs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  actor: logActorEnum("actor").notNull(),
  actorName: text("actor_name").notNull(),
  action: logActionEnum("action").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  unit: unitEnum("unit").notNull(),
  notes: text("notes"),
})

export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }))
export const productsRelations = relations(products, ({ one, many }) => ({ category: one(categories, { fields: [products.categoryId], references: [categories.id] }), variants: many(productVariants), orderItems: many(orderItems) }))
export const productVariantsRelations = relations(productVariants, ({ one }) => ({ product: one(products, { fields: [productVariants.productId], references: [products.id] }) }))
export const ordersRelations = relations(orders, ({ one, many }) => ({ buyer: one(users, { fields: [orders.buyerId], references: [users.id] }), items: many(orderItems), logs: many(orderLogs) }))
export const orderLogsRelations = relations(orderLogs, ({ one }) => ({ order: one(orders, { fields: [orderLogs.orderId], references: [orders.id] }) }))
export const orderItemsRelations = relations(orderItems, ({ one }) => ({ order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }), product: one(products, { fields: [orderItems.productId], references: [products.id] }), variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }) }))