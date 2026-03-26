import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Camera, Save, Bell, Shield, Award, Settings, Rss } from 'lucide-react';
import { UserProfile, NotificationSettings } from '../types';
import { SocialFeed } from './SocialFeed';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  notifications: NotificationSettings;
  onUpdateNotifications: (newSettings: NotificationSettings) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  notifications,
  onUpdateNotifications,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'progress' | 'feed'>('profile');
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile({ ...editedProfile, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateProfile(editedProfile);
    onClose();
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    onUpdateNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] my-auto"
      >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-slate-950 p-4 md:p-6 flex flex-row md:flex-col gap-2 border-b md:border-b-0 md:border-r border-slate-800 overflow-x-auto md:overflow-x-visible scrollbar-hide shrink-0">
              <div className="hidden md:flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase">Account</h2>
              </div>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === 'profile' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <User size={18} /> <span className="text-xs md:text-base">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === 'feed' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Rss size={18} /> <span className="text-xs md:text-base">Social Feed</span>
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === 'progress' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Award size={18} /> <span className="text-xs md:text-base">Progress</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === 'settings' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Settings size={18} /> <span className="text-xs md:text-base">Settings</span>
              </button>

              <div className="hidden md:block mt-auto pt-6 border-t border-slate-800">
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-400 transition-colors py-2 font-bold text-sm"
                >
                  <X size={16} /> Logout
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-900 relative">
              <button 
                onClick={onClose}
                className="md:hidden absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white z-10"
              >
                <X size={20} />
              </button>
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-800 flex items-center justify-center">
                        {editedProfile.profilePic ? (
                          <img
                            src={editedProfile.profilePic}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={48} className="text-slate-600" />
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-3 bg-red-600 rounded-full shadow-lg hover:bg-red-700 transition-colors border-4 border-slate-900 text-white"
                        title="Upload Profile Picture"
                      >
                        <Camera size={18} />
                      </button>
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-black tracking-tight uppercase">{editedProfile.username}</h3>
                      <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Level {editedProfile.level} Fan</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Username</label>
                      <input
                        type="text"
                        value={editedProfile.username}
                        onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Favorite Team</label>
                      <input
                        type="text"
                        value={editedProfile.favoriteTeam}
                        onChange={(e) => setEditedProfile({ ...editedProfile, favoriteTeam: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bio</label>
                      <textarea
                        value={editedProfile.bio}
                        onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500 transition-all font-medium text-sm"
                        placeholder="Tell the world about your football passion..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-black text-lg tracking-tight transition-all shadow-lg hover:shadow-red-600/20 flex items-center justify-center gap-2"
                  >
                    <Save size={20} /> SAVE CHANGES
                  </button>
                </div>
              )}

              {activeTab === 'feed' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black tracking-tight uppercase">Social Feed</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Live Community
                    </div>
                  </div>
                  <SocialFeed 
                    user={profile} 
                    isLoggedIn={true} 
                    onOpenLogin={() => {}} 
                  />
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="space-y-8">
                  <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 text-center space-y-4">
                    <div className="w-24 h-24 bg-yellow-500/10 rounded-full mx-auto flex items-center justify-center border-4 border-yellow-500/20">
                      <Award size={48} className="text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tight">{profile.points} XP</h3>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Progress Points</p>
                    </div>
                    <div className="relative h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(profile.points % 1000) / 10}%` }}
                        className="absolute left-0 top-0 h-full bg-yellow-500"
                      />
                    </div>
                    <p className="text-slate-400 text-xs font-medium">
                      {1000 - (profile.points % 1000)} XP until Level {profile.level + 1}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                      <h4 className="text-2xl font-black tracking-tight">12</h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Predictions Made</p>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                      <h4 className="text-2xl font-black tracking-tight">85%</h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Accuracy Rate</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Bell size={14} /> Notifications
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div>
                          <p className="font-bold">Goal Alerts</p>
                          <p className="text-slate-500 text-xs">Instant notification when a goal is scored</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('goalAlerts')}
                          className={`w-12 h-6 rounded-full transition-all relative ${
                            notifications.goalAlerts ? 'bg-red-600' : 'bg-slate-800'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            notifications.goalAlerts ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div>
                          <p className="font-bold">Match Reminders</p>
                          <p className="text-slate-500 text-xs">Get notified 15 mins before kickoff</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('matchReminders')}
                          className={`w-12 h-6 rounded-full transition-all relative ${
                            notifications.matchReminders ? 'bg-red-600' : 'bg-slate-800'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            notifications.matchReminders ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div>
                          <p className="font-bold">Transfer News</p>
                          <p className="text-slate-500 text-xs">Breaking transfer updates & rumors</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('newsUpdates')}
                          className={`w-12 h-6 rounded-full transition-all relative ${
                            notifications.newsUpdates ? 'bg-red-600' : 'bg-slate-800'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            notifications.newsUpdates ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Shield size={14} /> Privacy
                    </h3>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold">Public Profile</p>
                        <p className="text-slate-500 text-xs">Allow others to see your predictions</p>
                      </div>
                      <button className="w-12 h-6 bg-red-600 rounded-full relative">
                        <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
  );
};
