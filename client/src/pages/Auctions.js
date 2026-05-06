import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchAuctions } from '../api/auction';
import AuctionCard from '../components/AuctionCard';
import { FaSearch, FaTags, FaMoneyBillWave } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { toast } from 'sonner';

const Auctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    name: '',
    status: '',
    minPrice: '',
    maxPrice: '',
  });

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    setPage(1);
    setAuctions([]);
  }, [filters]);

  const loadAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAuctions(filters, page, 8);
      if (res && Array.isArray(res.auctions)) {
        setAuctions(prev =>
          page === 1 ? res.auctions : [...prev, ...res.auctions]
        );
        setTotal(res.total || 0);
        AOS.refresh(); //Refresh AOS for new cards.
      } else {
        toast.error('Server returned unexpected data');
      }
    } catch (err) {
      toast.error('Failed to load auctions. Try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  const lastAuctionRef = useCallback(
    node => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && auctions.length < total) {
          setPage(prev => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, auctions.length, total]
  );

  const handleChange = e => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      {/* Banner */}
      <div className="text-center mb-12">
        <h1
          className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-tight mb-2"
          data-aos="fade-down"
        >
          Live Auctions Dashboard
        </h1>
        <p className="text-gray-400" data-aos="fade-up" data-aos-delay="200">
          Explore active listings and start bidding on your next treasure.
        </p>
      </div>

      {/* Filters */}
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6 mb-12 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4"
        data-aos="fade-up"
        data-aos-delay="300"
      >
        <div className="flex items-center bg-gray-800 px-3 py-2 rounded-lg">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            name="name"
            placeholder="Search name"
            value={filters.name}
            onChange={handleChange}
            className="bg-transparent outline-none text-white w-full"
          />
        </div>
        <div className="flex items-center bg-gray-800 px-3 py-2 rounded-lg">
          <FaTags className="text-gray-400 mr-2" />
          <input
            name="category"
            placeholder="Category"
            value={filters.category}
            onChange={handleChange}
            className="bg-transparent outline-none text-white w-full"
          />
        </div>
        <select
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="bg-gray-800 px-3 py-2 rounded-lg text-white border border-gray-700 focus:ring-2 ring-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
        </select>
        <div className="flex items-center bg-gray-800 px-3 py-2 rounded-lg">
          <FaMoneyBillWave className="text-green-400 mr-2" />
          <input
            name="minPrice"
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleChange}
            className="bg-transparent outline-none text-white w-full"
          />
        </div>
        <div className="flex items-center bg-gray-800 px-3 py-2 rounded-lg">
          <FaMoneyBillWave className="text-yellow-300 mr-2" />
          <input
            name="maxPrice"
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleChange}
            className="bg-transparent outline-none text-white w-full"
          />
        </div>
      </div>

      {/* Auction Cards */}
      <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {auctions.length === 0 && !loading && (
          <p className="text-center col-span-full text-gray-400">No auctions found.</p>
        )}

        {auctions.map((auction, index) => {
          const isLast = index === auctions.length - 1;

          //animations.
          const animationType =
            index % 3 === 0 ? 'zoom-in' : index % 3 === 1 ? 'fade-right' : 'fade-left';

          return (
            <div
              key={auction._id}
              ref={isLast ? lastAuctionRef : null}
              data-aos={animationType}
              data-aos-delay={index * 100}
            >
              <AuctionCard auction={auction} />
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="text-center text-cyan-400 mt-10 animate-pulse">
          Loading more auctions...
        </p>
      )}
    </div>
  );
};

export default Auctions;

