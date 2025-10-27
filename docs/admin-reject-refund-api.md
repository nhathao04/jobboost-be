# Admin Reject Job Post with Refund API

## Overview
API này cho phép admin reject một job post và tự động hoàn tiền (refund) về ví của employer.

## Endpoint
```
PUT /api/admin/jobs/:jobId/review
```

## Authentication
- Yêu cầu: Admin authentication (cần implement middleware kiểm tra admin role)

## Request

### URL Parameters
| Parameter | Type   | Required | Description          |
|-----------|--------|----------|----------------------|
| jobId     | UUID   | Yes      | ID của job cần review|

### Body Parameters
| Parameter        | Type   | Required | Description                           |
|------------------|--------|----------|---------------------------------------|
| status           | String | Yes      | Trạng thái: "active" hoặc "rejected" |
| rejection_reason | String | No       | Lý do từ chối (bắt buộc nếu rejected)|

### Example Request - Approve
```json
PUT /api/admin/jobs/123e4567-e89b-12d3-a456-426614174000/review
Content-Type: application/json

{
  "status": "active"
}
```

### Example Request - Reject with Refund
```json
PUT /api/admin/jobs/123e4567-e89b-12d3-a456-426614174000/review
Content-Type: application/json

{
  "status": "rejected",
  "rejection_reason": "Nội dung không phù hợp với chính sách"
}
```

## Response

### Success Response - Approved (200 OK)
```json
{
  "success": true,
  "message": "Job has been approved",
  "data": {
    "job": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "owner_id": "user-uuid-123",
      "title": "Senior Frontend Developer",
      "description": "...",
      "status": "active",
      "post_cost": "100000.00",
      "rejection_reason": null,
      "created_at": "2025-10-27T10:00:00Z",
      "updated_at": "2025-10-27T11:00:00Z"
    }
  }
}
```

### Success Response - Rejected with Refund (200 OK)
```json
{
  "success": true,
  "message": "Job has been rejected. Refunded 100000.00 VND to employer's wallet.",
  "data": {
    "job": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "owner_id": "user-uuid-123",
      "title": "Senior Frontend Developer",
      "description": "...",
      "status": "rejected",
      "post_cost": "100000.00",
      "rejection_reason": "Nội dung không phù hợp với chính sách",
      "created_at": "2025-10-27T10:00:00Z",
      "updated_at": "2025-10-27T11:00:00Z"
    },
    "refund": {
      "amount": "100000.00",
      "new_balance": "250000.00",
      "transaction_id": "transaction-uuid-456"
    }
  }
}
```

### Error Responses

#### Invalid Status (400 Bad Request)
```json
{
  "success": false,
  "message": "Status must be 'active' or 'rejected'"
}
```

#### Job Not Found (404 Not Found)
```json
{
  "success": false,
  "message": "Job not found"
}
```

#### Job Already Processed (400 Bad Request)
```json
{
  "success": false,
  "message": "Job has already been active. Cannot review again."
}
```

#### Wallet Not Found (400 Bad Request)
```json
{
  "success": false,
  "message": "Failed to refund money to wallet",
  "error": "Wallet not found"
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "An error occurred while reviewing the job",
  "error": "Error details..."
}
```

## How It Works

### Flow khi Admin Approve Job
1. Admin gửi request với `status: "active"`
2. Hệ thống kiểm tra job có status là "pending" không
3. Cập nhật job status thành "active"
4. Trả về thông tin job đã approve
5. Job sẽ hiển thị trên danh sách công khai

### Flow khi Admin Reject Job với Refund
1. Admin gửi request với `status: "rejected"` và `rejection_reason`
2. Hệ thống kiểm tra job có status là "pending" không
3. Bắt đầu database transaction
4. Tìm wallet của employer (job owner)
5. Tính toán refund:
   - `balance_after = balance_before + post_cost`
   - `total_spent = total_spent - post_cost`
6. Cập nhật wallet balance
7. Tạo WalletTransaction record với:
   - `transaction_type: "REFUND"`
   - `amount: post_cost`
   - `reference_id: job_id`
   - `reference_type: "JOB"`
   - `description: rejection_reason`
   - `status: "completed"`
8. Cập nhật job status thành "rejected"
9. Commit transaction
10. Trả về thông tin job và refund details

## Database Impact

### Tables Affected
1. **jobs** - Cập nhật `status` và `rejection_reason`
2. **wallets** - Cập nhật `balance` và `total_spent`
3. **wallet_transactions** - Tạo record mới với type "REFUND"

### Transaction Safety
- Sử dụng Sequelize transaction để đảm bảo:
  - Nếu refund thất bại → job không bị reject
  - Nếu update job thất bại → wallet không bị thay đổi
  - Rollback tự động nếu có lỗi ở bất kỳ bước nào

## Security Considerations

⚠️ **Important**: API này cần được bảo vệ bởi Admin authentication middleware

```javascript
// Recommended route protection
router.put(
  "/admin/jobs/:jobId/review", 
  authenticate,        // Xác thực user
  requireAdmin,        // Kiểm tra admin role
  jobController.reviewJob
);
```

## Testing

### Test Case 1: Admin Approve Job
```bash
curl -X PUT http://localhost:3003/api/admin/jobs/{jobId}/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{
    "status": "active"
  }'
```

### Test Case 2: Admin Reject Job with Refund
```bash
curl -X PUT http://localhost:3003/api/admin/jobs/{jobId}/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{
    "status": "rejected",
    "rejection_reason": "Nội dung không phù hợp"
  }'
```

### Test Case 3: Try to Review Already Processed Job
```bash
# Gọi API review 2 lần để test logic
# Lần 2 phải trả về error "Job has already been..."
```

## Related APIs

- `POST /api/jobs` - Employer tạo job (trừ tiền)
- `GET /api/admin/jobs/pending` - Lấy danh sách job chờ duyệt
- `GET /api/wallet` - Xem thông tin ví
- `GET /api/wallet/transactions` - Xem lịch sử giao dịch (bao gồm refund)

## Business Rules

1. ✅ Chỉ job có status "pending" mới được review
2. ✅ Job đã approved/rejected không thể review lại
3. ✅ Reject job tự động refund 100% post_cost về wallet
4. ✅ Refund được ghi nhận trong transaction history
5. ✅ Employer sẽ nhận được thông báo về rejection (TODO: implement notification)

## Future Improvements

- [ ] Add email notification khi job bị reject
- [ ] Add push notification cho mobile app
- [ ] Add admin activity log
- [ ] Add partial refund option (refund một phần)
- [ ] Add re-submit job after rejection
- [ ] Add admin comment/feedback system
