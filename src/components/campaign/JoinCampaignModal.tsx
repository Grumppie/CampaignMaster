import React, { useState } from 'react';
import { Campaign } from '../../types';
import './JoinCampaignModal.css';

interface JoinCampaignModalProps {
  campaign: Campaign;
  onJoin: (characterName: string) => void;
  onClose: () => void;
}

export const JoinCampaignModal: React.FC<JoinCampaignModalProps> = ({
  campaign,
  onJoin,
  onClose
}) => {
  const [characterName, setCharacterName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!characterName.trim()) {
      setError('Please enter a character name');
      return;
    }

    // Check if character name is already taken
    const isNameTaken = campaign.players.some(
      player => player.characterName.toLowerCase() === characterName.trim().toLowerCase()
    );

    if (isNameTaken) {
      setError('This character name is already taken');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      await onJoin(characterName.trim());
      setIsSuccess(true);
      // Modal will be closed by parent component
    } catch (err) {
      setError('Failed to join campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="join-modal-overlay" onClick={onClose}>
      <div className="join-modal" onClick={(e) => e.stopPropagation()}>
        <div className="join-modal-header">
          <h2>Join Campaign</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="join-modal-content">
          <div className="campaign-info">
            <h3>{campaign.name}</h3>
            <p>{campaign.description}</p>
            <p className="dm-info">DM: {campaign.dmName}</p>
          </div>

          <form onSubmit={handleSubmit} className="join-form">
            <div className="form-group">
              <label htmlFor="characterName">Character Name</label>
              <input
                type="text"
                id="characterName"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Enter your character's name..."
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {isSuccess && (
              <div className="success-message">
                Successfully joined campaign! Redirecting...
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading || isSuccess}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || isSuccess}
              >
                {isLoading ? 'Joining...' : isSuccess ? 'Success!' : 'Join Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 