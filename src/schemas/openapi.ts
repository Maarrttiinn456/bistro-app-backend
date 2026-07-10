const componentRef = (name: string) => ({ $ref: `${name}#` }) as const

const nullableRef = (name: string) => ({
  anyOf: [
    componentRef(name),
    { type: 'null' },
  ],
}) as const

export const schemaRef = componentRef

export const mealSlotSchema = {
  type: 'string',
  enum: ['breakfast', 'lunch', 'dinner', 'snack'],
} as const

export const foodLogSourceSchema = {
  type: 'string',
  enum: ['plan', 'manual', 'barcode', 'ai', 'search'],
} as const

export const macroSchema = {
  type: 'object',
  required: ['kcal', 'protein', 'carbs', 'fat'],
  properties: {
    kcal: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
  },
} as const

export const goalsSchema = {
  ...macroSchema,
} as const

export const progressSchema = {
  ...macroSchema,
} as const

export const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
} as const

export const notImplementedResponseSchema = {
  description: 'Endpoint is documented but not implemented yet',
  ...errorResponseSchema,
} as const

export const openApiSpecSchema = {
  type: 'object',
  additionalProperties: true,
} as const

export const userSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: ['string', 'null'], format: 'email' },
  },
} as const

export const sessionSchema = {
  type: 'object',
  required: ['accessToken', 'refreshToken', 'expiresIn', 'tokenType'],
  properties: {
    accessToken: { type: ['string', 'null'] },
    refreshToken: { type: ['string', 'null'] },
    expiresIn: { type: ['number', 'null'] },
    tokenType: { type: ['string', 'null'] },
  },
} as const

export const profileSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'email',
    'goalKcal',
    'goalProtein',
    'goalCarbs',
    'goalFat',
    'activeHouseholdId',
    'createdAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    avatarUrl: { type: ['string', 'null'] },
    aiNotes: { type: ['string', 'null'] },
    goalKcal: { type: 'number' },
    goalProtein: { type: 'number' },
    goalCarbs: { type: 'number' },
    goalFat: { type: 'number' },
    activeHouseholdId: { type: ['string', 'null'], format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

export const householdSchema = {
  type: 'object',
  required: ['id', 'name', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    createdBy: { type: ['string', 'null'], format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

export const householdMembershipSchema = {
  type: 'object',
  required: ['householdId', 'userId', 'role', 'joinedAt', 'household'],
  properties: {
    householdId: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    role: { type: 'string', enum: ['owner', 'member'] },
    joinedAt: { type: 'string', format: 'date-time' },
    household: componentRef('Household'),
  },
} as const

export const authContextSchema = {
  type: 'object',
  required: ['user', 'session', 'profile', 'activeHousehold', 'households'],
  properties: {
    user: componentRef('User'),
    session: componentRef('Session'),
    profile: componentRef('Profile'),
    activeHousehold: nullableRef('Household'),
    households: {
      type: 'array',
      items: componentRef('HouseholdMembership'),
    },
  },
} as const

export const signUpBodySchema = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    name: { type: 'string', minLength: 1 },
  },
} as const

export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 },
  },
} as const

export const refreshBodySchema = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: { type: 'string', minLength: 1 },
  },
} as const

export const logoutResponseSchema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean' },
  },
} as const

export const profileResponseSchema = {
  type: 'object',
  required: ['profile'],
  properties: {
    profile: componentRef('Profile'),
  },
} as const

export const updateProfileBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    avatarUrl: { type: ['string', 'null'] },
    aiNotes: { type: ['string', 'null'] },
    goalKcal: { type: 'number', minimum: 0 },
    goalProtein: { type: 'number', minimum: 0 },
    goalCarbs: { type: 'number', minimum: 0 },
    goalFat: { type: 'number', minimum: 0 },
  },
} as const

