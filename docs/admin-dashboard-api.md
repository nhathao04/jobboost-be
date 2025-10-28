# Admin Dashboard API Documentation

## Overview

API endpoints để quản lý và giám sát hệ thống JobBoost. Tất cả endpoints yêu cầu quyền admin để truy cập.

**Base URL**: `/admin/dashboard`

**Authentication**: Tất cả endpoints yêu cầu Bearer token với quyền admin.

---

## 1. Dashboard Overview

### GET `/admin/dashboard/overview`

Lấy tổng quan về các chỉ số quan trọng của hệ thống.

#### Query Parameters

| Parameter | Type   | Required | Default | Description                                                   |
| --------- | ------ | -------- | ------- | ------------------------------------------------------------- |
| period    | string | No       | 'all'   | Khoảng thời gian lọc: 'today', 'week', 'month', 'year', 'all' |

#### Response

```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 50000000,
      "transactionCount": 150,
      "averagePerTransaction": 333333.33
    },
    "users": {
      "total": 500,
      "freelancers": 320,
      "employers": 180,
      "unverified": 45,
      "activeInPeriod": 120
    },
    "transactions": {
      "total": 280,
      "byType": {
        "JOB_POST": 150,
        "DEPOSIT": 80,
        "REFUND": 30,
        "WITHDRAW": 20
      }
    },
    "reviews": {
      "total": 85,
      "averageRating": 4.3,
      "byRole": {
        "freelancer": 45,
        "employer": 40
      },
      "verified": 60
    },
    "jobs": {
      "total": 200,
      "byStatus": {
        "PENDING": 20,
        "APPROVED": 120,
        "REJECTED": 10,
        "COMPLETED": 40,
        "CANCELLED": 10
      }
    },
    "applications": {
      "total": 450,
      "byStatus": {
        "PENDING": 80,
        "ACCEPTED": 150,
        "REJECTED": 180,
        "COMPLETED": 40
      }
    },
    "period": "week"
  }
}
```

#### Example Request

```bash
# Xem overview tuần này
GET /admin/dashboard/overview?period=week

# Xem overview tất cả thời gian
GET /admin/dashboard/overview
```

---

## 2. Revenue Details

### GET `/admin/dashboard/revenue`

Lấy chi tiết các giao dịch doanh thu với phân trang.

#### Query Parameters

| Parameter | Type   | Required | Default     | Description                         |
| --------- | ------ | -------- | ----------- | ----------------------------------- |
| page      | number | No       | 1           | Số trang                            |
| limit     | number | No       | 20          | Số bản ghi mỗi trang (max: 100)     |
| startDate | string | No       | -           | Ngày bắt đầu (YYYY-MM-DD)           |
| endDate   | string | No       | -           | Ngày kết thúc (YYYY-MM-DD)          |
| sortBy    | string | No       | 'createdAt' | Sắp xếp theo: 'amount', 'createdAt' |
| sortOrder | string | No       | 'DESC'      | Thứ tự: 'ASC', 'DESC'               |

