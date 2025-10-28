# Platform Review API Documentation

## 📋 Tổng quan

API cho phép freelancers và employers đánh giá nền tảng JobBoost. Hệ thống có **logic thông minh** để đề xuất đánh giá vào đúng thời điểm, tránh làm phiền user.

## 🎯 Chiến lược đề xuất đánh giá (Review Prompting Strategy)

> **📌 LƯU Ý**: Các ngưỡng đã được điều chỉnh cho dự án ngắn hạn (2 tuần) để thu thập nhiều feedback hơn.

### Cho Freelancers:

#### Lần đầu tiên:

- ✅ Sau khi hoàn thành **1 job** đầu tiên (giảm từ 3 jobs)
- Mục đích: Nhanh chóng có feedback từ users

#### Đề xuất lại:

- ✅ Sau **7 ngày** kể từ lần đánh giá cuối + hoàn thành thêm **2 job** (giảm từ 90 ngày + 5 jobs)
- ✅ Hoặc hoàn thành thêm **3 job** (giảm từ 10 jobs)
- Mục đích: Tăng tần suất cập nhật đánh giá trong thời gian ngắn

### Cho Employers:

#### Lần đầu tiên:

- ✅ Sau khi hoàn thành **1 job** đầu tiên (giảm từ 2 jobs)
- ✅ Hoặc tạo **1 job post** (giảm từ 3 posts)
- Mục đích: Thu thập feedback sớm về trải nghiệm tuyển dụng

#### Đề xuất lại:

- ✅ Sau **7 ngày** kể từ lần đánh giá cuối + hoàn thành thêm **2 job** (giảm từ 90 ngày + 3 jobs)
- ✅ Hoặc hoàn thành thêm **2 job** bất kể thời gian
- Mục đích: Cập nhật liên tục trong giai đoạn beta test

### Chống spam:

- ❌ Không cho phép đánh giá 2 lần trong vòng **3 ngày** (giảm từ 30 ngày)

### Verification Badge:

- ✅ Freelancer: Auto-verify sau **1 job hoàn thành** (giảm từ 3 jobs)
- ✅ Employer: Auto-verify sau **1 job hoàn thành** (giảm từ 2 jobs)

---

## 🔌 API Endpoints

### 1. Kiểm tra điều kiện đánh giá (Smart Prompting)

```
GET /api/platform-reviews/eligibility?user_role=FREELANCER
```

**Headers:**

