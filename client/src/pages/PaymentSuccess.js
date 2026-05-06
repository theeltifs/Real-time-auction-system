import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Confetti from 'react-confetti';

const PaymentSuccess = () => {
  const [auction, setAuction] = useState(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const auctionId = params.get('auctionId');

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auctions/${auctionId}`);
        setAuction(res.data);
      } catch (err) {
        console.error('Error loading auction:', err);
      }
    };

    if (auctionId) fetchAuction();
  }, [auctionId]);

  return (
    <div className="min-h-screen bg-green-950 text-white flex items-center justify-center px-4 relative overflow-hidden">
      <Confetti numberOfPieces={300} recycle={false} />

      <div className="bg-green-800 border border-green-500 shadow-2xl p-8 rounded-xl text-center max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-4 text-yellow-300">Payment Successful!</h1>
        <p className="text-lg mb-6 text-green-200">
          Congratulations! You've successfully paid for your auction item.
        </p>

        <button
          onClick={() => navigate('/auctions')}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-green-900 px-6 py-2 rounded font-bold transition"
        >
          Back to Auctions
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
