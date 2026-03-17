import data from './communes-referentiel.json' with { type: 'json' };
import type { CommuneRef } from '../types/index.js';

export const referentiel: Record<string, CommuneRef> = data as Record<string, CommuneRef>;