```
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|--------|----------|--------------------------------|
| user_role | String | Yes | FREELANCER hoặc EMPLOYER |

**Response Success (200 OK) - Nên đề xuất:**

```json
{
  "success": true,
  "data": {
    "should_prompt": true,
    "reason": "Bạn đã hoàn thành công việc đầu tiên! Hãy chia sẻ trải nghiệm của bạn.",
    "has_reviewed": false,
    "last_review": null,
    "stats": {
      "completed_jobs": 1,
      "total_earned": 500000
    }
  }
}
```

**Response Success (200 OK) - Chưa nên đề xuất:**

```json
{
  "success": true,
  "data": {
    "should_prompt": false,
    "reason": "",
    "has_reviewed": false,
    "last_review": null,
    "stats": {
      "completed_jobs": 1,
      "total_earned": 500000
    }
  }
}
```

**Use Case - Frontend:**

```javascript
// Gọi API này sau khi user hoàn thành job
const checkReviewEligibility = async () => {
  const response = await fetch(
    "/api/platform-reviews/eligibility?user_role=FREELANCER",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const { data } = await response.json();

  if (data.should_prompt) {
    // Show review modal/banner
    showReviewPrompt(data.reason);
  }
};
```

---

### 2. Tạo đánh giá mới

```
POST /api/platform-reviews
```

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "user_role": "FREELANCER",
  "rating": 5,
  "comment": "Rất hài lòng! Tìm được nhiều job chất lượng, thanh toán đúng hạn.",
  "aspects": {
    "user_interface": 5,
    "job_quality": 4,
    "support": 5,
    "payment": 5,
    "matching_algorithm": 4
  }
}
```

**Field Details:**
| Field | Type | Required | Description |
|------------|---------|----------|------------------------------------------------|
| user_role | String | Yes | FREELANCER hoặc EMPLOYER |
| rating | Integer | Yes | 1-5 sao |
| comment | String | No | Nội dung đánh giá chi tiết |
| aspects | Object | No | Đánh giá từng khía cạnh (1-5 cho mỗi aspect) |

**Aspects Object (tùy chọn):**

For Freelancers:

```json
{
  "user_interface": 5, // Giao diện dễ dùng
  "job_quality": 4, // Chất lượng công việc
  "support": 5, // Hỗ trợ khách hàng
  "payment": 5, // Quy trình thanh toán
  "matching_algorithm": 4 // Thuật toán gợi ý job
}
```

For Employers:

```json
{
  "user_interface": 5, // Giao diện dễ dùng
  "freelancer_quality": 4, // Chất lượng freelancer
  "support": 5, // Hỗ trợ khách hàng
  "posting_process": 5, // Quy trình đăng tin
  "candidate_matching": 4 // Khớp ứng viên phù hợp
}
```

**Response Success (201 Created):**

```json
{
  "success": true,
  "message": "Cảm ơn bạn đã đánh giá! Góp ý của bạn rất quý giá với chúng tôi.",
  "data": {
    "id": "uuid-123",
    "user_id": "uuid-456",
    "user_role": "FREELANCER",
    "rating": 5,
    "comment": "Rất hài lòng!...",
    "aspects": {...},
    "completed_jobs_count": 5,
    "total_earned": 2500000,
    "is_verified": true,
    "is_visible": true,
    "helpful_count": 0,
    "status": "active",
    "created_at": "2025-10-27T10:00:00Z",
    "updated_at": "2025-10-27T10:00:00Z"
  }
}
```

**Response Error (400 Bad Request) - Spam Protection:**

```json
{
  "success": false,
  "message": "Bạn đã đánh giá trong 3 ngày gần đây. Vui lòng thử lại sau.",
  "existing_review": {
    "id": "uuid-789",
    "rating": 4,
    "created_at": "2025-10-24T10:00:00Z"
  }
}
```

---

### 3. Lấy danh sách đánh giá (Public)

```
GET /api/platform-reviews?user_role=FREELANCER&page=1&limit=10
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|--------------|---------|----------|------------|------------------------------------|
| user_role | String | No | - | FREELANCER, EMPLOYER |
| rating | Integer | No | - | Lọc theo rating (1-5) |
| is_verified | Boolean | No | - | Chỉ lấy review đã xác thực |
| page | Integer | No | 1 | Số trang |
| limit | Integer | No | 10 | Số review mỗi trang |
| sort_by | String | No | created_at | created_at, rating, helpful_count |
| sort_dir | String | No | DESC | ASC hoặc DESC |

**Response Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid-123",
        "user_id": "uuid-456",
        "user_role": "FREELANCER",
        "rating": 5,
        "comment": "Rất hài lòng!...",
        "aspects": {...},
        "completed_jobs_count": 5,
        "total_earned": 2500000,
        "is_verified": true,
        "helpful_count": 12,
        "admin_response": null,
        "created_at": "2025-10-27T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    },
    "stats": {
      "average_rating": "4.5",
      "total_reviews": 50,
      "verified_reviews": 35,
      "rating_distribution": {
        "1": 2,
        "2": 3,
        "3": 5,
        "4": 15,
        "5": 25
      }
    }
  }
}
```

**Frontend Use Case - Display Reviews:**

```javascript
// Hiển thị rating tổng quan
<div className="rating-summary">
  <div className="average">⭐ {stats.average_rating}/5</div>
  <div className="total">{stats.total_reviews} đánh giá</div>
  <div className="verified">{stats.verified_reviews} đã xác thực</div>
</div>

// Hiển thị phân bố rating
<RatingDistribution distribution={stats.rating_distribution} />

// Danh sách reviews
{reviews.map(review => (
  <ReviewCard
    key={review.id}
    rating={review.rating}
    comment={review.comment}
    isVerified={review.is_verified}
    helpfulCount={review.helpful_count}
  />
))}
```

---

### 4. Lấy đánh giá của user hiện tại

```
GET /api/platform-reviews/my-review?user_role=FREELANCER
```

**Headers:**

```
Authorization: Bearer {token}
```

**Response Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "user_id": "uuid-456",
    "user_role": "FREELANCER",
    "rating": 5,
    "comment": "Rất hài lòng!",
    "aspects": {...},
    "created_at": "2025-10-27T10:00:00Z"
  }
}
```

**Response Error (404 Not Found):**

```json
{
  "success": false,
  "message": "Bạn chưa đánh giá nền tảng này"
}
```

---

### 5. Cập nhật đánh giá

```
PUT /api/platform-reviews/:reviewId
```

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Cập nhật: Vẫn tốt nhưng gặp vài vấn đề nhỏ",
  "aspects": {
    "user_interface": 4,
    "job_quality": 4,
    "support": 3,
    "payment": 5
  }
}
```

