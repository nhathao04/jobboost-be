# Job Product API Documentation

## Overview
The Job Product API allows freelancers to upload work deliverables/products for jobs they're working on, and enables employers to review, approve, or reject these submissions.

## Base URL
```
http://localhost:3000/api/v1/job-products
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Upload Job Product

**Endpoint:** `POST /api/v1/job-products`

**Description:** Upload a job product with files (freelancer)

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| job_id | UUID | Yes | Job ID this product belongs to |
| title | String | Yes | Product title (3-255 chars) |
| description | Text | No | Product description |
| files | File[] | No | Array of files (max 10 files, 25MB each) |

**Allowed File Types:**
- Documents: PDF, DOC, DOCX, XLS, XLSX, TXT
- Archives: ZIP
- Images: JPG, PNG, GIF

**Example Request (cURL):**
```bash
curl -X POST http://localhost:3000/api/v1/job-products \
  -H "Authorization: Bearer <token>" \
  -F "job_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "title=Website Homepage Design" \
  -F "description=Homepage mockup with responsive design" \
  -F "files=@homepage.pdf" \
  -F "files=@mockup.png"
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Job product uploaded successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "applicant_id": "user-uuid-here",
    "title": "Website Homepage Design",
    "description": "Homepage mockup with responsive design",
    "files": [
      {
        "name": "homepage.pdf",
        "path": "uploads/job-products/homepage-1730000000000-123456789.pdf",
        "size": 1024000,
        "mimetype": "application/pdf"
      },
      {
        "name": "mockup.png",
        "path": "uploads/job-products/mockup-1730000000001-987654321.png",
        "size": 2048000,
        "mimetype": "image/png"
      }
    ],
    "status": "pending",
    "rejection_reason": null,
    "reviewed_at": null,
    "reviewed_by": null,
    "created_at": "2025-10-29T10:00:00.000Z",
    "updated_at": "2025-10-29T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing job_id or title
- `404 Not Found` - Job not found
- `413 Payload Too Large` - File too large (>25MB)
- `400 Bad Request` - Invalid file type

---

### 2. Get My Job Products

**Endpoint:** `GET /api/v1/job-products`

**Description:** Get list of user's own job products with pagination and filtering

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Integer | 1 | Page number |
| limit | Integer | 10 | Items per page |
| status | String | - | Filter by status (pending/rejected/approved) |
| job_id | UUID | - | Filter by job ID |
| sort | String | created_at | Sort field |
| order | String | DESC | Sort order (ASC/DESC) |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/job-products?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "job_id": "123e4567-e89b-12d3-a456-426614174000",
        "applicant_id": "user-uuid",
        "title": "Website Homepage Design",
        "description": "Homepage mockup",
        "files": [...],
        "status": "pending",
        "rejection_reason": null,
        "reviewed_at": null,
        "reviewed_by": null,
        "created_at": "2025-10-29T10:00:00.000Z",
        "updated_at": "2025-10-29T10:00:00.000Z",
        "job": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "title": "Build Modern Website",
          "description": "Need a responsive website",
          "employer_id": "employer-uuid"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

---

### 3. Get Products by Job (Employer)

**Endpoint:** `GET /api/v1/job-products/by-job/:jobId`

**Description:** Get all products submitted for a specific job (employer only)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| jobId | UUID | Job ID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Integer | 1 | Page number |
| limit | Integer | 10 | Items per page |
| status | String | - | Filter by status |
| sort | String | created_at | Sort field |
| order | String | DESC | Sort order |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/job-products/by-job/123e4567-e89b-12d3-a456-426614174000?status=pending" \
  -H "Authorization: Bearer <token>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "job_id": "123e4567-e89b-12d3-a456-426614174000",
        "applicant_id": "freelancer-uuid",
        "title": "Website Homepage Design",
        "files": [...],
        "status": "pending",
        "created_at": "2025-10-29T10:00:00.000Z",
        "job": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "title": "Build Modern Website",
          "description": "Need a responsive website",
          "employer_id": "employer-uuid"
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

**Error Responses:**
- `403 Forbidden` - Not the job owner
- `404 Not Found` - Job not found

---

### 4. Review Job Product (Employer)

**Endpoint:** `PATCH /api/v1/job-products/:id/review`

**Description:** Approve or reject a job product (employer only)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Job product ID |

**Request Body:**
```json
{
  "status": "approved",  // or "rejected"
  "rejection_reason": "Does not meet requirements"  // Required if rejected
}
```

**Example Request (Approve):**
```bash
curl -X PATCH http://localhost:3000/api/v1/job-products/550e8400-e29b-41d4-a716-446655440000/review \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

**Example Request (Reject):**
```bash
curl -X PATCH http://localhost:3000/api/v1/job-products/550e8400-e29b-41d4-a716-446655440000/review \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "rejection_reason": "The design does not match our brand guidelines. Please revise the color scheme."
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Job product approved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "applicant_id": "freelancer-uuid",
    "title": "Website Homepage Design",
    "status": "approved",
    "rejection_reason": null,
    "reviewed_at": "2025-10-29T11:00:00.000Z",
    "reviewed_by": "employer-uuid",
    "created_at": "2025-10-29T10:00:00.000Z",
    "updated_at": "2025-10-29T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid status or missing rejection reason
