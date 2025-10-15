# 🚀 JobBoost Backend API Documentation for Frontend

**Version**: 1.0  
**Base URL**: `http://localhost:3000`  
**Last Updated**: October 15, 2025

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Employer APIs](#employer-apis)
3. [Job APIs](#job-apis)
4. [Application APIs](#application-apis)
5. [CV Management APIs](#cv-management-apis)
6. [Error Handling](#error-handling)
7. [Quick Start Examples](#quick-start-examples)

---

## 🔐 Authentication

### Headers Required for Protected Endpoints

```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### Authentication Flow

1. User logs in via Supabase Auth → receives JWT token
2. Frontend stores token (localStorage/sessionStorage)
3. Include token in `Authorization` header for all protected API calls
4. Backend verifies token and extracts `user_id`

### Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👔 Employer APIs

### Base Path: `/api/employer`

### 1. Register as Employer

**Endpoint**: `POST /api/employer/register`  
**Auth**: Required ✅  
**Description**: Register user as an employer with company information

#### Request

```javascript
// Headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}

// Body
{
  "company_name": "TechCorp Inc.",           // Required, min 2 chars
  "company_website": "https://techcorp.com", // Optional, must be valid URL
  "company_logo": "https://example.com/logo.png", // Optional, must be valid URL
  "company_description": "Leading tech company in Vietnam...", // Optional, max 2000 chars
  "industry": "Technology",                  // Optional
  "company_size": "51-200"                   // Optional: "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
}
```

#### Response 201 - Success

```json
{
  "message": "Employer profile created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "company_name": "TechCorp Inc.",
    "is_verified": false,
    "created_at": "2025-10-15T10:00:00.000Z"
  }
}
```

#### Response 409 - Already Registered

```json
{
  "error": "User already has an employer profile"
}
```

#### Response 400 - Validation Error

```json
{
  "error": "Validation error",
  "details": [
    "Company name is required and must be at least 2 characters"
  ]
}
```

---

### 2. Get Employer Profile

**Endpoint**: `GET /api/employer/profile`  
**Auth**: Required ✅  
**Description**: Get employer profile for current logged-in user

#### Request

```javascript
// Headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

#### Response 200 - Success

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "company_name": "TechCorp Inc.",
  "company_website": "https://techcorp.com",
  "company_logo": "https://example.com/logo.png",
  "company_description": "Leading tech company in Vietnam...",
  "industry": "Technology",
  "company_size": "51-200",
  "is_verified": false,
  "created_at": "2025-10-15T10:00:00.000Z",
  "updated_at": "2025-10-15T10:00:00.000Z"
}
```

#### Response 404 - Not Found

```json
{
  "error": "Employer profile not found"
}
```

---

### 3. Update Employer Profile

**Endpoint**: `PUT /api/employer/profile`  
**Auth**: Required ✅  
**Description**: Update employer profile information

#### Request

```javascript
// Headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}

// Body (all fields optional)
{
  "company_name": "Updated Company Name",
  "company_website": "https://newwebsite.com",
  "company_logo": "https://newlogo.com/logo.png",
  "company_description": "Updated description",
  "industry": "IT Services",
  "company_size": "201-500"
}
```

#### Response 200 - Success

```json
{
  "message": "Employer profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "company_name": "Updated Company Name",
    "company_website": "https://newwebsite.com",
    "company_logo": "https://newlogo.com/logo.png",
    "company_description": "Updated description",
    "industry": "IT Services",
    "company_size": "201-500",
    "is_verified": false,
    "created_at": "2025-10-15T10:00:00.000Z",
    "updated_at": "2025-10-15T11:30:00.000Z"
  }
}
```

---

### 4. Get All Verified Employers (Public)

**Endpoint**: `GET /api/employers`  
**Auth**: Not Required ❌  
**Description**: Get list of verified employers (public endpoint)

#### Request

```javascript
// Query Parameters
?page=1&limit=10
```

#### Response 200 - Success

```json
{
  "success": true,
  "message": "Verified employers retrieved successfully",
  "data": {
    "employers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "company_name": "TechCorp Inc.",
        "company_website": "https://techcorp.com",
        "company_logo": "https://example.com/logo.png",
        "company_description": "Leading tech company...",
        "industry": "Technology",
        "company_size": "51-200",
        "createdAt": "2025-10-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 47,
      "items_per_page": 10
    }
  }
}
```

---

### 5. Admin: Verify Employer

**Endpoint**: `PATCH /api/admin/employers/:id/verify`  
**Auth**: Required ✅ (Admin only)  
**Description**: Verify or unverify an employer

#### Request

```javascript
// Headers
{
  "Authorization": "Bearer ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}

// Body
{
  "is_verified": true  // or false to unverify
}
```

#### Response 200 - Success

```json
{
  "message": "Employer verification status updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "company_name": "TechCorp Inc.",
    "is_verified": true,
    "updated_at": "2025-10-15T12:00:00.000Z"
  }
}
```

---

## 💼 Job APIs

### Base Path: `/api/v1/jobs`

### 1. Get All Jobs (Public)

**Endpoint**: `GET /api/v1/jobs`  
**Auth**: Not Required ❌  
**Description**: Get list of all active jobs with filters

#### Request

```javascript
// Query Parameters
?page=1&limit=10&job_type=FREELANCE&status=active
```

#### Response 200 - Success

```json
{
  "success": true,
  "jobs": [
    {
      "id": "job-uuid-1",
      "owner_id": "user-uuid",
      "title": "Full Stack Developer Needed",
      "description": "We are looking for...",
      "job_type": "FREELANCE",
      "budget_type": "FIXED",
      "budget_min": 5000000,
      "budget_max": 10000000,
      "currency": "VND",
      "experience_level": "INTERMEDIATE",
      "skills_required": ["React", "Node.js", "PostgreSQL"],
      "status": "active",
      "deadline": "2025-11-15T00:00:00.000Z",
      "created_at": "2025-10-15T10:00:00.000Z",
      "updated_at": "2025-10-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 95,
    "items_per_page": 10
  }
}
```

---

### 2. Get Job by ID

**Endpoint**: `GET /api/v1/jobs/:jobId`  
**Auth**: Not Required ❌  
**Description**: Get detailed information about a specific job

#### Response 200 - Success

```json
{
  "success": true,
  "job": {
    "id": "job-uuid-1",
    "owner_id": "user-uuid",
    "title": "Full Stack Developer Needed",
    "description": "Detailed job description...",
    "job_type": "FREELANCE",
    "budget_type": "FIXED",
    "budget_min": 5000000,
    "budget_max": 10000000,
    "currency": "VND",
    "experience_level": "INTERMEDIATE",
    "skills_required": ["React", "Node.js"],
    "status": "active",
    "deadline": "2025-11-15T00:00:00.000Z",
    "created_at": "2025-10-15T10:00:00.000Z",
    "updated_at": "2025-10-15T10:00:00.000Z"
  }
}
```

---

### 3. Create Job (Employer Only)

**Endpoint**: `POST /api/v1/jobs`  
**Auth**: Required ✅  
**Description**: Create a new job posting

#### Request

```javascript
// Headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}

// Body
{
  "title": "Full Stack Developer Needed",
  "description": "We are looking for an experienced developer...",
  "job_type": "FREELANCE",           // "PROJECT", "FREELANCE", "PART_TIME"
  "budget_type": "FIXED",             // "FIXED", "HOURLY"
  "budget_min": 5000000,
  "budget_max": 10000000,
  "currency": "VND",
  "experience_level": "INTERMEDIATE", // "ENTRY", "INTERMEDIATE", "EXPERT"
  "deadline": "2025-11-15",
  "skills_required": ["React", "Node.js", "PostgreSQL"]
}
```

#### Response 201 - Success

```json
{
  "success": true,
  "message": "Job created successfully",
  "job": {
    "id": "new-job-uuid",
    "owner_id": "user-uuid",
    "title": "Full Stack Developer Needed",
    "status": "pending",
    "created_at": "2025-10-15T10:00:00.000Z"
  }
}
```

---

### 4. Update Job (Owner Only)

**Endpoint**: `PUT /api/v1/jobs/:jobId`  
**Auth**: Required ✅  
**Description**: Update job details (only if status is 'pending' or 'rejected')

#### Request

```javascript
// Headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}

// Body (all fields optional)
{
  "title": "Updated Job Title",
  "description": "Updated description",
  "budget_min": 6000000,
  "budget_max": 12000000
}
```

#### Response 200 - Success

```json
{
  "success": true,
  "message": "Job updated successfully",
  "job": {
    "id": "job-uuid",
    "title": "Updated Job Title",
    "updated_at": "2025-10-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete Job

**Endpoint**: `DELETE /api/v1/jobs/:jobId`  
**Auth**: Required ✅  
**Description**: Delete a job posting

#### Response 200 - Success

```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

---

### 6. Get My Jobs (Employer)

**Endpoint**: `GET /api/v1/jobs/my-jobs`  
**Auth**: Required ✅  
**Description**: Get all jobs posted by current employer

#### Response 200 - Success

```json
{
  "success": true,
  "jobs": [
    {
      "id": "job-uuid-1",
      "title": "Full Stack Developer",
      "status": "active",
      "created_at": "2025-10-15T10:00:00.000Z"
    }
  ]
}
```

---

### 7. Admin: Get Pending Jobs

**Endpoint**: `GET /api/v1/admin/jobs/pending`  
**Auth**: Required ✅ (Admin)  
**Description**: Get all jobs pending approval

#### Response 200 - Success

```json
{
  "success": true,
  "jobs": [
    {
      "id": "job-uuid",
      "title": "Backend Developer",
      "status": "pending",
      "created_at": "2025-10-15T09:00:00.000Z"
    }
  ]
}
```

---

### 8. Admin: Review Job

**Endpoint**: `PUT /api/v1/admin/jobs/:jobId/review`  
**Auth**: Required ✅ (Admin)  
**Description**: Approve or reject a job

#### Request

```javascript
// Body
{
  "status": "active",  // "active" to approve, "rejected" to reject
  "rejection_reason": "Content violates policies" // Required if status is "rejected"
}
```

#### Response 200 - Success

```json
{
  "success": true,
  "message": "Job review completed",
  "job": {
    "id": "job-uuid",
    "status": "active",
    "updated_at": "2025-10-15T12:00:00.000Z"
  }
}
```

---

## 📝 Application APIs

### Base Path: `/api/v1/applications`

### 1. Apply for Job (Freelancer)

**Endpoint**: `POST /api/v1/applications/:jobId`  
**Auth**: Required ✅  
**Description**: Apply for a specific job

#### Request

```javascript
// Headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}

// Body
{
  "cover_letter": "I am interested in this position because...",
  "proposed_rate": 8000000,
  "proposed_duration": "2 weeks",
  "availability_start": "2025-10-20"
}
```

#### Response 201 - Success

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "application": {
    "id": "application-uuid",
    "job_id": "job-uuid",
    "freelancer_id": "user-uuid",
    "status": "pending",
    "created_at": "2025-10-15T10:00:00.000Z"
  }
}
```

---

### 2. Get My Applications (Freelancer)

**Endpoint**: `GET /api/v1/applications`  
**Auth**: Required ✅  
**Description**: Get all applications submitted by current user

#### Request

```javascript
// Query Parameters
?page=1&limit=10&status=pending
```

#### Response 200 - Success

```json
{
  "success": true,
  "applications": [
    {
      "id": "application-uuid",
      "job_id": "job-uuid",
      "job_title": "Full Stack Developer",
      "status": "pending",
      "cover_letter": "I am interested...",
      "proposed_rate": 8000000,
      "created_at": "2025-10-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 25,
    "items_per_page": 10
  }
}
```

---

### 3. Get Applications for Job (Employer)

**Endpoint**: `GET /api/v1/jobs/:jobId/applications`  
**Auth**: Required ✅  
**Description**: Get all applications for a specific job (employer only)

#### Request

```javascript
// Query Parameters
?page=1&limit=10&status=pending
```

#### Response 200 - Success

```json
{
  "success": true,
  "data": [
    {
      "id": "application-uuid",
      "job_id": "job-uuid",
      "applicant_id": "user-uuid",
      "status": "pending",
      "cover_letter": "I am interested...",
      "proposed_rate": 8000000,
      "proposed_timeline": 14,
      "portfolio_links": ["https://portfolio.com"],
      "employer_notes": null,
      "rejection_reason": null,
      "createdAt": "2025-10-15T10:00:00.000Z",
      "updatedAt": "2025-10-15T10:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "profile": {
          "id": "freelancer-profile-uuid",
          "user_id": "user-uuid",
          "title": "Full Stack Developer",
          "bio": "Experienced developer...",
          "skills": ["React", "Node.js", "PostgreSQL"],
          "experience_level": "intermediate",
          "hourly_rate": 500000,
          "portfolio_links": ["https://portfolio.com"],
          "is_verified": true
        }
      },
      "freelancer": {
        "id": "freelancer-profile-uuid",
        "user_id": "user-uuid",
        "title": "Full Stack Developer",
        "bio": "Experienced developer...",
        "skills": ["React", "Node.js"],
        "experience_level": "intermediate",
        "hourly_rate": 500000,
        "portfolio_links": ["https://portfolio.com"],
        "is_verified": true
      }
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

**Note**: 
- The `user` field contains the applicant's Supabase user_id and their freelancer profile
- The `freelancer` field is also included for backward compatibility
- `profile` will be `null` if the user hasn't created a freelancer profile yet
- You'll need to fetch additional user details (name, email, avatar) from Supabase separately using the `user.id`

---

### 4. Get Application Detail

**Endpoint**: `GET /api/v1/applications/:applicationId`  
**Auth**: Required ✅  
**Description**: Get detailed information about an application

#### Response 200 - Success

```json
{
  "success": true,
  "application": {
    "id": "application-uuid",
    "job_id": "job-uuid",
    "freelancer_id": "user-uuid",
    "status": "pending",
    "cover_letter": "Detailed cover letter...",
    "proposed_rate": 8000000,
    "proposed_duration": "2 weeks",
    "availability_start": "2025-10-20T00:00:00.000Z",
    "created_at": "2025-10-15T10:00:00.000Z",
    "updated_at": "2025-10-15T10:00:00.000Z"
  }
}
```

---

### 4. Withdraw Application

**Endpoint**: `PUT /api/v1/applications/:applicationId/withdraw`  
**Auth**: Required ✅  
**Description**: Withdraw a submitted application

#### Response 200 - Success

```json
{
  "success": true,
  "message": "Application withdrawn successfully"
}
```

---

### 5. Update Application Status (Employer)

**Endpoint**: `PUT /api/v1/applications/:applicationId/status`  
**Auth**: Required ✅  
**Description**: Accept or reject an application (employer only)

#### Request

```javascript
// Body
{
  "status": "accepted"  // "accepted", "rejected"
}
```

#### Response 200 - Success

```json
{
  "success": true,
  "message": "Application status updated",
  "application": {
    "id": "application-uuid",
    "status": "accepted",
    "updated_at": "2025-10-15T12:00:00.000Z"
  }
}
```

---

## 📄 CV Management APIs

### Base Path: `/api/v1/cvs`

### 1. Upload CV

**Endpoint**: `POST /api/v1/cvs`  
**Auth**: Required ✅  
**Description**: Upload a PDF CV file

#### Request

```javascript
// Headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "multipart/form-data"
}

// Form Data
{
  "cv": File,                    // PDF file (max 10MB)
  "name": "My Resume 2025",      // Required
  "description": "Updated CV",   // Optional
  "isPrimary": "true"            // Optional, set as primary CV
}
```

#### Response 201 - Success

```json
{
  "success": true,
  "message": "CV uploaded successfully",
  "data": {
    "id": "cv-uuid",
    "name": "My Resume 2025",
    "description": "Updated CV",
    "file_name": "resume.pdf",
    "file_size": 524288,
    "is_primary": true,
    "uploaded_at": "2025-10-15T10:00:00.000Z",
    "created_at": "2025-10-15T10:00:00.000Z"
  }
}
```

#### Response 400 - Invalid File

```json
{
  "success": false,
  "message": "Only PDF files are allowed for CV upload"
}
```

---

### 2. Get My CVs

**Endpoint**: `GET /api/v1/cvs`  
**Auth**: Required ✅  
**Description**: Get all CVs for current user

#### Request

```javascript
// Query Parameters
?page=1&limit=10&status=active
```

#### Response 200 - Success

```json
{
  "success": true,
  "message": "CVs retrieved successfully",
  "data": {
    "cvs": [
      {
        "id": "cv-uuid-1",
        "name": "My Resume 2025",
        "description": "Latest version",
        "file_name": "resume.pdf",
        "file_size": 524288,
        "mime_type": "application/pdf",
        "is_primary": true,
        "status": "active",
        "uploaded_at": "2025-10-15T10:00:00.000Z",
        "created_at": "2025-10-15T10:00:00.000Z",
        "updated_at": "2025-10-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 3,
      "items_per_page": 10
    }
  }
}
```

---

### 3. Get CV by ID

**Endpoint**: `GET /api/v1/cvs/:id`  
**Auth**: Required ✅  
**Description**: Get CV details

#### Response 200 - Success

```json
{
  "success": true,
  "message": "CV retrieved successfully",
  "data": {
    "id": "cv-uuid",
    "name": "My Resume 2025",
    "description": "Latest version",
    "file_name": "resume.pdf",
    "file_size": 524288,
    "mime_type": "application/pdf",
    "is_primary": true,
    "status": "active",
    "uploaded_at": "2025-10-15T10:00:00.000Z",
    "created_at": "2025-10-15T10:00:00.000Z",
    "updated_at": "2025-10-15T10:00:00.000Z"
  }
}
```

---

### 4. Update CV

**Endpoint**: `PUT /api/v1/cvs/:id`  
**Auth**: Required ✅  
**Description**: Update CV name, description, or primary status

#### Request

```javascript
// Body
{
  "name": "Updated Resume Name",
  "description": "New description",
  "isPrimary": true
}
```

#### Response 200 - Success

```json
{
  "success": true,
  "message": "CV updated successfully",
  "data": {
    "id": "cv-uuid",
    "name": "Updated Resume Name",
    "description": "New description",
    "file_name": "resume.pdf",
    "file_size": 524288,
    "is_primary": true,
    "updated_at": "2025-10-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete CV

**Endpoint**: `DELETE /api/v1/cvs/:id`  
**Auth**: Required ✅  
**Description**: Delete a CV (soft delete)

#### Response 200 - Success

```json
{
  "success": true,
  "message": "CV deleted successfully"
}
```

---

### 6. Download CV

**Endpoint**: `GET /api/v1/cvs/:id/download`  
**Auth**: Required ✅  
**Description**: Download CV file

#### Response 200 - Success

Returns PDF file with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume.pdf"
```

---

### 7. Set Primary CV

**Endpoint**: `PATCH /api/v1/cvs/:id/set-primary`  
**Auth**: Required ✅  
**Description**: Set a CV as primary (unsets other primary CVs)

#### Response 200 - Success

```json
{
  "success": true,
  "message": "Primary CV set successfully",
  "data": {
    "id": "cv-uuid",
    "name": "My Resume 2025",
    "is_primary": true
  }
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message",
  "details": ["Additional detail 1", "Additional detail 2"]
}
```

### HTTP Status Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate) |
| 500 | Internal Server Error | Server error, check logs |

### Common Error Scenarios

#### 1. Missing Authorization Token

```json
{
  "message": "No token provided!"
}
```

#### 2. Invalid/Expired Token

```json
{
  "message": "Unauthorized!"
}
```

#### 3. Validation Error

```json
{
  "error": "Validation error",
  "details": [
    "Company name is required and must be at least 2 characters",
    "Company website must be a valid URL"
  ]
}
```

#### 4. Resource Not Found

```json
{
  "error": "Employer profile not found"
}
```

#### 5. Duplicate Resource

```json
{
  "error": "User already has an employer profile"
}
```

---

## 🚀 Quick Start Examples

### React/Next.js Example

```typescript
// api/client.ts
const API_BASE_URL = 'http://localhost:3000';

// Get JWT token from Supabase
const getAuthHeaders = () => {
  const token = localStorage.getItem('supabase_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Example: Register as Employer
export const registerEmployer = async (data: EmployerRegistration) => {
  const response = await fetch(`${API_BASE_URL}/api/employer/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  return response.json();
};

// Example: Get Employer Profile
export const getEmployerProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/employer/profile`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch profile');
  }
  
  return response.json();
};

// Example: Upload CV
export const uploadCV = async (file: File, name: string, description?: string) => {
  const formData = new FormData();
  formData.append('cv', file);
  formData.append('name', name);
  if (description) formData.append('description', description);
  
  const token = localStorage.getItem('supabase_token');
  const response = await fetch(`${API_BASE_URL}/api/v1/cvs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }
  
  return response.json();
};

// Example: Get All Jobs
export const getAllJobs = async (page = 1, limit = 10) => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/jobs?page=${page}&limit=${limit}`
  );
  
  if (!response.ok) throw new Error('Failed to fetch jobs');
  return response.json();
};

// Example: Create Job
export const createJob = async (jobData: JobCreate) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(jobData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create job');
  }
  
  return response.json();
};
```

---

### TypeScript Interfaces

```typescript
// types.ts

export interface EmployerProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_website?: string;
  company_logo?: string;
  company_description?: string;
  industry?: string;
  company_size?: CompanySize;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";

export interface EmployerRegistration {
  company_name: string;
  company_website?: string;
  company_logo?: string;
  company_description?: string;
  industry?: string;
  company_size?: CompanySize;
}

export interface Job {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  job_type: "PROJECT" | "FREELANCE" | "PART_TIME";
  budget_type: "FIXED" | "HOURLY";
  budget_min?: number;
  budget_max?: number;
  currency: string;
  experience_level: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  skills_required: string[];
  status: "pending" | "active" | "closed" | "rejected";
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface CV {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_primary: boolean;
  status: "active" | "archived" | "deleted";
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  freelancer_id: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  cover_letter: string;
  proposed_rate?: number;
  proposed_duration?: string;
  availability_start?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 📞 Support & Resources

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: TBD

### Swagger Documentation
Access interactive API documentation at: `http://localhost:3000/api-docs`

### Frontend CORS Configuration
Already configured to accept requests from: `http://localhost:5173`

### Need Help?
- Check server logs for detailed error messages
- Verify JWT token is valid and not expired
- Ensure request body matches the schemas above
- Check that file uploads use `multipart/form-data`

---

**Last Updated**: October 15, 2025  
**Version**: 1.0  
**Maintained by**: Backend Team
