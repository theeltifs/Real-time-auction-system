import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';

const GooglePayCheckout = ({ auctionId, amount, onSuccess }) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (stripe) {
      const request = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Auction Payment',
          amount: amount * 100,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      request.canMakePayment().then((result) => {
        if (result) setPaymentRequest(request);
      });

      request.on('token', async ({ complete, token }) => {
        const res = await fetch('http://localhost:5000/api/payments/googlepay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tokenId: token.id, auctionId }),
        });

        if (res.ok) {
          complete('success');
          onSuccess();
        } else {
          complete('fail');
          alert('Payment failed');
        }
      });
    }
  }, [stripe]);

  return paymentRequest ? <PaymentRequestButtonElement options={{ paymentRequest }} /> : null;
};

export default GooglePayCheckout;
