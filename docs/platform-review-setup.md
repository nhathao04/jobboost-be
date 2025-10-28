# Platform Review Setup Guide

## 📦 Database Migration

### Chạy migration để tạo bảng `platform_reviews`:

```bash
# Connect to PostgreSQL
psql -U your_username -d your_database

# Run migration
\i src/migrations/004_create_platform_reviews.sql

# Verify table created
\d platform_reviews
```

Hoặc dùng tool migration của bạn:

```bash
# Nếu dùng sequelize-cli
npx sequelize-cli db:migrate

# Nếu dùng node-pg-migrate
npm run migrate up
```

## 🧪 Testing APIs

### 1. Test Smart Review Eligibility (Freelancer)

```bash
# Check if freelancer should be prompted to review
curl -X GET "http://localhost:3003/api/platform-reviews/eligibility?user_role=FREELANCER" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (should prompt):**

```json
{
  "success": true,
  "data": {
    "should_prompt": true,
    "reason": "Bạn đã hoàn thành 3 công việc! Hãy chia sẻ trải nghiệm của bạn.",
    "has_reviewed": false,
    "last_review": null,
    "stats": {
      "completed_jobs": 3,
      "total_earned": 1500000
    }
  }
}
```

### 2. Test Create Review

```bash
curl -X POST "http://localhost:3003/api/platform-reviews" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_role": "FREELANCER",
    "rating": 5,
    "comment": "Rất hài lòng với nền tảng! Tìm được nhiều job chất lượng.",
    "aspects": {
      "user_interface": 5,
      "job_quality": 4,
      "support": 5,
      "payment": 5
    }
  }'
```

### 3. Test Get Public Reviews

```bash
curl -X GET "http://localhost:3003/api/platform-reviews?page=1&limit=10"
```

### 4. Test Get My Review

```bash
curl -X GET "http://localhost:3003/api/platform-reviews/my-review?user_role=FREELANCER" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Test Update Review

```bash
curl -X PUT "http://localhost:3003/api/platform-reviews/{REVIEW_ID}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Cập nhật đánh giá sau 3 tháng sử dụng"
  }'
```

### 6. Test Mark Helpful (No auth required)

```bash
curl -X POST "http://localhost:3003/api/platform-reviews/{REVIEW_ID}/helpful"
```

### 7. Test Admin Response (Admin only)

```bash
curl -X PUT "http://localhost:3003/api/admin/platform-reviews/{REVIEW_ID}/response" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_response": "Cảm ơn bạn đã đánh giá! Chúng tôi sẽ cải thiện."
  }'
```

## 📊 Sample Data for Testing

### Insert test data:

```sql
-- Test review from freelancer
INSERT INTO platform_reviews (
  user_id,
  user_role,
  rating,
  comment,
  aspects,
  completed_jobs_count,
  total_earned,
  is_verified,
  is_visible,
  helpful_count,
  status
) VALUES (
  'your-user-uuid',
  'FREELANCER',
  5,
  'Tuyệt vời! Đã tìm được 5 job chất lượng trong 2 tháng.',
  '{"user_interface": 5, "job_quality": 4, "support": 5, "payment": 5}'::jsonb,
  5,
  2500000,
  true,
  true,
  3,
  'active'
);

-- Test review from employer
INSERT INTO platform_reviews (
  user_id,
  user_role,
  rating,
  comment,
  aspects,
  completed_jobs_count,
  total_earned,
  is_verified,
  is_visible,
  status
) VALUES (
  'employer-user-uuid',
  'EMPLOYER',
  4,
  'Ứng viên chất lượng, quy trình đăng tin dễ dàng.',
  '{"user_interface": 4, "freelancer_quality": 4, "support": 5, "posting_process": 5}'::jsonb,
  3,
  1800000,
  true,
  true,
  'active'
);
```

## 🔍 Verify Smart Prompting Logic

> **📌 LƯU Ý**: Các ngưỡng đã được điều chỉnh cho dự án ngắn hạn (2 tuần)

### Test Case 1: Freelancer với 1 job hoàn thành (should prompt)

