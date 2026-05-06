import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const VERDICT_FILTER_OPTIONS = [
  { label: 'All',            value: ''           },
  { label: 'Suspicious Only', value: 'SUSPICIOUS' },
  { label: 'False Positives', value: 'NORMAL'     },
];

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);

  const [auctions, setAuctions] = useState([]);
  const [users, setUsers] = useState([]);
  const [flaggedBids, setFlaggedBids]       = useState([]);
  const [verdictFilter, setVerdictFilter]   = useState('');
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'bidder' });

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    startingBid: '',
    endTime: '',
  });
  const [image, setImage] = useState(null);

  const fetchFlaggedBids = async (verdict = '') => {
    try {
      const params = new URLSearchParams({ page: 1, limit: 50 });
      if (verdict) params.set('verdict', verdict);
      const res = await axios.get(`http://localhost:5000/api/admin/flagged-bids?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFlaggedBids(res.data.flaggedBids);
    } catch (error) {
      console.error('Fetch Flagged Bids Error:', error);
      toast.error('Failed to load flagged bids');
    }
  };

  const fetchAuctions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auctions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setAuctions(Array.isArray(data.auctions) ? data.auctions : data);
    } catch (error) {
      console.error('Fetch Auctions Error:', error);
      toast.error('Failed to load auctions');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Fetch Users Error:', error);
      toast.error('Failed to load users');
    }
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append('image', image);

      await axios.post('http://localhost:5000/api/auctions', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Auction created');
      fetchAuctions();
      setForm({ title: '', description: '', category: '', startingBid: '', endTime: '' });
      setImage(null);
    } catch (err) {
      console.error('Create Auction Error:', err);
      toast.error('Auction creation failed');
    }
  };

  const deleteAuction = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAuctions();
    } catch {
      toast.error('Failed to delete auction');
    }
  };

  const endAuction = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/auctions/${id}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAuctions();
    } catch {
      toast.error('Failed to end auction');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users', userForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('User created');
      fetchUsers();
      setUserForm({ name: '', email: '', password: '', role: 'bidder' });
    } catch (err) {
      console.error('Add User Error:', err);
      toast.error('Failed to create user');
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleVerdictFilter = (value) => {
    setVerdictFilter(value);
    fetchFlaggedBids(value);
  };

  useEffect(() => {
    fetchAuctions();
    fetchUsers();
    fetchFlaggedBids();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <h2 className="text-4xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-cyan-400">
        Admin Dashboard
      </h2>

      {/* users management */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl max-w-5xl mx-auto mb-14">
        <h3 className="text-2xl font-semibold mb-4 text-yellow-400">Manage Users</h3>

        <form onSubmit={handleAddUser} className="grid sm:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Name"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            className="bg-gray-700 px-4 py-2 rounded border border-gray-600"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            className="bg-gray-700 px-4 py-2 rounded border border-gray-600"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            className="bg-gray-700 px-4 py-2 rounded border border-gray-600"
            required
          />
          <select
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            className="bg-gray-700 px-4 py-2 rounded border border-gray-600"
          >
            <option value="bidder">Bidder</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded font-semibold"
          >
            Add User
          </button>
        </form>

        <table className="w-full border border-gray-700 text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 border border-gray-600">Name</th>
              <th className="p-2 border border-gray-600">Email</th>
              <th className="p-2 border border-gray-600">Role</th>
              <th className="p-2 border border-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-800">
                <td className="p-2 border border-gray-700">{u.name}</td>
                <td className="p-2 border border-gray-700">{u.email}</td>
                <td className="p-2 border border-gray-700 capitalize">{u.role}</td>
                <td className="p-2 border border-gray-700">
                  <button
                    onClick={() => deleteUser(u._id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* auctions management */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl max-w-5xl mx-auto mb-14">
        <h3 className="text-2xl font-semibold mb-4 text-green-400">Manage Auctions</h3>

        <form onSubmit={handleCreateAuction} className="grid gap-4" encType="multipart/form-data">
          {['title', 'description', 'category'].map((field, i) => (
            <input
              key={i}
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="bg-gray-700 px-4 py-2 rounded border border-gray-600"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required={field !== 'description'}
            />
          ))}
          <input
            type="number"
            placeholder="Starting Bid"
            value={form.startingBid}
            onChange={(e) => setForm({ ...form, startingBid: e.target.value })}
            className="bg-gray-700 px-4 py-2 rounded border border-gray-600"
            required
          />
          <input
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="bg-gray-700 px-4 py-2 rounded border border-gray-600"
            required
          />
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          <button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded font-semibold"
          >
            Create Auction
          </button>
        </form>
      </div>

      {/* flagged bids */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl max-w-7xl mx-auto mb-14">
        <h3 className="text-2xl font-semibold mb-4 text-red-400">Flagged Bids</h3>

        <div className="flex gap-2 mb-5">
          {VERDICT_FILTER_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleVerdictFilter(value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                verdictFilter === value
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-gray-600 text-gray-300 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {flaggedBids.length === 0 ? (
          <p className="text-gray-400 text-center py-10">
            No flagged bids yet. The system is monitoring all live auctions.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-700 text-sm">
              <thead>
                <tr className="bg-gray-700 text-gray-200">
                  <th className="p-3 border border-gray-600 text-left">Auction</th>
                  <th className="p-3 border border-gray-600 text-left">Bidder</th>
                  <th className="p-3 border border-gray-600 text-right">Amount</th>
                  <th className="p-3 border border-gray-600 text-left">Triggered Rules</th>
                  <th className="p-3 border border-gray-600 text-center">Verdict</th>
                  <th className="p-3 border border-gray-600 text-left">Reason</th>
                  <th className="p-3 border border-gray-600 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {flaggedBids.map((fb) => (
                  <tr key={fb._id} className="hover:bg-gray-700/40 border-b border-gray-700">
                    <td className="p-3 border border-gray-700 text-blue-300 font-medium">{fb.auctionTitle}</td>
                    <td className="p-3 border border-gray-700 text-gray-300">{fb.bidderEmail}</td>
                    <td className="p-3 border border-gray-700 text-green-400 text-right font-mono">
                      Rs. {fb.bidAmount.toLocaleString()}
                    </td>
                    <td className="p-3 border border-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {fb.triggeredRules.map((r) => (
                          <span
                            key={r.rule}
                            className="px-2 py-0.5 bg-orange-900/60 text-orange-300 border border-orange-700 rounded text-xs font-mono"
                          >
                            {r.rule}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 border border-gray-700 text-center">
                      {fb.llmVerdict === 'SUSPICIOUS' ? (
                        <span className="px-3 py-1 bg-red-700 text-white rounded-full text-xs font-bold tracking-wide">
                          SUSPICIOUS
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-600 text-black rounded-full text-xs font-bold tracking-wide">
                          FALSE POSITIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3 border border-gray-700 text-gray-400 text-xs max-w-xs">{fb.llmReason}</td>
                    <td className="p-3 border border-gray-700 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(fb.bidTimestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-semibold mb-4">All Auctions</h3>
        {auctions.length === 0 ? (
          <p className="text-gray-400 text-center">No auctions found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {auctions.map((a) => (
              <div key={a._id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
                <h4 className="text-xl font-bold text-blue-400 mb-1">{a.title}</h4>
                <p className="text-sm text-gray-400">Category: {a.category}</p>
                <p>Status: <span className="text-yellow-400">{a.status}</span></p>
                <p>Current Bid: <span className="text-green-400">Rs. {a.currentBid}</span></p>
                {a.bids?.length > 0 && a.status === 'ended' && (
                  <p className="text-purple-300 mt-1">Winner: {a.bids[a.bids.length - 1]?.bidder?.name}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => deleteAuction(a._id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm"
                  >
                    Delete
                  </button>
                  {a.status !== 'ended' && (
                    <button
                      onClick={() => endAuction(a._id)}
                      className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black text-sm"
                    >
                      Force End
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
