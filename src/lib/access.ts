import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { householdMembers, households, profiles } from '../db/schema'

type Database = typeof db

export const getProfileByUserId = async (userId: string, database: Database = db) => {
  const [profile] = await database
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  return profile ?? null
}

export const getActiveHousehold = async (userId: string, database: Database = db) => {
  const profile = await getProfileByUserId(userId, database)

  if (!profile?.activeHouseholdId) {
    return null
  }

  const [membership] = await database
    .select({
      householdId: householdMembers.householdId,
      role: householdMembers.role,
      household: households,
    })
    .from(householdMembers)
    .innerJoin(households, eq(households.id, householdMembers.householdId))
    .where(and(
      eq(householdMembers.userId, userId),
      eq(householdMembers.householdId, profile.activeHouseholdId),
    ))
    .limit(1)

  return membership ?? null
}

export const getActiveHouseholdId = async (userId: string, database: Database = db) => {
  const activeHousehold = await getActiveHousehold(userId, database)

  return activeHousehold?.householdId ?? null
}
