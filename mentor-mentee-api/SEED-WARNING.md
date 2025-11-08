# ⚠️ MIGRATION NOTICE - Topics System

## Vấn đề quan trọng với Seed Data

File `seed.ts` hiện tại **KHÔNG TƯƠNG THÍCH** với schema mới vì:

1. ❌ Đang tạo profiles với `JSON.stringify(['topic1', 'topic2'])`
2. ❌ Field `expertise` và `interests` không còn là string trong schema
3. ✅ Cần tạo quan hệ qua bảng `MentorTopicExpertise` và `MenteeTopicInterest`

## Giải pháp

### Option 1: Chạy seed-topics.ts trước (ĐÃ XONG)
```bash
npx ts-node prisma/seed-topics.ts
```

### Option 2: Cập nhật seed.ts để sử dụng topic relations

File seed cần được viết lại để:
1. Tạo profile trước (không có expertise/interests)
2. Sau đó tạo relations với topics qua `MentorTopicExpertise.createMany()` và `MenteeTopicInterest.createMany()`

### Option 3: Migrate existing data

Nếu đã có data cũ với JSON strings:

```sql
-- Migration script would be needed to:
-- 1. Parse JSON strings from old expertise/interests
-- 2. Match them with topics
-- 3. Create relations in junction tables
-- 4. Drop old string columns (already done in migration)
```

## Cảnh báo khi chạy seed.ts

**KHÔNG CHẠY** `prisma/seed.ts` cho đến khi nó được cập nhật!

File hiện tại sẽ gây lỗi vì:
- Schema không còn chấp nhận `expertise: string` và `interests: string`
- Cần tạo relations thay vì string values

## Checklist trước khi deploy

- [x] Migration topics đã chạy
- [x] Seed topics đã chạy (15 topics)
- [x] API endpoints đã được test
- [ ] Seed.ts cần được cập nhật
- [ ] Test với data cũ (nếu có)
- [ ] Cập nhật frontend để sử dụng topic IDs
