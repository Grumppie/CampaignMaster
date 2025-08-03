import React, { useState } from 'react';
import { GlobalAchievement } from '../../types';
import './AssignAchievementModal.css';

interface AssignAchievementModalProps {
  availableAchievements: GlobalAchievement[];
  onAssign: (globalAchievementId: string) => void;
  onClose: () => void;
}

export const AssignAchievementModal: React.FC<AssignAchievementModalProps> = ({
  availableAchievements,
  onAssign,
  onClose
}) => {
  const [selectedAchievementId, setSelectedAchievementId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAchievementId) {
      setError('Please select an achievement to assign');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onAssign(selectedAchievementId);
    } catch (err) {
      setError('Failed to assign achievement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="assign-achievement-modal-overlay" onClick={onClose}>
      <div className="assign-achievement-modal" onClick={(e) => e.stopPropagation()}>
        <div className="assign-achievement-modal-header">
          <h2>Assign Achievement</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="assign-achievement-modal-content">
          <p className="modal-description">
            Select an achievement from the global library to assign to this campaign.
          </p>

          <form onSubmit={handleSubmit} className="assign-form">
            <div className="form-group">
              <label htmlFor="achievementSelect">Select Achievement</label>
              <select
                id="achievementSelect"
                value={selectedAchievementId}
                onChange={(e) => setSelectedAchievementId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Choose an achievement...</option>
                {availableAchievements.map((achievement) => (
                  <option key={achievement.id} value={achievement.id}>
                    {achievement.name} - {achievement.description}
                  </option>
                ))}
              </select>
            </div>

            {selectedAchievementId && (
              <div className="selected-achievement-preview">
                {(() => {
                  const achievement = availableAchievements.find(a => a.id === selectedAchievementId);
                  if (!achievement) return null;
                  
                  return (
                    <div className="achievement-preview">
                      <h4>{achievement.name}</h4>
                      <p>{achievement.description}</p>
                      <div className="achievement-details">
                        <span>Base Points: {achievement.basePoints}</span>
                        <span>Upgrades: {achievement.upgrades.length}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || !selectedAchievementId}
              >
                {isLoading ? 'Assigning...' : 'Assign Achievement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 