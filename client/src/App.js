import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import Login from './pages/Login';
import Register from './pages/Register';
import Auctions from './pages/Auctions';
import BidRoom from './pages/BidRoom';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import LandingPage from './pages/LandingPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'sonner';

//Stripe publishable key.
const stripePromise = loadStripe('pk_test_51RlOd9PSR6ncnqmodkplXZ2CtQq1JSAEyUrNSqZz70l25B9D423HWZndO6DgjB2YGpFNi5nyVB6SO7HWHdWWU94t00kS7Hwugw');

function App() {
  return (
    <Router>
      <Toaster theme="dark" position="top-right" richColors />
      <Navbar />
      <Elements stripe={stripePromise}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/*Protected Routes */}
          <Route
            path="/auctions"
            element={
              <PrivateRoute allowedRoles={['admin', 'seller', 'bidder']}>
                <Auctions />
              </PrivateRoute>
            }
          />
          <Route
            path="/auction/:id"
            element={
              <PrivateRoute allowedRoles={['admin', 'bidder', 'seller']}>
                <BidRoom />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/seller"
            element={
              <PrivateRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </PrivateRoute>
            }
          />

          {/*Payment Routes */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
        </Routes>
      </Elements>
      <Footer />
    </Router>
  );
}

export default App;
