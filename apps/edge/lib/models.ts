import { z } from 'zod';

export const CatalogModelSchema = z.object({
  id: z.string().regex(/^(?:gpt-[a-zA-Z0-9.-]+|mock)$/).max(100),
  name: z.string().min(1).max(60),
  description: z.string().max(120),
  inputPrice: z.number().nonnegative(),
  outputPrice: z.number().nonnegative(),
  // An explicit request adapter is required; model-list APIs do not describe compatibility.
  adapter: z.enum(['standard', 'reasoning-none', 'mock']),
});
export type CatalogModel = z.infer<typeof CatalogModelSchema>;
export const DEFAULT_MODEL = 'gpt-5.4-mini';
export const DEFAULT_MODELS: CatalogModel[] = [
  { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', description: 'Recommended · conversation & photos', inputPrice: 0.75, outputPrice: 4.5, adapter: 'reasoning-none' },
  { id: 'gpt-5.4', name: 'GPT-5.4', description: 'Stronger reasoning & vision', inputPrice: 2.5, outputPrice: 15, adapter: 'reasoning-none' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Affordable fallback', inputPrice: 0.4, outputPrice: 1.6, adapter: 'standard' },
  { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Established conversation & vision', inputPrice: 2, outputPrice: 8, adapter: 'standard' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Budget option', inputPrice: 0.15, outputPrice: 0.6, adapter: 'standard' },
  { id: 'mock', name: 'Mock Mode', description: 'Testing without API calls', inputPrice: 0, outputPrice: 0, adapter: 'mock' },
];

export function modelCatalog(env: { MODEL_CATALOG_JSON?: string } = {}): CatalogModel[] {
  if (!env.MODEL_CATALOG_JSON) return DEFAULT_MODELS;
  try {
    const extra = z.array(CatalogModelSchema).max(30).parse(JSON.parse(env.MODEL_CATALOG_JSON));
    const merged = new Map(DEFAULT_MODELS.map(m => [m.id, m]));
    for (const model of extra) merged.set(model.id, model);
    return [...merged.values()];
  } catch { throw new Error('Invalid MODEL_CATALOG_JSON configuration'); }
}