#### Response

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 123,
        "wallet_code": "WLT001",
        "user_id": "uuid-123",
        "amount": 500000,
        "type": "JOB_POST",
        "description": "Đăng tin tuyển dụng",
        "balance_before": 2000000,
        "balance_after": 1500000,
        "createdAt": "2025-10-20T10:30:00Z",
        "Job": {
          "id": 456,
          "title": "Senior Frontend Developer",
          "status": "APPROVED"
        }
      }
    ],
    "summary": {
      "totalRevenue": 50000000,
      "averageTransaction": 333333.33,
      "minTransaction": 100000,
      "maxTransaction": 2000000,
      "transactionCount": 150
    },
    "chartData": [
      {
        "date": "2025-10-01",
        "revenue": 1500000,
        "count": 5
      },
      {
        "date": "2025-10-02",
        "revenue": 2000000,
        "count": 7
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### Example Request

```bash
# Xem doanh thu tháng 10
GET /admin/dashboard/revenue?startDate=2025-10-01&endDate=2025-10-31&limit=50

# Xem doanh thu cao nhất
GET /admin/dashboard/revenue?sortBy=amount&sortOrder=DESC
```

---

## 3. Revenue Chart

### GET `/admin/dashboard/revenue/chart`

Lấy dữ liệu biểu đồ doanh thu theo thời gian.

#### Query Parameters

| Parameter | Type   | Required | Default | Description                                      |
| --------- | ------ | -------- | ------- | ------------------------------------------------ |
| period    | string | No       | 'month' | Khoảng thời gian: 'day', 'week', 'month', 'year' |

#### Response

```json
{
  "success": true,
  "data": {
    "chartData": [
      {
        "time": "2025-10-01 00:00",
        "revenue": 1500000,
        "count": 5
      },
      {
        "time": "2025-10-02 00:00",
        "revenue": 2000000,
        "count": 7
      }
    ],
    "period": "month",
    "groupBy": "day"
  }
}
```

#### Grouping Logic

- **period = 'day'**: Group by hour (24 data points)
- **period = 'week'**: Group by day (7 data points)
- **period = 'month'**: Group by day (30 data points)
- **period = 'year'**: Group by month (12 data points)

#### Example Request

```bash
# Biểu đồ doanh thu theo giờ (24h qua)
GET /admin/dashboard/revenue/chart?period=day

# Biểu đồ doanh thu theo tháng (1 năm qua)
GET /admin/dashboard/revenue/chart?period=year
```

---

## 4. Users Management

### GET `/admin/dashboard/users`

Lấy danh sách người dùng với thông tin chi tiết.

#### Query Parameters

| Parameter | Type    | Required | Default      | Description                                              |
| --------- | ------- | -------- | ------------ | -------------------------------------------------------- |
| page      | number  | No       | 1            | Số trang                                                 |
| limit     | number  | No       | 20           | Số bản ghi mỗi trang (max: 100)                          |
| role      | string  | No       | -            | Lọc theo vai trò: 'freelancer', 'employer'               |
| verified  | boolean | No       | -            | Lọc theo trạng thái xác thực: true, false                |
| search    | string  | No       | -            | Tìm kiếm theo email hoặc tên                             |
| sortBy    | string  | No       | 'created_at' | Sắp xếp: 'created_at', 'balance', 'jobs', 'applications' |
| sortOrder | string  | No       | 'DESC'       | Thứ tự: 'ASC', 'DESC'                                    |

#### Response

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-123",
        "email": "user@example.com",
        "role": "freelancer",
        "email_confirmed_at": "2025-09-15T10:00:00Z",
        "created_at": "2025-09-01T08:30:00Z",
        "last_sign_in_at": "2025-10-27T09:15:00Z",
        "user_metadata": {
          "full_name": "Nguyen Van A"
        },
        "wallet": {
          "balance": 1500000,
          "totalSpent": 5000000,
          "totalDeposited": 6500000
        },
        "activity": {
          "jobsCreated": 0,
          "applications": 25,
          "reviews": 5
        }
      }
    ],
    "summary": {
      "totalUsers": 500,
      "freelancers": 320,
      "employers": 180,
      "verified": 455,
      "unverified": 45
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

#### Example Request

```bash
# Tìm freelancer đã xác thực
GET /admin/dashboard/users?role=freelancer&verified=true

# Tìm user theo email
GET /admin/dashboard/users?search=nguyen@example.com

# User có số dư ví cao nhất
GET /admin/dashboard/users?sortBy=balance&sortOrder=DESC
```

---

## 5. Transactions Log

### GET `/admin/dashboard/transactions`

Lấy lịch sử giao dịch của hệ thống.

#### Query Parameters

| Parameter | Type   | Required | Default     | Description                                       |
| --------- | ------ | -------- | ----------- | ------------------------------------------------- |
| page      | number | No       | 1           | Số trang                                          |
| limit     | number | No       | 20          | Số bản ghi mỗi trang (max: 100)                   |
| type      | string | No       | -           | Loại: 'JOB_POST', 'DEPOSIT', 'REFUND', 'WITHDRAW' |
| status    | string | No       | -           | Trạng thái: 'SUCCESS', 'PENDING', 'FAILED'        |
| startDate | string | No       | -           | Ngày bắt đầu (YYYY-MM-DD)                         |
| endDate   | string | No       | -           | Ngày kết thúc (YYYY-MM-DD)                        |
| minAmount | number | No       | -           | Số tiền tối thiểu                                 |
| maxAmount | number | No       | -           | Số tiền tối đa                                    |
| sortBy    | string | No       | 'createdAt' | Sắp xếp: 'amount', 'createdAt'                    |
| sortOrder | string | No       | 'DESC'      | Thứ tự: 'ASC', 'DESC'                             |

#### Response

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 123,
        "wallet_code": "WLT001",
        "user_id": "uuid-123",
        "type": "DEPOSIT",
        "amount": 1000000,
        "description": "Nạp tiền vào ví",
        "balance_before": 500000,
        "balance_after": 1500000,
        "status": "SUCCESS",
        "createdAt": "2025-10-27T10:00:00Z",
        "Wallet": {
          "wallet_code": "WLT001",
          "balance": 1500000
        },
        "user": {
          "email": "user@example.com",
          "name": "Nguyen Van A"
        }
      }
    ],
    "summary": {
      "totalTransactions": 280,
      "byType": {
        "JOB_POST": {
          "count": 150,
          "totalAmount": 45000000
        },
        "DEPOSIT": {
          "count": 80,
          "totalAmount": 120000000
        },
        "REFUND": {
          "count": 30,
          "totalAmount": 9000000
        },
        "WITHDRAW": {
          "count": 20,
          "totalAmount": 15000000
        }
      }
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 280,
      "totalPages": 14
    }
  }
}
```

#### Example Request

```bash
# Xem tất cả giao dịch nạp tiền
GET /admin/dashboard/transactions?type=DEPOSIT

