/**
 * Platform Review Configuration
 *
 * ⚠️ QUAN TRỌNG: Đây là cấu hình cho TESTING (2 tuần)
 * Sau giai đoạn beta test, cần điều chỉnh lại về production values
 */

// ================== TESTING CONFIG (Current) ==================

const TESTING_CONFIG = {
  // Freelancer
  FREELANCER_FIRST_REVIEW_JOBS: 1, // Jobs hoàn thành để prompt lần đầu
  FREELANCER_REPROMPOT_DAYS: 7, // Ngày kể từ lần review cuối
  FREELANCER_REPROMPOT_JOBS: 2, // Jobs bổ sung để re-prompt (với điều kiện thời gian)
  FREELANCER_REPROMPOT_JOBS_ONLY: 3, // Jobs bổ sung để re-prompt (không cần điều kiện thời gian)

  // Employer
  EMPLOYER_FIRST_REVIEW_JOBS: 1, // Jobs hoàn thành để prompt lần đầu
  EMPLOYER_FIRST_REVIEW_POSTS: 1, // Job posts tạo để prompt lần đầu
  EMPLOYER_REPROMPOT_DAYS: 7, // Ngày kể từ lần review cuối
  EMPLOYER_REPROMPOT_JOBS: 2, // Jobs bổ sung để re-prompt

  // Common
  SPAM_PROTECTION_DAYS: 3, // Không cho review 2 lần trong X ngày
  VERIFICATION_THRESHOLD_FREELANCER: 1, // Jobs để auto-verify freelancer review
  VERIFICATION_THRESHOLD_EMPLOYER: 1, // Jobs để auto-verify employer review

  // Metadata
  CONFIG_NAME: "SHORT_TERM_TESTING",
  VALID_UNTIL: "2025-11-10", // Ngày dự kiến chuyển về production
  REASON: "2-week beta testing để thu thập nhiều feedback",
};

// ================== PRODUCTION CONFIG (Recommended) ==================

const PRODUCTION_CONFIG = {
  // Freelancer
  FREELANCER_FIRST_REVIEW_JOBS: 3, // User có đủ trải nghiệm để đánh giá
  FREELANCER_REPROMPOT_DAYS: 90, // 3 tháng - tránh spam
  FREELANCER_REPROMPOT_JOBS: 5, // Đủ jobs mới để có ý kiến khác
  FREELANCER_REPROMPOT_JOBS_ONLY: 10, // Hoặc rất nhiều jobs mới

  // Employer
  EMPLOYER_FIRST_REVIEW_JOBS: 2, // Đã tuyển dụng thành công
  EMPLOYER_FIRST_REVIEW_POSTS: 3, // Hoặc đã post nhiều jobs
  EMPLOYER_REPROMPOT_DAYS: 90, // 3 tháng
  EMPLOYER_REPROMPOT_JOBS: 3, // Đủ hiring experiences mới

  // Common
  SPAM_PROTECTION_DAYS: 30, // 1 tháng cooldown
  VERIFICATION_THRESHOLD_FREELANCER: 3, // Review từ experienced users
  VERIFICATION_THRESHOLD_EMPLOYER: 2, // Review có credibility

  // Metadata
  CONFIG_NAME: "PRODUCTION",
  REASON: "Đảm bảo quality reviews từ users có đủ trải nghiệm",
};

// ================== CURRENT ACTIVE CONFIG ==================

const ACTIVE_CONFIG = TESTING_CONFIG; // ⚠️ CHANGE THIS AFTER TESTING

// ================== USAGE ==================

/**
 * Cách sử dụng trong code:
 *
 * const { FREELANCER_FIRST_REVIEW_JOBS } = require('./reviewConfig');
 *
 * if (completedJobs >= FREELANCER_FIRST_REVIEW_JOBS) {
 *   shouldPrompt = true;
 * }
 */

module.exports = ACTIVE_CONFIG;

// ================== MIGRATION NOTES ==================

/**
 * KHI CHUYỂN TỪ TESTING → PRODUCTION:
 *
 * 1. Đổi ACTIVE_CONFIG = PRODUCTION_CONFIG
 * 2. Restart server
 * 3. Thông báo cho users về thay đổi
 * 4. Monitor review rate trong 1 tuần
 * 5. Adjust nếu cần (có thể dùng hybrid config)
 *
 * EXAMPLE HYBRID CONFIG (nếu production quá strict):
 *
 * const HYBRID_CONFIG = {
 *   FREELANCER_FIRST_REVIEW_JOBS: 2,     // Giữa testing (1) và production (3)
 *   FREELANCER_REPROMPOT_DAYS: 30,       // Giữa testing (7) và production (90)
 *   SPAM_PROTECTION_DAYS: 7,             // Giữa testing (3) và production (30)
 *   // ... rest
 * };
 */

// ================== ANALYTICS ==================

/**
 * Metrics to track:
 *
 * - Review creation rate (reviews per day)
 * - Prompt → Review conversion rate
 * - Average time from prompt to review
 * - Review quality (comment length, aspects filled)
 * - Verified vs unverified ratio
 * - Spam/abuse reports
 * - User complaints about prompt frequency
 *
 * Use these metrics to decide final config values
 */
