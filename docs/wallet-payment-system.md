# Hệ Thống Ví và Thanh Toán Đăng Tin

## Tổng quan

Hệ thống ví cho phép nhà tuyển dụng (employer) quản lý số dư và thanh toán khi đăng tin tuyển dụng. Khi đăng bài, hệ thống sẽ tự động trừ tiền từ ví của nhà tuyển dụng.

## Cấu trúc Database

### Bảng `wallets`

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> auth.users.id, UNIQUE)
- balance: DECIMAL(15, 2) - Số dư hiện tại
- currency: VARCHAR (VND, USD, EUR, JPY)
- total_deposited: DECIMAL(15, 2) - Tổng tiền đã nạp
- total_spent: DECIMAL(15, 2) - Tổng tiền đã chi
- is_active: BOOLEAN - Trạng thái ví
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Bảng `wallet_transactions`

```sql
- id: UUID (Primary Key)
- wallet_id: UUID (Foreign Key -> wallets.id)
- transaction_type: VARCHAR (DEPOSIT, WITHDRAW, JOB_POST, REFUND, BONUS)
- amount: DECIMAL(15, 2)
- currency: VARCHAR
- balance_before: DECIMAL(15, 2)
- balance_after: DECIMAL(15, 2)
- reference_id: UUID - ID tham chiếu (ví dụ: job_id)
- reference_type: VARCHAR - Loại tham chiếu
- description: TEXT
- status: VARCHAR (pending, completed, failed, cancelled)
- metadata: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Bảng `jobs` (Cập nhật)

Thêm cột:

```sql
- post_cost: DECIMAL(15, 2) - Chi phí đăng tin
```

## API Endpoints

### 1. Tạo Ví Mới

**POST** `/api/wallet/create`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currency": "VND" // Optional, default: VND
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Wallet created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "balance": 0,
    "currency": "VND",
    "total_deposited": 0,
    "total_spent": 0,
    "is_active": true,
    "created_at": "2025-10-21T10:00:00Z",
    "updated_at": "2025-10-21T10:00:00Z"
  }
}
```

---

### 2. Lấy Thông Tin Ví

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
    "balance": 100000,
    "currency": "VND",
    "total_deposited": 200000,
    "total_spent": 100000,
    "is_active": true,
    "created_at": "2025-10-21T10:00:00Z",
    "updated_at": "2025-10-21T10:00:00Z"
  }
}
```

---

### 3. Nạp Tiền Vào Ví

**POST** `/api/wallet/deposit`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "amount": 100000,
  "description": "Nạp tiền vào ví" // Optional
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Deposit successful",
  "data": {
    "wallet": {
      "id": "uuid",
      "balance": 100000,
      "currency": "VND"
    },
    "transaction": {
      "id": "uuid",
      "wallet_id": "uuid",
      "transaction_type": "DEPOSIT",
      "amount": 100000,
      "currency": "VND",
      "balance_before": 0,
      "balance_after": 100000,
      "description": "Nạp tiền vào ví",
      "status": "completed",
      "created_at": "2025-10-21T10:00:00Z"
    }
  }
}
```

---

### 4. Rút Tiền Từ Ví

**POST** `/api/wallet/withdraw`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "amount": 50000,
  "description": "Rút tiền từ ví" // Optional
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Withdrawal successful",
  "data": {
    "wallet": {
      "id": "uuid",
      "balance": 50000,
      "currency": "VND"
    },
    "transaction": {
      "id": "uuid",
      "wallet_id": "uuid",
      "transaction_type": "WITHDRAW",
      "amount": 50000,
      "currency": "VND",
      "balance_before": 100000,
      "balance_after": 50000,
      "description": "Rút tiền từ ví",
      "status": "completed",
      "created_at": "2025-10-21T10:00:00Z"
    }
  }
}
```

**Error Response (400 - Insufficient Balance):**

```json
{
  "success": false,
  "message": "Insufficient balance",
  "current_balance": 50000,
  "requested_amount": 100000
}
```

---

### 5. Lấy Lịch Sử Giao Dịch

**GET** `/api/wallet/transactions`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `transaction_type` (DEPOSIT | WITHDRAW | JOB_POST | REFUND | BONUS)
- `status` (pending | completed | failed | cancelled)
- `start_date` (date format: YYYY-MM-DD)
- `end_date` (date format: YYYY-MM-DD)

**Example:**

```
GET /api/wallet/transactions?page=1&limit=10&transaction_type=JOB_POST
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "wallet_id": "uuid",
        "transaction_type": "JOB_POST",
        "amount": 20000,
        "currency": "VND",
        "balance_before": 100000,
        "balance_after": 80000,
        "reference_id": "job-uuid",
        "reference_type": "JOB",
        "description": "Payment for job posting",
        "status": "completed",
        "created_at": "2025-10-21T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "total_pages": 5
    }
  }
}
```

---

### 6. Đăng Tin Tuyển Dụng (Có Trừ Tiền)

**POST** `/api/jobs`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Senior Backend Developer",
  "description": "We are looking for...",
  "job_type": "FULL_TIME",
  "budget_type": "FIXED",
  "budget_min": 1000,
  "budget_max": 2000,
  "currency": "USD",
  "experience_level": "SENIOR",
  "deadline": "2025-12-31",
  "skills_required": ["Node.js", "PostgreSQL", "Docker"],
  "post_cost": 20000 // Chi phí đăng tin (REQUIRED)
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
      "owner_id": "uuid",
      "title": "Senior Backend Developer",
      "description": "We are looking for...",
      "job_type": "FULL_TIME",
      "budget_type": "FIXED",
      "budget_min": 1000,
      "budget_max": 2000,
      "currency": "USD",
      "experience_level": "SENIOR",
      "deadline": "2025-12-31T00:00:00Z",
      "skills_required": ["Node.js", "PostgreSQL", "Docker"],
      "post_cost": 20000,
      "status": "pending",
      "created_at": "2025-10-21T10:00:00Z"
    },
    "wallet_balance": 80000,
    "amount_deducted": 20000
  }
}
```