# Giao dịch lớn hơn 1 triệu
GET /admin/dashboard/transactions?minAmount=1000000

# Giao dịch thất bại
GET /admin/dashboard/transactions?status=FAILED
```

---

## 6. Reviews Moderation

### GET `/admin/dashboard/reviews`

Quản lý đánh giá của người dùng về nền tảng.

#### Query Parameters

| Parameter | Type    | Required | Default     | Description                                      |
| --------- | ------- | -------- | ----------- | ------------------------------------------------ |
| page      | number  | No       | 1           | Số trang                                         |
| limit     | number  | No       | 20          | Số bản ghi mỗi trang (max: 100)                  |
| role      | string  | No       | -           | Vai trò người đánh giá: 'freelancer', 'employer' |
| rating    | number  | No       | -           | Lọc theo số sao: 1-5                             |
| verified  | boolean | No       | -           | Đánh giá từ user đã xác thực                     |
| status    | string  | No       | -           | Trạng thái: 'active', 'hidden', 'flagged'        |
| startDate | string  | No       | -           | Ngày bắt đầu (YYYY-MM-DD)                        |
| endDate   | string  | No       | -           | Ngày kết thúc (YYYY-MM-DD)                       |
| sortBy    | string  | No       | 'createdAt' | Sắp xếp: 'rating', 'helpful_count', 'createdAt'  |
| sortOrder | string  | No       | 'DESC'      | Thứ tự: 'ASC', 'DESC'                            |

#### Response

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 45,
        "user_id": "uuid-123",
        "role": "freelancer",
        "rating": 5,
        "title": "Nền tảng tuyệt vời!",
        "comment": "Tôi đã tìm được nhiều dự án phù hợp...",
        "aspect_ratings": {
          "ease_of_use": 5,
          "job_quality": 4,
          "support": 5,
          "payment": 5
        },
        "helpful_count": 12,
        "is_verified_user": true,
        "status": "active",
        "createdAt": "2025-10-20T14:30:00Z",
        "user": {
          "email": "freelancer@example.com",
          "name": "Nguyen Van B",
          "verified": true
        }
      }
    ],
    "statistics": {
      "totalReviews": 85,
      "averageRating": 4.3,
      "ratingDistribution": {
        "5": 45,
        "4": 25,
        "3": 10,
        "2": 3,
        "1": 2
      },
      "byRole": {
        "freelancer": 45,
        "employer": 40
      },
      "verified": 60,
      "unverified": 25
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "totalPages": 5
    }
  }
}
```

