# Booking System Update: 1-on-1 Mentoring Sessions

## Overview
The booking system has been updated to support **1-on-1 mentoring sessions only**. Each schedule can now only accommodate one mentor and one mentee.

## Key Changes

### 1. Database Schema (`prisma/schema.prisma`)
- **schedule.capacity**: Explicitly documented as "Always 1 for 1-on-1 mentoring sessions"
- Default value remains `1` (no migration needed)

```prisma
model schedule {
  capacity    Int             @default(1) // Always 1 for 1-on-1 mentoring sessions
  // ... other fields
}
```

### 2. Booking Service Logic (`src/services/bookings.service.ts`)

#### createBooking()
- Simplified capacity checking for 1-1 booking
- Checks if ANY active booking (PENDING or CONFIRMED) exists
- If any active booking found, schedule is considered fully booked
- Clear error message: "This schedule is already booked"

```typescript
// For 1-1 booking: Check if there's already a confirmed or pending booking
if (schedule.booking.length > 0) {
  throw new Error('This schedule is already booked');
}
```

#### confirmBooking()
- Confirms the single booking
- Marks schedule status as 'BOOKED' to prevent other bookings
- Transaction ensures data consistency

#### cancelBooking()
- Cancels the 1-1 booking
- Frees up the schedule (status returns to 'AVAILABLE')
- Another mentee can now book this schedule

### 3. Schedule Service (`src/services/schedules.service.ts`)

#### createSchedule()
- Always creates schedules with `capacity: 1`
- Hardcoded in the service to enforce 1-1 sessions

```typescript
capacity: 1, // Always set to 1 - one mentor can only meet one mentee at a time
```

#### updateSchedule()
- Ignores any capacity update attempts (commented out)
- Capacity cannot be changed from 1

### 4. Seed Files Updated
All seed files now create schedules with `capacity: 1`:
- ✅ `prisma/seed-full.ts` - 13 schedules updated
- ✅ `prisma/seed-sessions.ts` - 3 schedules updated  
- ✅ `prisma/seed.ts` - 3 schedules updated

## Business Logic

### How 1-on-1 Booking Works

1. **Schedule Creation**
   - Mentor creates a schedule with capacity automatically set to 1
   - Schedule status: `AVAILABLE`

2. **Mentee Books Schedule**
   - Mentee creates a booking for the schedule
   - Booking status: `PENDING`
   - Schedule remains: `AVAILABLE` (until confirmed)

3. **Mentor Confirms Booking**
   - Mentor confirms the booking
   - Booking status: `CONFIRMED`
   - Schedule status: `BOOKED` ← **Schedule now unavailable**

4. **If Booking is Cancelled**
   - Booking status: `CANCELLED`
   - Schedule status: `AVAILABLE` ← **Schedule available again**

### Constraints Enforced

✅ **One schedule = One mentor + One mentee**
- Only ONE confirmed or pending booking allowed per schedule
- Unique constraint: `(scheduleId, menteeId)` prevents double booking by same mentee

✅ **Schedule Status Management**
- `AVAILABLE`: No confirmed bookings, mentees can book
- `BOOKED`: Has confirmed booking, unavailable for new bookings
- `CANCELLED`: Schedule cancelled by mentor

✅ **Booking Status Flow**
- `PENDING` → `CONFIRMED` (by mentor) or `CANCELLED`
- `CONFIRMED` → `CANCELLED` (frees up schedule)

## Database Migration

### Is Migration Needed?
**NO** - The schema already has `capacity INT DEFAULT 1`

### For Existing Data
If you have existing schedules with capacity > 1, run this SQL to fix:

```sql
UPDATE schedule SET capacity = 1 WHERE capacity != 1;
```

### Check Existing Data
```sql
-- Check if any schedules have capacity != 1
SELECT id, topic, capacity, status FROM schedule WHERE capacity != 1;

-- View booking count per schedule
SELECT s.id, s.topic, s.capacity, COUNT(b.id) as booking_count
FROM schedule s
LEFT JOIN booking b ON s.id = b.scheduleId AND b.status IN ('PENDING', 'CONFIRMED')
GROUP BY s.id, s.topic, s.capacity;
```

## Testing

### Test Scenarios

1. **Single Booking Success**
   ```
   ✓ Mentee A books available schedule
   ✓ Mentor confirms booking
   ✓ Schedule status becomes BOOKED
   ```

2. **Prevent Double Booking**
   ```
   ✓ Mentee A books schedule (PENDING)
   ✗ Mentee B tries to book same schedule → Error: "This schedule is already booked"
   ```

3. **Cancellation Frees Schedule**
   ```
   ✓ Mentee A has confirmed booking
   ✓ Booking is cancelled
   ✓ Schedule status returns to AVAILABLE
   ✓ Mentee B can now book the schedule
   ```

4. **Same Mentee Cannot Double Book**
   ```
   ✓ Mentee A books schedule
   ✗ Mentee A tries to book again → Error: "You have already booked this schedule"
   ```

## API Behavior

### POST /api/bookings
**Request:**
```json
{
  "scheduleId": 1
}
```

**Success (201):**
```json
{
  "id": 1,
  "scheduleId": 1,
  "menteeId": 2,
  "status": "PENDING",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

**Error (409) - Already Booked:**
```json
{
  "error": "This schedule is already booked"
}
```

### POST /api/bookings/:id/confirm
- Confirms the 1-1 booking
- Schedule becomes BOOKED

### POST /api/bookings/:id/cancel
- Cancels the booking
- Schedule becomes AVAILABLE again

## Summary

✅ **Completed Changes:**
1. ✅ Updated `bookings.service.ts` - simplified logic for 1-1 booking
2. ✅ Updated `schema.prisma` - documented capacity = 1
3. ✅ Created migration documentation
4. ✅ Updated all seed files (seed.ts, seed-full.ts, seed-sessions.ts)
5. ✅ Updated `schedules.service.ts` - enforces capacity = 1

🎯 **Result:**
- Clean 1-on-1 booking system
- One mentor ↔ One mentee per session
- Simple, predictable logic
- No quantity field needed (was never in schema anyway)

## Questions?

For any issues or questions about the 1-on-1 booking system, please refer to:
- `src/services/bookings.service.ts` - Booking logic
- `src/services/schedules.service.ts` - Schedule creation
- `prisma/schema.prisma` - Database schema

