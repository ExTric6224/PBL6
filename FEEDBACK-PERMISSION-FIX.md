# 🔧 Sửa Phân Quyền Feedback - Permission Fix

## 📋 Tổng Quan

Đã sửa lại chức năng Feedback để tuân thủ đúng bảng phân quyền:

| Tính Năng | Mentee | Mentor |
|-----------|--------|--------|
| Tạo feedback | ✅ | ❌ |
| Xem feedback đã tạo | ✅ | ❌ |
| Xem feedback nhận được | ❌ | ✅ |
| Sửa/Xóa feedback | ❌ | ❌ |
| Xem feedback của mentor khác | ✅ | ✅ |

---

## 🔨 Thay Đổi

### 1. Backend Controller (`feedbacks.controller.ts`)

**Đã sửa:** Thêm comment rõ ràng về quyền hạn

```typescript
async getMyFeedbacks(req: AuthenticatedRequest, res: Response) {
  try {
    // MENTEE: Xem feedback đã tạo (feedback:view_own)
    // MENTOR: Xem feedback nhận được (feedback:view_own)
    
    if (req.user!.role === 'MENTEE') {
      // Mentee chỉ xem feedback mà họ đã tạo
      const feedbacks = await feedbacksService.getFeedbacksByMentee(req.user!.sub);
      return success(res, {
        data: feedbacks,
        total: feedbacks.length,
        page: 1,
        limit: feedbacks.length,
        totalPages: 1
      });
    } else if (req.user!.role === 'MENTOR') {
      // Mentor chỉ xem feedback mà họ nhận được
      const result = await feedbacksService.getFeedbacksByMentor(req.user!.sub, req.query as any);
      return success(res, {
        data: result.feedbacks,
        total: result.feedbacks.length,
        page: 1,
        limit: result.feedbacks.length,
        totalPages: 1,
        stats: result.stats
      });
    } else {
      return authError(res, 'Invalid user role');
    }
  } catch (error: any) {
    throw error;
  }
}
```

---

### 2. Frontend Component (`FeedbackForm.tsx`)

#### ✅ Thêm Logic Phân Quyền

```typescript
import { useAuth } from '../../context/AuthContext';

const { user } = useAuth();
const isMentee = user?.role === 'MENTEE';
const isMentor = user?.role === 'MENTOR';
```

#### ✅ UI Theo Role

**Header với Subtitle:**
```tsx
<div className="feedback-header">
  <h1>⭐ Feedback</h1>
  <p className="feedback-subtitle">
    {isMentee && 'View feedbacks you have given to mentors'}
    {isMentor && 'View feedbacks you have received from mentees'}
  </p>
</div>
```

**Form Chỉ Cho MENTEE:**
```tsx
{/* Only MENTEE can create feedback */}
{isMentee && showForm && (
  <form className="feedback-form" onSubmit={handleSubmit}>
    {/* Form content */}
  </form>
)}

{/* Only MENTEE can see create button */}
{isMentee && !showForm && (
  <button className="create-post-btn" onClick={() => setShowForm(true)}>
    ✚ Give Feedback
  </button>
)}
```

**Danh Sách Feedback Theo Role:**
```tsx
<div className="feedback-list">
  <h2>
    {isMentee && 'Feedbacks I Have Given'}
    {isMentor && 'Feedbacks I Have Received'}
  </h2>
  
  {feedbacks.length === 0 ? (
    <div className="empty-state">
      {isMentee && 'You haven\'t given any feedback yet.'}
      {isMentor && 'You haven\'t received any feedback yet.'}
    </div>
  ) : (
    feedbacks.map((feedback) => (
      <div key={feedback.id} className="feedback-card">
        {/* ... */}
        <div className="feedback-meta">
          {/* MENTEE sees: Feedback for Mentor X */}
          {isMentee && `Feedback for: ${feedback.mentor?.email || 'Unknown Mentor'}`}
          
          {/* MENTOR sees: Feedback from Mentee X */}
          {isMentor && `Feedback from: ${feedback.mentee?.email || 'Anonymous Mentee'}`}
        </div>
      </div>
    ))
  )}
</div>
```

---

### 3. API Service (`feedbackApi.ts`)

**Đã sửa lỗi:** Response wrapping issue

```typescript
// Before (LỖI):
return response.data; // Trả về { data: { data: [], total: ... } }

// After (ĐÚNG):
return response.data.data; // Trả về { data: [], total: ... }
```

---

## 🔐 API Routes (Không Thay Đổi)

