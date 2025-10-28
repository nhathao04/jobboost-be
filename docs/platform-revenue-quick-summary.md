# Platform Revenue - Quick Summary

## 🎯 Mục đích

Lưu trữ và tracking lợi nhuận 3% của nền tảng từ mỗi job hoàn thành.

## 💰 Cách hoạt động

```
Employer post job: 1,000,000 VND
↓
Job completed
↓
├─ Platform giữ lại: 30,000 VND (3%)
└─ Freelancer nhận:  970,000 VND (97%)
```

## 📊 Nơi lưu trữ

### 1. Bảng `platform_revenues`

Lưu chi tiết từng khoản phí thu được:

- `total_amount`: Tổng tiền job
- `fee_amount`: Số tiền phí (3%)
- `freelancer_amount`: Tiền freelancer nhận
- `job_id`, `freelancer_id`, `employer_id`

### 2. Cột `platform_fee` trong `wallet_transactions`

Mỗi transaction của freelancer nhận tiền sẽ ghi rõ phí đã bị trừ.

## 🔍 Xem thống kê

### Admin Dashboard Overview

```
GET /admin/dashboard/overview
```

Response includes:

```json
{
  "platform_revenue": {
    "total_platform_fee": "4500000.00",
    "revenue_transactions": 150,
    "average_fee": "30000.00",
    "total_job_value": "150000000.00",
    "total_freelancer_paid": "145500000.00"
  }
}
```

### Platform Revenue Overview

```
GET /admin/platform-revenue/overview?period=week
```

### Chi tiết revenue

```
GET /admin/platform-revenue/details?page=1&limit=20
```

### Biểu đồ

```
GET /admin/platform-revenue/chart?period=month
```

### Breakdown theo user

```
GET /admin/platform-revenue/breakdown?type=freelancer
```

## 📁 Files quan trọng

| File                                       | Mô tả                            |
| ------------------------------------------ | -------------------------------- |
| `models/platformRevenue.model.js`          | Model cho bảng platform_revenues |
| `controllers/platformRevenueController.js` | 4 API endpoints                  |
| `controllers/applicationController.js`     | Logic tính phí khi complete job  |
| `routes/platformRevenueRoutes.js`          | Routes definition                |
| `migrations/005_add_platform_revenue.sql`  | Database migration               |

## 🚀 Migration cần chạy

```sql
-- Tạo bảng platform_revenues
-- Thêm cột platform_fee vào wallet_transactions
-- Tạo indexes và views
```

Chạy file: `src/migrations/005_add_platform_revenue.sql`

## ✅ Hoàn thành

- ✅ Database schema created
- ✅ Model và associations
- ✅ Logic tính phí 3% khi complete job
- ✅ 4 API endpoints cho admin
- ✅ Integration vào admin dashboard
- ✅ Documentation đầy đủ

## 📝 TODO

- ⏳ Run migration trong production
- ⏳ Add admin authorization middleware
- ⏳ Test với real data
- ⏳ Monitor platform revenue metrics

---

**Phần trăm phí**: 3%  
**Constant**: `PLATFORM_FEE_PERCENTAGE` trong `applicationController.js`  
**Có thể thay đổi**: Có, chỉnh constant hoặc lưu trong config
