# Job Review System Documentation

## Overview

Hệ thống đánh giá giữa Employer và Freelancer sau khi hoàn thành job.

## Database Schema

### Bảng `job_reviews`

```sql
CREATE TABLE job_reviews (
  id UUID PRIMARY KEY,

  -- Job/Project
  job_id UUID NOT NULL,

  -- People involved
  employer_id UUID NOT NULL,      -- Job owner
  freelancer_id UUID NOT NULL,     -- Người làm job
  reviewer_id UUID NOT NULL,       -- Người đánh giá
  reviewer_role VARCHAR(20),       -- EMPLOYER | FREELANCER

  -- Review content
  rating INTEGER (1-5),
  comment TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Business Logic

### Ai có thể review?

1. **Employer review Freelancer**: Sau khi job completed
2. **Freelancer review Employer**: Sau khi job completed

### Constraints

- Mỗi user chỉ review 1 lần/job
- Chỉ review được job status = "completed"
- Chỉ được review nếu là employer hoặc freelancer của job đó

## API Endpoints

### 1. Create Review

**POST** `/job-reviews`

```json
{
  "job_id": "uuid",
  "rating": 5,
  "comment": "Great work!"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "employer_id": "uuid",
    "freelancer_id": "uuid",
    "reviewer_id": "uuid",
    "reviewer_role": "EMPLOYER",
    "rating": 5,
    "comment": "Great work!",
    "created_at": "2025-10-28T10:00:00Z"
  }
}
```

### 2. Get Reviews of a Job

**GET** `/job-reviews/job/:jobId`

Response includes reviewer, employer, freelancer info from Supabase.

### 3. Get Reviews of a User

**GET** `/job-reviews/user/:userId?role=freelancer`

- `role`: 'freelancer' | 'employer' | undefined (all)

### 4. Update Review

**PUT** `/job-reviews/:id`

Chỉ owner mới update được.

### 5. Delete Review

**DELETE** `/job-reviews/:id`

Chỉ owner mới delete được.

### 6. Admin: Get All Reviews

**GET** `/admin/job-reviews`

Query parameters:

- `page`, `limit`
- `rating`: 1-5
- `reviewer_role`: EMPLOYER | FREELANCER
- `job_id`: filter by job
- `startDate`, `endDate`
- `sortBy`, `sortOrder`

## Admin Dashboard Integration

### Overview Endpoint

**GET** `/admin/dashboard/overview`

Includes job reviews statistics:

```json
{
  "reviews": {
    "total": 85,
    "average_rating": "4.3",
    "by_role": {
      "freelancers": 45,
      "employers": 40
    }
  }
}
```

### Reviews Details Endpoint

**GET** `/admin/dashboard/reviews`

Query parameters:

- `reviewer_role`: EMPLOYER | FREELANCER
- `rating`: 1-5
- `job_id`
- `start_date`, `end_date`

Response:

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "job": {
          "id": "uuid",
          "title": "Senior Developer",
          "status": "completed"
        },
        "employer": {
          "id": "uuid",
          "email": "employer@example.com",
          "full_name": "John Doe"
        },
        "freelancer": {
          "id": "uuid",
          "email": "freelancer@example.com",
          "full_name": "Jane Smith"
        },
        "reviewer": {
          "id": "uuid",
          "email": "employer@example.com",
          "full_name": "John Doe"
        },
        "reviewer_role": "EMPLOYER",
        "rating": 5,
        "comment": "Excellent work!",
        "created_at": "2025-10-28T10:00:00Z"
      }
    ],
    "statistics": {
      "average_rating": "4.5",
      "employer_review_count": 42,
      "freelancer_review_count": 38,
      "rating_distribution": [
        { "rating": 5, "count": 50 },
        { "rating": 4, "count": 20 },
        { "rating": 3, "count": 8 },
        { "rating": 2, "count": 2 },
        { "rating": 1, "count": 0 }
      ]
    },
    "pagination": {
      "total": 80,
      "page": 1,
      "limit": 20,
      "pages": 4
    }
  }
}
```

## Files Created

1. **Migration**: `src/migrations/006_create_job_reviews.sql`
2. **Model**: `src/models/jobReview.model.js`
3. **Controller**: `src/controllers/jobReviewController.js`
4. **Routes**: `src/routes/jobReviewRoutes.js`

## Files Modified

1. **`src/controllers/adminDashboardController.js`**

   - Updated overview to use JobReview instead of PlatformReview
   - Updated getReviewsDetails to show job reviews with full info

2. **`src/routes/index.js`**
   - Added jobReviewRoutes

## Usage Flow

```
1. Job posted by Employer
2. Freelancer applies
3. Employer accepts application
4. Freelancer completes job
5. Employer completes job → Money transferred
6. ✅ Both can review now
   - Employer reviews Freelancer's work
   - Freelancer reviews Employer's professionalism
7. Reviews visible on:
   - Job detail page
   - User profile page
   - Admin dashboard
```

## Migration Steps

1. Run migration SQL:

```bash
psql -d jobboost < src/migrations/006_create_job_reviews.sql
```

2. Restart server (model will auto-load)

3. Test endpoints

## Example: Create Review

```javascript
// Employer reviews freelancer
POST / job - reviews;
Authorization: Bearer <
  employer_token >
  {
    job_id: "abc-123",
    rating: 5,
    comment: "Great freelancer! Delivered on time with high quality.",
  };

// Freelancer reviews employer
POST / job - reviews;
Authorization: Bearer <
  freelancer_token >
  {
    job_id: "abc-123",
    rating: 4,
    comment: "Good employer, clear requirements but tight deadline.",
  };
```

## Notes

- ✅ Simple schema với 8 fields như yêu cầu
- ✅ Integrated vào admin dashboard
- ✅ Supabase integration để lấy user info
- ✅ Full CRUD operations
- ✅ Statistics và rating distribution
- ⚠️ TODO: Add requireAdmin middleware

---

**Version**: 1.0.0  
**Created**: October 28, 2025
