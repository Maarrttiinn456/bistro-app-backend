export type MacroTotals = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type MacroIngredient = {
  kcalPer100: string | number
  proteinPer100: string | number
  carbsPer100: string | number
  fatPer100: string | number
}

export const emptyMacros: MacroTotals = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}

export const toNumber = (value: string | number | null) => {
  if (value === null) {
    return null
  }

  return Number(value)
}

export const addMacroTotals = (
  total: MacroTotals,
  amountG: string | number,
  ingredient?: MacroIngredient,
) => {
  if (!ingredient) {
    return total
  }

  const amountRatio = Number(amountG) / 100

  return {
    kcal: total.kcal + Number(ingredient.kcalPer100) * amountRatio,
    protein: total.protein + Number(ingredient.proteinPer100) * amountRatio,
    carbs: total.carbs + Number(ingredient.carbsPer100) * amountRatio,
    fat: total.fat + Number(ingredient.fatPer100) * amountRatio,
  }
}
