# OTP Testing Commands

## Step 1: Request OTP Code
curl -X POST http://localhost:3000/api/auth/register/request-code ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"role\":\"MENTEE\"}"

## Step 2: Check Server Console
# Look for this output:
# ============================================================
# 📧 EMAIL VERIFICATION CODE (DEVELOPMENT MODE)  
# ============================================================
# 📨 To: test@example.com
# 🔐 Code: 123456
# ============================================================

## Step 3: Verify OTP Code (replace 123456 with actual code)
curl -X POST http://localhost:3000/api/auth/register/verify ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"code\":\"123456\"}"

## Step 4: Test JWT Token (replace YOUR_TOKEN with token from step 3)
curl -X GET http://localhost:3000/api/auth/me ^
  -H "Authorization: Bearer YOUR_TOKEN"

## Bonus: Resend Code
curl -X POST http://localhost:3000/api/auth/register/resend ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\"}"