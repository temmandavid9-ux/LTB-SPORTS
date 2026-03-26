import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageSquare, Share2, Send, Trash2, Clock } from 'lucide-react';
import { SocialPost, UserProfile } from '../types';

interface SocialFeedProps {
  user: UserProfile;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ user, isLoggedIn, onOpenLogin }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const savedPosts = localStorage.getItem('social_feed_posts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      // Initial mock posts
      const initialPosts: SocialPost[] = [
        {
          id: '1',
          userId: 'system',
          username: 'LTB Admin',
          userPic: 'https://picsum.photos/seed/admin/100/100',
          content: 'Welcome to the LTB Sports Social Feed! Share your match predictions and celebrate with the community! ⚽🔥',
          timestamp: Date.now() - 3600000,
          likes: 24,
          likedByMe: false,
          replies: [
            {
              id: 'r1',
              userId: 'user456',
              username: 'Fanatic',
              userPic: 'https://picsum.photos/seed/fan/100/100',
              content: 'This is awesome! Can\'t wait for the next match!',
              timestamp: Date.now() - 1800000
            }
          ]
        },
        {
          id: '2',
          userId: 'user123',
          username: 'GoalHunter',
          userPic: 'https://picsum.photos/seed/goal/100/100',
          content: 'What a goal by Haaland! Unbelievable finish! 😱',
          timestamp: Date.now() - 1800000,
          likes: 12,
          likedByMe: true,
          replies: []
        }
      ];
      setPosts(initialPosts);
      localStorage.setItem('social_feed_posts', JSON.stringify(initialPosts));
    }
  }, []);

  const savePosts = (updatedPosts: SocialPost[]) => {
    setPosts(updatedPosts);
    localStorage.setItem('social_feed_posts', JSON.stringify(updatedPosts));
  };

  const handlePost = () => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    if (!newPostContent.trim()) return;

    const newPost: SocialPost = {
      id: Date.now().toString(),
      userId: 'current-user',
      username: user.username,
      userPic: user.profilePic || `https://picsum.photos/seed/${user.username}/100/100`,
      content: newPostContent,
      timestamp: Date.now(),
      likes: 0,
      likedByMe: false,
      replies: []
    };

    savePosts([newPost, ...posts]);
    setNewPostContent('');
  };

  const handleReply = (postId: string) => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    if (!replyContent.trim()) return;

    const newReply = {
      id: Date.now().toString(),
      userId: 'current-user',
      username: user.username,
      userPic: user.profilePic || `https://picsum.photos/seed/${user.username}/100/100`,
      content: replyContent,
      timestamp: Date.now()
    };

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replies: [...(post.replies || []), newReply]
        };
      }
      return post;
    });

    savePosts(updatedPosts);
    setReplyContent('');
    setReplyingTo(null);
  };

  const handleLike = (postId: string) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.likedByMe ? post.likes - 1 : post.likes + 1,
          likedByMe: !post.likedByMe
        };
      }
      return post;
    });
    savePosts(updatedPosts);
  };

  const handleDelete = (postId: string) => {
    const updatedPosts = posts.filter(post => post.id !== postId);
    savePosts(updatedPosts);
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex gap-3">
          <img 
            src={user.profilePic || `https://picsum.photos/seed/${user.username}/100/100`} 
            alt="Me" 
            className="w-10 h-10 rounded-full object-cover border border-slate-700"
          />
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind, champ?"
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-2 placeholder:text-slate-600"
            rows={2}
          />
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-900">
          <button
            onClick={handlePost}
            disabled={!newPostContent.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Send size={14} /> POST UPDATE
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 p-5 rounded-2xl border border-slate-800 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <img src={post.userPic} alt={post.username} className="w-10 h-10 rounded-full object-cover border border-slate-800" />
                  <div>
                    <h4 className="font-black text-sm tracking-tight">{post.username}</h4>
                    <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <Clock size={10} /> {formatTime(post.timestamp)}
                    </div>
                  </div>
                </div>
                {post.userId === 'current-user' && (
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="text-slate-600 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-200 leading-relaxed mb-4">
                {post.content}
              </p>

              <div className="flex items-center gap-6 pt-4 border-t border-slate-900">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                    post.likedByMe ? 'text-red-500' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <Heart size={16} fill={post.likedByMe ? "currentColor" : "none"} />
                  {post.likes}
                </button>
                <button 
                  onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                  className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                    replyingTo === post.id ? 'text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <MessageSquare size={16} />
                  Reply
                </button>
                <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors ml-auto">
                  <Share2 size={16} />
                </button>
              </div>

              {/* Reply Input */}
              <AnimatePresence>
                {replyingTo === post.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-slate-900 overflow-hidden"
                  >
                    <div className="flex gap-3">
                      <img 
                        src={user.profilePic || `https://picsum.photos/seed/${user.username}/100/100`} 
                        alt="Me" 
                        className="w-8 h-8 rounded-full object-cover border border-slate-800"
                      />
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 transition-all resize-none"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                          >
                            CANCEL
                          </button>
                          <button
                            onClick={() => handleReply(post.id)}
                            disabled={!replyContent.trim()}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all"
                          >
                            REPLY
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Replies List */}
              {post.replies && post.replies.length > 0 && (
                <div className="mt-4 space-y-3 pl-8 border-l-2 border-slate-800">
                  {post.replies.map((reply) => (
                    <div key={reply.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                      <div className="flex gap-2 mb-2">
                        <img src={reply.userPic} alt={reply.username} className="w-6 h-6 rounded-full object-cover border border-slate-800" />
                        <div>
                          <h5 className="font-bold text-[10px] tracking-tight">{reply.username}</h5>
                          <span className="text-slate-600 text-[8px] uppercase font-bold">{formatTime(reply.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
