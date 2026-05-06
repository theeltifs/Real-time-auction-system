import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import logo from '../logo1.png';

const Navbar = () => {
  const { token, logout } = useContext(AuthContext);
  const user = token ? JSON.parse(atob(token.split('.')[1])) : null;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-xl border-b border-gray-700 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">

        <Link to="/" className="hover:scale-105 transition-transform duration-300 inline-block">
          <img src={logo} alt="RealTime Auction" className="h-16 w-auto" />
        </Link>

        <div className="sm:hidden">
          <button
            className="text-white text-2xl focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <HiX /> : <HiMenuAlt3 />}
          </button>
        </div>

        <div className={`sm:flex items-center gap-4 text-sm font-medium ${mobileMenuOpen ? 'block mt-4 sm:mt-0' : 'hidden sm:flex'}`}>
          {token ? (
            <>
              <NavLink to="/auctions" label="Live Auctions" onClick={closeMenu} />

              {user?.role === 'admin' && (
                <NavButton to="/admin" color="purple" label="Admin Dashboard" onClick={closeMenu} />
              )}

              {user?.role === 'seller' && (
                <NavButton to="/seller" color="green" label="Seller Panel" onClick={closeMenu} />
              )}

              <button
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white px-4 py-1.5 rounded-full shadow-sm font-semibold transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavButton to="/login" color="blue" label="Login" onClick={closeMenu} />
              <NavButton to="/register" color="indigo" label="Register" onClick={closeMenu} />
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="relative text-white hover:text-cyan-400 transition duration-300 after:absolute after:left-0 after:-bottom-1 after:w-0 hover:after:w-full after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300"
  >
    {label}
  </Link>
);

// gradient pill button used in navbar
const NavButton = ({ to, color, label, onClick }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
    indigo: 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
    green: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    purple: 'from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700',
  };

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`bg-gradient-to-r ${colorClasses[color]} text-white px-4 py-1.5 rounded-full shadow-sm font-semibold transition duration-200`}
    >
      {label}
    </Link>
  );
};

export default Navbar;
