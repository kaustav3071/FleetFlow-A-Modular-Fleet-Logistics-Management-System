import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Lock, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authAPI } from '../../api/auth.js';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function ProfilePage() {
    const { user, fetchUser, logout } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    // Profile form
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [profileLoading, setProfileLoading] = useState(false);

    // Password form
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const roleBadge = {
        manager: { label: 'Fleet Manager', color: 'bg-brand-100 text-brand-700 ring-brand-200' },
        dispatcher: { label: 'Dispatcher', color: 'bg-blue-100 text-blue-700 ring-blue-200' },
        safety_officer: { label: 'Safety Officer', color: 'bg-amber-100 text-amber-700 ring-amber-200' },
        analyst: { label: 'Financial Analyst', color: 'bg-purple-100 text-purple-700 ring-purple-200' },
    };
    const badge = roleBadge[user?.role] || roleBadge.manager;

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            await authAPI.updateProfile(profile);
            await fetchUser();
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwords.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        setPasswordLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success('Password changed! Please login again.');
            setTimeout(() => {
                logout();
                navigate('/auth');
            }, 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-all duration-200 cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="page-title">Profile & Settings</h1>
                    <p className="text-sm text-surface-500 mt-1">Manage your profile and account preferences</p>
                </div>
            </div>

            {/* Profile Card */}
            <Card className="overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-8">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white/30">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                            <p className="text-brand-100 text-sm mt-0.5">{user?.email}</p>
                            <div className="mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${badge.color}`}>
                                    <Shield className="w-3 h-3" />
                                    {badge.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
                    <h3 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-brand-500" />
                        Edit Profile
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            name="name"
                            label="Full Name"
                            value={profile.name}
                            onChange={handleProfileChange}
                            required
                            placeholder="John Doe"
                        />
                        <Input
                            name="email"
                            label="Email Address"
                            type="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            required
                            placeholder="john@example.com"
                        />
                        <Input
                            name="phone"
                            label="Phone Number"
                            type="tel"
                            value={profile.phone}
                            onChange={handleProfileChange}
                            placeholder="+91 98765 43210"
                        />
                        {/* Role — read-only */}
                        <div>
                            <label className="block text-sm font-medium text-surface-600 mb-1.5">Role</label>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-50 border border-surface-200 text-sm text-surface-500">
                                <Shield className="w-4 h-4" />
                                <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
                                <span className="text-xs text-surface-400 ml-auto">Managed by admin</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" loading={profileLoading} icon={Save}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Change Password Card */}
            <Card className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <h3 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-brand-500" />
                        Change Password
                    </h3>

                    <div className="grid grid-cols-1 gap-4 max-w-md">
                        <div className="relative">
                            <Input
                                name="currentPassword"
                                label="Current Password"
                                type={showCurrent ? 'text' : 'password'}
                                value={passwords.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-9 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="relative">
                            <Input
                                name="newPassword"
                                label="New Password"
                                type={showNew ? 'text' : 'password'}
                                value={passwords.newPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Minimum 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-9 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <Input
                            name="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                            placeholder="Re-enter new password"
                            error={passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword ? 'Passwords do not match' : ''}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" loading={passwordLoading} icon={Lock} variant="outline">
                            Change Password
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Account Info */}
            <Card className="p-6">
                <h3 className="text-base font-semibold text-surface-900 mb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                        <span className="text-surface-500">Account Created</span>
                        <span className="text-surface-800 font-medium">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                        <span className="text-surface-500">Last Login</span>
                        <span className="text-surface-800 font-medium">
                            {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                        <span className="text-surface-500">Email Verified</span>
                        <span className={`font-medium ${user?.isVerified ? 'text-emerald-600' : 'text-red-600'}`}>
                            {user?.isVerified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                        <span className="text-surface-500">Login Method</span>
                        <span className="text-surface-800 font-medium">
                            {user?.googleId ? 'Google OAuth' : 'Email & Password'}
                        </span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
