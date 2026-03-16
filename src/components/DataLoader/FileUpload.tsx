import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface FileUploadProps {
  onFileLoaded: (file: File, sheetName?: string) => void;
  sheetNames: string[];
  loading: boolean;
  error: string | null;
}

const ACCEPT = '.xlsx,.xls';

export default function FileUpload({ onFileLoaded, sheetNames, loading, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setPendingFile(file);
      onFileLoaded(file);
    },
    [onFileLoaded],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSheetSelect = (sheetName: string) => {
    if (pendingFile) {
      onFileLoaded(pendingFile, sheetName);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg
              className="h-5 w-5 animate-spin text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Chargement en cours...
          </div>
        ) : (
          <>
            <svg
              className="h-8 w-8 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm text-gray-600">
              Glissez-déposez un fichier Excel ici
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Parcourir
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Sheet selector */}
      {sheetNames.length > 1 && (
        <div className="space-y-1">
          <label htmlFor="sheet-select" className="block text-sm font-medium text-gray-700">
            Feuille de calcul
          </label>
          <select
            id="sheet-select"
            onChange={(e) => handleSheetSelect(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {sheetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
