# 📷 Post Images Feature Guide

## Tổng quan

Tính năng cho phép người dùng thêm ảnh vào bài post. Mỗi bài post có thể chứa nhiều ảnh (tối đa 10 ảnh), hiển thị ở đầu bài post.

## Backend Implementation

### Database Schema

```prisma
model post {
  id        Int         @id @default(autoincrement())
  authorId  Int
  title     String
  content   String      @db.Text
  isPublic  Boolean     @default(true)
  createdAt DateTime    @default(now())
  updatedAt DateTime
  images    postimage[] // Quan hệ 1-nhiều với ảnh
  // ...
}

model postimage {
  id        Int      @id @default(autoincrement())
  postId    Int
  imageUrl  String   @db.VarChar(500)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  post      post     @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

### API Endpoints

#### 1. Upload Images to Post
```http
POST /api/posts/:id/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: FormData with 'images' field (multiple files)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "postId": 5,
      "imageUrl": "/storage/posts/post_123_1699876543210_abc123.jpg",
      "order": 0,
      "createdAt": "2025-11-07T10:30:00.000Z"
    }
  ],
  "message": "Images uploaded successfully"
}
```

#### 2. Delete Post Image
```http
DELETE /api/posts/:id/images/:imageId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

#### 3. Get Posts (với images)
```http
GET /api/posts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Post Title",
      "content": "Post content...",
      "images": [
        {
          "id": 1,
          "imageUrl": "/storage/posts/image.jpg",
          "order": 0
        }
      ],
      // ...
    }
  ]
}
```

### File Upload Configuration

- **Thư mục lưu trữ:** `storage/posts/`
- **Kích thước tối đa:** 5MB/ảnh
- **Số lượng tối đa:** 10 ảnh/post
- **Định dạng cho phép:** JPEG, PNG, GIF, WebP
- **Tên file:** `post_<userId>_<timestamp>_<random>.<ext>`

### Permissions

Cần có permission `post:update` với scope `own` để:
- Upload ảnh vào post của mình
- Xóa ảnh từ post của mình

## Frontend Implementation

### Component Updates

**PostList.tsx** đã được cập nhật với:

1. **State quản lý upload:**
   ```typescript
   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
   const [uploadingImages, setUploadingImages] = useState<number | null>(null);
   ```

2. **Handler functions:**
   - `handleFileChange()` - Chọn file và validate
   - `handleUploadImages()` - Upload ảnh lên server
   - `handleDeleteImage()` - Xóa ảnh

3. **UI Components:**
   - Image gallery hiển thị ảnh
   - Upload section cho post owner
   - Delete button trên mỗi ảnh

### API Service

**postApi.ts** mới có:

```typescript
// Upload images
uploadPostImages: async (postId: number, files: File[]): Promise<PostImage[]> => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  
  const response = await api.post(`/posts/${postId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
}

// Delete image
deletePostImage: async (postId: number, imageId: number): Promise<void> => {
  await api.delete(`/posts/${postId}/images/${imageId}`);
}
```

### Styling

CSS mới thêm vào `PostList.css`:

- `.post-images-gallery` - Grid layout cho ảnh
- `.post-image-wrapper` - Container cho từng ảnh
- `.delete-image-btn` - Nút xóa ảnh (hiện khi hover)
- `.image-upload-section` - Khu vực upload
- `.upload-images-btn` - Nút chọn file
- `.btn-upload` - Nút upload

## Sử dụng

### Người dùng (Frontend)

1. **Xem ảnh trong post:**
   - Ảnh được hiển thị ở đầu post, trước nội dung
   - Layout grid responsive
   - Click để xem full size (có thể thêm lightbox sau)

2. **Thêm ảnh vào post của mình:**
   - Click "📷 Add Images" 
   - Chọn tối đa 10 ảnh
   - Click "Upload X image(s)"
   - Ảnh sẽ xuất hiện ngay sau khi upload

3. **Xóa ảnh:**
   - Hover vào ảnh
   - Click nút "✖" ở góc trên bên phải
   - Xác nhận xóa

### Lập trình viên

**Upload images khi tạo post:**

```typescript
// Bước 1: Tạo post
const post = await postApi.createPost({
  title: "My Post",
  content: "Content here"
});

