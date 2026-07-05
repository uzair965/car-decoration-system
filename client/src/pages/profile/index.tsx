import { useEffect, useState } from 'react';
import { Save, User, Key, Mail, Phone, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [joined, setJoined] = useState('');
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/profile');
      const u = response.data.data;
      setName(u.name);
      setEmail(u.email);
      setPhone(u.phone || '');
      setRole(u.role.name);
      setJoined(new Date(u.createdAt).toLocaleDateString());
    } catch (error) {
      toast.error('Failed to load profile details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }

    try {
      setIsSaving(true);
      const payload: any = { name, email, phone };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await api.put('/profile', payload);
      toast.success('Profile updated successfully!');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account information and credentials</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 space-y-6">
        
        {/* User Identity Info Card */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{name}</h2>
            <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-450 px-2 py-0.5 rounded-full font-medium">
                {role}
              </span>
              <span>•</span>
              <span>Joined {joined}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">General Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Change Password</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