- `403 Forbidden` - Not the job owner
- `404 Not Found` - Product not found

---

### 5. Download Product File

**Endpoint:** `GET /api/v1/job-products/:id/files/:fileIndex`

**Description:** Download a specific file from a job product

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Job product ID |
| fileIndex | Integer | Index of file in files array (0-based) |

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/v1/job-products/550e8400-e29b-41d4-a716-446655440000/files/0 \
  -H "Authorization: Bearer <token>" \
  --output downloaded-file.pdf
```

**Success Response (200):**
- File download stream
- Content-Disposition header with original filename

**Error Responses:**
- `403 Forbidden` - Not authorized (must be product owner or job employer)
- `404 Not Found` - Product or file not found

---

### 6. Delete Job Product

**Endpoint:** `DELETE /api/v1/job-products/:id`

**Description:** Delete a job product (only if status is pending)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Job product ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/job-products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Job product deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Cannot delete product that has been reviewed
- `403 Forbidden` - Not the product owner
- `404 Not Found` - Product not found

---

## Frontend Integration Examples

### React - Upload Job Product

```tsx
import { useState } from 'react';

interface UploadProductData {
  job_id: string;
  title: string;
  description?: string;
  files: File[];
}

const UploadJobProduct = () => {
  const [formData, setFormData] = useState<UploadProductData>({
    job_id: '',
    title: '',
    description: '',
    files: []
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, files: Array.from(e.target.files) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('job_id', formData.job_id);
    formDataToSend.append('title', formData.title);
    if (formData.description) {
      formDataToSend.append('description', formData.description);
    }
    
    formData.files.forEach((file) => {
      formDataToSend.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:3000/api/v1/job-products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      if (data.success) {
        alert('Product uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Product Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xlsx,.zip,.jpg,.png,.gif,.txt"
        onChange={handleFileChange}
      />
      <button type="submit">Upload Product</button>
    </form>
  );
};
```

### React - Employer Review

```tsx
interface ReviewProductProps {
  productId: string;
  onReviewComplete: () => void;
}

const ReviewProduct: React.FC<ReviewProductProps> = ({ productId, onReviewComplete }) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReview = async (status: 'approved' | 'rejected') => {
    const body: any = { status };
    if (status === 'rejected') {
      body.rejection_reason = rejectionReason;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/job-products/${productId}/review`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`Product ${status} successfully!`);
        onReviewComplete();
      }
    } catch (error) {
      console.error('Review failed:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleReview('approved')}>Approve</button>
      <div>
        <textarea
          placeholder="Rejection reason"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
        <button onClick={() => handleReview('rejected')}>Reject</button>
      </div>
    </div>
  );
};
```

### React - List Products

```tsx
interface JobProduct {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  files: Array<{ name: string; size: number; mimetype: string }>;
  created_at: string;
  rejection_reason?: string;
}

const MyProducts = () => {
  const [products, setProducts] = useState<JobProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/job-products?page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
    }
  };

  const downloadFile = (productId: string, fileIndex: number) => {
    window.open(
      `http://localhost:3000/api/v1/job-products/${productId}/files/${fileIndex}`,
      '_blank'
    );
  };

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>
          <h3>{product.title}</h3>
          <p>Status: {product.status}</p>
          {product.rejection_reason && (
            <p>Rejection Reason: {product.rejection_reason}</p>
          )}
          <div>
            {product.files.map((file, index) => (
              <button key={index} onClick={() => downloadFile(product.id, index)}>
                Download {file.name}
              </button>
            ))}
          </div>
        </div>
      ))}
      
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
};
```

---

## TypeScript Interfaces

```typescript
// Job Product
export interface JobProduct {
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
  job?: Job;
}

// Product File
export interface ProductFile {
  name: string;
  path: string;
  size: number;
  mimetype: string;
}

// Upload Request
export interface UploadProductRequest {
  job_id: string;
  title: string;
  description?: string;
  files?: File[];
}

// Review Request
export interface ReviewProductRequest {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

// List Response
export interface ListProductsResponse {
  success: boolean;
  data: {
    products: JobProduct[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}
```

---

## Status Flow

```
pending → approved (by employer)
        ↓
      rejected (by employer with reason)
```

**Rules:**
- Only **pending** products can be deleted by the freelancer
- Only the **job owner (employer)** can review products
- **Rejection reason** is required when rejecting
- Products can only be reviewed once (cannot change from approved to rejected or vice versa)

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `413 Payload Too Large` - File too large
- `500 Internal Server Error` - Server error
