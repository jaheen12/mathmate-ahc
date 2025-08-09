import React from 'react';
import { Megaphone, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../AuthContext'; // We need this to show/hide admin buttons

// This component displays a single notice
function NoticeCard({ notice, onEdit, onDelete }) {
  const { currentUser } = useAuth(); // Check if admin is logged in

  // Format the timestamp from Firebase into a readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className={`notice-card ${notice.isImportant ? 'important' : ''}`}>
      <div className="notice-header">
        <div className="notice-title-container">
          <Megaphone className="notice-icon" size={20} />
          <h3 className="notice-title">{notice.title}</h3>
        </div>
        
        {/* Admin buttons only show if logged in */}
        {currentUser && (
          <div className="notice-actions">
            <button className="action-button edit-button" onClick={() => onEdit(notice)}>
              <Pencil size={18} />
            </button>
            <button className="action-button delete-button" onClick={() => onDelete(notice.id)}>
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
      
      <p className="notice-date">Posted on: {formatDate(notice.createdAt)}</p>
      <p className="notice-content">{notice.content}</p>
    </div>
  );
}

export default NoticeCard;