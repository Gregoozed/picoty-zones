import { useState, useCallback, useEffect } from 'react';
import type { CommuneData } from '../types';
import { parseExcelFile } from '../utils/xlsParser';

interface UseCommuneDataReturn {
  communes: CommuneData[];
  loading: boolean;
  error: string | null;
  sheetNames: string[];
  lastUpdated: string | null;
  loadFromFile: (file: File, sheetName?: string) => Promise<void>;
}

export function useCommuneData(): UseCommuneDataReturn {
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [loading, setLoading] = useState(true); // true au démarrage (chargement API)
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Charger les données depuis l'API au montage
  useEffect(() => {
    let cancelled = false;

    async function fetchFromApi() {
      try {
        const res = await fetch('/api/communes');
        if (!res.ok) throw new Error('Serveur indisponible');
        const data: CommuneData[] = await res.json();

        if (cancelled) return;

        if (data.length > 0) {
          setCommunes(data);
          // Charger la date de dernière mise à jour
          try {
            const statusRes = await fetch('/api/communes/status');
            if (statusRes.ok) {
              const status = await statusRes.json();
              setLastUpdated(status.lastUpdated);
            }
          } catch {
            // non-bloquant
          }
        }
      } catch {
        // API indisponible — mode dégradé, l'utilisateur uploadera manuellement
        console.warn('API indisponible, mode upload manuel');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFromApi();
    return () => { cancelled = true; };
  }, []);

  // Upload via l'API (priorité) avec fallback local
  const loadFromFile = useCallback(async (file: File, sheetName?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Essayer l'upload vers le serveur
      const formData = new FormData();
      formData.append('file', file);
      if (sheetName) formData.append('sheetName', sheetName);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(body.error || 'Erreur serveur');
      }

      const result = await res.json();
      setSheetNames(result.sheetNames || []);

      // Recharger les données depuis la base
      const dataRes = await fetch('/api/communes');
      if (dataRes.ok) {
        const data: CommuneData[] = await dataRes.json();
        setCommunes(data);
      }

      // Mettre à jour la date
      try {
        const statusRes = await fetch('/api/communes/status');
        if (statusRes.ok) {
          const status = await statusRes.json();
          setLastUpdated(status.lastUpdated);
        }
      } catch {
        // non-bloquant
      }
    } catch (apiErr) {
      // Fallback : parsing local si le serveur est down
      console.warn('Upload API échoué, fallback local:', apiErr);
      try {
        const buffer = await file.arrayBuffer();
        const result = parseExcelFile(buffer, sheetName);
        setCommunes(result.communes);
        setSheetNames(result.sheetNames);
        setLastUpdated(null);
      } catch (localErr) {
        const message = localErr instanceof Error ? localErr.message : 'Erreur lors du parsing du fichier';
        setError(message);
        setCommunes([]);
        setSheetNames([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { communes, loading, error, sheetNames, lastUpdated, loadFromFile };
}
