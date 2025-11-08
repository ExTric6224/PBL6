# Test Script: Verify Posts Permission Logic Fix
# Run this after starting the API server
# Usage: .\test-posts-permission-fix.ps1

$API_BASE = "http://localhost:3000/api"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🧪 Testing Posts Permission Logic Fix" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login as mentee
Write-Host "📝 Test 1: Login as mentee user" -ForegroundColor Yellow

$loginBody = @{
    email = "mentee1@example.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $token"
}

# Test 2: View all posts
Write-Host "📝 Test 2: GET /api/posts (View public posts)" -ForegroundColor Yellow

try {
    $postsResponse = Invoke-RestMethod -Uri "$API_BASE/posts" -Method Get -Headers $headers
    
    if ($postsResponse.success) {
        Write-Host "✅ Can view posts without post:view_any permission" -ForegroundColor Green
        Write-Host "Total posts found: $($postsResponse.pagination.total)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Cannot view posts" -ForegroundColor Red
        Write-Host ($postsResponse | ConvertTo-Json) -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error viewing posts" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Test 3: View specific post
Write-Host "📝 Test 3: GET /api/posts/:id (View specific post)" -ForegroundColor Yellow

try {
    if ($postsResponse.data.Count -gt 0) {
        $postId = $postsResponse.data[0].id
        $postDetail = Invoke-RestMethod -Uri "$API_BASE/posts/$postId" -Method Get -Headers $headers
        
        if ($postDetail.success) {
            Write-Host "✅ Can view specific post" -ForegroundColor Green
            Write-Host "Post title: $($postDetail.data.title)" -ForegroundColor Gray
        } else {
            Write-Host "❌ Cannot view specific post" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  No posts available to test" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error viewing post" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Test 4: View post likes
Write-Host "📝 Test 4: GET /api/posts/:id/likes (View likes)" -ForegroundColor Yellow

try {
    if ($postsResponse.data.Count -gt 0) {
        $postId = $postsResponse.data[0].id
        $likesResponse = Invoke-RestMethod -Uri "$API_BASE/posts/$postId/likes" -Method Get -Headers $headers
        
        if ($likesResponse.success) {
            Write-Host "✅ Can view post likes" -ForegroundColor Green
        } else {
            Write-Host "❌ Cannot view post likes" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  No posts available to test" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error viewing likes" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Test 5: Create post (requires permission)
Write-Host "📝 Test 5: POST /api/posts (Create post - requires permission)" -ForegroundColor Yellow

$createBody = @{
    title = "Test Post from PowerShell Script"
    content = "Testing posts permission fix"
    isPublic = $true
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$API_BASE/posts" -Method Post -Body $createBody -Headers $headers -ContentType "application/json"
    
    if ($createResponse.success) {
        Write-Host "✅ Can create post (has post:create permission)" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Message -match "Insufficient permissions") {
        Write-Host "⚠️  Cannot create post (no post:create permission) - Expected" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Unexpected error creating post" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected Results:" -ForegroundColor Green
Write-Host "  1. ✅ Login successful"
Write-Host "  2. ✅ Can view public posts without permission"
Write-Host "  3. ✅ Can view specific post without permission"
Write-Host "  4. ✅ Can view post likes without permission"
Write-Host "  5. ⚠️  Create requires permission (may fail if user lacks permission)"
Write-Host ""
Write-Host "Key Point: " -NoNewline -ForegroundColor Yellow
Write-Host "Viewing posts no longer requires post:view_any permission"
Write-Host "Authentication is still required, but permission check is removed for viewing"
Write-Host ""