**Response Success (200 OK):**

```json
{
  "success": true,
  "message": "Đánh giá đã được cập nhật",
  "data": {...}
}
```

---

### 6. Xóa đánh giá

```
DELETE /api/platform-reviews/:reviewId
```

**Headers:**

```
Authorization: Bearer {token}
```

**Response Success (200 OK):**

```json
{
  "success": true,
  "message": "Đánh giá đã được xóa"
}
```

_Note: Soft delete - review chỉ bị ẩn đi, không xóa khỏi database_

---

### 7. Đánh dấu đánh giá hữu ích

```
POST /api/platform-reviews/:reviewId/helpful
```

**No authentication required**

**Response Success (200 OK):**

```json
{
  "success": true,
  "message": "Cảm ơn phản hồi của bạn!",
  "data": {
    "helpful_count": 13
  }
}
```

---

### 8. Admin: Phản hồi đánh giá

```
PUT /api/admin/platform-reviews/:reviewId/response
```

**Headers:**

```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "admin_response": "Cảm ơn bạn đã đánh giá! Chúng tôi đang cải thiện tính năng hỗ trợ khách hàng."
}
```

**Response Success (200 OK):**

```json
{
  "success": true,
  "message": "Admin response added successfully",
  "data": {...}
}
```

---

### 9. Admin: Ẩn/Hiện đánh giá

```
PUT /api/admin/platform-reviews/:reviewId/visibility
```

**Headers:**

```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "is_visible": false
}
```

**Response Success (200 OK):**

```json
{
  "success": true,
  "message": "Review hidden",
  "data": {...}
}
```

---

## 📊 Database Schema

```sql
CREATE TABLE platform_reviews (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_role VARCHAR(50) NOT NULL,  -- FREELANCER, EMPLOYER
    rating INTEGER NOT NULL,          -- 1-5
    comment TEXT,
    aspects JSONB,                    -- {user_interface: 5, job_quality: 4, ...}
    completed_jobs_count INTEGER,     -- Số job hoàn thành khi review
    total_earned DECIMAL(15, 2),      -- Tổng tiền kiếm/chi khi review
    is_verified BOOLEAN,              -- Auto-verified nếu đủ điều kiện
    is_visible BOOLEAN,               -- Admin control
    helpful_count INTEGER,            -- Số lượt "helpful"
    admin_response TEXT,
    status VARCHAR(50),               -- active, hidden, reported, removed
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🎨 Frontend Integration Examples

### 1. Smart Review Prompt Modal

```javascript
// Check after job completion
const handleJobComplete = async () => {
  // ... complete job logic

  // Check if should prompt review
  const { data } = await checkReviewEligibility("FREELANCER");

  if (data.should_prompt) {
    showModal({
      title: "Chia sẻ trải nghiệm của bạn",
      message: data.reason,
      action: "Đánh giá ngay",
      onConfirm: () => openReviewForm(),
    });
  }
};
```

### 2. Review Form Component

```jsx
<ReviewForm>
  <StarRating value={rating} onChange={setRating} />
  <TextArea
    placeholder="Chia sẻ chi tiết trải nghiệm của bạn..."
    value={comment}
    onChange={setComment}
  />

  <AspectRatings>
    <AspectSlider label="Giao diện" aspect="user_interface" />
    <AspectSlider label="Chất lượng job" aspect="job_quality" />
    <AspectSlider label="Hỗ trợ" aspect="support" />
    <AspectSlider label="Thanh toán" aspect="payment" />
  </AspectRatings>

  <Button onClick={submitReview}>Gửi đánh giá</Button>
