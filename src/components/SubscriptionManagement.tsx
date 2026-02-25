import { useState, useEffect } from 'react';
import { Settings, Calendar, DollarSign, AlertCircle, TrendingUp, Users, Download, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from './ui/button';

export interface Subscription {
  id: string;
  email: string;
  plan: 'Digital TOEFL' | 'High School Success' | 'Free';
  startDate: string;
  expiryDate: string;
  paymentMethod: 'PayPal' | 'QR Code' | 'Credit Card' | 'Bank Transfer' | 'None';
  status: 'Active' | 'Expired' | 'Cancelled';
  amount: number;
}

export function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState<Partial<Subscription>>({
    email: '',
    plan: 'Digital TOEFL',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    paymentMethod: 'PayPal',
    status: 'Active',
    amount: 114
  });

  useEffect(() => {
    // Load subscriptions from localStorage
    const saved = localStorage.getItem('toefl_subscriptions');
    if (saved) {
      setSubscriptions(JSON.parse(saved));
    }
  }, []);

  const saveSubscriptions = (subs: Subscription[]) => {
    setSubscriptions(subs);
    localStorage.setItem('toefl_subscriptions', JSON.stringify(subs));
  };

  const handleAddSubscription = () => {
    if (!formData.email || !formData.expiryDate) {
      alert('Please fill in all required fields');
      return;
    }

    const newSubscription: Subscription = {
      id: Date.now().toString(),
      email: formData.email!,
      plan: formData.plan as any || 'Digital TOEFL',
      startDate: formData.startDate!,
      expiryDate: formData.expiryDate!,
      paymentMethod: formData.paymentMethod as any || 'PayPal',
      status: formData.status as any || 'Active',
      amount: formData.amount || 114
    };

    saveSubscriptions([...subscriptions, newSubscription]);
    setShowAddForm(false);
    setFormData({
      email: '',
      plan: 'Digital TOEFL',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      paymentMethod: 'PayPal',
      status: 'Active',
      amount: 114
    });
  };

  const handleUpdateSubscription = () => {
    if (!editingSubscription || !formData.email || !formData.expiryDate) {
      alert('Please fill in all required fields');
      return;
    }

    const updated = subscriptions.map(sub =>
      sub.id === editingSubscription.id
        ? { ...sub, ...formData }
        : sub
    );

    saveSubscriptions(updated);
    setEditingSubscription(null);
    setFormData({
      email: '',
      plan: 'Digital TOEFL',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      paymentMethod: 'PayPal',
      status: 'Active',
      amount: 114
    });
  };

  const handleDeleteSubscription = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      saveSubscriptions(subscriptions.filter(sub => sub.id !== id));
    }
  };

  const handleEditSubscription = (sub: Subscription) => {
    setEditingSubscription(sub);
    setFormData(sub);
    setShowAddForm(true);
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Plan', 'Start Date', 'Expiry Date', 'Payment Method', 'Status', 'Amount'];
    const rows = subscriptions.map(sub => [
      sub.email,
      sub.plan,
      sub.startDate,
      sub.expiryDate,
      sub.paymentMethod,
      sub.status,
      sub.amount
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate statistics
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'Active').length,
    expiringSoon: subscriptions.filter(s => {
      const daysUntilExpiry = Math.floor((new Date(s.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0 && s.status === 'Active';
    }).length,
    monthlyRevenue: subscriptions
      .filter(s => s.status === 'Active')
      .reduce((sum, s) => sum + (s.amount / 6), 0) // Assuming 6-month billing
  };

  const isExpiringSoon = (expiryDate: string) => {
    const daysUntilExpiry = Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#2d5a5d]" />
          <h2 className="text-3xl font-bold text-[#2d5a5d]">Subscription Management</h2>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            className="bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setShowAddForm(true);
              setEditingSubscription(null);
              setFormData({
                email: '',
                plan: 'Digital TOEFL',
                startDate: new Date().toISOString().split('T')[0],
                expiryDate: '',
                paymentMethod: 'PayPal',
                status: 'Active',
                amount: 114
              });
            }}
            className="bg-[#2d5a5d] text-white hover:bg-[#1e6b73] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-semibold mb-1">Total Subscriptions</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-semibold mb-1">Active Subscriptions</p>
              <p className="text-3xl font-bold text-green-900">{stats.active}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-semibold mb-1">Expiring Soon</p>
              <p className="text-3xl font-bold text-orange-900">{stats.expiringSoon}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-semibold mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold text-purple-900">${stats.monthlyRevenue.toFixed(0)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-[#2d5a5d] mb-4">
            {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a5d]"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a5d]"
              >
                <option value="Digital TOEFL">Digital TOEFL</option>
                <option value="High School Success">High School Success</option>
                <option value="Free">Free</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a5d]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a5d]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a5d]"
              >
                <option value="PayPal">PayPal</option>
                <option value="QR Code">QR Code</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="None">None</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a5d]"
              >
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount ($)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a5d]"
                placeholder="114"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              onClick={editingSubscription ? handleUpdateSubscription : handleAddSubscription}
              className="bg-[#2d5a5d] text-white hover:bg-[#1e6b73]"
            >
              {editingSubscription ? 'Update' : 'Add'} Subscription
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setEditingSubscription(null);
              }}
              className="bg-gray-500 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-bold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Plan</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Start Date</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Expiry Date</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Payment</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Amount</th>
              <th className="px-4 py-3 text-center font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No subscriptions yet. Add your first subscription to get started.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{sub.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{sub.startDate}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {sub.expiryDate}
                    {isExpiringSoon(sub.expiryDate) && sub.status === 'Active' && (
                      <span className="ml-2 text-orange-500">
                        <AlertCircle className="w-4 h-4 inline" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{sub.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        sub.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : sub.status === 'Expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">${sub.amount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditSubscription(sub)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(sub.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
