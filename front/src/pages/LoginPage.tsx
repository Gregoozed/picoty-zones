import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/useUser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  // TODO: PingOne — replace this handler with redirect to PingOne authorize endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: '#1a2a50' }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <img
            src="/logo-picoty.png"
            alt="Picoty"
            className="mx-auto mb-4 h-16 w-auto"
          />
          <h1 className="text-2xl font-bold text-gray-800">Zones de Chalandise</h1>
          <p className="mt-1 text-sm text-gray-500">Groupe Picoty</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@picoty.fr"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: '#1a2a50' }}
          >
            {/* TODO: PingOne — change button text to "Se connecter avec PingOne" */}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* TODO: PingOne — add "Connexion via SSO" button here */}
      </div>
    </div>
  );
}
