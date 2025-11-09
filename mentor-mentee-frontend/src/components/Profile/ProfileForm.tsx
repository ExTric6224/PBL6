import React, { useState, useEffect, useCallback } from 'react';
import { profileApi } from '../../services/profileApi';
import { useAuth } from '../../context/AuthContext';
import { CreateMentorProfileData, CreateMenteeProfileData, MentorProfile, MenteeProfile } from '../../types/profile';
import TopicSelector from '../Topics/TopicSelector';
import './ProfileForm.css';

const ProfileForm: React.FC = () => {
  const { user } = useAuth();
  const isMentor = user?.role === 'MENTOR';
  const isMentee = user?.role === 'MENTEE';

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingProfile, setExistingProfile] = useState<MentorProfile | MenteeProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [mentorData, setMentorData] = useState<CreateMentorProfileData>({
    fullName: '',
    avatar: '',
    school: '',
    expertise: [],
    degree: '',
    yearsExp: 0,
    bio: '',
  });
  const [menteeData, setMenteeData] = useState<CreateMenteeProfileData>({
    fullName: '',
    avatar: '',
    interests: [],
    goals: '',
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview('');
    setAvatarFile(null);
    if (isMentor) {
      setMentorData({ ...mentorData, avatar: '' });
    } else {
      setMenteeData({ ...menteeData, avatar: '' });
    }
  };

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      if (isMentor) {
        const profile = await profileApi.getMentorProfile(user.id);
        setExistingProfile(profile);
        
        const expertiseIds = profile.expertise.map(topic => topic.id);
        
        setMentorData({
          fullName: profile.fullName,
          avatar: profile.avatar || '',
          school: profile.school || '',
          bio: profile.bio || '',
          expertise: expertiseIds,
          degree: profile.degree || '',
          yearsExp: profile.yearsExp || 0,
        });
        
        if (profile.avatar) {
          const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
          const avatarUrl = `${baseUrl}${profile.avatar}`;
          setAvatarPreview(avatarUrl);
        }
      } else if (isMentee) {
        const profile = await profileApi.getMenteeProfile(user.id);
        setExistingProfile(profile);
        
        const interestIds = profile.interests.map(topic => topic.id);
        
        setMenteeData({
          fullName: profile.fullName,
          avatar: profile.avatar || '',
          interests: interestIds,
          goals: profile.goals || '',
        });
        
        if (profile.avatar) {
          const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
          const avatarUrl = `${baseUrl}${profile.avatar}`;
          setAvatarPreview(avatarUrl);
        }
      }
    } catch (err: any) {
      console.log('No existing profile found');
    } finally {
      setLoading(false);
    }
  }, [user, isMentor, isMentee]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!loading && !existingProfile) {
      setIsEditing(true);
    }
  }, [loading, existingProfile]);

  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileApi.createOrUpdateMentorProfile(mentorData, avatarFile || undefined);
      alert('Mentor profile saved successfully!');
      setAvatarFile(null);
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save profile');
    }
  };

  const handleMenteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileApi.createOrUpdateMenteeProfile(menteeData, avatarFile || undefined);
      alert('Mentee profile saved successfully!');
      setAvatarFile(null);
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save profile');
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    loadProfile();
  };

  if (loading) {
    return <div className="loading">✨ Loading profile...</div>;
  }

  const renderMentorView = () => {
    const profile = existingProfile as MentorProfile;
    return (
      <div className="profile-view">
        <div className="profile-view-header">
          <div className="profile-avatar-large">
            {avatarPreview ? (
              <img src={avatarPreview} alt={profile.fullName} />
            ) : (
              <div className="avatar-placeholder-large">
                <span>👨‍🏫</span>
              </div>
            )}
          </div>
          <div className="profile-view-info">
            <h2>{profile.fullName}</h2>
            <p className="profile-role">🎓 {user?.role}</p>
            <p className="profile-email">📧 {user?.email}</p>
          </div>
        </div>

        <div className="profile-details">
          {profile.school && (
            <div className="detail-item">
              <span className="detail-label">🏫 School</span>
              <span className="detail-value">{profile.school}</span>
            </div>
          )}
          
          {profile.degree && (
            <div className="detail-item">
              <span className="detail-label">🎓 Degree</span>
              <span className="detail-value">{profile.degree}</span>
            </div>
          )}
          
          {profile.yearsExp !== undefined && (
            <div className="detail-item">
              <span className="detail-label">💼 Experience</span>
              <span className="detail-value">{profile.yearsExp} years</span>
            </div>
          )}
          
          {profile.bio && (
            <div className="detail-item">
              <span className="detail-label">📝 Bio</span>
              <p className="detail-value">{profile.bio}</p>
            </div>
          )}
          
          {profile.expertise && profile.expertise.length > 0 && (
            <div className="detail-item">
              <span className="detail-label">🎯 Expertise</span>
              <div className="topics-display">
                {profile.expertise.map((topic) => (
                  <span key={topic.id} className="topic-badge">
                    {topic.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleEditClick}>
          ✏️ Edit Profile
        </button>
      </div>
    );
  };

  const renderMenteeView = () => {
    const profile = existingProfile as MenteeProfile;
    return (
      <div className="profile-view">
        <div className="profile-view-header">
          <div className="profile-avatar-large">
            {avatarPreview ? (
              <img src={avatarPreview} alt={profile.fullName} />
            ) : (
              <div className="avatar-placeholder-large">
                <span>👩‍🎓</span>
              </div>
            )}
          </div>
          <div className="profile-view-info">
            <h2>{profile.fullName}</h2>
            <p className="profile-role">🎓 {user?.role}</p>
            <p className="profile-email">📧 {user?.email}</p>
          </div>
        </div>

        <div className="profile-details">
          {profile.goals && (
            <div className="detail-item">
              <span className="detail-label">🎯 Goals</span>
              <p className="detail-value">{profile.goals}</p>
            </div>
          )}
          
          {profile.interests && profile.interests.length > 0 && (
            <div className="detail-item">
              <span className="detail-label">💡 Interests</span>
              <div className="topics-display">
                {profile.interests.map((topic) => (
                  <span key={topic.id} className="topic-badge">
                    {topic.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleEditClick}>
          ✏️ Edit Profile
        </button>
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 {isMentor ? 'Mentor' : 'Mentee'} Profile</h1>
        {isEditing && existingProfile && (
          <button className="btn btn-secondary" onClick={handleCancelEdit}>
            ← Back to Profile
          </button>
        )}
      </div>

      <div className="profile-card">
        {!isEditing && existingProfile && isMentor && renderMentorView()}
        {!isEditing && existingProfile && isMentee && renderMenteeView()}

        {isEditing && isMentor && (
          <form className="profile-form" onSubmit={handleMentorSubmit}>
            <div className="avatar-section">
              <label>Profile Picture</label>
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>📷</span>
                      <p>Add Photo</p>
                    </div>
                  )}
                </div>
                <div className="avatar-actions">
                  <input
                    type="file"
                    id="mentor-avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="mentor-avatar" className="btn btn-secondary">
                    📁 Choose Image
                  </label>
                  {avatarPreview && (
                    <button type="button" className="btn btn-danger" onClick={removeAvatar}>
                      🗑️ Remove
                    </button>
                  )}
                  <small className="text-muted">Max 5MB, JPG/PNG/WebP</small>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={mentorData.fullName}
                onChange={(e) => setMentorData({ ...mentorData, fullName: e.target.value })}
                required
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label>School</label>
              <input
                type="text"
                value={mentorData.school}
                onChange={(e) => setMentorData({ ...mentorData, school: e.target.value })}
                placeholder="e.g. MIT, Stanford, etc."
              />
            </div>

            <div className="form-group">
              <label>Degree</label>
              <input
                type="text"
                value={mentorData.degree}
                onChange={(e) => setMentorData({ ...mentorData, degree: e.target.value })}
                placeholder="e.g. Master of Computer Science"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={mentorData.bio}
                onChange={(e) => setMentorData({ ...mentorData, bio: e.target.value })}
                placeholder="Tell mentees about yourself..."
                rows={4}
              />
            </div>

            <TopicSelector
              selectedTopicIds={mentorData.expertise}
              onChange={(topicIds) => setMentorData({ ...mentorData, expertise: topicIds })}
              label="Expertise *"
              placeholder="Select your areas of expertise..."
            />

            <div className="form-group">
              <label>Years of Experience</label>
              <div className="experience-input">
                <input
                  type="number"
                  value={mentorData.yearsExp}
                  onChange={(e) => setMentorData({ 
                    ...mentorData, 
                    yearsExp: parseInt(e.target.value) || 0 
                  })}
                  min="0"
                  max="50"
                />
                <span>years</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {existingProfile ? '💾 Save Changes' : '✨ Create Profile'}
              </button>
              {existingProfile && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {isEditing && isMentee && (
          <form className="profile-form" onSubmit={handleMenteeSubmit}>
            <div className="avatar-section">
              <label>Profile Picture</label>
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>📷</span>
                      <p>Add Photo</p>
                    </div>
                  )}
                </div>
                <div className="avatar-actions">
                  <input
                    type="file"
                    id="mentee-avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="mentee-avatar" className="btn btn-secondary">
                    📁 Choose Image
                  </label>
                  {avatarPreview && (
                    <button type="button" className="btn btn-danger" onClick={removeAvatar}>
                      🗑️ Remove
                    </button>
                  )}
                  <small className="text-muted">Max 5MB, JPG/PNG/WebP</small>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={menteeData.fullName}
                onChange={(e) => setMenteeData({ ...menteeData, fullName: e.target.value })}
                required
                placeholder="Your full name"
              />
            </div>

            <TopicSelector
              selectedTopicIds={menteeData.interests}
              onChange={(topicIds) => setMenteeData({ ...menteeData, interests: topicIds })}
              label="Interests *"
              placeholder="Select topics you're interested in..."
            />

            <div className="form-group">
              <label>Goals</label>
              <textarea
                value={menteeData.goals}
                onChange={(e) => setMenteeData({ ...menteeData, goals: e.target.value })}
                required
                placeholder="What do you want to achieve?"
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {existingProfile ? '💾 Save Changes' : '✨ Create Profile'}
              </button>
              {existingProfile && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileForm;