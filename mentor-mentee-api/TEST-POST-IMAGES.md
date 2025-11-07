# Post Images API Test Commands

## Setup
Đảm bảo server đang chạy:
```bash
npm run dev
```

## Test với curl (PowerShell)

### 1. Login để lấy token
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body (@{email="mentor1@example.com"; password="123456"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.data.token
Write-Host "Token: $token"
```

### 2. Tạo một post mới
```powershell
$createPost = Invoke-RestMethod -Uri "http://localhost:3000/api/posts" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{title="Test Post with Images"; content="This is a test post"; isPublic=$true} | ConvertTo-Json) -ContentType "application/json"
$postId = $createPost.data.id
Write-Host "Created Post ID: $postId"
```

### 3. Upload images vào post
```powershell
# Tạo một file test image (hoặc dùng file có sẵn)
# Thay đổi đường dẫn đến file ảnh của bạn
$imagePath = "C:\path\to\your\image.jpg"

# Upload single image
$boundary = [System.Guid]::NewGuid().ToString()
$contentType = "multipart/form-data; boundary=$boundary"
$body = Get-Content $imagePath -Encoding Byte
Invoke-RestMethod -Uri "http://localhost:3000/api/posts/$postId/images" -Method POST -Headers @{Authorization="Bearer $token"} -ContentType $contentType -Body $body
```

### 4. Lấy thông tin post với images
```powershell
$post = Invoke-RestMethod -Uri "http://localhost:3000/api/posts/$postId" -Headers @{Authorization="Bearer $token"}
Write-Host "Post images:" ($post.data.images | ConvertTo-Json)
```

### 5. Xóa một image
```powershell
$imageId = $post.data.images[0].id
Invoke-RestMethod -Uri "http://localhost:3000/api/posts/$postId/images/$imageId" -Method DELETE -Headers @{Authorization="Bearer $token"}
Write-Host "Deleted image ID: $imageId"
```

## Test với Postman

### 1. Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "mentor1@example.com",
  "password": "123456"
}
```
Copy `data.token` từ response.

### 2. Create Post
```
POST http://localhost:3000/api/posts
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "title": "My Post with Images",
  "content": "This is my post content",
  "isPublic": true
}
```
Copy `data.id` (post ID).

### 3. Upload Images
```
POST http://localhost:3000/api/posts/{postId}/images
Authorization: Bearer <your-token>
Content-Type: multipart/form-data

Body:
- Select "form-data"
- Key: "images" (change type to "File")
- Value: Select multiple image files (max 10)
```

### 4. Get Post with Images
```
GET http://localhost:3000/api/posts/{postId}
Authorization: Bearer <your-token>
```

### 5. Get All Posts (with images)
```
GET http://localhost:3000/api/posts?page=1&limit=10
Authorization: Bearer <your-token>
```

### 6. Delete Image
```
DELETE http://localhost:3000/api/posts/{postId}/images/{imageId}
Authorization: Bearer <your-token>
```

## Manual Testing Checklist

### Validation Tests
- [ ] Upload với file không phải ảnh → Should reject
- [ ] Upload ảnh > 5MB → Should reject
- [ ] Upload > 10 ảnh cùng lúc → Should only accept 10
- [ ] Upload với các format: JPG, PNG, GIF, WebP → All should work

### Authorization Tests
- [ ] Upload image vào post của người khác → Should fail (403)
- [ ] Delete image của post người khác → Should fail (403)
- [ ] Upload/Delete không có token → Should fail (401)

### Functionality Tests
- [ ] Upload 1 ảnh → Should succeed
- [ ] Upload nhiều ảnh (3-5) → Should succeed
- [ ] Delete 1 ảnh → Should succeed
- [ ] Xóa post → All images should be deleted (cascade)
- [ ] Get posts → Images should be included and sorted by order

### Frontend Tests
- [ ] Tạo post và upload ảnh
- [ ] Ảnh hiển thị đúng trong post list
- [ ] Xóa ảnh thành công
- [ ] Upload nhiều ảnh và kiểm tra order
- [ ] Test responsive trên mobile
- [ ] Kiểm tra validation messages

## Expected Responses

### Successful Upload
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "postId": 5,
      "imageUrl": "/storage/posts/post_1_1699876543210_abc123.jpg",
      "order": 0,
      "createdAt": "2025-11-07T10:30:00.000Z"
    }
  ],
  "message": "Images uploaded successfully"
}
```

### Successful Delete
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Error: Invalid File Type
```json
{
  "success": false,
  "error": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

### Error: Access Denied
```json
{
  "success": false,
  "error": "Post not found or access denied"
}
```

## Performance Testing

### Test Large Uploads
```powershell
# Upload 10 images (5MB each)
# Monitor upload time and memory usage
```

### Test Concurrent Uploads
```powershell
# Multiple users uploading simultaneously
# Check for race conditions
```

## Database Verification

```sql
-- Check uploaded images
SELECT * FROM postimage WHERE postId = ?;

-- Check cascade delete
DELETE FROM post WHERE id = ?;
-- Verify all related postimage records are deleted

-- Check order
SELECT * FROM postimage WHERE postId = ? ORDER BY `order` ASC;
```

## Clean Up Test Data

```sql
-- Remove all test images
DELETE FROM postimage WHERE postId IN (SELECT id FROM post WHERE title LIKE 'Test%');

-- Remove test posts
DELETE FROM post WHERE title LIKE 'Test%';
```

---

## Quick Test Script

```powershell
# Complete test flow
Write-Host "1. Login..."
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body (@{email="mentor1@example.com"; password="123456"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.data.token

Write-Host "2. Create post..."
$createPost = Invoke-RestMethod -Uri "http://localhost:3000/api/posts" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{title="Quick Test Post"; content="Testing images"; isPublic=$true} | ConvertTo-Json) -ContentType "application/json"
$postId = $createPost.data.id
Write-Host "Post ID: $postId"

Write-Host "3. Get post..."
$post = Invoke-RestMethod -Uri "http://localhost:3000/api/posts/$postId" -Headers @{Authorization="Bearer $token"}
Write-Host "Post created successfully!"
Write-Host "Images count: $($post.data.images.Count)"

Write-Host "`nTest completed! Now upload images via Postman or frontend."
```
