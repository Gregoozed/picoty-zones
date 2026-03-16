export default function Header() {
  return (
    <header
      className="flex items-center gap-4 px-6 py-2 shadow-md"
      style={{ backgroundColor: '#1a2a50' }}
    >
      <img
        src="/logo-picoty.png"
        alt="Picoty"
        className="h-10 w-auto"
      />
      <div>
        <h1 className="text-lg font-bold text-white leading-tight">Groupe Picoty</h1>
        <p className="text-xs text-blue-200">Zones de Chalandise</p>
      </div>
    </header>
  );
}
