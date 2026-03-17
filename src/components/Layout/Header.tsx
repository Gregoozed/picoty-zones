import { useState } from 'react';
import { exportMapToPdf } from '../../utils/exportPdf';
import type { ProductType } from '../../types';

interface HeaderProps {
  hasData?: boolean;
  product?: ProductType;
  viewMode?: string;
  filiales?: string[];
  departements?: string[];
}

export default function Header({
  hasData = false,
  product = 'PP',
  viewMode = 'departement',
  filiales = [],
  departements = [],
}: HeaderProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportMapToPdf({ product, viewMode, filiales, departements });
    } catch (err) {
      console.error('Export PDF failed:', err);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-2 shadow-md"
      style={{ backgroundColor: '#1a2a50' }}
    >
      <div className="flex items-center gap-4">
        <img
          src="/logo-picoty.png"
          alt="Picoty"
          className="h-10 w-auto"
        />
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Groupe Picoty</h1>
          <p className="text-xs text-blue-200">Zones de Chalandise</p>
        </div>
      </div>

      {hasData && (
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-md bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25 disabled:opacity-50 disabled:cursor-wait"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm4.75 11.25a.75.75 0 0 0 1.5 0v-2.546l.943.942a.75.75 0 1 0 1.06-1.06l-2.22-2.22a.75.75 0 0 0-1.06 0l-2.22 2.22a.75.75 0 1 0 1.06 1.06l.937-.938v2.542Z" clipRule="evenodd" />
          </svg>
          {exporting ? 'Export...' : 'Export PDF'}
        </button>
      )}
    </header>
  );
}
