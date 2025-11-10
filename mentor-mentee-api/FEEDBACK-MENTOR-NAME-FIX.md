# ✅ FIX: Feedback không hiển thị Mentor Name

## 🐛 Vấn đề

Feedback form hiển thị "Feedback for: Unknown Mentor" thay vì tên mentor thực tế.

![Bug Screenshot](screenshot provided by user showing "Feedback for: Unknown Mentor")

## 🔍 Nguyên nhân

1. **Backend không include mentor/mentee data** trong feedback queries
2. **Prisma relation names** không match với frontend expectations:
   - Prisma: `user_feedback_mentorIdTouser`, `user_feedback_menteeIdTouser`
   - Frontend expect: `mentor`, `mentee`

## ✅ Giải pháp

### 1. Backend Fix - `feedbacks.service.ts`

**Added mentor/mentee includes:**
```typescript
include: {
  user_feedback_mentorIdTouser: {
    select: {
      id: true,
      email: true,
      mentorprofile: {
        select: {
          fullName: true,
          bio: true,
          expertise: true,
        },
      },
    },
  },
  user_feedback_menteeIdTouser: {
    select: {
      id: true,
      email: true,
      menteeprofile: {
        select: {
          fullName: true,
        },
      },
    },
  },
  // ... session, booking, schedule
}
```

**Transform response data:**
```typescript
// Transform relation names to be more frontend-friendly
const transformedFeedbacks = feedbacks.map(feedback => ({
  ...feedback,
  mentor: feedback.user_feedback_mentorIdTouser,
  mentee: feedback.user_feedback_menteeIdTouser,
  user_feedback_mentorIdTouser: undefined,
  user_feedback_menteeIdTouser: undefined,
}));
```

**Updated methods:**
- ✅ `getFeedbacksByMentor()` - Mentor xem feedback nhận được
- ✅ `getFeedbacksByMentee()` - Mentee xem feedback đã tạo

### 2. Frontend Type Fix - `feedback.ts`

**Updated Feedback interface:**
```typescript
mentor?: {
  id: number;
  email: string;
  mentorprofile?: {
    fullName?: string;  // Added
    bio?: string;
    expertise?: any;
  };
};
mentee?: {
  id: number;
  email: string;
  menteeprofile?: {
    fullName?: string;  // Added
  };
};
```

### 3. Frontend Display Fix - `FeedbackForm.tsx`

**Show fullName with fallback:**
```tsx
{/* MENTEE sees: Feedback for Mentor X */}
{isMentee && (
  <span>
    Feedback for: {
      feedback.mentor?.mentorprofile?.fullName || 
      feedback.mentor?.email || 
      'Unknown Mentor'
    }
  </span>
)}

{/* MENTOR sees: Feedback from Mentee X */}
{isMentor && (
  <span>
    Feedback from: {
      feedback.mentee?.menteeprofile?.fullName || 
      feedback.mentee?.email || 
      'Anonymous Mentee'
    }
  </span>
)}
```

## 📝 Files Modified

### Backend:
- ✅ `src/services/feedbacks.service.ts`
  - Added mentor/mentee includes
  - Transform response data
  - Updated `getFeedbacksByMentor()`
  - Updated `getFeedbacksByMentee()`

### Frontend:
- ✅ `src/types/feedback.ts`
  - Updated Feedback interface
  - Added fullName fields
- ✅ `src/components/Feedbacks/FeedbackForm.tsx`
  - Display fullName with fallback logic

## 🎯 Result

### Before:
❌ "Feedback for: Unknown Mentor"
❌ No mentor/mentee information in API response

### After:
✅ "Feedback for: Trần Minh Tuấn" (fullName)
✅ Fallback to email nếu không có fullName
✅ Complete mentor/mentee data in API response

## 🧪 Testing

### As MENTEE (mentee1@example.com):
```bash
# View feedbacks you gave
GET /api/feedbacks/my

# Response should include:
{
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Great session!",
      "mentor": {
        "email": "mentor1@example.com",
        "mentorprofile": {
          "fullName": "Trần Minh Tuấn"
        }
      }
    }
  ]
}
```

### As MENTOR (mentor1@example.com):
```bash
# View feedbacks you received
GET /api/feedbacks/my

# Response should include:
{
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Great session!",
      "mentee": {
        "email": "mentee1@example.com",
        "menteeprofile": {
          "fullName": "Nguyễn Văn An"
        }
      }
    }
  ]
}
```

## 💡 Technical Notes

### Why Transform Data?

**Option 1: Transform at Backend (Chosen)**
- ✅ Clean API for frontend
- ✅ Consistent naming
- ✅ Easy to consume
- Frontend doesn't care about Prisma's naming

**Option 2: Frontend Adaptation**
- ❌ Frontend needs to know Prisma relation names
- ❌ Code becomes ugly: `feedback.user_feedback_mentorIdTouser`
- ❌ Hard to maintain

### Prisma Relation Naming

Khi có multiple relations giữa 2 models, Prisma tự động generate tên dài:
```prisma
model feedback {
  user_feedback_menteeIdTouser user @relation("feedback_menteeIdTouser", ...)
  user_feedback_mentorIdTouser user @relation("feedback_mentorIdTouser", ...)
}
```

**Could rename in schema:**
```prisma
model feedback {
  mentee user @relation("feedback_mentee", ...)
  mentor user @relation("feedback_mentor", ...)
}
```
But requires migration, so transform at runtime is safer.

## ✅ Complete

Feedback hiện giờ hiển thị đúng tên mentor/mentee thay vì "Unknown"!

**Happy coding! 🚀**
