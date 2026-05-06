import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('bidder');
  const [error, setError] = useState(false);

  const redirectByRole = (token) => {
    const { role } = jwtDecode(token);
    if (role === 'admin')  return navigate('/admin');
    if (role === 'seller') return navigate('/seller');
    navigate('/auctions');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', form);
      login(res.data.token);
      redirectByRole(res.data.token);
    } catch (err) {
      setError(true);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      if (!decoded.email_verified) {
        toast.error('Email not verified by Google');
        return;
      }

      const res = await axios.post('http://localhost:5000/api/auth/google', {
        tokenId: credentialResponse.credential,
        role: selectedRole,
      });

      login(res.data.token);
      redirectByRole(res.data.token);
    } catch (err) {
      toast.error('Google login failed');
      console.error(err);
    }
  };

  return (
    <GoogleOAuthProvider clientId="114568419252-ppbchj9p4srsvpi635744jv74qe4vseo.apps.googleusercontent.com">
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 animate-fade-in">

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg border-4 border-gray-900">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.245.714 5.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Login to RealTimeAuctionSystem
          </h2>

          {error && (
            <p className="text-red-400 text-center mb-4 transition-opacity animate-fade-in">
              Invalid email or password
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setError(false);
                }}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setError(false);
                }}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-md ${
                error ? 'animate-shake' : ''
              }`}
            >
              Login
            </button>
          </form>

          {/* role only applies when signing in with Google for the first time */}
          <div className="mb-2">
            <label className="block mb-1 text-sm text-gray-300">
              Role for Google Sign-Up{' '}
              <span className="text-gray-500 text-xs">(only applies to new Google accounts)</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            >
              <option value="bidder">Bidder</option>
              <option value="seller">Seller</option>
            </select>
          </div>

          <div className="flex items-center justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => toast.error('Google login failed')}
              theme="filled_black"
              size="large"
              width="100%"
            />
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-400 hover:underline">
              Register here
            </a>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
