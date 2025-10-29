# Job Product API - Quick Reference

## 🚀 Quick Start

### 1. Run Database Migration
```sql
-- Execute this SQL file in your PostgreSQL database
-- File: src/migrations/004_create_job_products_table.sql
psql -h 103.228.36.168 -U your_user -d exe201 -f src/migrations/004_create_job_products_table.sql
```

### 2. Server is Ready
✅ Server already running on http://localhost:3000  
✅ All routes mounted at `/api/v1/job-products`

---

## 📍 API Endpoints

### User (Freelancer) Endpoints

#### Upload Product
```bash
POST /api/v1/job-products
Content-Type: multipart/form-data

Fields:
- job_id: UUID (required)
- title: string (required)
- description: string (optional)
- files: File[] (optional, max 10, 25MB each)
```

#### List My Products
```bash
GET /api/v1/job-products?page=1&limit=10&status=pending
```

#### Delete Product (Pending Only)
```bash
DELETE /api/v1/job-products/:id
```

#### Download File
```bash
GET /api/v1/job-products/:id/files/:fileIndex
```

---

### Employer Endpoints

#### View Job Submissions
```bash
GET /api/v1/job-products/by-job/:jobId?status=pending&page=1&limit=10
```

#### Approve Product
```bash
PATCH /api/v1/job-products/:id/review
Content-Type: application/json

{
  "status": "approved"
}
```

#### Reject Product
```bash
PATCH /api/v1/job-products/:id/review
Content-Type: application/json

{
  "status": "rejected",
  "rejection_reason": "Does not meet requirements"
}
```

---

## 🧪 Test with cURL

### Upload Test
```bash
# Replace YOUR_TOKEN with actual JWT token
# Replace JOB_ID with actual job UUID

curl -X POST http://localhost:3000/api/v1/job-products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "job_id=JOB_ID" \
  -F "title=Test Product" \
  -F "description=Test description" \
  -F "files=@test.pdf"
```

### List Products Test
```bash
curl -X GET "http://localhost:3000/api/v1/job-products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve Test
```bash
curl -X PATCH http://localhost:3000/api/v1/job-products/PRODUCT_ID/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

---

## 📁 File Upload Specifications

**Allowed File Types:**
- Documents: PDF, DOC, DOCX, XLS, XLSX, TXT
- Archives: ZIP
- Images: JPG, PNG, GIF

**Limits:**
- Max file size: 25MB per file
- Max files per upload: 10 files
- Upload directory: `uploads/job-products/`

---

## 🔐 Authorization Rules

| Action | Who Can Access |
|--------|----------------|
| Upload product | Any authenticated user (freelancer) |
| View own products | Product owner only |
| Delete product | Product owner (pending status only) |
| View job products | Job employer only |
| Review product | Job employer only |
| Download file | Product owner OR job employer |

---

## 📊 Status Flow

```
User uploads product → Status: pending
                            ↓
                    Employer reviews
                    ↙            ↘
            Status: approved   Status: rejected
                               (with rejection_reason)
```

**Rules:**
- Only `pending` products can be deleted
- Once reviewed (approved/rejected), product cannot be deleted
- Rejection requires a reason

---

## 🐛 Troubleshooting

### Error: "Job not found"
- Make sure the job_id exists in the jobs table
- Verify the UUID format is correct

### Error: "Invalid file type"
- Check file extension matches allowed types
- Verify MIME type is in the allowed list

### Error: "File too large"
- Maximum file size is 25MB per file
- Compress large files or split into multiple files

### Error: "You do not have permission"
- Verify JWT token is valid
- Check user is the job owner (for employer actions)
- Check user is the product owner (for user actions)

---

## 📝 TypeScript Types

```typescript
interface JobProduct {
  id: string;
  job_id: string;
  applicant_id: string;
  title: string;
  description: string | null;
  files: ProductFile[];
  status: 'pending' | 'rejected' | 'approved';
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductFile {
  name: string;
  path: string;
  size: number;
  mimetype: string;
}
```

---

## 📚 Documentation Files

- **API Documentation**: `JOB_PRODUCT_API_DOCUMENTATION.md`
- **Implementation Summary**: `JOB_PRODUCT_IMPLEMENTATION_SUMMARY.md`
- **This Quick Reference**: `JOB_PRODUCT_QUICK_REFERENCE.md`

---

## ✅ Implementation Checklist

- [x] Model created (`jobProduct.model.js`)
- [x] Middleware created (`uploadJobProduct.js`)
- [x] Controller created (`jobProductController.js`)
- [x] Routes created (`jobProductRoutes.js`)
- [x] Routes mounted (`index.js`)
- [x] Migration script created (`004_create_job_products_table.sql`)
- [x] API documentation created
- [x] Server tested (running without errors)
- [ ] **Database migration executed** ⚠️ TODO
- [ ] Frontend integration started

---

## 🎯 Next Immediate Action

**Run the database migration:**

```bash
# Connect to your PostgreSQL database
psql -h 103.228.36.168 -U your_username -d exe201

# Then run:
\i src/migrations/004_create_job_products_table.sql
```

Or use Sequelize sync:
```javascript
// In your Node.js console or migration script
const { sequelize } = require('./src/config/sequelize');
await sequelize.sync({ alter: true });
```

After migration, the API is ready to use! 🚀
