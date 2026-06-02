import type { FastifySchema } from 'fastify';

const recipeHeaderSchema = {
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
        id: { type: 'string' },
        householdId: { type: 'string' },
        createdBy: { type: ['string', 'null'] },
        name: { type: 'string' },
        image: { type: ['string', 'null'] },
        prepTimeMin: { type: 'number' },
        portions: { type: 'number' },
        mealTypes: {
            type: 'array',
            items: { type: 'string' },
        },
        steps: { type: 'string' },
        sourceUrl: { type: ['string', 'null'] },
        createdAt: {
            type: 'string',
            format: 'date-time',
        },
    },
} as const;

export const getRecipesSchema = {
    tags: ['Recipes'],
    summary: 'List recipes',
    operationId: 'getRecipes',
    response: {
        200: {
            description: 'Recipes list response',
            type: 'object',
            required: ['recipes'],
            properties: {
                recipes: {
                    type: 'array',
                    items: recipeHeaderSchema,
                },
            },
        },
    },
} satisfies FastifySchema;
