import { useState, useCallback } from 'react';
import type { CommuneData } from '../types';
import { parseExcelFile } from '../utils/xlsParser';

interface UseCommuneDataReturn {
  communes: CommuneData[];
  loading: boolean;
  error: string | null;
  sheetNames: string[];
  loadFromFile: (file: File, sheetName?: string) => Promise<void>;
}

export function useCommuneData(): UseCommuneDataReturn {
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);

  const loadFromFile = useCallback(async (file: File, sheetName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer, sheetName);
      setCommunes(result.communes);
      setSheetNames(result.sheetNames);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du parsing du fichier';
      setError(message);
      setCommunes([]);
      setSheetNames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { communes, loading, error, sheetNames, loadFromFile };
}
