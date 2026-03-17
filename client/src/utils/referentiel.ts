import type { CommuneRef } from '../types';
import data from '../data/communes-referentiel.json';

export const referentiel = data as Record<string, CommuneRef>;
