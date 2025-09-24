const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/jobboost';
const PORT = process.env.PORT || 3000;

const ROLES = {
    EMPLOYER: 'employer',
    STUDENT: 'student',
    ADMIN: 'admin',
};

const APPLICATION_STATUSES = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
};

const ASSIGNMENT_STATUSES = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed',
};

const JOB_STATUSES = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

const NOTIFICATION_TYPES = {
    JOB_APPLICATION: 'job_application',
    JOB_ASSIGNMENT: 'job_assignment',
    PAYMENT: 'payment',
    GENERAL: 'general',
};

module.exports = {
    JWT_SECRET,
    JWT_EXPIRATION,
    DATABASE_URL,
    PORT,
    ROLES,
    APPLICATION_STATUSES,
    ASSIGNMENT_STATUSES,
    JOB_STATUSES,
    NOTIFICATION_TYPES,
};