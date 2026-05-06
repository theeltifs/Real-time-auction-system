import { Link } from 'react-router-dom';

const AuctionCard = ({ auction }) => {
  const { _id, title, image, currentBid, status } = auction;

  return (
    <div
      className="bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700 transition-transform transform hover:scale-105 hover:-translate-y-1 duration-300 group"
      data-aos="zoom-in"
      data-aos-duration="800"
      data-aos-easing="ease-in-out"
    >
      <h3
        className="text-xl font-bold text-blue-400 mb-3 transition-colors group-hover:text-blue-300"
        data-aos="fade-right"
        data-aos-delay="100"
      >
        {title}
      </h3>

      <img
        src={`http://localhost:5000/uploads/${image}`}
        alt={title}
        className="w-full h-48 object-cover rounded-lg mb-4 shadow-md transition-transform duration-500 group-hover:scale-105"
        data-aos="zoom-in-up"
        data-aos-delay="200"
      />

      <p
        className="text-green-400 font-semibold text-lg"
        data-aos="fade-up"
        data-aos-delay="300"
      >
        Rs. {currentBid}
      </p>

      <p
        className={`text-sm mb-4 ${status === 'ended' ? 'text-red-400' : 'text-yellow-400'}`}
        data-aos="fade-up"
        data-aos-delay="350"
      >
        {status.toUpperCase()}
      </p>

      <Link to={`/auction/${_id}`}>
        <button
          className={`w-full py-2 rounded font-semibold transition-colors duration-300 ${
            status === 'live'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              : 'bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900'
          } text-white`}
        >
          {status === 'live' ? 'Bid Now' : 'View Bid History'}
        </button>
      </Link>
    </div>
  );
};

export default AuctionCard;
