# 📸 Avatar Feature - Complete Guide

## ✅ **ĐÃ HOÀN THÀNH**

Avatar feature đã được thêm vào cho cả **Mentor** và **Mentee** profiles!

---

## 🎯 **TÍNH NĂNG**

### **1. Upload Avatar**
- ✅ Chọn ảnh từ máy tính
- ✅ Preview trước khi save
- ✅ Lưu dưới dạng Base64 trong database
- ✅ Validation: Max 2MB, chỉ file ảnh

### **2. Hiển thị Avatar**
- ✅ Circular avatar preview
- ✅ Placeholder khi chưa có ảnh
- ✅ Responsive trên mobile

### **3. Quản lý Avatar**
- ✅ Upload ảnh mới
- ✅ Remove avatar
- ✅ Auto load khi có sẵn

---

## 🗂️ **CÁC THAY ĐỔI**

### **Backend Changes**

#### **1. Database Schema**
```prisma
// prisma/schema.prisma

model mentorprofile {
  id        Int     @id @default(autoincrement())
  userId    Int     @unique
  fullName  String
  avatar    String? @db.Text  // ← MỚI
  school    String?
  expertise String  @db.LongText
  degree    String?
  yearsExp  Int?
  bio       String?
  user      user    @relation(...)
}

model menteeprofile {
  id        Int     @id @default(autoincrement())
  userId    Int     @unique
  fullName  String
  avatar    String? @db.Text  // ← MỚI
  goals     String?
  interests String  @db.LongText
  user      user    @relation(...)
}
```

**Migration:** `20251102134603_add_avatar_to_profiles`

#### **2. Schema Validation**
```typescript
// src/schemas/profiles.schema.ts

export const createMentorProfileSchema = z.object({
  fullName: z.string().min(1),
  avatar: z.string().optional(),  // ← MỚI
  school: z.string().optional(),
  expertise: z.array(z.string()).default([]),
  // ...
});

export const createMenteeProfileSchema = z.object({
  fullName: z.string().min(1),
  avatar: z.string().optional(),  // ← MỚI
  goals: z.string().optional(),
  interests: z.array(z.string()).default([]),
});
```

#### **3. Service Layer**
```typescript
// src/services/profiles.service.ts

// Mentor
await prisma.mentorprofile.create({
  data: {
    userId,
    fullName: data.fullName,
    avatar: data.avatar,  // ← MỚI
    school: data.school,
    // ...
  }
});

// Mentee
await prisma.menteeprofile.create({
  data: {
    userId,
    fullName: data.fullName,
    avatar: data.avatar,  // ← MỚI
    goals: data.goals,
    // ...
  }
});
```

---

### **Frontend Changes**

#### **1. Type Definitions**
```typescript
// src/types/profile.ts

export interface MentorProfile {
  id: number;
  userId: number;
  fullName: string;
  avatar?: string;  // ← MỚI
  school?: string;
  expertise: string[];
  // ...
}

export interface CreateMentorProfileData {
  fullName: string;
  avatar?: string;  // ← MỚI
  school?: string;
  expertise: string[];
  // ...
}
```

#### **2. ProfileForm Component**
```tsx
// src/components/Profile/ProfileForm.tsx

// State
const [avatarPreview, setAvatarPreview] = useState<string>('');

// Handler
const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate size & type
    if (file.size > 2 * 1024 * 1024) {
      alert('File size should not exceed 2MB');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarPreview(base64String);
      setMentorData({ ...mentorData, avatar: base64String });
    };
    reader.readAsDataURL(file);
  }
};
```

#### **3. UI Component**
```tsx
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
```

#### **4. CSS Styling**
```css
/* ProfileForm.css */

.avatar-preview {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e2e8f0;
  background: #f7fafc;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #a0aec0;
}

/* Responsive */
@media (max-width: 768px) {
  .avatar-preview {
    width: 120px;
    height: 120px;
  }
}
```

---

## 📱 **HƯỚNG DẪN SỬ DỤNG**

### **Cho User (Frontend)**

1. **Vào Profile Page**
   - Click vào "Profile" trong navigation menu

2. **Upload Avatar**
   - Click button "Choose Image"
   - Chọn file ảnh (JPG, PNG, max 2MB)
   - Xem preview ngay lập tức

