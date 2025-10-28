# Platform Revenue System Documentation

## Overview

Hệ thống Platform Revenue tracking được thiết kế để lưu trữ và theo dõi lợi nhuận của nền tảng JobBoost từ các giao dịch hoàn thành công việc.

## Business Logic

### Phí nền tảng (Platform Fee)

- **Tỷ lệ phí**: 3% từ mỗi job được hoàn thành
- **Cách tính**:
  - Employer post job với phí `post_cost` (ví dụ: 1,000,000 VND)
  - Khi job hoàn thành:
    - Platform giữ lại: 3% × 1,000,000 = **30,000 VND**
    - Freelancer nhận được: 97% × 1,000,000 = **970,000 VND**

### Luồng xử lý

1. **Employer đăng job**

   - Trừ tiền từ wallet employer
   - Tạo transaction type `JOB_POST` (debit)
   - Số tiền bị giữ trong hệ thống

2. **Freelancer hoàn thành job**
   - Tính phí nền tảng: `fee_amount = post_cost × 3%`
   - Tính tiền freelancer nhận: `freelancer_amount = post_cost - fee_amount`
   - Cộng tiền vào wallet freelancer
   - Tạo transaction cho freelancer (có ghi `platform_fee`)
   - **Tạo bản ghi PlatformRevenue** để tracking lợi nhuận

## Database Schema

### Bảng `platform_revenues`

```sql
CREATE TABLE platform_revenues (
  id UUID PRIMARY KEY,
  transaction_id UUID,           -- Link to wallet_transaction
  job_id UUID,                    -- Link to job

  -- Số tiền
  total_amount DECIMAL(15,2),     -- Tổng số tiền job (post_cost)
  fee_percentage DECIMAL(5,2),    -- % phí (default: 3.00)
  fee_amount DECIMAL(15,2),       -- Số tiền phí thu được
  freelancer_amount DECIMAL(15,2), -- Số tiền freelancer nhận

  -- Metadata
  freelancer_id UUID,
  employer_id UUID,
  revenue_type VARCHAR(50),       -- JOB_COMPLETION, SUBSCRIPTION, etc.
  description TEXT,
  metadata JSONB,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Thêm cột `platform_fee` vào `wallet_transactions`

```sql
ALTER TABLE wallet_transactions
ADD COLUMN platform_fee DECIMAL(15,2) DEFAULT 0;
```

Cột này lưu số tiền phí platform đã trừ (chỉ áp dụng cho transaction của freelancer nhận tiền).

## API Endpoints

### Base URL: `/admin/platform-revenue`

---

### 1. Platform Revenue Overview

**GET** `/admin/platform-revenue/overview`

Lấy tổng quan về platform revenue.

#### Query Parameters

| Parameter | Type   | Default | Description                                     |
| --------- | ------ | ------- | ----------------------------------------------- |
| period    | string | 'all'   | Khoảng thời gian: today, week, month, year, all |

#### Response

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_transactions": 150,
      "total_job_amount": 150000000, // Tổng giá trị job
      "total_platform_revenue": 4500000, // 3% của tổng job
      "total_freelancer_payment": 145500000,
      "avg_fee_percentage": 3.0,
      "min_revenue": 15000,
      "max_revenue": 60000,
      "avg_revenue_per_transaction": 30000
    },
    "by_type": [
      {
        "type": "JOB_COMPLETION",
        "count": 150,
        "total_revenue": 4500000
      }
    ],
    "top_jobs": [
      {
        "job_id": "uuid",
        "job_title": "Senior Developer",
        "job_status": "completed",
        "revenue": 60000
      }
    ],
    "period": "week"
  }
}
```

---

### 2. Platform Revenue Details

**GET** `/admin/platform-revenue/details`

Chi tiết các bản ghi platform revenue với phân trang.

#### Query Parameters

