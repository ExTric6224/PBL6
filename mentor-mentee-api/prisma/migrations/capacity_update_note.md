# Capacity Update for 1-on-1 Booking System

## Changes Made

The booking system has been updated to enforce 1-on-1 mentoring sessions (one mentor with one mentee).

### Schema Changes
- **schedule.capacity**: Already defaults to 1 in the schema
- **No migration needed**: The default value is already set correctly

### Logic Changes
1. **bookings.service.ts**:
   - Simplified booking creation to check for any active booking (PENDING or CONFIRMED)
   - For 1-1 booking, if any active booking exists, the schedule is considered fully booked
   - Updated comments to clarify 1-1 booking behavior

2. **schedules.service.ts**:
   - Already enforces capacity = 1 in `createSchedule` method
   - Update method ignores any capacity changes (commented out)
   - All schedules are created with capacity = 1

### Database State
- Existing schedules should already have `capacity = 1` (default value)
- If any schedules have different capacity values, run this query to fix:

```sql
UPDATE schedule SET capacity = 1 WHERE capacity != 1;
```

### Key Points
- Each schedule can only have **ONE** confirmed or pending booking at a time
- This represents: **1 Mentor ↔ 1 Mentee** per session
- When a booking is confirmed, the schedule status changes to 'BOOKED'
- When a confirmed booking is cancelled, the schedule status returns to 'AVAILABLE'
- Mentees cannot double-book the same schedule (enforced by unique constraint)

### No Migration Required
Since the schema already has `capacity INT DEFAULT 1`, and the application logic enforces this, no database migration is necessary. The system is already configured for 1-on-1 bookings.

