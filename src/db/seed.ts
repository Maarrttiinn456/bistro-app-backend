import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, eq, inArray } from 'drizzle-orm'
import postgres from 'postgres'
import {
  householdMembers,
  households,
  ingredients,
  profiles,
  recipeIngredients,
  recipes,
} from './schema'
import * as schema from './schema'

const DEMO_USER_ADAM_ID = '11111111-1111-4111-8111-111111111111'
const DEMO_USER_EVA_ID = '22222222-2222-4222-8222-222222222222'
const DEMO_HOUSEHOLD_ID = '33333333-3333-4333-8333-333333333333'

const ingredientIds = {
  oats: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  greekYogurt: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  banana: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  blueberries: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
  chickenBreast: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  rice: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  broccoli: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
  oliveOil: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
  eggs: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
  wholegrainBread: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
  avocado: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
  salmon: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12',
  potatoes: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13',
  cottageCheese: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14',
  tomato: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa15',
}

const recipeIds = {
  yogurtBowl: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  chickenRice: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  avocadoToast: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  salmonPotatoes: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
}

const loadEnvFile = () => {
  const envPath = resolve(process.cwd(), '.env')

  if (!existsSync(envPath)) {
    return
  }

  const envFile = readFileSync(envPath, 'utf8')

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim()

    if (!key || process.env[key]) {
      continue
    }

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

const seed = async () => {
  loadEnvFile()

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Add it to .env or export it before running pnpm db:seed.')
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false })
  const db = drizzle(sql, { schema })

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(profiles)
        .values([
          {
            id: DEMO_USER_ADAM_ID,
            name: 'Adam Demo',
            email: 'adam.demo@example.com',
            goalKcal: 2400,
            goalProtein: 160,
            goalCarbs: 260,
            goalFat: 75,
          },
          {
            id: DEMO_USER_EVA_ID,
            name: 'Eva Demo',
            email: 'eva.demo@example.com',
            goalKcal: 1900,
            goalProtein: 120,
            goalCarbs: 190,
            goalFat: 60,
          },
        ])
        .onConflictDoNothing()

      await tx
        .update(profiles)
        .set({
          name: 'Adam Demo',
          email: 'adam.demo@example.com',
          goalKcal: 2400,
          goalProtein: 160,
          goalCarbs: 260,
          goalFat: 75,
        })
        .where(eq(profiles.id, DEMO_USER_ADAM_ID))

      await tx
        .update(profiles)
        .set({
          name: 'Eva Demo',
          email: 'eva.demo@example.com',
          goalKcal: 1900,
          goalProtein: 120,
          goalCarbs: 190,
          goalFat: 60,
        })
        .where(eq(profiles.id, DEMO_USER_EVA_ID))

      await tx
        .insert(households)
        .values({
          id: DEMO_HOUSEHOLD_ID,
          name: 'Demo household',
          createdBy: DEMO_USER_ADAM_ID,
        })
        .onConflictDoUpdate({
          target: households.id,
          set: {
            name: 'Demo household',
            createdBy: DEMO_USER_ADAM_ID,
          },
        })

      await tx
        .update(profiles)
        .set({ activeHouseholdId: DEMO_HOUSEHOLD_ID })
        .where(inArray(profiles.id, [DEMO_USER_ADAM_ID, DEMO_USER_EVA_ID]))

      await tx
        .insert(householdMembers)
        .values([
          {
            householdId: DEMO_HOUSEHOLD_ID,
            userId: DEMO_USER_ADAM_ID,
            role: 'owner',
          },
          {
            householdId: DEMO_HOUSEHOLD_ID,
            userId: DEMO_USER_EVA_ID,
            role: 'member',
          },
        ])
        .onConflictDoNothing()

      await tx
        .update(householdMembers)
        .set({ role: 'owner' })
        .where(and(
          eq(householdMembers.householdId, DEMO_HOUSEHOLD_ID),
          eq(householdMembers.userId, DEMO_USER_ADAM_ID),
        ))

      await tx
        .update(householdMembers)
        .set({ role: 'member' })
        .where(and(
          eq(householdMembers.householdId, DEMO_HOUSEHOLD_ID),
          eq(householdMembers.userId, DEMO_USER_EVA_ID),
        ))

      await tx
        .insert(ingredients)
        .values([
          {
            id: ingredientIds.oats,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Oats',
            baseUnit: 'g',
            kcalPer100: '389',
            proteinPer100: '16.9',
            carbsPer100: '66.3',
            fatPer100: '6.9',
          },
          {
            id: ingredientIds.greekYogurt,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Greek yogurt',
            baseUnit: 'g',
            kcalPer100: '59',
            proteinPer100: '10.3',
            carbsPer100: '3.6',
            fatPer100: '0.4',
          },
          {
            id: ingredientIds.banana,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Banana',
            baseUnit: 'g',
            kcalPer100: '89',
            proteinPer100: '1.1',
            carbsPer100: '22.8',
            fatPer100: '0.3',
            servingGrams: '120',
            servingLabel: '1 banana',
          },
          {
            id: ingredientIds.blueberries,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Blueberries',
            baseUnit: 'g',
            kcalPer100: '57',
            proteinPer100: '0.7',
            carbsPer100: '14.5',
            fatPer100: '0.3',
          },
          {
            id: ingredientIds.chickenBreast,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Chicken breast',
            baseUnit: 'g',
            kcalPer100: '120',
            proteinPer100: '22.5',
            carbsPer100: '0',
            fatPer100: '2.6',
          },
          {
            id: ingredientIds.rice,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Rice',
            baseUnit: 'g',
            kcalPer100: '360',
            proteinPer100: '7',
            carbsPer100: '79',
            fatPer100: '0.6',
          },
          {
            id: ingredientIds.broccoli,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Broccoli',
            baseUnit: 'g',
            kcalPer100: '34',
            proteinPer100: '2.8',
            carbsPer100: '6.6',
            fatPer100: '0.4',
          },
          {
            id: ingredientIds.oliveOil,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Olive oil',
            baseUnit: 'ml',
            kcalPer100: '884',
            proteinPer100: '0',
            carbsPer100: '0',
            fatPer100: '100',
          },
          {
            id: ingredientIds.eggs,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Eggs',
            baseUnit: 'g',
            kcalPer100: '143',
            proteinPer100: '12.6',
            carbsPer100: '0.7',
            fatPer100: '9.5',
            servingGrams: '55',
            servingLabel: '1 egg',
          },
          {
            id: ingredientIds.wholegrainBread,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Wholegrain bread',
            baseUnit: 'g',
            kcalPer100: '247',
            proteinPer100: '13',
            carbsPer100: '41',
            fatPer100: '4.2',
          },
          {
            id: ingredientIds.avocado,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Avocado',
            baseUnit: 'g',
            kcalPer100: '160',
            proteinPer100: '2',
            carbsPer100: '8.5',
            fatPer100: '14.7',
          },
          {
            id: ingredientIds.salmon,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Salmon fillet',
            baseUnit: 'g',
            kcalPer100: '208',
            proteinPer100: '20',
            carbsPer100: '0',
            fatPer100: '13',
          },
          {
            id: ingredientIds.potatoes,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Potatoes',
            baseUnit: 'g',
            kcalPer100: '77',
            proteinPer100: '2',
            carbsPer100: '17',
            fatPer100: '0.1',
          },
          {
            id: ingredientIds.cottageCheese,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Cottage cheese',
            baseUnit: 'g',
            kcalPer100: '98',
            proteinPer100: '11.1',
            carbsPer100: '3.4',
            fatPer100: '4.3',
          },
          {
            id: ingredientIds.tomato,
            householdId: DEMO_HOUSEHOLD_ID,
            name: 'Tomato',
            baseUnit: 'g',
            kcalPer100: '18',
            proteinPer100: '0.9',
            carbsPer100: '3.9',
            fatPer100: '0.2',
          },
        ])
        .onConflictDoNothing()

      await tx
        .insert(recipes)
        .values([
          {
            id: recipeIds.yogurtBowl,
            householdId: DEMO_HOUSEHOLD_ID,
            createdBy: DEMO_USER_ADAM_ID,
            name: 'Yogurt breakfast bowl',
            image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38',
            prepTimeMin: 10,
            portions: 2,
            mealTypes: ['breakfast', 'snack'],
            steps: 'Mix yogurt with oats. Top with sliced banana and blueberries.',
          },
          {
            id: recipeIds.chickenRice,
            householdId: DEMO_HOUSEHOLD_ID,
            createdBy: DEMO_USER_ADAM_ID,
            name: 'Chicken rice bowl',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
            prepTimeMin: 30,
            portions: 2,
            mealTypes: ['lunch', 'dinner'],
            steps: 'Cook rice. Grill chicken breast. Steam broccoli and finish with olive oil.',
          },
          {
            id: recipeIds.avocadoToast,
            householdId: DEMO_HOUSEHOLD_ID,
            createdBy: DEMO_USER_EVA_ID,
            name: 'Avocado egg toast',
            image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8',
            prepTimeMin: 15,
            portions: 2,
            mealTypes: ['breakfast', 'snack'],
            steps: 'Toast bread. Mash avocado with tomato. Serve with boiled eggs.',
          },
          {
            id: recipeIds.salmonPotatoes,
            householdId: DEMO_HOUSEHOLD_ID,
            createdBy: DEMO_USER_EVA_ID,
            name: 'Salmon with potatoes',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
            prepTimeMin: 35,
            portions: 2,
            mealTypes: ['lunch', 'dinner'],
            steps: 'Bake salmon and potatoes. Serve with broccoli and cottage cheese dip.',
          },
        ])
        .onConflictDoNothing()

      await tx
        .insert(recipeIngredients)
        .values([
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
            recipeId: recipeIds.yogurtBowl,
            ingredientId: ingredientIds.greekYogurt,
            displayName: 'Greek yogurt',
            amountG: '300',
            displayAmount: '300',
            displayUnit: 'g',
            position: 0,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc02',
            recipeId: recipeIds.yogurtBowl,
            ingredientId: ingredientIds.oats,
            displayName: 'Oats',
            amountG: '80',
            displayAmount: '80',
            displayUnit: 'g',
            position: 1,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc03',
            recipeId: recipeIds.yogurtBowl,
            ingredientId: ingredientIds.banana,
            displayName: 'Banana',
            amountG: '120',
            displayAmount: '1',
            displayUnit: 'pc',
            position: 2,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc04',
            recipeId: recipeIds.yogurtBowl,
            ingredientId: ingredientIds.blueberries,
            displayName: 'Blueberries',
            amountG: '80',
            displayAmount: '80',
            displayUnit: 'g',
            position: 3,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc05',
            recipeId: recipeIds.chickenRice,
            ingredientId: ingredientIds.chickenBreast,
            displayName: 'Chicken breast',
            amountG: '320',
            displayAmount: '320',
            displayUnit: 'g',
            position: 0,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc06',
            recipeId: recipeIds.chickenRice,
            ingredientId: ingredientIds.rice,
            displayName: 'Rice',
            amountG: '160',
            displayAmount: '160',
            displayUnit: 'g',
            position: 1,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc07',
            recipeId: recipeIds.chickenRice,
            ingredientId: ingredientIds.broccoli,
            displayName: 'Broccoli',
            amountG: '250',
            displayAmount: '250',
            displayUnit: 'g',
            position: 2,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc08',
            recipeId: recipeIds.chickenRice,
            ingredientId: ingredientIds.oliveOil,
            displayName: 'Olive oil',
            amountG: '15',
            displayAmount: '1',
            displayUnit: 'tbsp',
            position: 3,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc09',
            recipeId: recipeIds.avocadoToast,
            ingredientId: ingredientIds.wholegrainBread,
            displayName: 'Wholegrain bread',
            amountG: '120',
            displayAmount: '4',
            displayUnit: 'slices',
            position: 0,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc10',
            recipeId: recipeIds.avocadoToast,
            ingredientId: ingredientIds.avocado,
            displayName: 'Avocado',
            amountG: '160',
            displayAmount: '1',
            displayUnit: 'pc',
            position: 1,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc11',
            recipeId: recipeIds.avocadoToast,
            ingredientId: ingredientIds.eggs,
            displayName: 'Eggs',
            amountG: '110',
            displayAmount: '2',
            displayUnit: 'pcs',
            position: 2,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc12',
            recipeId: recipeIds.avocadoToast,
            ingredientId: ingredientIds.tomato,
            displayName: 'Tomato',
            amountG: '120',
            displayAmount: '1',
            displayUnit: 'pc',
            position: 3,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc13',
            recipeId: recipeIds.salmonPotatoes,
            ingredientId: ingredientIds.salmon,
            displayName: 'Salmon fillet',
            amountG: '300',
            displayAmount: '300',
            displayUnit: 'g',
            position: 0,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc14',
            recipeId: recipeIds.salmonPotatoes,
            ingredientId: ingredientIds.potatoes,
            displayName: 'Potatoes',
            amountG: '500',
            displayAmount: '500',
            displayUnit: 'g',
            position: 1,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc15',
            recipeId: recipeIds.salmonPotatoes,
            ingredientId: ingredientIds.broccoli,
            displayName: 'Broccoli',
            amountG: '250',
            displayAmount: '250',
            displayUnit: 'g',
            position: 2,
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc16',
            recipeId: recipeIds.salmonPotatoes,
            ingredientId: ingredientIds.cottageCheese,
            displayName: 'Cottage cheese',
            amountG: '150',
            displayAmount: '150',
            displayUnit: 'g',
            position: 3,
          },
        ])
        .onConflictDoNothing()
    })
  } finally {
    await sql.end()
  }
}

seed()
  .then(() => {
    console.log('Demo seed completed.')
  })
  .catch((error: unknown) => {
    console.error('Demo seed failed.')
    console.error(error)
    process.exit(1)
  })
