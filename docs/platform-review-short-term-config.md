# Platform Review - Điều chỉnh cho dự án ngắn hạn

## 📊 Bảng so sánh ngưỡng

### Freelancer Review Prompts

| Điều kiện                   | Trước (Production) | Sau (2 tuần testing) | Lý do thay đổi                     |
| --------------------------- | ------------------ | -------------------- | ---------------------------------- |
| **Lần đầu tiên**            | 3 jobs hoàn thành  | **1 job hoàn thành** | Có feedback nhanh hơn              |
| **Đề xuất lại - Thời gian** | 90 ngày + 5 jobs   | **7 ngày + 2 jobs**  | Tăng tần suất trong thời gian ngắn |
| **Đề xuất lại - Số jobs**   | 10 jobs bổ sung    | **3 jobs bổ sung**   | Dễ trigger trong 2 tuần            |
| **Spam protection**         | 30 ngày            | **3 ngày**           | Cho phép update nhanh hơn          |
| **Verification**            | ≥ 3 jobs           | **≥ 1 job**          | Tăng số review được verify         |

### Employer Review Prompts

| Điều kiện                   | Trước (Production) | Sau (2 tuần testing) | Lý do thay đổi             |
| --------------------------- | ------------------ | -------------------- | -------------------------- |
| **Lần đầu tiên - Option 1** | 2 jobs hoàn thành  | **1 job hoàn thành** | Có feedback sớm hơn        |
| **Lần đầu tiên - Option 2** | 3 job posts tạo    | **1 job post tạo**   | Trigger ngay sau tạo job   |
| **Đề xuất lại**             | 90 ngày + 3 jobs   | **7 ngày + 2 jobs**  | Cập nhật liên tục          |
| **Spam protection**         | 30 ngày            | **3 ngày**           | Cho phép điều chỉnh review |
| **Verification**            | ≥ 2 jobs           | **≥ 1 job**          | Tăng độ tin cậy review     |

---

## 🎯 Tác động của việc điều chỉnh

### ✅ Lợi ích:

1. **Thu thập feedback nhanh hơn**

   - Review xuất hiện ngay sau job đầu tiên
   - Giúp team cải thiện sản phẩm kịp thời

2. **Tăng số lượng reviews**

   - Dễ trigger hơn → nhiều user đánh giá hơn
   - Review distribution đa dạng hơn

3. **Update reviews thường xuyên**

   - Cooldown 3 ngày thay vì 30 ngày
   - Users có thể điều chỉnh đánh giá nhanh

4. **Tăng verified reviews**
   - Verify chỉ cần 1 job → nhiều badge xanh
   - Tăng độ tin cậy tổng thể

### ⚠️ Rủi ro cần quản lý:

1. **Chất lượng review có thể thấp hơn**

   - Solution: Có thể ẩn reviews < 50 words
   - Admin moderate kỹ hơn

2. **Spam tiềm năng**

   - Solution: Vẫn giữ 3-day cooldown
   - Track spam users

3. **Review không đại diện**
   - User mới có thể đánh giá chưa đủ trải nghiệm
   - Solution: Highlight verified vs unverified

---

## 📈 Timeline mong đợi (2 tuần)

### Tuần 1:

- **Ngày 1-3**: User đầu tiên hoàn thành job → Reviews đầu tiên
- **Ngày 4-7**: Tích lũy 10-20 reviews

### Tuần 2:

- **Ngày 8-10**: Re-prompt users đã review tuần 1
- **Ngày 11-14**: Có 30-50+ reviews với mix ratings

### Kết quả mong đợi:

- ✅ 30-50 platform reviews
- ✅ Tối thiểu 20 verified reviews
- ✅ Average rating có ý nghĩa thống kê
- ✅ Feedback để cải thiện nền tảng

---

## 🔄 Khi nào chuyển về production settings?

Sau giai đoạn testing 2 tuần, nên điều chỉnh lại:

```javascript
// Production settings (sau khi có đủ reviews)
FREELANCER_FIRST_PROMPT: 3 jobs      // từ 1 → 3
FREELANCER_REPROMPOT_DAYS: 90       // từ 7 → 90
FREELANCER_REPROMPOT_JOBS: 5        // từ 2 → 5
EMPLOYER_FIRST_PROMPT: 2 jobs       // từ 1 → 2
SPAM_COOLDOWN: 30 days              // từ 3 → 30
VERIFICATION_THRESHOLD: 3 jobs      // từ 1 → 3
```