// Bước 2: Upload images
if (selectedFiles.length > 0) {
  await postApi.uploadPostImages(post.id, selectedFiles);
}
```

**Xóa image:**

```typescript
await postApi.deletePostImage(postId, imageId);
```

## Testing

### Backend Testing (Postman)

1. **Upload Images:**
   ```
   POST http://localhost:3000/api/posts/1/images
   Headers: Authorization: Bearer <token>
   Body: form-data
     - images: [file1.jpg, file2.png]
   ```

2. **Delete Image:**
   ```
   DELETE http://localhost:3000/api/posts/1/images/1
   Headers: Authorization: Bearer <token>
   ```

3. **Get Post with Images:**
   ```
   GET http://localhost:3000/api/posts/1
   Headers: Authorization: Bearer <token>
   ```

### Frontend Testing

1. Tạo post mới
2. Thêm 5 ảnh vào post
3. Reload trang - kiểm tra ảnh vẫn hiển thị
4. Xóa 1 ảnh
5. Kiểm tra responsive trên mobile

## Security & Validation

### Backend

✅ **File Type Validation:**
- Chỉ cho phép: JPEG, JPG, PNG, GIF, WebP
- Reject các file khác

✅ **File Size Limit:**
- 5MB/ảnh
- Tổng không quá 50MB cho 10 ảnh

✅ **Authorization:**
- Chỉ post owner mới upload/delete được ảnh
- Kiểm tra qua permission middleware

✅ **Cascading Delete:**
- Khi xóa post, tất cả ảnh cũng bị xóa (onDelete: Cascade)

### Frontend

✅ **Client-side Validation:**
- Kiểm tra file type trước khi upload
- Giới hạn 10 ảnh
- Hiển thị warning nếu file không hợp lệ

## File Structure

```
mentor-mentee-api/
├── storage/posts/           # Thư mục chứa ảnh posts
├── src/
│   ├── middleware/
│   │   └── upload.middleware.ts    # Upload config
│   ├── controllers/
│   │   └── posts.controller.ts     # Upload/delete handlers
│   ├── services/
│   │   └── posts.service.ts        # Business logic
│   └── routes/
│       └── posts.routes.ts         # Image routes

mentor-mentee-frontend/
├── src/
│   ├── types/
│   │   └── post.ts                 # PostImage interface
│   ├── services/
│   │   └── postApi.ts              # API calls
│   └── components/Posts/
│       ├── PostList.tsx            # Image display & upload
│       └── PostList.css            # Styling
```

## Tính năng có thể mở rộng

1. **Image Optimization:**
   - Resize ảnh trước khi lưu
   - Tạo thumbnail
   - Lazy loading

2. **Better UX:**
   - Lightbox để xem ảnh full size
   - Drag & drop để upload
   - Progress bar khi upload
   - Preview ảnh trước khi upload

3. **Advanced Features:**
   - Reorder ảnh (thay đổi order)
   - Add caption cho từng ảnh
   - Image filters/effects
   - CDN integration

## Troubleshooting

**Lỗi: "Invalid file type"**
- Kiểm tra định dạng file (chỉ cho phép JPEG, PNG, GIF, WebP)

**Lỗi: "Post not found or access denied"**
- Chỉ post owner mới upload/delete được ảnh
- Kiểm tra authentication token

**Ảnh không hiển thị:**
- Kiểm tra `REACT_APP_API_URL` trong frontend .env
- Đảm bảo backend đang serve static files từ `/storage`

**Lỗi CORS:**
- Kiểm tra CORS config trong backend app.ts
- Đảm bảo frontend URL được whitelist

## Performance Tips

1. **Lazy Loading:** Chỉ load ảnh khi scroll đến
2. **Image Compression:** Compress ảnh client-side trước khi upload
3. **CDN:** Sử dụng CDN để serve ảnh nhanh hơn
4. **Caching:** Cache ảnh trong browser

---

✨ **Tính năng đã hoàn thành và sẵn sàng sử dụng!**