Routes đã đúng từ trước:

```typescript
// POST /api/feedbacks - Tạo feedback
router.post('/', 
  authenticate, 
  authorizePermissions('feedback:create'), // Chỉ MENTEE có permission này
  validate(createFeedbackSchema), 
  feedbacksController.createFeedback
);

// GET /api/feedbacks/mentor/:mentorId - Xem feedback của mentor (Public)
router.get('/mentor/:mentorId', 
  authenticate, 
  authorizePermissions('feedback:view_any'), // MENTEE và MENTOR đều có
  validateQuery(feedbackQuerySchema), 
  feedbacksController.getFeedbacksByMentor
);

// GET /api/feedbacks/my - Xem feedback của mình
router.get('/my', 
  authenticate, 
  authorizePermissions('feedback:view_own'), // MENTEE và MENTOR đều có
  validateQuery(feedbackQuerySchema), 
  feedbacksController.getMyFeedbacks
);
```

---

## 🧪 Test Cases

### Test 1: MENTEE Tạo Feedback
```bash
# Login as MENTEE
POST /api/feedbacks
{
  "sessionId": 1,
  "rating": 5,
  "comment": "Great mentor!"
}
# ✅ Expected: 201 Created
```

### Test 2: MENTOR Tạo Feedback
```bash
# Login as MENTOR
POST /api/feedbacks
{
  "sessionId": 1,
  "rating": 5,
  "comment": "..."
}
# ✅ Expected: 403 Forbidden (Only mentees can provide feedback)
```

### Test 3: MENTEE Xem Feedback Đã Tạo
```bash
# Login as MENTEE
GET /api/feedbacks/my
# ✅ Expected: Danh sách feedback mà mentee đã tạo
```

### Test 4: MENTOR Xem Feedback Nhận Được
```bash
# Login as MENTOR
GET /api/feedbacks/my
# ✅ Expected: Danh sách feedback mà mentor nhận được + stats
```

### Test 5: Xem Feedback Của Mentor Khác
```bash
# Login as MENTEE hoặc MENTOR
GET /api/feedbacks/mentor/2
# ✅ Expected: Danh sách feedback của mentor có id=2
```

---

## 📊 UI Flow

### MENTEE View:
```
┌─────────────────────────────────────┐
│ ⭐ Feedback                         │
│ View feedbacks you have given       │
│                                     │
│ [✚ Give Feedback]                  │
│                                     │
│ Feedbacks I Have Given              │
│ ┌─────────────────────────────┐   │
│ │ ⭐⭐⭐⭐⭐                  │   │
│ │ "Great mentor!"              │   │
│ │ Feedback for: mentor@email  │   │
│ │ Nov 9, 2025                  │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### MENTOR View:
```
┌─────────────────────────────────────┐
│ ⭐ Feedback                         │
│ View feedbacks you have received    │
│                                     │
│ Feedbacks I Have Received           │
│ ┌─────────────────────────────┐   │
│ │ ⭐⭐⭐⭐                   │   │
│ │ "Good session!"              │   │
│ │ Feedback from: student@email│   │
│ │ Nov 9, 2025                  │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## ✅ Kết Quả

- ✅ MENTEE chỉ có thể tạo feedback
- ✅ MENTEE chỉ xem được feedback đã tạo
- ✅ MENTOR chỉ xem được feedback nhận được
- ✅ MENTOR không thể tạo feedback
- ✅ Cả hai có thể xem feedback của mentor khác (public view)
- ✅ UI hiển thị đúng theo role
- ✅ Fix lỗi `feedbacks.map is not a function`

---

## 🚀 Cách Test

### 1. Start Backend:
```bash
cd mentor-mentee-api
npm run dev
```

### 2. Start Frontend:
```bash
cd mentor-mentee-frontend
npm start
```

### 3. Test Flow:

**As MENTEE:**
1. Login as mentee
2. Vào tab "Feedback"
3. Thấy nút "✚ Give Feedback"
4. Click và tạo feedback
5. Xem danh sách feedback đã tạo

**As MENTOR:**
1. Login as mentor
2. Vào tab "Feedback"
3. KHÔNG thấy nút "✚ Give Feedback"
4. Xem danh sách feedback nhận được từ mentees

---

## 📝 Notes

- Feedback không thể sửa hoặc xóa sau khi tạo
- Mỗi session chỉ được feedback 1 lần
- Chỉ feedback cho session đã COMPLETED
- Rating: 1-5 sao
- Comment là optional
