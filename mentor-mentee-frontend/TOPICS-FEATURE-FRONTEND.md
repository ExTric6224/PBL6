# Topics Feature - Frontend Implementation

## Overview
The frontend has been updated to use the Topics feature, replacing free-text expertise/interests fields with predefined topics from the database.

## Files Updated

### 1. Type Definitions

#### `src/types/topic.ts` (NEW)
```typescript
export interface Topic {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
```

#### `src/types/profile.ts` (UPDATED)
- **MentorProfile.expertise**: Changed from `string[]` to `Topic[]`
- **MenteeProfile.interests**: Changed from `string[]` to `Topic[]`
- **CreateMentorProfileData.expertise**: Changed from `string[]` to `number[]` (topic IDs)
- **CreateMenteeProfileData.interests**: Changed from `string[]` to `number[]` (topic IDs)

#### `src/types/schedule.ts` (UPDATED)
- **Schedule.mentor.mentorProfile.expertise**: Changed from `string[]` to `Topic[]`

### 2. API Service

#### `src/services/topicApi.ts` (NEW)
```typescript
export const topicApi = {
  getAllTopics: async (): Promise<Topic[]>
};
```
Fetches all available topics from `GET /api/topics`.

### 3. Components

#### `src/components/Topics/TopicSelector.tsx` (NEW)
A reusable dropdown component for selecting multiple topics:
- Fetches all topics from API on mount
- Shows selected topics as tags
- Dropdown with checkboxes for selection
- Shows topic name and description
- Supports adding/removing topics

**Props:**
- `selectedTopicIds: number[]` - Array of selected topic IDs
- `onChange: (topicIds: number[]) => void` - Callback when selection changes
- `label: string` - Label for the selector
- `placeholder?: string` - Placeholder text when no topics selected

**Usage:**
```tsx
<TopicSelector
  selectedTopicIds={mentorData.expertise}
  onChange={(topicIds) => setMentorData({ ...mentorData, expertise: topicIds })}
  label="Expertise *"
  placeholder="Select your areas of expertise..."
/>
```

#### `src/components/Profile/ProfileForm.tsx` (UPDATED)
**Changes:**
- Removed free-text tag input for expertise/interests
- Added `TopicSelector` component for both mentor and mentee profiles
- Updated `loadProfile()` to extract topic IDs from Topic objects returned by API
- State now stores topic IDs (`number[]`) instead of strings
- API automatically sends topic IDs and receives Topic objects

**Mentor Profile:**
```tsx
<TopicSelector
  selectedTopicIds={mentorData.expertise}
  onChange={(topicIds) => setMentorData({ ...mentorData, expertise: topicIds })}
  label="Expertise *"
  placeholder="Select your areas of expertise..."
/>
```

**Mentee Profile:**
```tsx
<TopicSelector
  selectedTopicIds={menteeData.interests}
  onChange={(topicIds) => setMenteeData({ ...menteeData, interests: topicIds })}
  label="Interests *"
  placeholder="Select topics you're interested in..."
/>
```

#### `src/components/Schedules/ScheduleList.tsx` (UPDATED)
**Changes:**
- Now displays mentor expertise as topic tags
- Shows topic names from Topic objects
- Added tooltip with topic description on hover

**Display:**
```tsx
{schedule.mentor.mentorProfile?.expertise && (
  <div className="mentor-expertise">
    <strong>Expertise:</strong>
    <div className="expertise-tags">
      {schedule.mentor.mentorProfile.expertise.map((topic) => (
        <span key={topic.id} className="expertise-tag" title={topic.description}>
          {topic.name}
        </span>
      ))}
    </div>
  </div>
)}
```

### 4. Styles

#### `src/components/Topics/TopicSelector.css` (NEW)
Styling for the TopicSelector component:
- Dropdown with checkboxes
- Selected topics shown as blue tags
- Hover effects
- Responsive design

#### `src/components/Schedules/ScheduleList.css` (UPDATED)
Added styles for:
- `.schedule-mentor` - Mentor info section
- `.mentor-expertise` - Expertise section
- `.expertise-tags` - Container for topic tags
- `.expertise-tag` - Individual topic tag (purple gradient, hover effect)

## How It Works

### 1. Creating/Updating Profile

**Flow:**
1. Component loads existing profile (if any)
2. Extracts topic IDs from Topic objects: `profile.expertise.map(topic => topic.id)`
3. User selects topics using TopicSelector dropdown
4. On submit, sends topic IDs to API: `expertise: [1, 3, 7]`
5. API returns profile with full Topic objects
6. Component displays topics by ID, fetching names from Topic objects

### 2. Viewing Schedules

**Flow:**
1. API returns schedules with mentor info including `mentorProfile.expertise` as Topic[]
2. Component maps over Topic objects and displays topic names
3. Hover shows topic description

## Available Topics

15 predefined topics (seeded in backend):
1. Web Development
2. Mobile Development
3. Data Science
4. DevOps
5. Cybersecurity
6. UI/UX Design
7. Database
8. Software Architecture
9. Career Development
10. Soft Skills
11. Game Development
12. Cloud Computing
13. Blockchain
14. Testing & QA
15. Project Management

## Testing the Frontend

### 1. Test Mentor Profile
1. Login as mentor (mentor1@example.com / 123456)
2. Go to Profile page
3. Click on Expertise selector
4. Select multiple topics (e.g., Web Development, Data Science, Database)
5. Fill other fields and submit
6. Verify profile shows selected topics
7. Update profile and change topics
8. Verify changes are saved

### 2. Test Mentee Profile
1. Login as mentee (mentee1@example.com / 123456)
2. Go to Profile page
3. Click on Interests selector
4. Select topics you're interested in
5. Submit profile
6. Verify topics are displayed

### 3. Test Schedule Display
1. Login as mentor and create a profile with expertise topics
2. Create a schedule
3. Login as mentee
4. View available schedules
5. Verify mentor's expertise topics are shown as colored tags

## Migration Notes

### Breaking Changes
- **Data format changed**: 
  - OLD: `expertise: ["Web Development", "Mobile Development"]` (strings)
  - NEW: `expertise: [{id: 1, name: "Web Development", ...}, {id: 2, name: "Mobile Development", ...}]` (objects)

### Backwards Compatibility
- Frontend gracefully handles both formats during transition
- If API returns Topic objects, extracts IDs
- If profile doesn't exist, starts with empty array

## Future Enhancements
1. **Topic filtering**: Filter mentors/schedules by topic
2. **Topic search**: Search functionality in TopicSelector
3. **Popular topics**: Show trending or recommended topics
4. **Topic categories**: Group topics by category (Technical, Soft Skills, etc.)
5. **Custom topics**: Allow admins to add new topics via UI
