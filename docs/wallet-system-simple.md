# Hệ Thống Ví và Thanh Toán - Phiên Bản Đơn Giản

## 📋 Tổng Quan

Hệ thống ví đơn giản với các tính năng:

1. ✅ Tự động tạo ví với số dư mặc định khi employer đăng ký
2. ✅ Trừ tiền khi đăng job
3. ✅ Chuyển tiền cho freelancer khi hoàn thành job

## 🎯 Luồng Hoạt Động

### 1️⃣ Employer Đăng Ký → Tự Động Tạo Ví

```
POST /api/employer/register
→ Tạo employer profile
→ Tự động tạo ví với số dư: 1,000,000 VND
```

### 2️⃣ Employer Đăng Tin → Trừ Tiền

```
POST /api/jobs
Body: {
  "title": "Senior Developer",
  "description": "...",
  "job_type": "FULL_TIME",
  "budget_type": "FIXED",
  "budget_min": 1000,
  "budget_max": 2000,
  "post_cost": 20000  ← Chi phí đăng tin
}
→ Kiểm tra số dư
→ Trừ tiền từ ví employer
→ Tạo job với status "pending"
→ Ghi nhận transaction
```

### 3️⃣ Freelancer Apply → Employer Accept

```
POST /api/applications/:jobId
→ Freelancer nộp đơn

PUT /api/applications/:applicationId/status
Body: { "status": "accepted" }
→ Employer chấp nhận ứng viên
```

### 4️⃣ Chốt Job → Chuyển Tiền cho Freelancer

```
POST /api/applications/:applicationId/complete
→ Tự động tạo ví cho freelancer (nếu chưa có)
→ Chuyển số tiền post_cost vào ví freelancer
→ Cập nhật status application → "completed"
→ Cập nhật status job → "completed"
→ Ghi nhận transaction
```

## 🔌 API Endpoints

### Wallet Management

#### 1. Xem Thông Tin Ví

**GET** `/api/wallet`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "balance": 980000,
    "currency": "VND",
    "total_deposited": 1000000,
    "total_spent": 20000,
    "is_active": true,
    "created_at": "2025-10-21T10:00:00Z",
    "updated_at": "2025-10-21T10:05:00Z"
  }
}
```

#### 2. Xem Lịch Sử Giao Dịch

**GET** `/api/wallet/transactions`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `transaction_type` (JOB_POST | DEPOSIT | REFUND)
- `start_date`, `end_date`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "transaction_type": "JOB_POST",
        "amount": 20000,
        "balance_before": 1000000,
        "balance_after": 980000,
        "description": "Payment for job posting",
        "reference_id": "job-uuid",
        "status": "completed",
        "created_at": "2025-10-21T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "total_pages": 1
    }
  }
}
```

### Job Management

#### 3. Đăng Tin Tuyển Dụng (Có Trừ Tiền)

**POST** `/api/jobs`

**Request Body:**

```json
{
  "title": "Senior Backend Developer",
  "description": "Looking for experienced developer...",
  "job_type": "FULL_TIME",
  "budget_type": "FIXED",
  "budget_min": 1000,
  "budget_max": 2000,
  "currency": "USD",
  "experience_level": "SENIOR",
  "deadline": "2025-12-31",
  "skills_required": ["Node.js", "PostgreSQL"],
  "post_cost": 20000  ← REQUIRED
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Job created successfully and awaiting approval. Money deducted from wallet.",
  "data": {
    "job": {
      "id": "uuid",
      "title": "Senior Backend Developer",
      "post_cost": 20000,
      "status": "pending",
      "created_at": "2025-10-21T10:00:00Z"
    },
    "wallet_balance": 980000,
    "amount_deducted": 20000
  }
}
```

**Error (400 - Insufficient Balance):**

```json
{
  "success": false,
  "message": "Insufficient balance. Current: 10000, Required: 20000",
  "error": "WALLET_ERROR"
}
```

### Application Management

#### 4. Chốt Job và Chuyển Tiền

**POST** `/api/applications/:applicationId/complete`

**Headers:**

```
Authorization: Bearer <employer_token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Job completed successfully. Money transferred to freelancer.",
  "data": {
    "application": {
      "id": "uuid",
      "status": "completed"
    },
    "job": {
      "id": "uuid",
      "title": "Senior Backend Developer",
      "status": "completed"
    },
    "payment": {
      "amount": 20000,
      "currency": "VND",
      "freelancer_id": "uuid",
      "freelancer_new_balance": 20000
    }
  }
}
```

**Errors:**

- `403` - Không có quyền (không phải job owner)
- `400` - Application status phải là "accepted"
- `400` - Job đã completed rồi
- `404` - Application không tồn tại

## 💾 Database Schema

### Bảng `wallets`

```sql
id              UUID PRIMARY KEY
user_id         UUID UNIQUE (employer hoặc freelancer)
balance         DECIMAL(15,2) DEFAULT 1000000  ← Số dư mặc định
currency        VARCHAR DEFAULT 'VND'
total_deposited DECIMAL(15,2)
total_spent     DECIMAL(15,2)
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Bảng `jobs` (Updated)

```sql
...existing fields...
post_cost       DECIMAL(15,2)  ← Chi phí đăng tin
...
```

### Bảng `applications` (Updated)

```sql
...existing fields...
status          VARCHAR  ← Thêm 'completed'
  - pending
  - accepted
  - rejected
  - withdrawn
  - completed  ← MỚI