export const ingredientSchema = {
  type: 'object',
  required: [
    'id',
    'householdId',
    'name',
    'brand',
    'barcode',
    'baseUnit',
    'kcalPer100',
    'proteinPer100',
    'carbsPer100',
    'fatPer100',
    'servingGrams',
    'servingLabel',
    'archivedAt',
    'createdAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    householdId: { type: ['string', 'null'], format: 'uuid' },
    name: { type: 'string' },
    brand: { type: ['string', 'null'] },
    barcode: { type: ['string', 'null'] },
    baseUnit: { type: 'string', enum: ['g', 'ml'] },
    kcalPer100: { type: 'number' },
    proteinPer100: { type: 'number' },
    carbsPer100: { type: 'number' },
    fatPer100: { type: 'number' },
    servingGrams: { type: ['number', 'null'] },
    servingLabel: { type: ['string', 'null'] },
    archivedAt: { type: ['string', 'null'], format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

export const createIngredientBodySchema = {
  type: 'object',
  required: ['name', 'kcalPer100', 'proteinPer100', 'carbsPer100', 'fatPer100'],
  properties: {
    name: { type: 'string', minLength: 1 },
    brand: { type: ['string', 'null'] },
    barcode: { type: ['string', 'null'] },
    baseUnit: { type: 'string', enum: ['g', 'ml'] },
    kcalPer100: { type: 'number', minimum: 0 },
    proteinPer100: { type: 'number', minimum: 0 },
    carbsPer100: { type: 'number', minimum: 0 },
    fatPer100: { type: 'number', minimum: 0 },
    servingGrams: { type: ['number', 'null'], minimum: 0 },
    servingLabel: { type: ['string', 'null'] },
  },
} as const

export const updateIngredientBodySchema = {
  ...createIngredientBodySchema,
  required: [],
} as const

export const resolveIngredientBarcodeBodySchema = {
  type: 'object',
  required: ['barcode'],
  properties: {
    barcode: { type: 'string', minLength: 1 },
  },
} as const

export const getIngredientsResponseSchema = {
  type: 'object',
  required: ['ingredients'],
  properties: {
    ingredients: {
      type: 'array',
      items: componentRef('Ingredient'),
    },
  },
} as const

export const ingredientResponseSchema = {
  type: 'object',
  required: ['ingredient'],
  properties: {
    ingredient: componentRef('Ingredient'),
  },
} as const

export const resolveIngredientBarcodeResponseSchema = {
  type: 'object',
  required: ['ingredient', 'source', 'created'],
  properties: {
    ingredient: componentRef('Ingredient'),
    source: { type: 'string', enum: ['local', 'open_food_facts'] },
    created: { type: 'boolean' },
  },
} as const

export const foodLogSchema = {
  type: 'object',
  required: [
    'id',
    'userId',
    'eatenAt',
    'nameSnapshot',
    'kcalSnapshot',
    'proteinSnapshot',
    'carbsSnapshot',
    'fatSnapshot',
    'quantityG',
    'portions',
    'source',
    'recipeId',
    'ingredientId',
    'planSlotId',
    'createdAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    eatenAt: { type: 'string', format: 'date-time' },
    nameSnapshot: { type: 'string' },
    kcalSnapshot: { type: 'number' },
    proteinSnapshot: { type: 'number' },
    carbsSnapshot: { type: 'number' },
    fatSnapshot: { type: 'number' },
    quantityG: { type: ['number', 'null'] },
    portions: { type: ['number', 'null'] },
    source: componentRef('FoodLogSource'),
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    planSlotId: { type: ['string', 'null'], format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

export const dailyTotalSchema = {
  type: 'object',
  required: ['date', 'totals', 'count'],
  properties: {
    date: { type: 'string', format: 'date' },
    totals: componentRef('Macro'),
    count: { type: 'number' },
  },
} as const

export const createFoodLogBodySchema = {
  type: 'object',
  required: ['eatenAt', 'nameSnapshot', 'kcalSnapshot', 'proteinSnapshot', 'carbsSnapshot', 'fatSnapshot', 'source'],
  properties: {
    eatenAt: { type: 'string', format: 'date-time' },
    nameSnapshot: { type: 'string', minLength: 1 },
    kcalSnapshot: { type: 'number', minimum: 0 },
    proteinSnapshot: { type: 'number', minimum: 0 },
    carbsSnapshot: { type: 'number', minimum: 0 },
    fatSnapshot: { type: 'number', minimum: 0 },
    quantityG: { type: ['number', 'null'], minimum: 0 },
    portions: { type: ['number', 'null'], minimum: 0 },
    source: foodLogSourceSchema,
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    planSlotId: { type: ['string', 'null'], format: 'uuid' },
  },
} as const

export const updateFoodLogBodySchema = {
  ...createFoodLogBodySchema,
  required: [],
} as const

const createFoodLogBodyOpenApiSchema = {
  ...createFoodLogBodySchema,
  properties: {
    ...createFoodLogBodySchema.properties,
    source: componentRef('FoodLogSource'),
  },
} as const

const updateFoodLogBodyOpenApiSchema = {
  ...createFoodLogBodyOpenApiSchema,
  required: [],
} as const

export const foodLogResponseSchema = {
  type: 'object',
  required: ['log'],
  properties: {
    log: componentRef('FoodLog'),
  },
} as const

export const getFoodLogResponseSchema = {
  type: 'object',
  required: ['logs', 'dailyTotals', 'goals'],
  properties: {
    logs: {
      type: 'array',
      items: componentRef('FoodLog'),
    },
    dailyTotals: {
      type: 'array',
      items: componentRef('DailyTotal'),
    },
    goals: componentRef('Goals'),
  },
} as const

export const updateFoodLogResponseSchema = {
  type: 'object',
  required: ['log', 'dailyTotal'],
  properties: {
    log: componentRef('FoodLog'),
    dailyTotal: componentRef('DailyTotal'),
  },
} as const

export const deleteFoodLogResponseSchema = {
  type: 'object',
  required: ['success', 'dailyTotal'],
  properties: {
    success: { type: 'boolean' },
    dailyTotal: componentRef('DailyTotal'),
  },
} as const

export const deleteMealPlanSlotResponseSchema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean' },
  },
} as const

export const mealPlanSlotIngredientSchema = {
  type: 'object',
  required: ['id', 'ingredientId', 'displayName', 'amountG', 'displayAmount', 'displayUnit', 'position', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    displayName: { type: 'string' },
    amountG: { type: 'number' },
    displayAmount: { type: ['number', 'null'] },
    displayUnit: { type: ['string', 'null'] },
    position: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

export const mealPlanSlotIngredientInputSchema = {
  type: 'object',
  required: ['displayName', 'amountG'],
  properties: {
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    displayName: { type: 'string', minLength: 1 },
    amountG: { type: 'number', minimum: 0 },
    displayAmount: { type: ['number', 'null'] },
    displayUnit: { type: ['string', 'null'] },
    position: { type: 'number', minimum: 0 },
  },
} as const

export const mealPlanSlotRecipeSchema = {
  type: 'object',
  required: ['id', 'name', 'image', 'portions', 'mealTypes'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    image: { type: ['string', 'null'] },
    portions: { type: 'number' },
    mealTypes: {
      type: 'array',
      items: componentRef('MealSlot'),
    },
  },
} as const

export const mealPlanSlotSchema = {
  type: 'object',
  required: [
    'id',
    'userId',
    'dayDate',
    'slot',
    'recipeId',
    'eatenAt',
    'createdAt',
    'recipe',
    'ingredients',
    'macrosTotal',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    dayDate: { type: 'string', format: 'date' },
    slot: componentRef('MealSlot'),
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    eatenAt: { type: ['string', 'null'], format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    recipe: nullableRef('MealPlanSlotRecipe'),
    ingredients: {
      type: 'array',
      items: componentRef('MealPlanSlotIngredient'),
    },
    macrosTotal: componentRef('Macro'),
  },
} as const

export const mealPlanDaySchema = {
  type: 'object',
  required: ['date', 'slots'],
  properties: {
    date: { type: 'string', format: 'date' },
    slots: {
      type: 'array',
      items: componentRef('MealPlanSlot'),
    },
  },
} as const

export const getMealPlanResponseSchema = {
  type: 'object',
  required: ['days'],
  properties: {
    days: {
      type: 'array',
      items: componentRef('MealPlanDay'),
    },
  },
} as const

export const mealPlanSlotResponseSchema = {
  type: 'object',
  required: ['slot'],
  properties: {
    slot: componentRef('MealPlanSlot'),
  },
} as const

export const createMealPlanSlotBodySchema = {
  type: 'object',
  required: ['dayDate', 'slot'],
  properties: {
    dayDate: { type: 'string', format: 'date' },
    slot: mealSlotSchema,
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    ingredients: {
      type: 'array',
      items: mealPlanSlotIngredientInputSchema,
    },
  },
} as const

export const updateMealPlanSlotBodySchema = {
  type: 'object',
  properties: {
    dayDate: { type: 'string', format: 'date' },
    slot: mealSlotSchema,
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    eatenAt: { type: ['string', 'null'], format: 'date-time' },
  },
} as const

export const updateMealPlanSlotIngredientsBodySchema = {
  type: 'object',
  required: ['ingredients'],
  properties: {
    ingredients: {
      type: 'array',
      items: mealPlanSlotIngredientInputSchema,
    },
  },
} as const

const createMealPlanSlotBodyOpenApiSchema = {
  ...createMealPlanSlotBodySchema,
  properties: {
    ...createMealPlanSlotBodySchema.properties,
    slot: componentRef('MealSlot'),
    ingredients: {
      type: 'array',
      items: componentRef('MealPlanSlotIngredientInput'),
    },
  },
} as const

const updateMealPlanSlotBodyOpenApiSchema = {
  ...updateMealPlanSlotBodySchema,
  properties: {
    ...updateMealPlanSlotBodySchema.properties,
    slot: componentRef('MealSlot'),
  },
} as const

const updateMealPlanSlotIngredientsBodyOpenApiSchema = {
  ...updateMealPlanSlotIngredientsBodySchema,
  properties: {
    ingredients: {
      type: 'array',
      items: componentRef('MealPlanSlotIngredientInput'),
    },
  },
} as const

export const recipeIngredientSchema = {
  type: 'object',
  required: ['id', 'displayName', 'amountG', 'position'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    displayName: { type: 'string' },
    amountG: { type: 'number' },
    displayAmount: { type: ['number', 'null'] },
    displayUnit: { type: ['string', 'null'] },
    position: { type: 'number' },
  },
} as const

export const recipeIngredientInputSchema = {
  type: 'object',
  required: ['displayName', 'amountG'],
  properties: {
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    displayName: { type: 'string' },
    amountG: { type: 'number', minimum: 0 },
    displayAmount: { type: ['number', 'null'] },
    displayUnit: { type: ['string', 'null'] },
    position: { type: 'number', minimum: 0 },
  },
} as const

export const recipeSchema = {
  type: 'object',
  required: [
    'id',
    'householdId',
    'name',
    'prepTimeMin',
    'portions',
    'mealTypes',
    'steps',
    'createdAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    householdId: { type: 'string', format: 'uuid' },
    createdBy: { type: ['string', 'null'], format: 'uuid' },
    name: { type: 'string' },
    image: { type: ['string', 'null'] },
    prepTimeMin: { type: 'number' },
    portions: { type: 'number' },
    mealTypes: {
      type: 'array',
      items: componentRef('MealSlot'),
    },
    steps: { type: 'string' },
    sourceUrl: { type: ['string', 'null'] },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
  },
} as const

export const recipeDetailSchema = {
  type: 'object',
  required: [...recipeSchema.required, 'ingredients', 'macrosTotal'],
  properties: {
    ...recipeSchema.properties,
    ingredients: {
      type: 'array',
      items: componentRef('RecipeIngredient'),
    },
    macrosTotal: componentRef('Macro'),
  },
} as const

export const createRecipeBodySchema = {
  type: 'object',
  required: ['name', 'portions', 'mealTypes', 'ingredients'],
  properties: {
    name: { type: 'string', minLength: 1 },
    image: { type: ['string', 'null'] },
    prepTimeMin: { type: 'number', minimum: 0 },
    portions: { type: 'number', minimum: 1 },
    mealTypes: {
      type: 'array',
      items: mealSlotSchema,
    },
    steps: { type: 'string' },
    sourceUrl: { type: ['string', 'null'] },
    ingredients: {
      type: 'array',
      items: recipeIngredientInputSchema,
    },
  },
} as const

export const updateRecipeBodySchema = {
  ...createRecipeBodySchema,
  required: [],
} as const

const createRecipeBodyOpenApiSchema = {
  ...createRecipeBodySchema,
  properties: {
    ...createRecipeBodySchema.properties,
    mealTypes: {
      type: 'array',
      items: componentRef('MealSlot'),
    },
    ingredients: {
      type: 'array',
      items: componentRef('RecipeIngredientInput'),
    },
  },
} as const

const updateRecipeBodyOpenApiSchema = {
  ...createRecipeBodyOpenApiSchema,
  required: [],
} as const

export const getRecipesResponseSchema = {
  type: 'object',
  required: ['recipes'],
  properties: {
    recipes: {
      type: 'array',
      items: componentRef('Recipe'),
    },
  },
} as const

export const recipeDetailResponseSchema = {
  type: 'object',
  required: ['recipe'],
  properties: {
    recipe: componentRef('RecipeDetail'),
  },
} as const

export const deleteRecipeResponseSchema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean' },
  },
} as const

export const previewRecipeImportBodySchema = {
  type: 'object',
  required: ['url'],
  properties: {
    url: { type: 'string', format: 'uri' },
  },
} as const

export const previewRecipeImportRecipeSchema = {
  type: 'object',
  required: ['name', 'portions', 'mealTypes', 'steps', 'ingredients'],
  properties: createRecipeBodyOpenApiSchema.properties,
} as const

export const previewRecipeImportResponseSchema = {
  type: 'object',
  required: ['recipe'],
  properties: {
    recipe: componentRef('PreviewRecipeImportRecipe'),
  },
} as const

export const dashboardTodayResponseSchema = {
  type: 'object',
  required: ['date', 'plan', 'logs', 'dailyTotal', 'goals', 'progress'],
  properties: {
    date: { type: 'string', format: 'date' },
    plan: {
      type: 'object',
      required: ['slots'],
      properties: {
        slots: {
          type: 'array',
          items: componentRef('MealPlanSlot'),
        },
      },
    },
    logs: {
      type: 'array',
      items: componentRef('FoodLog'),
    },
    dailyTotal: componentRef('DailyTotal'),
    goals: componentRef('Goals'),
    progress: componentRef('Progress'),
  },
} as const

export const statsDailyResponseSchema = {
  type: 'object',
  required: ['days'],
  properties: {
    days: {
      type: 'array',
      items: componentRef('DailyTotal'),
    },
  },
} as const

export const statsSummaryResponseSchema = {
  type: 'object',
  required: ['from', 'to', 'daysCount', 'totals', 'averages', 'entriesCount', 'bestDay', 'worstDay', 'goals', 'goalFulfillment'],
  properties: {
    from: { type: 'string', format: 'date' },
    to: { type: 'string', format: 'date' },
    daysCount: { type: 'number' },
    totals: componentRef('Macro'),
    averages: componentRef('Macro'),
    entriesCount: { type: 'number' },
    bestDay: nullableRef('DailyTotal'),
    worstDay: nullableRef('DailyTotal'),
    goals: componentRef('Goals'),
    goalFulfillment: componentRef('Progress'),
  },
} as const

const withId = <Schema extends object>(id: string, schema: Schema) => ({
  $id: id,
  ...schema,
}) as const

export const openApiSchemas = [
  withId('MealSlot', mealSlotSchema),
  withId('FoodLogSource', foodLogSourceSchema),
  withId('Macro', macroSchema),
  withId('Goals', goalsSchema),
  withId('Progress', progressSchema),
  withId('ErrorResponse', errorResponseSchema),
  withId('NotImplementedResponse', notImplementedResponseSchema),
  withId('OpenApiSpec', openApiSpecSchema),
  withId('User', userSchema),
  withId('Session', sessionSchema),
  withId('Profile', profileSchema),
  withId('Household', householdSchema),
  withId('HouseholdMembership', householdMembershipSchema),
  withId('AuthContext', authContextSchema),
  withId('SignUpBody', signUpBodySchema),
  withId('LoginBody', loginBodySchema),
  withId('RefreshBody', refreshBodySchema),
  withId('LogoutResponse', logoutResponseSchema),
  withId('ProfileResponse', profileResponseSchema),
  withId('UpdateProfileBody', updateProfileBodySchema),
  withId('Ingredient', ingredientSchema),
  withId('CreateIngredientBody', createIngredientBodySchema),
  withId('UpdateIngredientBody', updateIngredientBodySchema),
  withId('ResolveIngredientBarcodeBody', resolveIngredientBarcodeBodySchema),
  withId('GetIngredientsResponse', getIngredientsResponseSchema),
  withId('IngredientResponse', ingredientResponseSchema),
  withId('ResolveIngredientBarcodeResponse', resolveIngredientBarcodeResponseSchema),
  withId('FoodLog', foodLogSchema),
  withId('DailyTotal', dailyTotalSchema),
  withId('CreateFoodLogBody', createFoodLogBodyOpenApiSchema),
  withId('UpdateFoodLogBody', updateFoodLogBodyOpenApiSchema),
  withId('FoodLogResponse', foodLogResponseSchema),
  withId('GetFoodLogResponse', getFoodLogResponseSchema),
  withId('UpdateFoodLogResponse', updateFoodLogResponseSchema),
  withId('DeleteFoodLogResponse', deleteFoodLogResponseSchema),
  withId('DeleteMealPlanSlotResponse', deleteMealPlanSlotResponseSchema),
  withId('MealPlanSlotIngredient', mealPlanSlotIngredientSchema),
  withId('MealPlanSlotIngredientInput', mealPlanSlotIngredientInputSchema),
  withId('MealPlanSlotRecipe', mealPlanSlotRecipeSchema),
  withId('MealPlanSlot', mealPlanSlotSchema),
  withId('MealPlanDay', mealPlanDaySchema),
  withId('GetMealPlanResponse', getMealPlanResponseSchema),
  withId('MealPlanSlotResponse', mealPlanSlotResponseSchema),
  withId('CreateMealPlanSlotBody', createMealPlanSlotBodyOpenApiSchema),
  withId('UpdateMealPlanSlotBody', updateMealPlanSlotBodyOpenApiSchema),
  withId('UpdateMealPlanSlotIngredientsBody', updateMealPlanSlotIngredientsBodyOpenApiSchema),
  withId('RecipeIngredient', recipeIngredientSchema),
  withId('RecipeIngredientInput', recipeIngredientInputSchema),
  withId('Recipe', recipeSchema),
  withId('RecipeDetail', recipeDetailSchema),
  withId('CreateRecipeBody', createRecipeBodyOpenApiSchema),
  withId('UpdateRecipeBody', updateRecipeBodyOpenApiSchema),
  withId('GetRecipesResponse', getRecipesResponseSchema),
  withId('RecipeDetailResponse', recipeDetailResponseSchema),
  withId('DeleteRecipeResponse', deleteRecipeResponseSchema),
  withId('PreviewRecipeImportBody', previewRecipeImportBodySchema),
  withId('PreviewRecipeImportRecipe', previewRecipeImportRecipeSchema),
  withId('PreviewRecipeImportResponse', previewRecipeImportResponseSchema),
  withId('DashboardTodayResponse', dashboardTodayResponseSchema),
  withId('StatsDailyResponse', statsDailyResponseSchema),
  withId('StatsSummaryResponse', statsSummaryResponseSchema),
] as const