### Lý do:

- Đã có đủ reviews ban đầu
- Tránh spam trong long-term
- Đảm bảo quality > quantity
- Reviews có depth hơn

---

## 💡 Best Practices trong giai đoạn testing

### 1. Monitor thường xuyên:

```sql
-- Daily check: Số reviews mới
SELECT
  DATE(created_at) as date,
  user_role,
  COUNT(*) as reviews_count,
  AVG(rating) as avg_rating
FROM platform_reviews
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), user_role
ORDER BY date DESC;
```

### 2. Identify spam patterns:

```sql
-- Users với nhiều reviews trong thời gian ngắn
SELECT
  user_id,
  COUNT(*) as review_count,
  MIN(created_at) as first_review,
  MAX(created_at) as last_review
FROM platform_reviews
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(*) > 2
ORDER BY review_count DESC;
```

### 3. Track conversion rate:

```javascript
// Analytics
const eligibilityChecks = 150; // Số lần check eligibility
const reviewsCreated = 45; // Số reviews thực tế tạo
const conversionRate = (45 / 150) * 100; // 30% - Good!

// Benchmark:
// 20-30%: Excellent
// 10-20%: Good
// < 10%: Cần improve UX
```

### 4. Quality metrics:

```sql
-- Average comment length (quality indicator)
SELECT
  user_role,
  AVG(LENGTH(comment)) as avg_comment_length,
  COUNT(*) FILTER (WHERE LENGTH(comment) > 100) as detailed_reviews,
  COUNT(*) FILTER (WHERE aspects IS NOT NULL) as with_aspects
FROM platform_reviews
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_role;
```

---

## 🎨 Frontend adjustments

### Show "Beta" badge for short-term config:

```jsx
<ReviewSection>
  <Badge variant="info">
    🧪 Beta Testing - Chia sẻ feedback giúp chúng tôi cải thiện!
  </Badge>

  <ReviewPrompt
    message="Hoàn thành job đầu tiên! Đánh giá ngay nhé 🎉"
    highlight={true} // More prominent in testing phase
  />
</ReviewSection>
```

### Emphasize verified reviews:

```jsx
<ReviewCard review={review}>
  {review.is_verified && (
    <VerifiedBadge>
      ✓ Đã hoàn thành {review.completed_jobs_count} job
    </VerifiedBadge>
  )}
</ReviewCard>
```

### Encourage detailed reviews:

```jsx
<ReviewForm>
  <ProgressIndicator>
    {comment.length < 50 && "Thêm chi tiết để review hữu ích hơn! (50+ ký tự)"}
    {comment.length >= 50 &&
      comment.length < 100 &&
      "Tốt! Viết thêm một chút nữa."}
    {comment.length >= 100 && "✓ Review chi tiết! Cảm ơn bạn!"}
  </ProgressIndicator>
</ReviewForm>
```

---

## 📝 Summary

### Current Settings (2-week testing):

| Metric                    | Value      | Purpose               |
| ------------------------- | ---------- | --------------------- |
| First review (Freelancer) | 1 job      | Fast feedback         |
| First review (Employer)   | 1 job/post | Early insights        |
| Re-prompt interval        | 7 days     | Frequent updates      |
| Re-prompt jobs            | 2-3 jobs   | Easy trigger          |
| Spam cooldown             | 3 days     | Allow adjustments     |
| Verification              | 1 job      | More verified reviews |

### Expected Outcomes:

- 📊 30-50 reviews trong 2 tuần
- ⭐ Đa dạng ratings (1-5 sao)
- ✓ 60%+ verified reviews
- 💬 Mix quick + detailed feedback
- 🔄 15-20% users re-review sau tuần 1

### Rollback Plan:

Nếu thấy spam hoặc quality issues:

1. Tăng cooldown lên 7 ngày
2. Tăng verification lên 2 jobs
3. Add comment length requirement
4. Enable admin pre-approval

---

## ✅ Checklist

- [ ] Code đã update với thresholds mới
- [ ] Documentation đã cập nhật
- [ ] Team hiểu rõ đây là temporary settings
- [ ] Analytics tracking đã setup
- [ ] Admin moderation tools ready
- [ ] Frontend prompts đã optimize
- [ ] Schedule meeting sau 2 tuần để review
- [ ] Plan để chuyển về production settings
