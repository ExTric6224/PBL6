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
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingProfile, setExistingProfile] = useState<MentorProfile | MenteeProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [mentorData, setMentorData] = useState<CreateMentorProfileData>({
    fullName: '',
    avatar: '',
    phoneNumber: '',
    school: '',
    expertise: [],
    degree: '',
    yearsExp: 0,
    bio: '',
  });
  const [menteeData, setMenteeData] = useState<CreateMenteeProfileData>({
    fullName: '',
    avatar: '',
    phoneNumber: '',
    interests: [],
    goals: '',
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
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
          phoneNumber: profile.phoneNumber || '',
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
          phoneNumber: profile.phoneNumber || '',
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
      console.log('Không tìm thấy hồ sơ hiện có:', err);
      setExistingProfile(null);
    } finally {
      setLoading(false);
      setProfileLoaded(true);
    }
  }, [user, isMentor, isMentee]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    // Only switch to edit mode if profile loading is complete and no profile exists
    if (profileLoaded && !existingProfile) {
      setIsEditing(true);
    }
  }, [profileLoaded, existingProfile]);

  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number if provided
    if (mentorData.phoneNumber && mentorData.phoneNumber.trim() !== '') {
      const phoneRegex = /^[+]?[\d\s-()]+$/;
      if (!phoneRegex.test(mentorData.phoneNumber)) {
        alert('Số điện thoại chỉ có thể chứa chữ số, khoảng trắng, +, -, và dấu ngoặc');
        return;
      }
      const digitsOnly = mentorData.phoneNumber.replace(/[^\d]/g, '');
      if (digitsOnly.length < 10) {
        alert('Số điện thoại phải có ít nhất 10 chữ số');
        return;
      }
      if (mentorData.phoneNumber.length > 20) {
        alert('Số điện thoại không được vượt quá 20 ký tự');
        return;
      }
    }
    
    try {
      await profileApi.createOrUpdateMentorProfile(mentorData, avatarFile || undefined);
      alert('Đã lưu hồ sơ mentor thành công!');
      setAvatarFile(null);
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể lưu hồ sơ');
    }
  };

  const handleMenteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number if provided
    if (menteeData.phoneNumber && menteeData.phoneNumber.trim() !== '') {
      const phoneRegex = /^[+]?[\d\s-()]+$/;
      if (!phoneRegex.test(menteeData.phoneNumber)) {
        alert('Số điện thoại chỉ có thể chứa chữ số, khoảng trắng, +, -, và dấu ngoặc');
        return;
      }
      const digitsOnly = menteeData.phoneNumber.replace(/[^\d]/g, '');
      if (digitsOnly.length < 10) {
        alert('Số điện thoại phải có ít nhất 10 chữ số');
        return;
      }
      if (menteeData.phoneNumber.length > 20) {
        alert('Số điện thoại không được vượt quá 20 ký tự');
        return;
      }
    }
    
    try {
      await profileApi.createOrUpdateMenteeProfile(menteeData, avatarFile || undefined);
      alert('Đã lưu hồ sơ mentee thành công!');
      setAvatarFile(null);
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể lưu hồ sơ');
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
    return <div className="loading">✨ Đang tải hồ sơ...</div>;
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
            {profile.phoneNumber && (
              <p className="profile-phone">📱 {profile.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="profile-details">
          {profile.school && (
            <div className="detail-item">
              <span className="detail-label">🏫 Trường</span>
              <span className="detail-value">{profile.school}</span>
            </div>
          )}
          
          {profile.degree && (
            <div className="detail-item">
              <span className="detail-label">🎓 Bằng cấp</span>
              <span className="detail-value">{profile.degree}</span>
            </div>
          )}
          
          {profile.yearsExp !== undefined && (
            <div className="detail-item">
              <span className="detail-label">💼 Kinh nghiệm</span>
              <span className="detail-value">{profile.yearsExp} năm</span>
            </div>
          )}
          
          {profile.bio && (
            <div className="detail-item">
              <span className="detail-label">📝 Giới thiệu</span>
              <p className="detail-value">{profile.bio}</p>
            </div>
          )}
          
          {profile.expertise && profile.expertise.length > 0 && (
            <div className="detail-item">
              <span className="detail-label">🎯 Chuyên môn</span>
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
          ✏️ Chỉnh sửa hồ sơ
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
            {profile.phoneNumber && (
              <p className="profile-phone">📱 {profile.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="profile-details">
          {profile.goals && (
            <div className="detail-item">
              <span className="detail-label">🎯 Mục tiêu</span>
              <p className="detail-value">{profile.goals}</p>
            </div>
          )}
          
          {profile.interests && profile.interests.length > 0 && (
            <div className="detail-item">
              <span className="detail-label">💡 Sở thích</span>
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
          ✏️ Chỉnh sửa hồ sơ
        </button>
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 Hồ sơ {isMentor ? 'Mentor' : 'Mentee'}</h1>
        {isEditing && existingProfile && (
          <button className="btn btn-secondary" onClick={handleCancelEdit}>
            ← Quay lại hồ sơ
          </button>
        )}
      </div>

      <div className="profile-card">
        {!isEditing && existingProfile && isMentor && renderMentorView()}
        {!isEditing && existingProfile && isMentee && renderMenteeView()}

        {isEditing && isMentor && (
          <form className="profile-form" onSubmit={handleMentorSubmit}>
            <div className="avatar-section">
              <label>Ảnh hồ sơ</label>
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
                    📁 Chọn ảnh
                  </label>
                  {avatarPreview && (
                    <button type="button" className="btn btn-danger" onClick={removeAvatar}>
                      🗑️ Xóa
                    </button>
                  )}
                  <small className="text-muted">Tối đa 5MB, JPG/PNG/WebP</small>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Họ và tên *</label>
              <input
                type="text"
                value={mentorData.fullName}
                onChange={(e) => setMentorData({ ...mentorData, fullName: e.target.value })}
                required
                placeholder="Họ và tên của bạn"
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                value={mentorData.phoneNumber || ''}
                onChange={(e) => setMentorData({ ...mentorData, phoneNumber: e.target.value })}
                pattern="[+]?[\d\s-()]+"
                minLength={10}
                maxLength={20}
                placeholder="Ví dụ: +84912345678"
                title="Số điện thoại chỉ có thể chứa chữ số, khoảng trắng, +, -, và dấu ngoặc. Phải có 10-20 ký tự."
              />
            </div>

            <div className="form-group">
              <label>Trường</label>
              <input
                type="text"
                value={mentorData.school}
                onChange={(e) => setMentorData({ ...mentorData, school: e.target.value })}
                placeholder="Ví dụ: ĐH Bách Khoa, ĐH Công Nghệ..."
              />
            </div>

            <div className="form-group">
              <label>Bằng cấp</label>
              <input
                type="text"
                value={mentorData.degree}
                onChange={(e) => setMentorData({ ...mentorData, degree: e.target.value })}
                placeholder="Ví dụ: Thạc sĩ Khoa học Máy tính"
              />
            </div>

            <div className="form-group">
              <label>Giới thiệu</label>
              <textarea
                value={mentorData.bio}
                onChange={(e) => setMentorData({ ...mentorData, bio: e.target.value })}
                placeholder="Giới thiệu bản thân với mentee..."
                rows={4}
              />
            </div>

            <TopicSelector
              selectedTopicIds={mentorData.expertise}
              onChange={(topicIds) => setMentorData({ ...mentorData, expertise: topicIds })}
              label="Chuyên môn *"
              placeholder="Chọn lĩnh vực chuyên môn của bạn..."
            />

            <div className="form-group">
              <label>Số năm kinh nghiệm</label>
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
                <span>năm</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {existingProfile ? '💾 Lưu thay đổi' : '✨ Tạo hồ sơ'}
              </button>
              {existingProfile && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Huỷ
                </button>
              )}
            </div>
          </form>
        )}

        {isEditing && isMentee && (
          <form className="profile-form" onSubmit={handleMenteeSubmit}>
            <div className="avatar-section">
              <label>Ảnh đại diện</label>
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>📷</span>
                      <p>Thêm ảnh</p>
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
                    📁 Chọn ảnh
                  </label>
                  {avatarPreview && (
                    <button type="button" className="btn btn-danger" onClick={removeAvatar}>
                      🗑️ Xóa
                    </button>
                  )}
                  <small className="text-muted">Tối đa 5MB, JPG/PNG/WebP</small>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Họ và tên *</label>
              <input
                type="text"
                value={menteeData.fullName}
                onChange={(e) => setMenteeData({ ...menteeData, fullName: e.target.value })}
                required
                placeholder="Họ và tên của bạn"
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                value={menteeData.phoneNumber || ''}
                onChange={(e) => setMenteeData({ ...menteeData, phoneNumber: e.target.value })}
                pattern="[+]?[\d\s-()]+"
                minLength={10}
                maxLength={20}
                placeholder="Ví dụ: +84912345678"
                title="Số điện thoại chỉ có thể chứa chữ số, khoảng trắng, +, -, và dấu ngoặc. Phải có 10-20 ký tự."
              />
            </div>

            <TopicSelector
              selectedTopicIds={menteeData.interests}
              onChange={(topicIds) => setMenteeData({ ...menteeData, interests: topicIds })}
              label="Sở thích *"
              placeholder="Chọn chủ đề bạn quan tâm..."
            />

            <div className="form-group">
              <label>Mục tiêu</label>
              <textarea
                value={menteeData.goals}
                onChange={(e) => setMenteeData({ ...menteeData, goals: e.target.value })}
                required
                placeholder="Bạn muốn đạt được điều gì?"
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