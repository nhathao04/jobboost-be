# Thay đổi tỷ lệ phí platform từ 3% → 8%

## 📋 Tóm tắt thay đổi

Đã cập nhật toàn bộ hệ thống để thay đổi tỷ lệ phí platform từ **3%** sang **8%**.

---

## ✅ Files đã cập nhật

### 1. **src/controllers/applicationController.js**

- Dòng 15: `PLATFORM_FEE_PERCENTAGE = 8.0` (từ 3.0)
- Dòng 546: Comment "Tính phí nền tảng (8%)"
- Dòng 589: Comment "Cộng tiền vào ví freelancer (sau khi trừ phí 8%)"
- Dòng 674: Message "minus 8% platform fee"

**Ảnh hưởng**: Khi job completed, freelancer sẽ nhận **92%** thay vì 97%

### 2. **src/migrations/005_add_platform_revenue.sql**

- Dòng 19: `DEFAULT 8.00` (từ 3.00)
- Dòng 58: Comment "Phần trăm phí, mặc định 8%"

**Ảnh hưởng**: Khi tạo bảng mới, default fee sẽ là 8%

### 3. **src/controllers/adminDashboardController.js**

- Dòng 441: Comment "8% fee from completed jobs"
- Dòng 494: Comment "Lợi nhuận từ phí 8%"
- Dòng 501: `profit_percentage: "8%"`

**Ảnh hưởng**: Admin dashboard hiển thị đúng tỷ lệ phí 8%

### 4. **docs/admin-dashboard-revenue-api.md**

- Cập nhật tất cả references từ 3% → 8%
- Cập nhật 97% → 92% (phần freelancer nhận)
- Cập nhật ví dụ và giải thích

**Ảnh hưởng**: Tài liệu API phản ánh đúng logic mới

---

## 💰 Business Logic sau khi thay đổi

### Trước (3%):

```
Job value: 100,000 VND
├─ Platform fee (3%): 3,000 VND
└─ Freelancer receives (97%): 97,000 VND
```

### Sau (8%):

```
Job value: 100,000 VND
├─ Platform fee (8%): 8,000 VND
└─ Freelancer receives (92%): 92,000 VND
```

---

## 🔄 Flow hoàn chỉnh

### 1. Employer post job

```
Employer → Pay 100,000 VND → Job created → Money held in system
```

### 2. Freelancer apply & work

```
Freelancer applies → Accepted → Work → Complete
```

### 3. Job completed (THAY ĐỔI TẠI ĐÂY)

```javascript
// applicationController.js - completeJob()
const PLATFORM_FEE_PERCENTAGE = 8.0; // 8%

const platformFeeAmount = (100000 * 8.0) / 100; // = 8,000 VND
const freelancerReceiveAmount = 100000 - 8000; // = 92,000 VND

// Lưu vào platform_revenue
await PlatformRevenue.create({
  total_amount: 100000,
  fee_percentage: 8,
  fee_amount: 8000,
  freelancer_amount: 92000,
});

// Cộng tiền cho freelancer
await freelancerWallet.update({
  balance: currentBalance + 92000, // 92% thay vì 97%
});
```

### 4. Admin view profit

```
GET /api/admin/dashboard/revenue
→ Shows platform profit = 8% of all completed jobs
```

---

## 📊 Impact trên Revenue

### Với 100 jobs hoàn thành (mỗi job 100,000 VND):

| Metric              | Trước (3%) | Sau (8%)    | Chênh lệch   |
| ------------------- | ---------- | ----------- | ------------ |
| Total job value     | 10,000,000 | 10,000,000  | -            |
| Platform profit     | 300,000    | **800,000** | **+500,000** |
| Freelancers receive | 9,700,000  | 9,200,000   | -500,000     |
| Profit margin       | 3%         | **8%**      | **+5%**      |

**Platform kiếm thêm 500,000 VND (tăng 166.67%)** 🎉

---

## ⚠️ Lưu ý quan trọng

### 1. Database Migration

Nếu đã có dữ liệu cũ trong bảng `platform_revenues`:

```sql
-- Không cần update dữ liệu cũ
-- Chỉ jobs mới hoàn thành sau update sẽ dùng 8%
-- Dữ liệu cũ vẫn giữ nguyên fee_percentage của chúng
```

### 2. Frontend Update Required

Cần cập nhật frontend để hiển thị:

- "Platform phí 8%" thay vì "3%"
- "Freelancer nhận 92%" thay vì "97%"
- Terms & Conditions cần update

### 3. Testing

Cần test:

```bash
# Test job completion
POST /api/applications/:id/complete
→ Verify freelancer receives 92%
→ Verify platform_revenue has fee_percentage = 8

# Test admin dashboard
GET /api/admin/dashboard/revenue
→ Verify profit_percentage = "8%"
→ Verify calculations are correct
```

### 4. Communication

Cần thông báo cho users:

- Email notification về policy change
- Update Terms of Service
- Update FAQ
- In-app notification

---

## 🧪 Quick Test

```bash
# 1. Tạo job mới (100k)
POST /api/jobs
{ "post_cost": 100000 }

# 2. Accept application
POST /api/applications/:id/accept

# 3. Complete job
POST /api/applications/:id/complete

# 4. Kiểm tra platform_revenue
GET /api/platform-revenue?jobId=xxx

# Expected response:
{
  "total_amount": 100000,
  "fee_percentage": 8,
  "fee_amount": 8000,          // 8% of 100k
  "freelancer_amount": 92000   // 92% of 100k
}

# 5. Kiểm tra freelancer wallet
# Balance should increase by 92,000 (not 97,000)
```

---

## 📝 Checklist

- [x] Update constant in applicationController.js
- [x] Update migration default value
- [x] Update admin dashboard display
- [x] Update API documentation
- [x] Update comments in code
- [ ] Test complete job flow
- [ ] Update frontend display
- [ ] Update Terms & Conditions
- [ ] Notify users about change
- [ ] Run database migration (if needed)

---

## 🔗 Related Files

- `src/controllers/applicationController.js` - Main logic
- `src/controllers/adminDashboardController.js` - Dashboard stats
- `src/migrations/005_add_platform_revenue.sql` - Database schema
- `docs/admin-dashboard-revenue-api.md` - API docs
- `src/models/platformRevenue.model.js` - Data model

---

## 💡 Revert Instructions

Nếu cần quay lại 3%:

```bash
# 1. Tìm và thay thế
grep -r "8.0" src/controllers/applicationController.js
# Change back to 3.0

grep -r "8%" src/controllers/
# Change back to 3%

grep -r "92%" docs/
# Change back to 97%

# 2. Update migration
# Change DEFAULT 8.00 → DEFAULT 3.00

# 3. Restart server
npm run dev
```
