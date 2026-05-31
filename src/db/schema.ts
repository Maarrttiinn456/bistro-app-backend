import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  primaryKey,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const mealSlot = pgEnum('meal_slot', ['breakfast', 'lunch', 'dinner', 'snack'])
export const foodLogSource = pgEnum('food_log_source', ['plan', 'manual', 'barcode', 'ai', 'search'])

// ─── Tables (in FK dependency order) ─────────────────────────────────────────

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdBy: uuid('created_by').references((): AnyPgColumn => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // = auth.users.id, no default
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  aiNotes: text('ai_notes'),
  goalKcal: integer('goal_kcal').notNull().default(2000),
  goalProtein: integer('goal_protein').notNull().default(150),
  goalCarbs: integer('goal_carbs').notNull().default(200),
  goalFat: integer('goal_fat').notNull().default(70),
  activeHouseholdId: uuid('active_household_id').references((): AnyPgColumn => households.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const householdMembers = pgTable('household_members', {
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'member'] }).notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.householdId, t.userId] })])

export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  brand: text('brand'),
  barcode: text('barcode').unique(),
  baseUnit: text('base_unit', { enum: ['g', 'ml'] }).notNull().default('g'),
  kcalPer100: numeric('kcal_per_100').notNull(),
  proteinPer100: numeric('protein_per_100').notNull(),
  carbsPer100: numeric('carbs_per_100').notNull(),
  fatPer100: numeric('fat_per_100').notNull(),
  servingGrams: numeric('serving_grams'),
  servingLabel: text('serving_label'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  image: text('image'),
  prepTimeMin: integer('prep_time_min').notNull().default(0),
  portions: integer('portions').notNull().default(1),
  mealTypes: text('meal_types').array().notNull(),
  steps: text('steps').notNull().default(''),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  amountG: numeric('amount_g').notNull(),
  displayAmount: numeric('display_amount'),
  displayUnit: text('display_unit'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const mealPlanSlots = pgTable('meal_plan_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  dayDate: date('day_date').notNull(),
  slot: mealSlot('slot').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  eatenAt: timestamp('eaten_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const mealPlanSlotIngredients = pgTable('meal_plan_slot_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id').notNull().references(() => mealPlanSlots.id, { onDelete: 'cascade' }),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  amountG: numeric('amount_g').notNull(),
  displayAmount: numeric('display_amount'),
  displayUnit: text('display_unit'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const foodLog = pgTable('food_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  eatenAt: timestamp('eaten_at', { withTimezone: true }).notNull(),
  nameSnapshot: text('name_snapshot').notNull(),
  kcalSnapshot: numeric('kcal_snapshot').notNull(),
  proteinSnapshot: numeric('protein_snapshot').notNull(),
  carbsSnapshot: numeric('carbs_snapshot').notNull(),
  fatSnapshot: numeric('fat_snapshot').notNull(),
  quantityG: numeric('quantity_g'),
  portions: numeric('portions'),
  source: foodLogSource('source').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
  planSlotId: uuid('plan_slot_id').references(() => mealPlanSlots.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const shoppingLists = pgTable('shopping_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  dateFrom: date('date_from').notNull(),
  dateTo: date('date_to').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const shoppingListItems = pgTable('shopping_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  shoppingListId: uuid('shopping_list_id').notNull().references(() => shoppingLists.id, { onDelete: 'cascade' }),
  category: text('category').notNull().default(''),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  amount: text('amount').notNull(),
  checked: boolean('checked').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
