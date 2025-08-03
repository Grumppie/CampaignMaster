import React, { useState } from 'react';
import { AchievementUpgrade } from '../../types';
import './CreateAchievementModal.css';

interface CreateAchievementModalProps {
  campaignId: string;
  onCreate: (achievementData: {
    name: string;
    description: string;
    basePoints: number;
    upgrades: AchievementUpgrade[];
  }) => void;
  onClose: () => void;
}

export const CreateAchievementModal: React.FC<CreateAchievementModalProps> = ({
  campaignId,
  onCreate,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePoints: 1
  });
  const [upgrades, setUpgrades] = useState<Omit<AchievementUpgrade, 'id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basePoints' ? parseInt(value) || 0 : value
    }));
  };

  const addUpgrade = () => {
    setUpgrades(prev => [...prev, {
      name: '',
      description: '',
      requiredCount: 0,
      points: 0
    }]);
  };

  const removeUpgrade = (index: number) => {
    setUpgrades(prev => prev.filter((_, i) => i !== index));
  };

  const updateUpgrade = (index: number, field: keyof AchievementUpgrade, value: string | number) => {
    setUpgrades(prev => prev.map((upgrade, i) => 
      i === index ? { ...upgrade, [field]: value } : upgrade
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.basePoints < 0) {
      setError('Base points cannot be negative');
      return;
    }

    // Validate upgrades
    for (let i = 0; i < upgrades.length; i++) {
      const upgrade = upgrades[i];
      if (!upgrade.name.trim() || !upgrade.description.trim()) {
        setError(`Please fill in all fields for upgrade ${i + 1}`);
        return;
      }
      if (upgrade.requiredCount <= 0) {
        setError(`Required count for upgrade ${i + 1} must be greater than 0`);
        return;
      }
      if (upgrade.points < 0) {
        setError(`Points for upgrade ${i + 1} cannot be negative`);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const achievementData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        basePoints: formData.basePoints,
        upgrades: upgrades.map((upgrade, index) => ({
          ...upgrade,
          id: `upgrade-${index}`,
          name: upgrade.name.trim(),
          description: upgrade.description.trim()
        }))
      };

      await onCreate(achievementData);
    } catch (err) {
      setError('Failed to create achievement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-achievement-modal-overlay" onClick={onClose}>
      <div className="create-achievement-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Achievement</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-achievement-form">
          <div className="form-group">
            <label htmlFor="name">Achievement Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Fireball Newbie"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what this achievement tracks..."
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="basePoints">Base Points</label>
            <input
              type="number"
              id="basePoints"
              name="basePoints"
              value={formData.basePoints}
              onChange={handleInputChange}
              min="0"
              placeholder="1"
            />
          </div>

          <div className="upgrades-section">
            <div className="upgrades-header">
              <h3>Achievement Upgrades</h3>
              <button
                type="button"
                onClick={addUpgrade}
                className="add-upgrade-btn"
              >
                + Add Upgrade
              </button>
            </div>

            {upgrades.map((upgrade, index) => (
              <div key={index} className="upgrade-card">
                <div className="upgrade-header">
                  <h4>Upgrade {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeUpgrade(index)}
                    className="remove-upgrade-btn"
                  >
                    Remove
                  </button>
                </div>

                <div className="upgrade-fields">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={upgrade.name}
                      onChange={(e) => updateUpgrade(index, 'name', e.target.value)}
                      placeholder="e.g., Fireball Novice"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={upgrade.description}
                      onChange={(e) => updateUpgrade(index, 'description', e.target.value)}
                      placeholder="Describe this upgrade level..."
                      rows={2}
                    />
                  </div>

                  <div className="upgrade-stats">
                    <div className="form-group">
                      <label>Required Count</label>
                      <input
                        type="number"
                        value={upgrade.requiredCount}
                        onChange={(e) => updateUpgrade(index, 'requiredCount', parseInt(e.target.value) || 0)}
                        min="1"
                        placeholder="10"
                      />
                    </div>

                    <div className="form-group">
                      <label>Points</label>
                      <input
                        type="number"
                        value={upgrade.points}
                        onChange={(e) => updateUpgrade(index, 'points', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {upgrades.length === 0 && (
              <p className="no-upgrades">
                No upgrades added yet. Click "Add Upgrade" to create achievement levels.
              </p>
            )}
          </div>

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
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 