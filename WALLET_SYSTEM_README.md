# Wallet & Payment System - Implementation Summary

## 📋 Tổng Quan

Hệ thống ví và thanh toán đã được tích hợp vào jobboost-backend để quản lý việc trừ tiền khi nhà tuyển dụng đăng tin tuyển dụng.

## 🆕 Các File Đã Tạo/Cập Nhật

### 1. Models (src/models/)

- ✅ **wallet.model.js** - Model quản lý ví tiền
- ✅ **walletTransaction.model.js** - Model lịch sử giao dịch
- ✅ **job.model.js** - Thêm field `post_cost`

### 2. Controllers (src/controllers/)

- ✅ **walletController.js** - Xử lý logic cho ví

  - `createWallet` - Tạo ví mới
  - `getWallet` - Lấy thông tin ví
  - `depositMoney` - Nạp tiền
  - `withdrawMoney` - Rút tiền
  - `getTransactionHistory` - Xem lịch sử giao dịch
  - `deductMoneyForJobPost` - Trừ tiền khi đăng tin (helper)
  - `refundMoneyForJob` - Hoàn tiền (helper)

- ✅ **jobController.js** - Cập nhật `createJob`
  - Thêm validation cho `post_cost`
  - Tích hợp trừ tiền từ ví
  - Sử dụng transaction để đảm bảo data consistency

### 3. Routes (src/routes/)

- ✅ **walletRoutes.js** - Định nghĩa các endpoints cho ví
- ✅ **index.js** - Đăng ký wallet routes

### 4. Migrations (src/migrations/)

- ✅ **004_add_wallet_system.sql** - Tạo bảng wallets và wallet_transactions
- ✅ **005_add_post_cost_to_jobs.sql** - Thêm cột post_cost vào bảng jobs

### 5. Documentation (docs/)

- ✅ **wallet-payment-system.md** - Tài liệu chi tiết về API và cách sử dụng

## 🔌 API Endpoints

### Wallet Management

```
POST   /api/wallet/create          - Tạo ví mới
GET    /api/wallet                 - Lấy thông tin ví
POST   /api/wallet/deposit         - Nạp tiền vào ví
POST   /api/wallet/withdraw        - Rút tiền từ ví
GET    /api/wallet/transactions    - Xem lịch sử giao dịch
```

### Job Posting (Updated)

```
POST   /api/jobs                   - Đăng tin (có trừ tiền)
```

## 💾 Database Schema

### Bảng `wallets`

| Column          | Type          | Description          |
| --------------- | ------------- | -------------------- |
| id              | UUID          | Primary key          |
| user_id         | UUID          | Foreign key (unique) |
| balance         | DECIMAL(15,2) | Số dư hiện tại       |
| currency        | VARCHAR       | Loại tiền tệ         |
| total_deposited | DECIMAL(15,2) | Tổng tiền đã nạp     |
| total_spent     | DECIMAL(15,2) | Tổng tiền đã chi     |
| is_active       | BOOLEAN       | Trạng thái ví        |
| created_at      | TIMESTAMP     | Ngày tạo             |
| updated_at      | TIMESTAMP     | Ngày cập nhật        |

### Bảng `wallet_transactions`

| Column           | Type          | Description                            |
| ---------------- | ------------- | -------------------------------------- |
| id               | UUID          | Primary key                            |
| wallet_id        | UUID          | Foreign key                            |
| transaction_type | VARCHAR       | DEPOSIT/WITHDRAW/JOB_POST/REFUND/BONUS |
| amount           | DECIMAL(15,2) | Số tiền giao dịch                      |
| balance_before   | DECIMAL(15,2) | Số dư trước giao dịch                  |
| balance_after    | DECIMAL(15,2) | Số dư sau giao dịch                    |
| reference_id     | UUID          | ID tham chiếu (job_id)                 |
| status           | VARCHAR       | pending/completed/failed/cancelled     |
| description      | TEXT          | Mô tả giao dịch                        |
| metadata         | JSONB         | Thông tin bổ sung                      |
| created_at       | TIMESTAMP     | Ngày tạo                               |