| Parameter   | Type   | Default    | Description                          |
| ----------- | ------ | ---------- | ------------------------------------ |
| page        | number | 1          | Số trang                             |
| limit       | number | 20         | Số bản ghi/trang (max: 100)          |
| startDate   | string | -          | Ngày bắt đầu (YYYY-MM-DD)            |
| endDate     | string | -          | Ngày kết thúc (YYYY-MM-DD)           |
| revenueType | string | -          | Loại: JOB_COMPLETION, SUBSCRIPTION   |
| minAmount   | number | -          | Phí tối thiểu                        |
| maxAmount   | number | -          | Phí tối đa                           |
| sortBy      | string | created_at | Sắp xếp theo: fee_amount, created_at |
| sortOrder   | string | DESC       | ASC hoặc DESC                        |

#### Response

```json
{
  "success": true,
  "data": {
    "revenues": [
      {
        "id": "uuid",
        "job_id": "uuid",
        "job_title": "Senior Frontend Developer",
        "total_amount": 2000000,
        "fee_percentage": 3.0,
        "fee_amount": 60000,
        "freelancer_amount": 1940000,
        "freelancer_id": "uuid",
        "employer_id": "uuid",
        "revenue_type": "JOB_COMPLETION",
        "description": "Platform fee from job: ...",
        "created_at": "2025-10-27T10:00:00Z"
      }
    ],
    "summary": {
      "total_revenue": 4500000,
      "avg_revenue": 30000,
      "min_revenue": 15000,
      "max_revenue": 60000
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 3. Platform Revenue Chart

**GET** `/admin/platform-revenue/chart`

Dữ liệu biểu đồ revenue theo thời gian.

#### Query Parameters

| Parameter | Type   | Default | Description            |
| --------- | ------ | ------- | ---------------------- |
| period    | string | month   | day, week, month, year |

#### Response

```json
{
  "success": true,
  "data": {
    "chartData": [
      {
        "time": "2025-10-27",
        "revenue": 450000,
        "count": 15
      },
      {
        "time": "2025-10-28",
        "revenue": 380000,
        "count": 12
      }
    ],
    "period": "month"
  }
}
```

---

### 4. Platform Revenue Breakdown

**GET** `/admin/platform-revenue/breakdown`

Phân tích revenue theo freelancer hoặc employer.

#### Query Parameters

| Parameter | Type   | Default    | Description              |
| --------- | ------ | ---------- | ------------------------ |
| type      | string | freelancer | freelancer hoặc employer |
| page      | number | 1          | Số trang                 |
| limit     | number | 20         | Số bản ghi/trang         |
| period    | string | all        | today, week, month, all  |

#### Response

```json
{
  "success": true,
  "data": {
    "breakdown": [
      {
        "user_id": "uuid",
        "transaction_count": 25,
        "total_revenue": 750000,
        "total_job_amount": 25000000,
        "avg_revenue": 30000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120,
      "totalPages": 6
    },
    "type": "freelancer",
    "period": "month"
  }
}
```

---

## Integration with Admin Dashboard

Admin Dashboard Overview endpoint (`/admin/dashboard/overview`) đã được update để include platform revenue:

```json
{
  "success": true,
  "data": {
    "period": "week",
    "revenue": {
      "total": "150000000.00",
      "transactions_count": 150,
      "average_per_transaction": "1000000.00"
    },
    "platform_revenue": {
      "total_platform_fee": "4500000.00",
      "revenue_transactions": 150,
      "average_fee": "30000.00",
      "total_job_value": "150000000.00",
      "total_freelancer_paid": "145500000.00"
    },
    "users": { ... },
    "transactions": { ... },
    ...
  }
}
```

## Code Changes

### Files Created

1. **`src/models/platformRevenue.model.js`**

   - Sequelize model cho bảng platform_revenues
   - Associations với Job và WalletTransaction

2. **`src/controllers/platformRevenueController.js`**

   - 4 controller methods cho platform revenue APIs

3. **`src/routes/platformRevenueRoutes.js`**

   - Route definitions cho platform revenue endpoints

4. **`src/migrations/005_add_platform_revenue.sql`**
   - SQL migration để tạo bảng và indexes

### Files Modified

1. **`src/models/walletTransaction.model.js`**

   - Thêm cột `platform_fee`

2. **`src/controllers/applicationController.js`**

   - Update logic `completeJob` để:
     - Tính phí 3%
     - Trừ phí từ số tiền freelancer nhận
     - Tạo bản ghi PlatformRevenue
     - Lưu platform_fee vào WalletTransaction

3. **`src/controllers/adminDashboardController.js`**

   - Thêm platform_revenue section vào overview response

4. **`src/routes/index.js`**
   - Mount platformRevenueRoutes

## Usage Examples

### Xem tổng lợi nhuận tuần này

```bash
curl -X GET "http://localhost:3003/admin/platform-revenue/overview?period=week" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Xem chi tiết revenue tháng 10

```bash
curl -X GET "http://localhost:3003/admin/platform-revenue/details?startDate=2025-10-01&endDate=2025-10-31&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Xem biểu đồ revenue năm nay

```bash
curl -X GET "http://localhost:3003/admin/platform-revenue/chart?period=year" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Xem top freelancer mang revenue cao

```bash
curl -X GET "http://localhost:3003/admin/platform-revenue/breakdown?type=freelancer&period=month&sortBy=total_revenue&sortOrder=DESC" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Testing

### Test Complete Job với Platform Fee

```javascript
// Test flow
1. Employer có 5,000,000 VND trong wallet
2. Post job với post_cost = 2,000,000 VND
3. Wallet employer còn: 3,000,000 VND
4. Freelancer apply và được accept
5. Employer complete job
6. Kiểm tra:
   - Freelancer nhận: 2,000,000 × 97% = 1,940,000 VND
   - Platform giữ: 2,000,000 × 3% = 60,000 VND
   - PlatformRevenue có 1 record mới với fee_amount = 60,000
   - WalletTransaction của freelancer có platform_fee = 60,000
```

## Database Views

Migration tạo view `platform_revenue_summary` để dễ query:

```sql
SELECT * FROM platform_revenue_summary
WHERE date >= '2025-10-01'
ORDER BY date DESC;
```

Kết quả:

| date       | transaction_count | total_job_amount | total_platform_revenue | total_freelancer_payment | avg_fee_percentage |
| ---------- | ----------------- | ---------------- | ---------------------- | ------------------------ | ------------------ |
| 2025-10-27 | 15                | 30,000,000       | 900,000                | 29,100,000               | 3.0                |
| 2025-10-26 | 12                | 24,000,000       | 720,000                | 23,280,000               | 3.0                |

## Future Enhancements

1. **Variable Fee Percentage**

   - Cho phép fee khác nhau theo loại job hoặc tier user
   - Ví dụ: Premium employer có thể trả ít phí hơn

2. **Revenue Projections**

   - Dự đoán revenue tháng tới dựa trên trend

3. **Payment to Platform**

   - Tích hợp rút tiền platform revenue ra tài khoản ngân hàng

4. **Tax Reporting**

   - Export báo cáo cho mục đích thuế

5. **Referral Revenue**
   - Track revenue từ chương trình giới thiệu

## Security Notes

- ✅ Tất cả endpoints yêu cầu authentication
- ⚠️ TODO: Thêm admin authorization middleware
- ✅ Platform fee được tính tự động, không thể manipulate từ client
- ✅ Transaction sử dụng database transactions để đảm bảo consistency

## Monitoring

Các metrics cần theo dõi:

1. **Daily Platform Revenue**: Lợi nhuận mỗi ngày
2. **Revenue Growth Rate**: Tỷ lệ tăng trưởng
3. **Average Fee per Transaction**: Phí trung bình mỗi giao dịch
4. **Top Revenue Contributors**: User/Job mang lại revenue cao nhất
5. **Fee Percentage Trend**: Theo dõi nếu fee % thay đổi

---

**Version**: 1.0.0  
**Last Updated**: October 28, 2025  
**Maintainer**: Development Team
