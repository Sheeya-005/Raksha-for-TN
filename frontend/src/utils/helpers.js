import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getSeverityColor(severity) {
  switch (severity) {
    case 'Critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'Medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  }
}

export function getMarkerColor(type) {
  switch (type) {
    case 'critical': return '#ef4444';
    case 'assistance': return '#f97316';
    case 'safe': return '#22c55e';
    case 'connected': return '#3b82f6';
    case 'offline': return '#6b7280';
    default: return '#3b82f6';
  }
}

export function getStatusBadge(status) {
  switch (status) {
    case 'Active':
    case 'SOS_TRIGGERED':
    case 'SOS Triggered':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'ALERT_RECEIVED':
    case 'Alert Received':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'RESPONDER_ASSIGNED':
    case 'ACCEPTED':
    case 'Accepted':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'RESPONDING':
    case 'Responding':
      return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    case 'REACHED_LOCATION':
    case 'Reached Location':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    case 'Resolved':
    case 'RESOLVED':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'CLOSED':
    case 'Closed':
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    case 'Acknowledged':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
}

export function truncate(str, n = 30) {
  return str?.length > n ? str.slice(0, n) + '...' : str;
}