...
```

### Bảng `wallet_transactions`

```sql
id              UUID PRIMARY KEY
wallet_id       UUID
transaction_type VARCHAR (DEPOSIT, JOB_POST, REFUND)
amount          DECIMAL(15,2)
balance_before  DECIMAL(15,2)
balance_after   DECIMAL(15,2)
reference_id    UUID (job_id)
reference_type  VARCHAR (JOB, JOB_COMPLETED)
description     TEXT
status          VARCHAR
metadata        JSONB
created_at      TIMESTAMP
```

## 🚀 Hướng Dẫn Setup

### 1. Chạy Migrations

```bash
# Migration 1: Tạo bảng wallets và wallet_transactions
psql -U your_user -d your_database -f src/migrations/004_add_wallet_system.sql

# Migration 2: Thêm cột post_cost vào jobs
psql -U your_user -d your_database -f src/migrations/005_add_post_cost_to_jobs.sql

# Migration 3: Thêm status 'completed' vào applications
psql -U your_user -d your_database -f src/migrations/006_add_completed_status_to_applications.sql
```

### 2. Test Flow

#### Bước 1: Employer Đăng Ký (Tự động tạo ví)

```bash
curl -X POST http://localhost:3000/api/employer/register \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Tech Company",
    "industry": "Technology",
    "company_size": "11-50"
  }'

# ✅ Ví được tạo tự động với balance: 1,000,000 VND
```

#### Bước 2: Kiểm Tra Số Dư

```bash
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer <employer_token>"

# Response: balance: 1000000
```

#### Bước 3: Đăng Tin (Trừ tiền)

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer <employer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Developer",
    "description": "Looking for...",
    "job_type": "FULL_TIME",
    "budget_type": "FIXED",
    "budget_min": 1000,
    "budget_max": 2000,
    "post_cost": 20000
  }'

# ✅ Job created
# ✅ Số dư còn: 980,000 VND
```

#### Bước 4: Freelancer Apply

```bash
curl -X POST http://localhost:3000/api/applications/:jobId \
  -H "Authorization: Bearer <freelancer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cover_letter": "I am interested...",
    "proposed_rate": 1500
  }'
```

#### Bước 5: Employer Accept

```bash
curl -X PUT http://localhost:3000/api/applications/:applicationId/status \
  -H "Authorization: Bearer <employer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "employer_notes": "Welcome aboard!"
  }'
```

#### Bước 6: Chốt Job và Chuyển Tiền

```bash
curl -X POST http://localhost:3000/api/applications/:applicationId/complete \
  -H "Authorization: Bearer <employer_token>"

# ✅ Application status → "completed"
# ✅ Job status → "completed"
# ✅ 20,000 VND chuyển vào ví freelancer
```

#### Bước 7: Freelancer Kiểm Tra Ví

```bash
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer <freelancer_token>"

# Response: balance: 20000 (nếu là lần đầu nhận tiền)
```

## 📊 Các Loại Giao Dịch

| Type     | Khi Nào                 | Người Nhận               |
| -------- | ----------------------- | ------------------------ |
| JOB_POST | Employer đăng tin       | System (trừ từ employer) |
| JOB_POST | Job completed           | Freelancer (cộng tiền)   |
| DEPOSIT  | Nạp tiền (future)       | User                     |
| REFUND   | Job bị từ chối (future) | Employer                 |

## 🎨 Flow Diagram

```
┌─────────────┐
│  Employer   │
│  Đăng ký    │
└─────┬───────┘
      │
      ▼
┌─────────────────────┐
│ Tạo Ví Tự Động     │
│ Balance: 1,000,000  │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Đăng Job           │
│  post_cost: 20,000  │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│ Trừ Tiền           │
│ Balance: 980,000    │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│ Freelancer Apply    │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│ Employer Accept     │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│ Complete Job        │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│ Chuyển 20,000 VND   │
│ cho Freelancer      │
└─────────────────────┘
```

## ⚠️ Lưu Ý Quan Trọng

1. **Số dư mặc định**: 1,000,000 VND khi employer đăng ký
2. **Không cần API nạp/rút tiền**: Sẽ làm sau
3. **Tự động tạo ví freelancer**: Khi nhận tiền lần đầu
4. **Transaction safety**: Tất cả đều dùng database transaction
5. **Application status flow**: pending → accepted → completed
6. **Job status**: pending → active → completed

## 🔒 Validation

- ✅ Kiểm tra số dư trước khi đăng tin
- ✅ Chỉ employer owner mới chốt job được
- ✅ Application phải ở trạng thái "accepted"
- ✅ Job chưa được completed
- ✅ post_cost > 0

## 📝 Files Đã Tạo/Cập Nhật

### Models

- ✅ `wallet.model.js`
- ✅ `walletTransaction.model.js`
- ✅ `job.model.js` (thêm post_cost)
- ✅ `application.model.js` (thêm status "completed")

### Controllers

- ✅ `walletController.js` (chỉ getWallet & getTransactions)
- ✅ `jobController.js` (tích hợp trừ tiền)
- ✅ `employerController.js` (tự động tạo ví)
- ✅ `applicationController.js` (thêm completeJobAndTransferMoney)

### Routes

- ✅ `walletRoutes.js`
- ✅ `applicationRoutes.js` (thêm /complete)

### Migrations

- ✅ `004_add_wallet_system.sql`
- ✅ `005_add_post_cost_to_jobs.sql`
- ✅ `006_add_completed_status_to_applications.sql`

## 🎯 Summary

Hệ thống hoạt động theo flow đơn giản:

1. Employer đăng ký → Tự động có ví 1,000,000 VND
2. Đăng job → Trừ tiền
3. Chốt job → Chuyển tiền cho freelancer

Không cần API nạp/rút tiền vào lúc này. Tất cả đã sẵn sàng để sử dụng! 🚀
