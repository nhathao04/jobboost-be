# Platform Review - Chỉ giữ Web Review

## ✅ Đã cập nhật

API admin dashboard giờ chỉ hiển thị **Platform Reviews** (reviews về website JobBoost), không còn Job Reviews nữa.

---

## 📋 Thay đổi trong `adminDashboardController.js`

### 1. **Bỏ Job Association**

- ❌ Xóa: `include Job` trong query
- ✅ Giữ: Chỉ query PlatformReview đơn giản

### 2. **Field Names**

Sử dụng đúng field names từ PlatformReview model hiện tại:

- `user_id` (thay vì reviewer_id)
- `user_role` (thay vì reviewer_role)
- Không có: job_id, employer_id, freelancer_id

### 3. **Filters**

```javascript
// Query params
reviewer_role → maps to → user_role
rating → maps to → rating
// Bỏ job_id (không cần)
```

### 4. **Response Structure**

```json
{
  "reviews": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_role": "FREELANCER",
      "rating": 5,
      "comment": "Great platform!",
      "aspects": { ... },
      "completed_jobs_count": 10,
      "total_earned": 5000000,
      "reviewer": {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "John Doe",
        "role": "FREELANCER"
      }
    }
  ],
  "statistics": {
    "average_rating": "4.5",
    "employer_review_count": 20,
    "freelancer_review_count": 30,
    "rating_distribution": [...]
  }
}
```

---

## 🎯 APIs hoạt động

### 1. GET `/api/admin/dashboard/overview`

```json
{
  "reviews": {
    "total": 50,
    "average_rating": "4.5",
    "by_role": {
      "freelancers": 30,
      "employers": 20
    }
  }
}
```

### 2. GET `/api/admin/dashboard/reviews`

Query params:

- `page` (default: 1)
- `limit` (default: 20)
- `reviewer_role` (FREELANCER or EMPLOYER)
- `rating` (1-5)
- `start_date`, `end_date`
- `sort_by`, `sort_dir`

**Đã bỏ:** `job_id` filter

---

## 🗑️ JobReview - Không còn sử dụng

Files JobReview vẫn tồn tại nhưng **KHÔNG được sử dụng** trong admin dashboard:

- `src/models/jobReview.model.js` ❌
- `src/controllers/jobReviewController.js` ❌
- `src/routes/jobReviewRoutes.js` ❌

Có thể xóa sau nếu không cần.

---

## 📝 PlatformReview Model Fields

```javascript
{
  id: UUID,
  user_id: UUID,              // User đánh giá
  user_role: STRING,          // FREELANCER | EMPLOYER
  rating: INTEGER (1-5),      // Rating
  comment: TEXT,              // Comment
  aspects: JSONB,             // Chi tiết đánh giá
  completed_jobs_count: INT,  // Số job đã làm
  total_earned: DECIMAL,      // Tổng tiền kiếm được
  is_verified: BOOLEAN,       // Đã verify chưa
  is_visible: BOOLEAN,        // Hiển thị không
  helpful_count: INTEGER,     // Số người thấy hữu ích
  admin_response: TEXT,       // Admin trả lời
  status: STRING,             // PENDING | APPROVED | REJECTED
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

---

## ✅ Test Commands

```bash
# 1. Get overview
curl http://localhost:3000/api/admin/dashboard/overview

# 2. Get all reviews
curl http://localhost:3000/api/admin/dashboard/reviews

# 3. Filter by role
curl http://localhost:3000/api/admin/dashboard/reviews?reviewer_role=FREELANCER

# 4. Filter by rating
curl http://localhost:3000/api/admin/dashboard/reviews?rating=5

# Expected: Không có lỗi "Job is not associated to PlatformReview!"
```

---

## 🎉 Summary

✅ Admin dashboard chỉ hiển thị **Platform Reviews** (web reviews)
✅ Bỏ association với Job model
✅ Sử dụng đúng field names (user_id, user_role)
✅ Response đơn giản hơn, chỉ có reviewer info
✅ Không còn lỗi association
