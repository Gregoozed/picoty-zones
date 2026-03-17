import type { ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ children, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="fixed top-16 left-3 z-40 rounded-md bg-white p-2 shadow-lg lg:hidden"
        aria-label={isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5 text-gray-700"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          )}
        </svg>
      </button>

      {/* Backdrop (mobile/tablet) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-[380px] bg-white shadow-xl overflow-y-auto transition-transform duration-300 lg:relative lg:translate-x-0 lg:shadow-md ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 pt-14 lg:pt-4">{children}</div>
      </aside>
    </>
  );
}