```sql
-- Create test user and job
INSERT INTO applications (applicant_id, job_id, status, proposed_rate) VALUES
  ('test-freelancer-id', 'job-1', 'completed', 500000);

-- Call API
GET /api/platform-reviews/eligibility?user_role=FREELANCER
```

**Expected:** `should_prompt: true` với message "Bạn đã hoàn thành công việc đầu tiên!"

### Test Case 2: Freelancer với 0 jobs (should NOT prompt)

```sql
-- No completed jobs for user
```

**Expected:** `should_prompt: false`

### Test Case 3: Spam protection (3 days cooldown)

```sql
-- Create recent review
INSERT INTO platform_reviews (user_id, user_role, rating, created_at)
VALUES ('test-user', 'FREELANCER', 5, NOW() - INTERVAL '2 days');

-- Try to create another review
POST /api/platform-reviews
```

**Expected:** Error - "Bạn đã đánh giá trong 3 ngày gần đây"

### Test Case 4: Re-prompt after 7 days + 2 more jobs

```sql
-- Create old review
INSERT INTO platform_reviews (user_id, user_role, rating, completed_jobs_count, created_at)
VALUES ('test-user-2', 'FREELANCER', 4, 1, NOW() - INTERVAL '8 days');

-- Create 3 completed jobs (total)
INSERT INTO applications (applicant_id, job_id, status) VALUES
  ('test-user-2', 'job-1', 'completed'),
  ('test-user-2', 'job-2', 'completed'),
  ('test-user-2', 'job-3', 'completed');

-- Call API
GET /api/platform-reviews/eligibility?user_role=FREELANCER
```

**Expected:** `should_prompt: true` với message "Đã 1 tuần kể từ lần đánh giá cuối"

## 📈 Monitoring Queries

### Get average rating by user role:

```sql
SELECT
  user_role,
  AVG(rating) as avg_rating,
  COUNT(*) as total_reviews,
  COUNT(*) FILTER (WHERE is_verified = true) as verified_reviews
FROM platform_reviews
WHERE status = 'active' AND is_visible = true
GROUP BY user_role;
```

### Get rating distribution:

```sql
SELECT
  rating,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM platform_reviews
WHERE status = 'active' AND is_visible = true
GROUP BY rating
ORDER BY rating DESC;
```

### Get most helpful reviews:

```sql
SELECT
  user_role,
  rating,
  comment,
  helpful_count,
  created_at
FROM platform_reviews
WHERE status = 'active' AND is_visible = true
ORDER BY helpful_count DESC
LIMIT 10;
```

### Get reviews needing admin attention:

```sql
SELECT
  id,
  user_role,
  rating,
  comment,
  created_at
FROM platform_reviews
WHERE rating <= 2
  AND status = 'active'
  AND admin_response IS NULL
ORDER BY created_at DESC;
```

## 🎯 Integration Checklist

- [ ] Database migration chạy thành công
- [ ] Model `PlatformReview` được import vào `models/index.js`
- [ ] Routes được thêm vào `routes/index.js`
- [ ] Test API eligibility check
- [ ] Test create review với spam protection
- [ ] Test public reviews list
- [ ] Test update review
- [ ] Test mark helpful
- [ ] Verify smart prompting logic với data thật
- [ ] Setup admin routes với proper authentication
- [ ] Add analytics tracking events
- [ ] Test frontend integration

## 🐛 Common Issues

### Issue 1: "Model PlatformReview not found"

**Solution:** Restart server để auto-import model từ `models/index.js`

```bash
npm run dev  # or pm2 restart app
```

### Issue 2: "Relation platform_reviews does not exist"

**Solution:** Chạy migration

```bash
psql -d your_db -f src/migrations/004_create_platform_reviews.sql
```

### Issue 3: Smart prompting không hoạt động

**Debug:**

```javascript
// Check completed jobs count
const count = await Application.count({
  where: { applicant_id: userId, status: "completed" },
});
console.log("Completed jobs:", count); // Should be >= 3 for prompt
```

## 📞 Support

Nếu gặp vấn đề, check:

1. Server logs: `npm run dev` hoặc PM2 logs
2. Database connection
3. Model associations trong `models/index.js`
4. Route registration trong `routes/index.js`