**Error Response (400 - Insufficient Balance):**

```json
{
  "success": false,
  "message": "Insufficient balance. Current: 10000, Required: 20000",
  "error": "WALLET_ERROR"
}
```

**Error Response (400 - Missing Post Cost):**

```json
{
  "success": false,
  "message": "Post cost is required and must be greater than 0"
}
```

**Error Response (404 - Wallet Not Found):**

```json
{
  "success": false,
  "message": "Wallet not found. Please create a wallet first.",
  "error": "WALLET_ERROR"
}
```

---

## Quy Trình Sử Dụng

### Bước 1: Tạo Ví

Employer cần tạo ví trước khi có thể nạp tiền và đăng tin.

```bash
curl -X POST http://localhost:3000/api/wallet/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"currency": "VND"}'
```

### Bước 2: Nạp Tiền

Nạp tiền vào ví để có số dư cho việc đăng tin.

```bash
curl -X POST http://localhost:3000/api/wallet/deposit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100000,
    "description": "Nạp tiền lần đầu"
  }'
```

### Bước 3: Kiểm Tra Số Dư

Xem số dư hiện tại trong ví.

```bash
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer <token>"
```

### Bước 4: Đăng Tin Tuyển Dụng

Đăng tin với chi phí được chỉ định, tiền sẽ tự động được trừ từ ví.

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Backend Developer",
    "description": "Looking for experienced developer...",
    "job_type": "FULL_TIME",
    "budget_type": "FIXED",
    "budget_min": 1000,
    "budget_max": 2000,
    "currency": "USD",
    "post_cost": 20000
  }'
```

### Bước 5: Xem Lịch Sử Giao Dịch

Xem tất cả các giao dịch đã thực hiện.

```bash
curl -X GET http://localhost:3000/api/wallet/transactions?page=1&limit=10 \
  -H "Authorization: Bearer <token>"
```

---

## Lưu Ý Quan Trọng

1. **Tạo ví trước:** Employer phải tạo ví trước khi có thể nạp tiền hoặc đăng tin.

2. **Kiểm tra số dư:** Hệ thống sẽ tự động kiểm tra số dư trước khi cho phép đăng tin. Nếu không đủ tiền, giao dịch sẽ bị từ chối.

3. **Transaction Safety:** Tất cả các thao tác trừ tiền và tạo job đều được bọc trong database transaction để đảm bảo tính nhất quán.

4. **Lịch sử giao dịch:** Mọi thao tác với ví đều được ghi lại trong bảng `wallet_transactions` để tra cứu và đối soát.

5. **Hoàn tiền:** Hệ thống có hàm `refundMoneyForJob` để hoàn tiền khi job bị từ chối hoặc xóa (có thể tích hợp sau).

6. **Currency:** Hiện tại hỗ trợ VND, USD, EUR, JPY. Mặc định là VND.

---

## Các Loại Giao Dịch

- **DEPOSIT**: Nạp tiền vào ví
- **WITHDRAW**: Rút tiền từ ví
- **JOB_POST**: Thanh toán cho việc đăng tin tuyển dụng
- **REFUND**: Hoàn tiền (khi job bị từ chối/xóa)
- **BONUS**: Tiền thưởng (dùng cho các chương trình khuyến mãi)

---

## Migrations

Chạy các migration sau để setup database:

```bash
# Migration 1: Tạo bảng wallets và wallet_transactions
psql -U your_user -d your_database -f src/migrations/004_add_wallet_system.sql

# Migration 2: Thêm cột post_cost vào bảng jobs
psql -U your_user -d your_database -f src/migrations/005_add_post_cost_to_jobs.sql
```

---

## Testing với Postman

Import file `postman_collection.json` để test các API endpoints. Collection đã bao gồm:

- Tạo ví
- Nạp/Rút tiền
- Xem lịch sử giao dịch
- Đăng tin có trừ tiền

---

## Mã Lỗi

| Code | Message                       | Description                      |
| ---- | ----------------------------- | -------------------------------- |
| 400  | Missing required fields       | Thiếu thông tin bắt buộc         |
| 400  | Amount must be greater than 0 | Số tiền phải lớn hơn 0           |
| 400  | Insufficient balance          | Số dư không đủ                   |
| 400  | Post cost is required         | Thiếu thông tin chi phí đăng tin |
| 403  | Wallet is not active          | Ví không hoạt động               |
| 404  | Wallet not found              | Không tìm thấy ví                |
| 409  | Wallet already exists         | Ví đã tồn tại                    |
| 500  | Internal Server Error         | Lỗi server                       |

---

## Ví dụ Full Flow

```javascript
// 1. Tạo ví
const createWallet = await fetch("/api/wallet/create", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ currency: "VND" }),
});

// 2. Nạp tiền
const deposit = await fetch("/api/wallet/deposit", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 100000,
    description: "Nạp tiền lần đầu",
  }),
});

// 3. Kiểm tra số dư
const wallet = await fetch("/api/wallet", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// 4. Đăng tin (tự động trừ tiền)
const createJob = await fetch("/api/jobs", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Senior Developer",
    description: "Looking for...",
    job_type: "FULL_TIME",
    budget_type: "FIXED",
    budget_min: 1000,
    budget_max: 2000,
    post_cost: 20000, // Sẽ trừ 20000 từ ví
  }),
});

// 5. Xem lịch sử
const transactions = await fetch("/api/wallet/transactions?page=1&limit=10", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```
