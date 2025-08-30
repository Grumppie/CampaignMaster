import React, { useState, useEffect } from 'react';
import { CampaignSession, SessionPlayer } from '../../types';
import { 
  createCampaignSession, 
  getCampaignSessions, 
  updateSessionStatus,
  addPlayerToSession,
  removePlayerFromSession,
  updateSession,
  deleteSession
} from '../../services/sessions';
import { useAuth } from '../../hooks/useAuth';
import './SessionManager.css';

interface SessionManagerProps {
  campaignId: string;
  isDM: boolean;
  dmId: string;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ 
  campaignId, 
  isDM, 
  dmId 
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CampaignSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CampaignSession | null>(null);

  // Form state for creating/editing sessions
  const [formData, setFormData] = useState({
    sessionDate: '',
    notes: '',
    duration: ''
  });

  useEffect(() => {
    fetchSessions();
  }, [campaignId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const campaignSessions = await getCampaignSessions(campaignId);
      setSessions(campaignSessions);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create sessions');
      return;
    }

    try {
      setError(null);
      await createCampaignSession(
        campaignId,
        {
          campaignId,
          sessionDate: new Date(formData.sessionDate),
          dmId,
          notes: formData.notes || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined
        },
        user.uid,
        user.displayName || user.email || 'Unknown User'
      );
      
      setFormData({ sessionDate: '', notes: '', duration: '' });
      setShowCreateModal(false);
      fetchSessions();
    } catch (err) {
      setError('Failed to create session');
      console.error('Error creating session:', err);
    }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSession) {
      setError('You must be logged in and select a session to update');
      return;
    }

    try {
      setError(null);
      const updates: any = {};
      if (formData.sessionDate) updates.sessionDate = new Date(formData.sessionDate);
      if (formData.notes !== undefined) updates.notes = formData.notes;
      if (formData.duration) updates.duration = parseInt(formData.duration);

      await updateSession(
        selectedSession.id,
        updates,
        user.uid,
        user.displayName || user.email || 'Unknown User'
      );
      
      setFormData({ sessionDate: '', notes: '', duration: '' });
      setShowEditModal(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (err) {
      setError('Failed to update session');
      console.error('Error updating session:', err);
    }
  };

  const handleStatusChange = async (sessionId: string, newStatus: CampaignSession['status']) => {
    if (!user) {
      setError('You must be logged in to update session status');
      return;
    }

    try {
      setError(null);
      await updateSessionStatus(
        sessionId,
        newStatus,
        user.uid,
        user.displayName || user.email || 'Unknown User'
      );
      fetchSessions();
    } catch (err) {
      setError('Failed to update session status');
      console.error('Error updating session status:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) {
      setError('You must be logged in to delete sessions');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await deleteSession(
        sessionId,
        user.uid,
        user.displayName || user.email || 'Unknown User'
      );
      fetchSessions();
    } catch (err) {
      setError('Failed to delete session');
      console.error('Error deleting session:', err);
    }
  };

  const handleEditSession = (session: CampaignSession) => {
    setSelectedSession(session);
    setFormData({
      sessionDate: session.sessionDate.toISOString().split('T')[0],
      notes: session.notes || '',
      duration: session.duration?.toString() || ''
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status: CampaignSession['status']) => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-scheduled';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="session-manager">
      <div className="session-header">
        <div className="header-content">
          <h2>Campaign Sessions</h2>
          <p className="header-description">
            Manage sessions for this campaign. Track attendance and session progress.
          </p>
        </div>
        {isDM && (
          <button 
            className="create-session-btn" 
            onClick={() => setShowCreateModal(true)}
          >
            Create Session
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {sessions.length === 0 ? (
        <div className="empty-sessions">
          <h3>NO SESSIONS YET</h3>
          <p>Create your first session to start tracking campaign progress!</p>
          {isDM && (
            <button 
              className="btn-primary" 
              onClick={() => setShowCreateModal(true)}
            >
              Create First Session
            </button>
          )}
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <div className="session-info">
                  <h3>Session {session.sessionNumber}</h3>
                  <p className="session-date">
                    {session.sessionDate.toLocaleDateString()}
                  </p>
                  <span className={`status-badge ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                {isDM && (
                  <div className="session-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => handleEditSession(session)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              {session.notes && (
                <div className="session-notes">
                  <p>{session.notes}</p>
                </div>
              )}
              
              <div className="session-details">
                <div className="detail-item">
                  <span className="label">Duration:</span>
                  <span className="value">
                    {session.duration ? `${session.duration} minutes` : 'Not specified'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Players:</span>
                  <span className="value">{session.players.length}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Achievements:</span>
                  <span className="value">{session.assignedAchievements.length}</span>
                </div>
              </div>

              {isDM && (
                <div className="session-status-controls">
                  <select 
                    value={session.status}
                    onChange={(e) => handleStatusChange(session.id, e.target.value as CampaignSession['status'])}
                    className="status-select"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Session</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="session-form">
              <div className="form-group">
                <label htmlFor="sessionDate">Session Date:</label>
                <input
                  type="date"
                  id="sessionDate"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes):</label>
                <input
                  type="number"
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes:</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional session notes..."
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditModal && selectedSession && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Session {selectedSession.sessionNumber}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateSession} className="session-form">
              <div className="form-group">
                <label htmlFor="editSessionDate">Session Date:</label>
                <input
                  type="date"
                  id="editSessionDate"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editDuration">Duration (minutes):</label>
                <input
                  type="number"
                  id="editDuration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label htmlFor="editNotes">Notes:</label>
                <textarea
                  id="editNotes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional session notes..."
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