#### Example Request

```bash
# Xem đánh giá 5 sao
GET /admin/dashboard/reviews?rating=5

# Đánh giá từ freelancer đã xác thực
GET /admin/dashboard/reviews?role=freelancer&verified=true

# Đánh giá hữu ích nhất
GET /admin/dashboard/reviews?sortBy=helpful_count&sortOrder=DESC
```

---

## Error Responses

Tất cả endpoints đều có thể trả về các lỗi sau:

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Không có quyền truy cập"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Yêu cầu quyền admin"
}
```

### 400 Bad Request

```json
{
  "success": false,
  "message": "Tham số không hợp lệ",
  "errors": {
    "period": "Giá trị phải là: today, week, month, year, all"
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Lỗi server",
  "error": "Chi tiết lỗi..."
}
```

---

## Common Parameters

### Pagination

Tất cả endpoints có phân trang đều hỗ trợ:

- `page`: Số trang (mặc định: 1)
- `limit`: Số bản ghi/trang (mặc định: 20, tối đa: 100)

### Sorting

- `sortBy`: Trường để sắp xếp
- `sortOrder`: 'ASC' (tăng dần) hoặc 'DESC' (giảm dần)

### Date Filtering

- Format: `YYYY-MM-DD` (ví dụ: 2025-10-27)
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc

### Period Options

- `today`: Hôm nay
- `week`: 7 ngày qua
- `month`: 30 ngày qua
- `year`: 365 ngày qua
- `all`: Tất cả thời gian

---

## Rate Limiting

- **Rate limit**: 100 requests/phút/IP
- **Burst limit**: 20 requests/giây

Khi vượt quá giới hạn, API trả về:

```json
{
  "success": false,
  "message": "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  "retryAfter": 60
}
```

---

## Notes

1. **Authentication**: Tất cả endpoints yêu cầu header:

   ```
   Authorization: Bearer <admin_token>
   ```

2. **Timezone**: Tất cả timestamp sử dụng UTC timezone

3. **Currency**: Tất cả số tiền tính bằng VND

4. **Performance**:

   - Sử dụng pagination để tránh timeout
   - Limit tối đa 100 bản ghi/request
   - Cache được áp dụng cho overview statistics (5 phút)

5. **Data Privacy**:
   - Thông tin nhạy cảm của user được che giấu
   - Chỉ admin mới truy cập được endpoints này

---

## Example Usage

### JavaScript (Fetch API)

```javascript
// Get dashboard overview
const getOverview = async (period = "week") => {
  const response = await fetch(`/admin/dashboard/overview?period=${period}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

// Get users with filters
const getUsers = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/admin/dashboard/users?${params}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  return response.json();
};
```

### cURL

```bash
# Get overview
curl -X GET "http://localhost:3003/admin/dashboard/overview?period=month" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get revenue details
curl -X GET "http://localhost:3003/admin/dashboard/revenue?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get users
curl -X GET "http://localhost:3003/admin/dashboard/users?role=freelancer&verified=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Changelog

### Version 1.0.0 (2025-10-27)

- Initial release
- 6 endpoints: overview, revenue, revenue chart, users, transactions, reviews
- Support pagination, filtering, sorting
- Integration with Supabase authentication
