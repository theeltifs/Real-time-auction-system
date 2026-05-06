import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaFacebookF, FaTwitter, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  const { token } = useContext(AuthContext);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const quickLinks = [
    { label: 'Live Auctions', to: '/auctions', always: true },
    { label: 'Login', to: '/login', guestOnly: true },
    { label: 'Register', to: '/register', guestOnly: true },
    { label: 'Contact Us', to: '/contact', always: true },
  ].filter(link => link.always || (link.guestOnly && !token));

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-black to-gray-950 text-gray-300 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-gray-800 pb-10">

        <div data-aos="fade-up">
          <h3 className="text-3xl font-extrabold text-cyan-400 mb-3 tracking-wider drop-shadow-md">
            RealTimeAuctionSystem
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Explore real-time auctions for cars, bikes, smartphones, and dream homes.
            Elevate your bidding experience with AuctionPro.
          </p>
        </div>

        <div data-aos="fade-up" data-aos-delay="100">
          <h4 className="text-xl font-bold text-white mb-5 border-b border-cyan-400 pb-1 inline-block">
            Quick Links
          </h4>
          <ul className="space-y-3 mt-4">
            {quickLinks.map((link, i) => (
              <li key={i}>
                <Link
                  to={link.to}
                  className="relative group inline-block text-gray-300 hover:text-cyan-400 transition duration-200"
                >
                  {link.label}
                  <span className="block h-0.5 max-w-0 bg-cyan-400 transition-all duration-300 group-hover:max-w-full"></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div data-aos="fade-up" data-aos-delay="200">
          <h4 className="text-xl font-bold text-white mb-5 border-b border-cyan-400 pb-1 inline-block">
            Connect With Us
          </h4>
          <div className="flex gap-4 mt-5">
            <a href="https://www.facebook.com/share/1J3TQe4bBN/" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-tr from-blue-600 to-blue-400 p-3 rounded-full text-white hover:scale-110 transition duration-300 shadow-lg" title="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://x.com/time_sys44753" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-tr from-sky-500 to-blue-400 p-3 rounded-full text-white hover:scale-110 transition duration-300 shadow-lg" title="Twitter">
              <FaTwitter />
            </a>
            <div className="relative">
              <button
                onClick={() => setWhatsappOpen(!whatsappOpen)}
                className="bg-gradient-to-tr from-green-500 to-green-400 p-3 rounded-full text-white hover:scale-110 transition duration-300 shadow-lg"
                title="WhatsApp"
              >
                <FaWhatsapp />
              </button>
              {whatsappOpen && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl py-2 w-44 z-50">
                  <a
                    href="https://wa.me/923494221822"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWhatsappOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:text-green-400 hover:bg-gray-700 transition"
                  >
                    <FaWhatsapp className="text-green-400" /> Mr. Shehroz
                  </a>
                  <a
                    href="https://wa.me/923065060745"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWhatsappOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:text-green-400 hover:bg-gray-700 transition"
                  >
                    <FaWhatsapp className="text-green-400" /> Mr. Umar
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-6 text-sm text-gray-500 mt-10">
        <span className="block">
          © {new Date().getFullYear()}{' '}
          <span className="text-cyan-400 font-semibold">RealTimeAuctionSystem</span>. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
