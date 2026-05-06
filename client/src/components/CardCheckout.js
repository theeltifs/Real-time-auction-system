import {
  CardElement,
  useElements,
  useStripe
} from '@stripe/react-stripe-js';
import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';

const CardCheckout = ({ auctionId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      if (!stripe || !elements) {
        setError('Stripe has not loaded properly.');
        setLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card details are missing.');
        setLoading(false);
        return;
      }

      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        setError(`${pmError.message}`);
        setLoading(false);
        return;
      }

      const res = await axios.post('http://localhost:5000/api/payments/create-intent', {
        auctionId,
        paymentMethodId: paymentMethod.id,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });

      const { clientSecret } = res.data;

      if (!clientSecret) {
        setError('Missing client secret from server');
        return;
      }

      // confirm is called client-side because 3D Secure may require user interaction
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (result.error) {
        setError(`${result.error.message}`);
      } else if (result.paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        window.location.href = '/payment-success';
      } else {
        setError('Payment was not completed.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-3">Pay with Card</h2>
      <CardElement className="p-3 bg-gray-700 rounded text-white mb-4" />
      {error && <p className="text-red-400 mb-3">{error}</p>}
      <button
        onClick={handlePayment}
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-semibold"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
};

export default CardCheckout;
