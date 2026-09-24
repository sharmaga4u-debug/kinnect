import React, { useState } from 'react';
import { 
  Heart, MessageCircle, Share2, Plus, Sparkles, Send, 
  Smile, Shield, Globe, Award, Calendar, Image as ImageIcon 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CommunityHub() {
  const { 
    user, communityPosts, likeCommunityPost, 
    addCommunityComment, createCommunityPost 
  } = useApp();

  const [activeCategory, setActiveCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [newPostForm, setNewPostForm] = useState({
    title: '',
    content: '',
    tag: 'Family Blessing 🙏',
    category: 'family'
  });

  function handleCommentSubmit(postId) {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    addCommunityComment(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  }

  function handleCreatePost() {
    if (!newPostForm.content.trim()) return;
    createCommunityPost(newPostForm);
    setNewPostForm({ title: '', content: '', tag: 'Family Blessing 🙏', category: 'family' });
    setShowCreateModal(false);
  }

  const filteredPosts = communityPosts.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="page" style={{ paddingBottom: 110, maxWidth: 660 }}>
      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="section-title">👥 Family & Community</h1>
      </div>

      {/* Global Connection Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F766E, #0E7490)',
        color: '#FFFFFF',
        borderRadius: 22,
        padding: '16px 20px',
        marginBottom: 18,
        boxShadow: '0 8px 24px rgba(14,116,144,0.22)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.9 }}>
            🌍 Connected Global Family
          </span>
          <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
            4 Timezones
          </span>
        </div>
        <p style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>
          "Distance vanishes when love and prayer bridge the miles."
        </p>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', opacity: 0.92, flexWrap: 'wrap' }}>
          <span>🇮🇳 India</span>
          <span>·</span>
          <span>🇬🇧 United Kingdom</span>
          <span>·</span>
          <span>🇨🇦 Canada</span>
          <span>·</span>
          <span>🇺🇸 USA</span>
        </div>
      </div>

      {/* Create a Post Trigger Bar */}
      <div
        className="card animate-slideUp"
        style={{
          padding: '12px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          background: 'var(--c-card)',
          border: '1.5px dashed var(--c-primary)'
        }}
        onClick={() => setShowCreateModal(true)}
      >
        <div
          className="avatar"
          style={{ width: 42, height: 42, background: '#FEF3C7', color: '#92400E', fontSize: '1.2rem' }}
        >
          {user?.avatar || '👵'}
        </div>
        <p style={{ color: 'var(--c-muted)', fontSize: '0.94rem', flex: 1, fontWeight: 500 }}>
          Share a blessing, family update, or festival wish...
        </p>
        <button className="btn btn-primary btn-sm" style={{ minHeight: 36, padding: '0 14px' }}>
          <Plus size={16} /> Post
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { id: 'all', label: '🌟 All Community' },
          { id: 'family', label: '🏡 Family Wall' },
          { id: 'spiritual', label: '📿 Spiritual & Satsang' }
        ].map(cat => (
          <button
            key={cat.id}
            className={`chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredPosts.map(post => {
          const isCommentsOpen = openCommentsPostId === post.id;

          return (
            <div
              key={post.id}
              className="card animate-slideUp"
              style={{
                padding: '20px',
                border: '1px solid var(--c-border)',
                background: 'var(--c-card)'
              }}
            >
              {/* Author Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    className="avatar"
                    style={{
                      width: 44, height: 44,
                      background: post.avatarBg,
                      color: post.avatarColor,
                      fontSize: '1.3rem'
                    }}
                  >
                    {post.avatar}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--c-text)' }}>
                      {post.author}
                    </h3>
                    <p style={{ fontSize: '0.76rem', color: 'var(--c-muted)' }}>
                      {post.authorRelation} · {post.time}
                    </p>
                  </div>
                </div>

                <span className="badge badge-amber" style={{ fontSize: '0.74rem' }}>
                  {post.tag}
                </span>
              </div>

              {/* Title & Body Content */}
              <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--c-text)', marginBottom: 6 }}>
                {post.title}
              </h4>
              <p style={{ fontSize: '0.94rem', color: 'var(--c-text-soft)', lineHeight: 1.6, marginBottom: 14 }}>
                {post.content}
              </p>

              {/* Action Buttons: Like, Comment, Share */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid var(--c-border)'
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* Like / Blessing Button */}
                  <button
                    onClick={() => likeCommunityPost(post.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: post.hasLiked ? '#FEE2E2' : 'transparent',
                      color: post.hasLiked ? '#DC2626' : 'var(--c-muted)',
                      border: 'none',
                      borderRadius: 99,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      transition: 'all 0.18s'
                    }}
                  >
                    <Heart size={18} fill={post.hasLiked ? '#DC2626' : 'none'} />
                    <span>{post.likes} Blessings</span>
                  </button>

                  {/* Comment Toggle Button */}
                  <button
                    onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      color: 'var(--c-muted)',
                      border: 'none',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.86rem'
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>{post.comments.length} Comments</span>
                  </button>
                </div>

                <span style={{ fontSize: '0.78rem', color: 'var(--c-emerald)', fontWeight: 700 }}>
                  Family Verified 🔒
                </span>
              </div>

              {/* Inline Comments Section */}
              {isCommentsOpen && (
                <div style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: '1px solid var(--c-surface)',
                  background: 'var(--c-surface)',
                  borderRadius: 14,
                  padding: 12
                }}>
                  {post.comments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {post.comments.map(c => (
                        <div key={c.id} style={{ background: '#fff', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                          <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--c-text)' }}>
                            {c.author} <span style={{ fontWeight: 400, color: 'var(--c-muted)', fontSize: '0.72rem' }}>· {c.time}</span>
                          </p>
                          <p style={{ fontSize: '0.86rem', color: 'var(--c-text-soft)', marginTop: 2 }}>{c.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', marginBottom: 8, textAlign: 'center' }}>
                      No comments yet. Send the first word of blessing!
                    </p>
                  )}

                  {/* Add Comment Input */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="input"
                      style={{ minHeight: 38, borderRadius: 12, fontSize: '0.86rem', padding: '6px 12px' }}
                      placeholder="Write a warm reply..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ minHeight: 38, padding: '0 12px', borderRadius: 12 }}
                      onClick={() => handleCommentSubmit(post.id)}
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="card animate-slideUp"
            style={{ width: '100%', maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 14 }}>
              ✍️ Share with Community
            </h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 700, fontSize: '0.84rem', display: 'block', marginBottom: 4 }}>
                Category Tag:
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  'Family Blessing 🙏',
                  'Festival Wish 🪔',
                  'Milestone & Pride 🏆',
                  'Kitchen Memories 🍲',
                  'Daily Reflection 📖'
                ].map(tag => (
                  <button
                    key={tag}
                    className={`chip ${newPostForm.tag === tag ? 'active' : ''}`}
                    onClick={() => setNewPostForm(f => ({ ...f, tag }))}
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 700, fontSize: '0.84rem', display: 'block', marginBottom: 4 }}>
                Headline / Title:
              </label>
              <input
                className="input"
                style={{ minHeight: 44, borderRadius: 12, fontSize: '0.92rem' }}
                placeholder="e.g. Diwali Diyas lit with grandchildren!"
                value={newPostForm.title}
                onChange={(e) => setNewPostForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 700, fontSize: '0.84rem', display: 'block', marginBottom: 4 }}>
                Your Message:
              </label>
              <textarea
                className="input"
                rows={4}
                style={{ borderRadius: 12, fontSize: '0.92rem', padding: 12, resize: 'none' }}
                placeholder="Share your thoughts, advice, festival greetings, or prayers with everyone..."
                value={newPostForm.content}
                onChange={(e) => setNewPostForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ flex: 1 }}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={handleCreatePost}
                disabled={!newPostForm.content.trim()}
              >
                Publish Post 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
