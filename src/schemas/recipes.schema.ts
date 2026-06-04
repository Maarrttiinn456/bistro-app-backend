import type { FastifySchema } from 'fastify';
import type { FromSchema } from 'json-schema-to-ts';

const mealTypeSchema = {
    type: 'string',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
} as const;

const recipeMacroSchema = {
    type: 'object',
    required: ['kcal', 'protein', 'carbs', 'fat'],
    properties: {
        kcal: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fat: { type: 'number' },
    },
} as const;

const recipeIngredientSchema = {
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
} as const;

const recipeIngredientInputSchema = {
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
} as const;

const recipeSummarySchema = {
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
            items: mealTypeSchema,
        },
        steps: { type: 'string' },
        sourceUrl: { type: ['string', 'null'] },
        createdAt: {
            type: 'string',
            format: 'date-time',
        },
    },
} as const;

const recipeDetailSchema = {
    type: 'object',
    required: ['recipe'],
    properties: {
        recipe: {
            ...recipeSummarySchema,
            required: [...recipeSummarySchema.required, 'ingredients', 'macrosTotal'],
            properties: {
                ...recipeSummarySchema.properties,
                ingredients: {
                    type: 'array',
                    items: recipeIngredientSchema,
                },
                macrosTotal: recipeMacroSchema,
            },
        },
    },
} as const;

export const recipeMutationBodySchema = {
    type: 'object',
    required: ['name', 'portions', 'mealTypes', 'ingredients'],
    properties: {
        name: { type: 'string', minLength: 1 },
        image: { type: ['string', 'null'] },
        prepTimeMin: { type: 'number', minimum: 0 },
        portions: { type: 'number', minimum: 1 },
        mealTypes: {
            type: 'array',
            items: mealTypeSchema,
        },
        steps: { type: 'string' },
        sourceUrl: { type: ['string', 'null'] },
        ingredients: {
            type: 'array',
            items: recipeIngredientInputSchema,
        },
    },
} as const;

export const recipePatchBodySchema = {
    ...recipeMutationBodySchema,
    required: [],
} as const;

export const recipeParamsSchema = {
    type: 'object',
    required: ['recipeId'],
    properties: {
        recipeId: { type: 'string', format: 'uuid' },
    },
} as const;

export const getRecipesQuerySchema = {
    type: 'object',
    properties: {
        query: { type: 'string' },
        mealType: mealTypeSchema,
    },
} as const;

const notImplementedResponseSchema = {
    description: 'Endpoint is documented but not implemented yet',
    type: 'object',
    required: ['error'],
    properties: {
        error: { type: 'string' },
    },
} as const;

export const getRecipesSchema = {
    tags: ['Recipes'],
    summary: 'List recipes',
    operationId: 'getRecipes',
    querystring: getRecipesQuerySchema,
    response: {
        200: {
            description: 'Recipes list response',
            type: 'object',
            required: ['recipes'],
            properties: {
                recipes: {
                    type: 'array',
                    items: recipeSummarySchema,
                },
            },
        },
    },
} satisfies FastifySchema;

export type GetRecipesQuery = FromSchema<typeof getRecipesQuerySchema>;
export type RecipeMutationBody = FromSchema<typeof recipeMutationBodySchema>;
export type RecipePatchBody = FromSchema<typeof recipePatchBodySchema>;
export type RecipeParams = FromSchema<typeof recipeParamsSchema>;

export const createRecipeSchema = {
    tags: ['Recipes'],
    summary: 'Create recipe',
    operationId: 'createRecipe',
    body: recipeMutationBodySchema,
    response: {
        201: recipeDetailSchema,
        501: notImplementedResponseSchema,
    },
} satisfies FastifySchema;

export const getRecipeSchema = {
    tags: ['Recipes'],
    summary: 'Get recipe detail',
    operationId: 'getRecipe',
    params: recipeParamsSchema,
    response: {
        200: recipeDetailSchema,
        501: notImplementedResponseSchema,
    },
} satisfies FastifySchema;

export const updateRecipeSchema = {
    tags: ['Recipes'],
    summary: 'Update recipe',
    operationId: 'updateRecipe',
    params: recipeParamsSchema,
    body: recipePatchBodySchema,
    response: {
        200: recipeDetailSchema,
        501: notImplementedResponseSchema,
    },
} satisfies FastifySchema;

export const deleteRecipeSchema = {
    tags: ['Recipes'],
    summary: 'Delete recipe',
    operationId: 'deleteRecipe',
    params: recipeParamsSchema,
    response: {
        200: {
            description: 'Recipe delete response',
            type: 'object',
            required: ['success'],
            properties: {
                success: { type: 'boolean' },
            },
        },
        501: notImplementedResponseSchema,
    },
} satisfies FastifySchema;

export const previewRecipeImportSchema = {
    tags: ['Recipes'],
    summary: 'Preview recipe import from URL',
    operationId: 'previewRecipeImport',
    body: {
        type: 'object',
        required: ['url'],
        properties: {
            url: { type: 'string', format: 'uri' },
        },
    },
    response: {
        200: {
            description: 'Recipe import preview response',
            type: 'object',
            required: ['recipe'],
            properties: {
                recipe: {
                    type: 'object',
                    required: ['name', 'portions', 'mealTypes', 'steps', 'ingredients'],
                    properties: recipeMutationBodySchema.properties,
                },
            },
        },
        501: notImplementedResponseSchema,
    },
} satisfies FastifySchema;