</ReviewForm>
```

### 3. Display Reviews on Landing Page

```jsx
<ReviewsSection>
  <RatingSummary stats={stats} />

  <Filters>
    <FilterButton active={filter === "all"}>Tất cả</FilterButton>
    <FilterButton active={filter === "verified"}>Đã xác thực</FilterButton>
    <FilterButton active={filter === "5star"}>5 sao</FilterButton>
  </Filters>

  <ReviewList>
    {reviews.map((review) => (
      <ReviewCard
        key={review.id}
        {...review}
        onHelpful={() => markHelpful(review.id)}
      />
    ))}
  </ReviewList>
</ReviewsSection>
```

---

## ⚡ Best Practices

### 1. Thời điểm đề xuất đánh giá:

✅ **NÊN:**

- Sau khi hoàn thành job thành công
- Trong màn hình "Job Completed" success
- Sau khi nhận thanh toán
- Trong notification center (non-intrusive)

❌ **KHÔNG NÊN:**

- Khi user đang làm việc
- Popup ngay khi vào app
- Spam notifications
- Khi user vừa report issue

### 2. UI/UX Suggestions:

```javascript
// Good: Non-intrusive banner
<ReviewBanner
  message={reason}
  dismissible={true}
  action="Đánh giá"
  position="bottom"
/>

// Good: In-app notification
<Notification
  icon="⭐"
  message="Chia sẻ trải nghiệm của bạn với JobBoost!"
  cta="Viết đánh giá"
/>

// Bad: Blocking modal
<Modal blocking={true}>  ❌
```

### 3. Verification Badge:

```jsx
{
  review.is_verified && (
    <Badge color="blue">
      ✓ Đã xác thực • {review.completed_jobs_count} job
      {review.completed_jobs_count > 1 ? "s" : ""}
    </Badge>
  );
}
```

**Note:** Ngưỡng verification đã giảm xuống 1 job hoàn thành để phù hợp với dự án ngắn hạn.

---

## 🔐 Security & Validation

1. **Rate Limiting:** Không cho đánh giá 2 lần trong **3 ngày** (điều chỉnh cho dự án ngắn hạn)
2. **Verification:** Auto-verify based on activity (**1+ job** hoàn thành)
3. **Spam Protection:** Admin có thể ẩn review không phù hợp
4. **Authentication:** Tất cả write operations yêu cầu auth

---

## 📈 Metrics to Track

```javascript
// Analytics events
trackEvent('review_prompted', { user_role, reason });
trackEvent('review_created', { user_role, rating });
trackEvent('review_helpful_clicked', { review_id });

// KPIs
- Review conversion rate (prompted vs submitted)
- Average rating by user_role
- Verified reviews percentage
- Most helpful reviews
```

---

## 🚀 Future Enhancements

- [ ] Email notification cho review prompts
- [ ] Review response from employer/freelancer
- [ ] Photo/video attachments
- [ ] Review moderation queue
- [ ] Sentiment analysis
- [ ] Review trending/featured section
- [ ] Export reviews for marketing

---

## 📞 Support

Nếu có vấn đề với API, vui lòng liên hệ dev team hoặc tạo issue trên repository.
