/**
 * Helper functions for checking and resetting user posting and marking limits
 */

/**
 * Check if user's monthly limits need to be reset
 * @param {Object} user - User document from MongoDB
 * @returns {boolean} - True if reset is needed
 */
export function shouldResetMonthlyLimits(user) {
  if (!user.lastMonthlyReset) return true;

  const now = new Date();
  const lastReset = new Date(user.lastMonthlyReset);
  const monthsPassed =
    (now.getFullYear() - lastReset.getFullYear()) * 12 +
    (now.getMonth() - lastReset.getMonth());

  return monthsPassed >= 1;
}

/**
 * Check if user's daily mark-as-found limit needs to be reset
 * @param {Object} user - User document from MongoDB
 * @returns {boolean} - True if reset is needed
 */
export function shouldResetDailyLimit(user) {
  if (!user.lastDailyReset) return true;

  const now = new Date();
  const lastDailyReset = new Date(user.lastDailyReset);
  const daysPassed = Math.floor(
    (now.getTime() - lastDailyReset.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysPassed >= 1;
}

/**
 * Reset user's monthly limits
 * @param {Object} user - User document from MongoDB
 */
export async function resetMonthlyLimits(user) {
  user.monthlyLostRequestsCount = 0;
  user.monthlyFoundAnnouncementsCount = 0;
  user.lastMonthlyReset = new Date();
  await user.save();
}

/**
 * Reset user's daily mark-as-found limit
 * @param {Object} user - User document from MongoDB
 */
export async function resetDailyLimit(user) {
  user.dailyMarkFoundCount = 0;
  user.lastDailyReset = new Date();
  await user.save();
}

/**
 * Check if user can post a lost request
 * @param {Object} user - User document from MongoDB
 * @returns {Object} - { allowed: boolean, message: string }
 */
export function canPostLostRequest(user) {
  const MONTHLY_LOST_LIMIT = 2;

  if (user.monthlyLostRequestsCount >= MONTHLY_LOST_LIMIT) {
    return {
      allowed: false,
      message: `Monthly limit reached. You can only post ${MONTHLY_LOST_LIMIT} lost requests per month. Your limit will reset next month.`,
    };
  }

  return {
    allowed: true,
    remaining: MONTHLY_LOST_LIMIT - user.monthlyLostRequestsCount,
  };
}

/**
 * Check if user can post a found announcement
 * @param {Object} user - User document from MongoDB
 * @returns {Object} - { allowed: boolean, message: string }
 */
export function canPostFoundAnnouncement(user) {
  const MONTHLY_FOUND_LIMIT = 2;

  if (user.monthlyFoundAnnouncementsCount >= MONTHLY_FOUND_LIMIT) {
    return {
      allowed: false,
      message: `Monthly limit reached. You can only post ${MONTHLY_FOUND_LIMIT} found announcements per month. Your limit will reset next month.`,
    };
  }

  return {
    allowed: true,
    remaining: MONTHLY_FOUND_LIMIT - user.monthlyFoundAnnouncementsCount,
  };
}

/**
 * Check if user can mark an item as found
 * @param {Object} user - User document from MongoDB
 * @returns {Object} - { allowed: boolean, message: string }
 */
export function canMarkItemAsFound(user) {
  const DAILY_MARK_LIMIT = 1;

  if (user.dailyMarkFoundCount >= DAILY_MARK_LIMIT) {
    return {
      allowed: false,
      message: `Daily limit reached. You can only mark ${DAILY_MARK_LIMIT} item as found per day. Try again tomorrow.`,
    };
  }

  return {
    allowed: true,
    remaining: DAILY_MARK_LIMIT - user.dailyMarkFoundCount,
  };
}

/**
 * Get user's limit status for display
 * @param {Object} user - User document from MongoDB
 * @returns {Object} - Object with all limit statuses
 */
export function getUserLimitStatus(user) {
  return {
    monthly: {
      lostRequests: {
        used: user.monthlyLostRequestsCount || 0,
        limit: 2,
        remaining: 2 - (user.monthlyLostRequestsCount || 0),
        resetDate: user.lastMonthlyReset,
      },
      foundAnnouncements: {
        used: user.monthlyFoundAnnouncementsCount || 0,
        limit: 2,
        remaining: 2 - (user.monthlyFoundAnnouncementsCount || 0),
        resetDate: user.lastMonthlyReset,
      },
    },
    daily: {
      markAsFound: {
        used: user.dailyMarkFoundCount || 0,
        limit: 1,
        remaining: 1 - (user.dailyMarkFoundCount || 0),
        resetDate: user.lastDailyReset,
      },
    },
  };
}
