# Frontend Update - Employer Registration System

**Ngày**: October 15, 2025  
**Branch**: `klong/auth`  
**Frontend**: Next.js 15 with App Router  
**Auth**: Supabase Auth (JWT)

---

## 📝 Tóm tắt

Frontend đã hoàn thành **Employer Registration System** với role-based UI. Backend cần cung cấp các API tương ứng.

---

## 🎯 Frontend đã implement

### 1. **User Role Management**
- AuthContext tracking user role: `'normal'` | `'employer'` | `null`
- User metadata: `user.user_metadata.role`
- Auto-refresh role sau khi đăng ký employer

### 2. **UI Components**
- **Navbar**: 
  - Hiển thị "Become Employer" button cho normal users
  - Hiển thị "Dashboard" button cho employers
  
- **Employer Registration Page** (`/employer/register`):
  - Form với 6 fields: company_name, company_website, company_logo, company_description, industry, company_size
  - Protected route (chỉ logged-in users)
  - Auto-redirect nếu đã là employer
  
- **Employer Dashboard** (`/employer/dashboard`):
  - Hiển thị employer profile
  - Warning banner nếu chưa verified
  - Protected route (chỉ employers)

### 3. **Frontend API Calls**
Frontend đang call các endpoints sau (cần Backend implement):

#### `POST /api/employer/register`
- **Request Headers**: `Authorization: Bearer {jwt_token}`
- **Request Body**:
```json
{
  "user_id": "uuid",
  "company_name": "TechCorp Inc.",
  "company_website": "https://techcorp.com",
  "company_logo": "https://example.com/logo.png",
  "company_description": "Leading tech company...",
  "industry": "Technology",
  "company_size": "51-200"
}
```
- **Expected Response (201)**:
```json
{
  "message": "Employer profile created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "company_name": "TechCorp Inc.",
    "is_verified": false,
    "created_at": "2025-10-15T10:00:00Z"
  }
}
```
- **Error Response (409)**:
```json
{
  "error": "User already has an employer profile"
}
```

#### `GET /api/employer/profile?user_id={user_id}` (hoặc dùng JWT)
- **Request Headers**: `Authorization: Bearer {jwt_token}`
- **Expected Response (200)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "company_name": "TechCorp Inc.",
  "company_website": "https://techcorp.com",
  "company_logo": "https://example.com/logo.png",
  "company_description": "Leading tech company...",
  "industry": "Technology",
  "company_size": "51-200",
  "is_verified": true,
  "created_at": "2025-10-15T10:00:00Z",
  "updated_at": "2025-10-15T10:00:00Z"
}
```
## Employer model

/src/models/employerProfile.model.js


## 🔐 Authentication Flow

1. User đăng nhập → JWT token
2. Frontend gửi token trong header: `Authorization: Bearer {token}`
3. Backend verify token với Supabase Auth API
4. Backend extract `user_id` từ token
5. Backend check/create/update employer profile

**JWT Verification** (Backend cần implement):
```javascript
const { data: { user }, error } = await supabase.auth.getUser(token)
```

---

## ✅ Backend Cần Làm

### Priority 1: Core APIs (Ngay lập tức)

- [ ] **POST `/api/employer/register`**
  - Verify JWT token
  - Validate request body
  - Check duplicate (user_id UNIQUE)
  - Insert employer_profiles
  - Update user metadata: `role: 'employer'`
  - Return 201 Created

- [ ] **GET `/api/employer/profile`**
  - Verify JWT token
  - Get employer profile by user_id (từ token)
  - Return profile data
  - Return 404 if not found

### Priority 2: Additional APIs (Sau này)

- [ ] **PUT `/api/employer/profile`** - Update employer profile
- [ ] **POST `/api/employer/upload-logo`** - Upload company logo (file upload)
- [ ] **GET `/api/employers`** - List verified employers (public, có pagination)
- [ ] **PATCH `/api/admin/employers/:id/verify`** - Admin verify employer (set `is_verified = true`)

---

## 📋 Validation Rules

Backend cần validate:

| Field | Required | Type | Rules |
|-------|----------|------|-------|
| `company_name` | ✅ Yes | String | Min 2 chars |
| `company_website` | ❌ No | String | Valid URL format |
| `company_logo` | ❌ No | String | Valid URL format |
| `company_description` | ❌ No | String | Max 2000 chars |
| `industry` | ❌ No | String | Max 100 chars |
| `company_size` | ❌ No | String | Must be one of: "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+" |

---

## 🚨 Error Handling

Backend cần handle:

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid request body | `{ "error": "Validation error", "details": [...] }` |
| 401 | Missing/invalid token | `{ "error": "Unauthorized" }` |
| 403 | Wrong user role | `{ "error": "Forbidden" }` |
| 404 | Profile not found | `{ "error": "Employer profile not found" }` |
| 409 | Duplicate profile | `{ "error": "User already has an employer profile" }` |
| 500 | Server error | `{ "error": "Internal server error" }` |

---

## 📂 Files Changed (Frontend)

Để tham khảo implementation:

1. `src/contexts/AuthContext.tsx` - User role management
2. `src/components/Navbar.tsx` - Role-based UI
3. `src/app/employer/register/page.tsx` - Registration form
4. `src/app/employer/dashboard/page.tsx` - Dashboard UI
5. `src/app/api/employer/register/route.ts` - **Next.js API route (tạm thời, nên chuyển sang Backend)**
6. `src/lib/supabase.ts` - Supabase client helpers

---

## 💡 Notes cho Backend

1. **JWT Token**: Frontend gửi Supabase JWT token, Backend verify bằng Supabase Auth API
2. **User Role**: Sau khi tạo employer profile, PHẢI update `user.user_metadata.role = 'employer'`
3. **Unique Constraint**: `user_id` là UNIQUE, check duplicate trước khi insert
4. **Verification**: `is_verified` mặc định FALSE, chỉ admin mới set TRUE
5. **CORS**: Whitelist frontend URL: `http://localhost:3000`
6. **File Upload**: Logo hiện dùng URL, sau này có thể upgrade lên file upload
7. **API Contract**: Response format phải match với Frontend expectations

---

## 🔗 Related Documents

- `DATABASE_SETUP.md` - Chi tiết SQL schema với RLS policies
- `src/app/employer/register/page.tsx` - Frontend form implementation
- `src/contexts/AuthContext.tsx` - Role management logic

---

## 📞 Contact

Nếu có thắc mắc về Frontend implementation, liên hệ Frontend team.

**Frontend Lead**: [Your Name]  
**Backend Lead**: [Backend Team Lead]  
**Last Updated**: October 15, 2025