### Bảng `jobs` (Updated)

Thêm cột:

- `post_cost` (DECIMAL(15,2)) - Chi phí đăng tin

## 🚀 Cách Sử Dụng

### 1. Chạy Migrations

```bash
# Tạo bảng wallets và wallet_transactions
psql -U your_user -d your_database -f src/migrations/004_add_wallet_system.sql

# Thêm cột post_cost vào jobs
psql -U your_user -d your_database -f src/migrations/005_add_post_cost_to_jobs.sql
```

### 2. Quy Trình Đăng Tin

```javascript
// 1. Employer tạo ví
POST /api/wallet/create

// 2. Employer nạp tiền
POST /api/wallet/deposit
{
  "amount": 100000,
  "description": "Nạp tiền vào ví"
}

// 3. Employer đăng tin (tiền tự động trừ)
POST /api/jobs
{
  "title": "Senior Developer",
  "description": "...",
  "job_type": "FULL_TIME",
  "budget_type": "FIXED",
  "budget_min": 1000,
  "budget_max": 2000,
  "post_cost": 20000  // REQUIRED - Chi phí đăng tin
}

// 4. Kiểm tra lịch sử giao dịch
GET /api/wallet/transactions
```

## 🔒 Tính Năng Bảo Mật

1. **Authentication Required** - Tất cả endpoints yêu cầu Bearer token
2. **Transaction Safety** - Sử dụng database transaction để đảm bảo consistency
3. **Balance Validation** - Kiểm tra số dư trước khi thực hiện giao dịch
4. **Audit Trail** - Lưu lại toàn bộ lịch sử giao dịch

## ⚠️ Xử Lý Lỗi

- **400 Bad Request** - Thiếu thông tin hoặc số dư không đủ
- **403 Forbidden** - Ví không hoạt động
- **404 Not Found** - Không tìm thấy ví
- **409 Conflict** - Ví đã tồn tại
- **500 Internal Server Error** - Lỗi server

## 📊 Các Loại Giao Dịch

| Type     | Description                |
| -------- | -------------------------- |
| DEPOSIT  | Nạp tiền vào ví            |
| WITHDRAW | Rút tiền từ ví             |
| JOB_POST | Thanh toán đăng tin        |
| REFUND   | Hoàn tiền (job bị từ chối) |
| BONUS    | Tiền thưởng                |

## 🧪 Testing

Sử dụng Postman hoặc curl để test các endpoints:

```bash
# Tạo ví
curl -X POST http://localhost:3000/api/wallet/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Nạp tiền
curl -X POST http://localhost:3000/api/wallet/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'

# Đăng tin
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Dev",
    "description": "...",
    "job_type": "FULL_TIME",
    "budget_type": "FIXED",
    "post_cost": 20000
  }'
```

## 📝 Next Steps (Tính năng có thể mở rộng)

- [ ] Tích hợp payment gateway (VNPay, PayPal, Stripe)
- [ ] Hệ thống hoàn tiền tự động khi job bị từ chối
- [ ] Thông báo qua email khi giao dịch thành công
- [ ] Dashboard quản lý tài chính cho employer
- [ ] Báo cáo thu chi theo tháng/năm
- [ ] Chương trình khuyến mãi (bonus transactions)
- [ ] Giới hạn số lần rút tiền mỗi ngày
- [ ] KYC verification cho rút tiền lớn

## 📚 Tài Liệu Chi Tiết

Xem file `docs/wallet-payment-system.md` để biết thêm chi tiết về:

- API documentation đầy đủ
- Request/Response examples
- Error handling
- Best practices

## 🎯 Summary

Hệ thống ví và thanh toán đã được tích hợp hoàn chỉnh với các tính năng:

- ✅ Quản lý ví tiền của employer
- ✅ Nạp/Rút tiền
- ✅ Trừ tiền tự động khi đăng tin
- ✅ Lịch sử giao dịch chi tiết
- ✅ Transaction safety với database
- ✅ API documentation đầy đủ

Hệ thống sẵn sàng để sử dụng sau khi chạy migrations!
