# Session Auto Start/End Feature

## Tổng quan
Tính năng tự động start và end session dựa trên thời gian schedule, đồng thời cho phép mentor control manually.

## Cách hoạt động

### 1. Auto Start Session
- **Khi nào**: Khi đến giờ bắt đầu schedule (schedule.startAt)
- **Điều kiện**: 
  - Booking phải ở trạng thái `CONFIRMED`
  - Chưa có session nào được tạo cho booking này
  - Thời gian hiện tại >= schedule.startAt
  - Thời gian hiện tại <= schedule.endAt
- **Hành động**: Tạo session với:
  - `status = 'IN_PROGRESS'`
  - `startedAt = current time`
  - `autoStarted = true`

### 2. Auto End Session
- **Khi nào**: Khi hết giờ kết thúc schedule (schedule.endAt)
- **Điều kiện**:
  - Session đang ở trạng thái `IN_PROGRESS`
  - Chưa có `endedAt`
  - Thời gian hiện tại >= schedule.endAt
- **Hành động**: Update session với:
  - `status = 'COMPLETED'`
  - `endedAt = current time`
  - `autoEnded = true`

### 3. Manual Start Session (Mentor)
- **API**: `POST /api/sessions/start`
- **Body**: 
  ```json
  {
    "bookingId": 123
  }
  ```
- **Behavior**:
  - Nếu chưa có session: Tạo mới với `autoStarted = false`
  - Nếu đã có session nhưng chưa start: Update `startedAt` và chuyển status sang `IN_PROGRESS`
  - Nếu đã start: Trả lỗi "Session already started"

### 4. Manual End Session (Mentor)
- **API**: `POST /api/sessions/end`
- **Body**:
  ```json
  {
    "sessionId": 456,
    "notes": "Session completed successfully"
  }
  ```
- **Behavior**:
  - Update session với `autoEnded = false`
  - Set `endedAt = current time`
  - Set `status = 'COMPLETED'`
  - Lưu notes nếu có

## Session Status Flow

```
SCHEDULED → IN_PROGRESS → COMPLETED
     ↓            ↓
  CANCELLED    CANCELLED
```

- **SCHEDULED**: Session được tạo nhưng chưa bắt đầu
- **IN_PROGRESS**: Session đang diễn ra
- **COMPLETED**: Session đã kết thúc thành công
- **CANCELLED**: Session bị hủy

## Cron Jobs

### Auto Start Scheduler
- **Tần suất**: Mỗi phút
- **Log**: "Checking for sessions to auto-start..."
- **Output**: Số lượng sessions đã được auto-start

### Auto End Scheduler
- **Tần suất**: Mỗi phút
- **Log**: "Checking for sessions to auto-end..."
- **Output**: Số lượng sessions đã được auto-end

## Database Schema Changes

### Session Model
```prisma
model session {
  id          Int            @id @default(autoincrement())
  bookingId   Int            @unique
  mentorId    Int
  menteeId    Int
  startedAt   DateTime?
  endedAt     DateTime?
  status      session_status @default(SCHEDULED)  // NEW
  notes       String?
  autoStarted Boolean        @default(false)       // NEW
  autoEnded   Boolean        @default(false)       // NEW
  // ... relations
}

enum session_status {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## API Endpoints

### Start Session
```
POST /api/sessions/start
Authorization: Bearer <mentor_token>
Body: { "bookingId": number }
```

### End Session
```
POST /api/sessions/end
Authorization: Bearer <mentor_token>
Body: { "sessionId": number, "notes": string }
```

### Get My Sessions
```
GET /api/sessions/my
Authorization: Bearer <token>
```
- Mentor: Lấy tất cả sessions của mentor
- Mentee: Lấy tất cả sessions của mentee

## Testing

### Test Auto Start
1. Tạo booking với status `CONFIRMED`
2. Set schedule.startAt = thời gian hiện tại hoặc trong quá khứ
3. Đợi 1 phút để scheduler chạy
4. Kiểm tra session được tạo với:
   - `status = 'IN_PROGRESS'`
   - `autoStarted = true`
   - `startedAt` có giá trị

### Test Auto End
1. Tạo session với status `IN_PROGRESS`
2. Set schedule.endAt = thời gian hiện tại hoặc trong quá khứ
3. Đợi 1 phút để scheduler chạy
4. Kiểm tra session được update với:
   - `status = 'COMPLETED'`
   - `autoEnded = true`
   - `endedAt` có giá trị

### Test Manual Start
```bash
POST http://localhost:3000/api/sessions/start
Authorization: Bearer <mentor_token>
Content-Type: application/json

{
  "bookingId": 1
}
```

### Test Manual End
```bash
POST http://localhost:3000/api/sessions/end
Authorization: Bearer <mentor_token>
Content-Type: application/json

{
  "sessionId": 1,
  "notes": "Great session!"
}
```

## Frontend Integration

### Display Session Status
```typescript
const getStatusColor = (status: SessionStatus) => {
  switch (status) {
    case 'SCHEDULED': return 'blue';
    case 'IN_PROGRESS': return 'green';
    case 'COMPLETED': return 'gray';
    case 'CANCELLED': return 'red';
  }
};

const getStatusLabel = (status: SessionStatus) => {
  switch (status) {
    case 'SCHEDULED': return 'Đã lên lịch';
    case 'IN_PROGRESS': return 'Đang diễn ra';
    case 'COMPLETED': return 'Đã hoàn thành';
    case 'CANCELLED': return 'Đã hủy';
  }
};
```

### Show Auto Status
```typescript
{session.autoStarted && (
  <span className="auto-badge">🤖 Tự động bắt đầu</span>
)}

{session.autoEnded && (
  <span className="auto-badge">🤖 Tự động kết thúc</span>
)}
```

## Monitoring

### Logs to Watch
```
⏰ Session schedulers started
⏰ Session schedulers stopped
Checking for sessions to auto-start...
Auto-started 2 session(s)
Checking for sessions to auto-end...
Auto-ended 1 session(s)
```

### Errors to Handle
- Database connection errors
- Invalid booking status
- Missing schedule data
- Concurrent session creation

## Notes
- Schedulers chạy độc lập với API requests
- Schedulers được stop gracefully khi server shutdown
- Tất cả timestamps sử dụng UTC
- Session có thể được start trước schedule.startAt bởi mentor
- Session có thể được end trước schedule.endAt bởi mentor