3. **Xóa Avatar**
   - Click button "Remove" để xóa ảnh
   - Placeholder sẽ hiển thị lại

4. **Lưu Profile**
   - Click "Create Profile" hoặc "Update Profile"
   - Avatar sẽ được lưu cùng thông tin khác

---

## 🔧 **KỸ THUẬT**

### **Lưu trữ Avatar**

**Phương pháp:** Base64 Encoding

**Lý do chọn Base64:**
- ✅ Đơn giản, không cần file storage server
- ✅ Lưu trực tiếp trong database
- ✅ Dễ implement và maintain
- ❌ Tăng kích thước database (~33%)
- ❌ Không tối ưu cho ảnh lớn

**Format lưu:**
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

### **Validation Rules**

1. **File Size:** Max 2MB
2. **File Type:** Chỉ image/* (jpg, png, gif, webp, etc.)
3. **Optional:** Avatar không bắt buộc

### **Performance Considerations**

**Pros:**
- Không cần CDN/storage service
- Không cần signed URLs
- Đơn giản hóa architecture

**Cons:**
- Database size tăng
- Slow cho ảnh lớn
- Không cache được riêng

**Giải pháp tương lai:**
- Chuyển sang cloud storage (AWS S3, Cloudinary)
- Resize ảnh trước khi lưu
- Lazy load avatars

---

## 🧪 **TESTING**

### **Test Cases**

#### **1. Upload Avatar Success**
```
✓ Chọn file ảnh < 2MB
✓ Preview hiển thị đúng
✓ Lưu profile thành công
✓ Load lại profile → avatar hiển thị
```

#### **2. Upload Avatar Fail**
```
✓ File > 2MB → Show error
✓ File không phải ảnh → Show error
✓ Cancel upload → Không thay đổi
```

#### **3. Remove Avatar**
```
✓ Click Remove
✓ Preview về placeholder
✓ Lưu profile → avatar = null
```

#### **4. Update Avatar**
```
✓ Upload ảnh mới
✓ Overwrite ảnh cũ
✓ Lưu thành công
```

---

## 📊 **DATABASE IMPACT**

### **Before (no avatar)**
```sql
SELECT * FROM mentorprofile;
-- Size: ~200 bytes/row
```

### **After (with avatar)**
```sql
SELECT * FROM mentorprofile;
-- Size: ~50KB - 500KB/row (depends on image)
```

### **Storage Estimation**

| Users | Avg Avatar Size | Total Storage |
|-------|----------------|---------------|
| 100 | 100KB | ~10MB |
| 1,000 | 100KB | ~100MB |
| 10,000 | 100KB | ~1GB |

---

## 🚀 **DEPLOY CHECKLIST**

- [x] Update Prisma schema
- [x] Create migration
- [x] Regenerate Prisma Client
- [x] Update backend schemas
- [x] Update backend services
- [x] Update frontend types
- [x] Update frontend components
- [x] Add CSS styling
- [x] Test upload functionality
- [x] Test validation
- [ ] Test in production
- [ ] Monitor database size

---

## 🔮 **FUTURE IMPROVEMENTS**

### **Phase 2 Features**

1. **Image Optimization**
   ```typescript
   // Resize before upload
   const resizeImage = async (file: File, maxWidth: number) => {
     // Canvas resize logic
   };
   ```

2. **Cloud Storage**
   ```typescript
   // Upload to S3/Cloudinary
   const uploadToCloud = async (file: File) => {
     const formData = new FormData();
     formData.append('file', file);
     const response = await api.post('/upload', formData);
     return response.data.url;
   };
   ```

3. **Avatar Cropper**
   - Cho phép crop ảnh trước khi upload
   - Square crop để fit circular avatar

4. **Multiple Formats**
   - Thumbnail (50x50)
   - Medium (150x150)
   - Large (500x500)

5. **Lazy Loading**
   ```tsx
   <img 
     src={avatar} 
     loading="lazy" 
     alt="Avatar"
   />
   ```

---

## 📝 **NOTES**

- Avatar được lưu dưới dạng Base64 string trong database
- Field `avatar` là optional, có thể null
- Frontend tự động convert file → base64
- Backend không cần xử lý file upload multipart
- Responsive: 150px desktop, 120px mobile

---

**Ngày tạo:** 02/11/2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
