# API Test Commands

## 1. Health Check
```bash
curl http://localhost:3000/api/health
```

## 2. Login as Mentor
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mentor@example.com", "password": "mentor123"}'
```

## 3. Login as Mentee  
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mentee@example.com", "password": "mentee123"}'
```

## 4. Get Current User (replace YOUR_TOKEN)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 5. Create Mentor Profile
```bash
curl -X POST http://localhost:3000/api/profiles/mentor \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe Updated",
    "school": "Harvard",
    "expertise": ["Backend", "Mobile", "AI"],
    "degree": "PhD Computer Science",
    "yearsExp": 8,
    "bio": "Senior software engineer with AI expertise"
  }'
```

## 6. Get Available Schedules
```bash
curl -X GET "http://localhost:3000/api/schedules?status=AVAILABLE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## PowerShell Commands (Windows)

### Login as Mentor
```powershell
$response = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email": "mentor@example.com", "password": "mentor123"}'
$token = ($response.Content | ConvertFrom-Json).data.token
Write-Host "Token: $token"
```

### Get Current User
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/auth/me -Method GET -Headers @{"Authorization"="Bearer $token"}
```
