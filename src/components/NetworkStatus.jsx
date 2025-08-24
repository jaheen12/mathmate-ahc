// src/components/NetworkStatus.jsx
import React from 'react';
import './NetworkStatus.css';

const NetworkStatus = ({ fromCache = false, isOnline = true, hasPendingWrites = false }) => {
  // Show status only when relevant
  const shouldShowStatus = !isOnline || fromCache || hasPendingWrites;

  if (!shouldShowStatus) return null;

  let statusText = '';
  let statusClass = '';

  if (!isOnline) {
    statusText = '🔴 Offline';
    statusClass = 'offline';
  } else if (fromCache) {
    statusText = '📦 From Cache';
    statusClass = 'cache';
  } else if (hasPendingWrites) {
    statusText = '⏳ Syncing...';
    statusClass = 'syncing';
  }

  return (
    <div className="network-status-container" role="status" aria-live="polite">
      <span className={`status-pill ${statusClass}`}>{statusText}</span>
    </div>
  );
};

export default NetworkStatus;