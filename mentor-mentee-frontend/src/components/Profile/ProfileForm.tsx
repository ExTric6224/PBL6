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
  const [existingProfile, setExistingProfile] = useState<MentorProfile | MenteeProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [mentorData, setMentorData] = useState<CreateMentorProfileData>({
    fullName: '',
    avatar: '',
    school: '',
    expertise: [], // Now number[] (topic IDs)
    degree: '',
    yearsExp: 0,
    bio: '',
  });
  const [menteeData, setMenteeData] = useState<CreateMenteeProfileData>({
    fullName: '',
    avatar: '',
    interests: [], // Now number[] (topic IDs)
    goals: '',
  });

  // Handle avatar file selection and preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Store file and create preview
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
        
        // Extract topic IDs from Topic objects
        const expertiseIds = profile.expertise.map(topic => topic.id);
        
        setMentorData({
          fullName: profile.fullName,
          avatar: profile.avatar || '',
          school: profile.school || '',
          bio: profile.bio || '',
          expertise: expertiseIds, // Store as number[]
          degree: profile.degree || '',
          yearsExp: profile.yearsExp || 0,
        });
        // Set preview to server path if exists
        if (profile.avatar) {
          // Remove /api from REACT_APP_API_URL and use just the base URL
          const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
          const avatarUrl = `${baseUrl}${profile.avatar}`;
          console.log('[DEBUG] Avatar path from DB:', profile.avatar);
          console.log('[DEBUG] Full avatar URL:', avatarUrl);
          setAvatarPreview(avatarUrl);
        }
      } else if (isMentee) {
        const profile = await profileApi.getMenteeProfile(user.id);
        setExistingProfile(profile);
        
        // Extract topic IDs from Topic objects
        const interestIds = profile.interests.map(topic => topic.id);
        
        setMenteeData({
          fullName: profile.fullName,
          avatar: profile.avatar || '',
          interests: interestIds, // Store as number[]
          goals: profile.goals || '',
        });
        // Set preview to server path if exists
        if (profile.avatar) {
          // Remove /api from REACT_APP_API_URL and use just the base URL
          const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
          const avatarUrl = `${baseUrl}${profile.avatar}`;
          console.log('[DEBUG] Avatar path from DB:', profile.avatar);
          console.log('[DEBUG] Full avatar URL:', avatarUrl);
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

  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileApi.createOrUpdateMentorProfile(mentorData, avatarFile || undefined);
      alert('Mentor profile saved successfully!');
      setAvatarFile(null); // Clear file after successful upload
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save profile');
    }
  };

  const handleMenteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] Submitting mentee data:', menteeData);
    console.log('[DEBUG] Interests array:', menteeData.interests);
    try {
      await profileApi.createOrUpdateMenteeProfile(menteeData, avatarFile || undefined);
      alert('Mentee profile saved successfully!');
      setAvatarFile(null); // Clear file after successful upload
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save profile');
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 {isMentor ? 'Mentor' : 'Mentee'} Profile</h1>
      </div>

      <div className="profile-card">
        <div className="profile-info">
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{user?.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Role</span>
            <span className="info-value">{user?.role}</span>
          </div>
        </div>

        {isMentor && (
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
                      <p>No Image</p>
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
                    Choose Image
                  </label>
                  {avatarPreview && (
                    <button type="button" className="btn btn-danger" onClick={removeAvatar}>
                      Remove
                    </button>
                  )}
                  <small className="text-muted">Max 2MB, JPG/PNG</small>
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

            <button type="submit" className="btn btn-primary">
              {existingProfile ? 'Update Profile' : 'Create Profile'}
            </button>
          </form>
        )}

        {isMentee && (
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
                      <p>No Image</p>
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
                    Choose Image
                  </label>
                  {avatarPreview && (
                    <button type="button" className="btn btn-danger" onClick={removeAvatar}>
                      Remove
                    </button>
                  )}
                  <small className="text-muted">Max 2MB, JPG/PNG</small>
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

            <button type="submit" className="btn btn-primary">
              {existingProfile ? 'Update Profile' : 'Create Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileForm;
