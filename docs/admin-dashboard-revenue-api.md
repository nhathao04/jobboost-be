# Admin Dashboard - Revenue & Profit API

## Overview

API để xem chi tiết doanh thu và lợi nhuận của nền tảng JobBoost.

**Endpoint:** `GET /api/admin/dashboard/revenue`

**Authentication:** Required (Bearer Token)

**Authorization:** Admin role required

---

## Query Parameters

| Parameter    | Type    | Default    | Description               |
| ------------ | ------- | ---------- | ------------------------- |
| `page`       | integer | 1          | Số trang                  |
| `limit`      | integer | 20         | Số items mỗi trang        |
| `start_date` | date    | -          | Lọc từ ngày (YYYY-MM-DD)  |
| `end_date`   | date    | -          | Lọc đến ngày (YYYY-MM-DD) |
| `sort_by`    | string  | created_at | Sắp xếp theo field        |
| `sort_dir`   | string  | DESC       | Thứ tự: ASC hoặc DESC     |

---

## Response Structure

```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    },
    "summary": {
      // DOANH THU (từ employer post job)
      "total_revenue": "15000000.00",
      "transaction_count": 150,
      "average_amount": "100000.00",
      "min_amount": "50000.00",
      "max_amount": "500000.00",

      // LỢI NHUẬN (phí 8% khi job hoàn thành)
      "platform_profit": {
        "total_profit": "450000.00",        // Tổng lợi nhuận (8% từ jobs đã hoàn thành)
        "completed_jobs": 75,                 // Số job đã hoàn thành
        "average_profit_per_job": "6000.00", // Trung bình lợi nhuận/job
        "total_job_value": "15000000.00",    // Tổng giá trị jobs
        "total_paid_to_freelancers": "14550000.00", // Tổng tiền trả cho freelancer (92%)
        "profit_percentage": "8%"
      }
    },
    "revenue_by_day": [...],           // Doanh thu theo ngày (30 ngày)
    "platform_profit_by_day": [...]    // Lợi nhuận theo ngày (30 ngày)
  }
}
```

---

## Detailed Response Fields

### 1. Transactions (Giao dịch post job)

Danh sách các giao dịch employer trả phí để post job:

```json
{
  "id": "uuid",
  "amount": 100000.0,
  "currency": "VND",
  "wallet_code": "WLT001",
  "user_id": "uuid-employer",
  "job": {
    "id": "uuid",
    "title": "Web Developer needed",
    "status": "completed"
  },
  "description": "Job posting fee",
  "created_at": "2025-10-28T10:00:00Z"
}
```

### 2. Summary Statistics

#### Revenue (Doanh thu)

- **total_revenue**: Tổng tiền employer đã trả để post jobs
- **transaction_count**: Tổng số giao dịch post job
- **average_amount**: Giá trị trung bình mỗi job
- **min_amount**: Job rẻ nhất
- **max_amount**: Job đắt nhất

#### Platform Profit (Lợi nhuận nền tảng)

- **total_profit**: Tổng lợi nhuận = 8% x tổng giá trị jobs hoàn thành
- **completed_jobs**: Số jobs đã hoàn thành (đã trả tiền cho freelancer)
- **average_profit_per_job**: Trung bình web kiếm được bao nhiêu/job
- **total_job_value**: Tổng giá trị của tất cả jobs hoàn thành
- **total_paid_to_freelancers**: Tổng tiền freelancers nhận được (92%)
- **profit_percentage**: Tỷ lệ phí (luôn là 8%)

### 3. Revenue by Day

Doanh thu theo từng ngày (30 ngày gần nhất):

```json
{
  "date": "2025-10-28",
  "daily_revenue": "500000.00",
  "daily_count": 5
}
```

### 4. Platform Profit by Day

Lợi nhuận theo từng ngày (30 ngày gần nhất):

```json
{
  "date": "2025-10-28",
  "daily_profit": "15000.00", // Tổng lợi nhuận trong ngày (8%)
  "daily_completed_jobs": 3 // Số job hoàn thành trong ngày
}
```

---

## Business Logic Flow

### 1️⃣ Employer post job

```
Employer → Pay posting fee (VND 100,000) → Wallet Transaction (JOB_POST)
```

### 2️⃣ Job completed

```
1. Application accepted → Job completed
2. System calculates:
   - Total amount: 100,000 VND (job value)
   - Platform fee (8%): 8,000 VND → Goes to Platform Revenue
   - Freelancer amount (92%): 92,000 VND → Goes to Freelancer Wallet
3. Create record in `platform_revenue` table:
   {
     job_id: "uuid",
     application_id: "uuid",
     total_amount: 100000,
     fee_percentage: 8,
     fee_amount: 8000,
     freelancer_amount: 92000
   }
```

### 3️⃣ Admin view dashboard

```
GET /api/admin/dashboard/revenue
→ Shows:
  - Total revenue from job posts
  - Total profit from 8% fee (completed jobs only)
  - Charts & statistics
```

---

## Example Request

```bash
curl -X GET "http://localhost:3000/api/admin/dashboard/revenue?page=1&limit=20&start_date=2025-10-01&end_date=2025-10-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Example Response

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx-001",
        "amount": 150000.0,
        "currency": "VND",
        "wallet_code": "WLT001",
        "user_id": "employer-uuid",
        "job": {
          "id": "job-001",
          "title": "Build E-commerce Website",
          "status": "completed"
        },
        "description": "Job posting fee",
        "created_at": "2025-10-25T09:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    },
    "summary": {
      "total_revenue": "15000000.00",
      "transaction_count": 150,
      "average_amount": "100000.00",
      "min_amount": "50000.00",
      "max_amount": "500000.00",

      "platform_profit": {
        "total_profit": "450000.00",
        "completed_jobs": 75,
        "average_profit_per_job": "6000.00",
        "total_job_value": "15000000.00",
        "total_paid_to_freelancers": "14550000.00",
        "profit_percentage": "8%"
      }
    },
    "revenue_by_day": [
      {
        "date": "2025-10-25",
        "daily_revenue": "500000.00",
        "daily_count": 5
      }
    ],
    "platform_profit_by_day": [
      {
        "date": "2025-10-25",
        "daily_profit": "15000.00",
        "daily_completed_jobs": 3
      }
    ]
  }
}
```

---

## Key Metrics Explained

### 📊 Doanh thu (Revenue)

- **Nguồn**: Employer trả phí để post job
- **Thời điểm**: Khi job được tạo/đăng
- **Bảng**: `wallet_transactions` (type: JOB_POST)

### 💰 Lợi nhuận (Profit)

- **Nguồn**: Phí 8% từ giá trị job khi hoàn thành
- **Thời điểm**: Khi job completed và trả tiền cho freelancer
- **Bảng**: `platform_revenue`
- **Công thức**:
  - Platform fee = Total job value × 8%
  - Freelancer receives = Total job value × 92%

### 📈 Tổng thu nhập thực tế của platform

```
Total Platform Income = Posting Revenue + Platform Profit (8% fees)
```

---

## Notes

1. **Revenue vs Profit**:

   - Revenue: Tiền employer trả để POST job
   - Profit: Tiền platform kiếm được (8%) khi job HOÀN THÀNH

2. **Completed Jobs Only**:

   - Chỉ tính lợi nhuận cho jobs đã completed
   - Jobs pending/active/rejected không tạo lợi nhuận

3. **Date Filter**:

   - Áp dụng cho cả revenue và profit
   - Dùng `created_at` để lọc

4. **Chart Data**:
   - Last 30 days by default
   - 2 charts: revenue_by_day và platform_profit_by_day
