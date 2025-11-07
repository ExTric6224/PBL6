# 🔍 Debug Guide - Post Images Not Showing

## Vấn đề
Hình ảnh không hiển thị trong post.

## Các bước kiểm tra

### 1. Kiểm tra Console Browser
Mở Developer Tools (F12) → Console tab

**Tìm kiếm:**
- ❌ Lỗi 404 (file not found)
- ❌ Lỗi CORS
- ✅ Log: "Loading image: http://localhost:3000/storage/posts/..."

**Nếu thấy lỗi 404:**
- File ảnh không tồn tại
- Đường dẫn sai

**Nếu thấy lỗi CORS:**
- Backend chưa config CORS đúng

### 2. Kiểm tra Network Tab
Developer Tools → Network tab → Filter: Img

**Kiểm tra:**
1. Request URL có đúng không?
   - ✅ Đúng: `http://localhost:3000/storage/posts/post_xxx.jpg`
   - ❌ Sai: `http://localhost:3000/api/storage/posts/post_xxx.jpg` (thừa /api)

2. Response status?
   - ✅ 200 OK
   - ❌ 404 Not Found
   - ❌ 403 Forbidden
   - ❌ 500 Internal Server Error

### 3. Kiểm tra File Thực Tế
```powershell
# Kiểm tra thư mục storage/posts
cd D:\Documents\PBL6\mentor-mentee-api
ls storage\posts

# Nên thấy các file như:
# post_4_1762489942920_35h2cb.jpg
```

### 4. Test Trực Tiếp
Mở browser và truy cập:
```
http://localhost:3000/storage/posts/post_4_1762489942920_35h2cb.jpg
```

**Kết quả mong đợi:** Ảnh hiển thị
**Nếu lỗi:** Backend không serve static files đúng cách

### 5. Kiểm tra Backend đang chạy
```powershell
# Terminal backend
cd D:\Documents\PBL6\mentor-mentee-api
npm run dev
```

**Console phải hiển thị:**
```
🚀 Server is running on http://localhost:3000
```

### 6. Kiểm tra Database
```sql
-- Kết nối MySQL
SELECT * FROM postimage WHERE postId = 1;

-- Kết quả mong đợi:
-- id | postId | imageUrl | order
-- 1  | 1      | /storage/posts/post_xxx.jpg | 0
```

**imageUrl phải:**
- ✅ Bắt đầu với `/storage/posts/`
- ❌ KHÔNG có `http://localhost:3000`
- ❌ KHÔNG có `/api`

### 7. Kiểm tra .env Frontend
```
D:\Documents\PBL6\mentor-mentee-frontend\.env
```

Nội dung:
```
REACT_APP_API_URL=http://localhost:3000/api
```

**Lưu ý:** Code sẽ tự động remove `/api` khi load ảnh

### 8. Restart Servers
```powershell
# Backend
cd D:\Documents\PBL6\mentor-mentee-api
npm run dev

# Frontend (terminal mới)
cd D:\Documents\PBL6\mentor-mentee-frontend
npm start
```

## Giải pháp theo từng lỗi

### Lỗi 1: URL sai (có /api)
**Triệu chứng:** 
```
http://localhost:3000/api/storage/posts/xxx.jpg → 404
```

**Giải pháp:** ✅ ĐÃ SỬA
```typescript
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000/api').replace('/api', '');
```

### Lỗi 2: CORS Block
**Triệu chứng:**
```
Access to image has been blocked by CORS policy
```

**Giải pháp:** Kiểm tra `app.ts`
```typescript
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
```

### Lỗi 3: File không tồn tại
**Triệu chứng:** 404 Not Found

**Giải pháp:**
1. Upload lại ảnh
2. Kiểm tra thư mục `storage/posts/`
3. Kiểm tra database có đúng tên file

### Lỗi 4: Permission denied
**Triệu chứng:** 403 Forbidden

**Giải pháp:**
```powershell
# Windows - check folder permissions
icacls "storage\posts"
```

### Lỗi 5: Static files không được serve
**Triệu chứng:** 404 khi access trực tiếp

**Giải pháp:** Kiểm tra `app.ts`
```typescript
// Phải có dòng này
app.use('/storage', express.static(path.join(__dirname, '..', 'storage')));
```

## Quick Test Script

```typescript
// Trong PostList.tsx, thêm debug log
useEffect(() => {
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Posts:', posts);
  posts.forEach(post => {
    if (post.images) {
      post.images.forEach(img => {
        console.log('Image URL:', `${API_BASE_URL}${img.imageUrl}`);
      });
    }
  });
}, [posts, API_BASE_URL]);
```

## Expected Output

**Console log:**
```
API_BASE_URL: http://localhost:3000
Loading image: http://localhost:3000/storage/posts/post_4_1762489942920_35h2cb.jpg
```

**Network tab:**
```
Request URL: http://localhost:3000/storage/posts/post_4_1762489942920_35h2cb.jpg
Status: 200 OK
Content-Type: image/jpeg
```

## Checklist

- [ ] Backend đang chạy (port 3000)
- [ ] Frontend đang chạy (port 3001)
- [ ] Thư mục `storage/posts/` có file ảnh
- [ ] Database có record trong `postimage` table
- [ ] Console không có lỗi 404/CORS
- [ ] Network tab shows 200 OK
- [ ] Truy cập trực tiếp URL hiển thị ảnh

## Common Mistakes

❌ **Sai:**
```typescript
src={`${API_BASE_URL}/api${image.imageUrl}`}
// → http://localhost:3000/api/storage/posts/xxx.jpg (404)
```

✅ **Đúng:**
```typescript
src={`${API_BASE_URL}${image.imageUrl}`}
// → http://localhost:3000/storage/posts/xxx.jpg (200)
```

## Còn lỗi?

1. **Clear browser cache:** Ctrl + Shift + Delete
2. **Hard reload:** Ctrl + Shift + R
3. **Restart cả backend và frontend**
4. **Kiểm tra lại tất cả các bước trên**

## Support

Nếu vẫn không hiển thị, gửi thông tin:
1. Screenshot console errors
2. Screenshot network tab
3. Output của: `ls storage\posts`
4. Content của 1 record trong `postimage` table
