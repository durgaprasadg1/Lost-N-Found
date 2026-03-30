import User from "@/model/user";

export function shouldResetMonthlyLimits(user) {
  if (!user.lastMonthlyReset) return true;

  const now = new Date();
  const lastReset = new Date(user.lastMonthlyReset);
  const monthsPassed =
    (now.getFullYear() - lastReset.getFullYear()) * 12 +
    (now.getMonth() - lastReset.getMonth());

  return monthsPassed >= 1;
}

export function shouldResetDailyLimit(user) {
  if (!user.lastDailyReset) return true;

  const now = new Date();
  const lastDailyReset = new Date(user.lastDailyReset);
  const daysPassed = Math.floor(
    (now.getTime() - lastDailyReset.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysPassed >= 1;
}

export async function resetMonthlyLimits(user) {
  const updates = {
    monthlyLostRequestsCount: 0,
    monthlyFoundAnnouncementsCount: 0,
    lastMonthlyReset: new Date(),
  };
  if (user._id) {
    await User.findByIdAndUpdate(user._id, updates);
  }
  return { ...user, ...updates };
}

export async function resetDailyLimit(user) {
  const updates = {
    dailyMarkFoundCount: 0,
    lastDailyReset: new Date(),
  };
  if (user._id) {
    await User.findByIdAndUpdate(user._id, updates);
  }
  return { ...user, ...updates };
}

export function canPostLostRequest(user) {
  const MONTHLY_LOST_LIMIT = 2;

  if ((user.monthlyLostRequestsCount ?? 0) >= MONTHLY_LOST_LIMIT) {
    return {
      allowed: false,
      message: `Monthly limit reached. You can only post ${MONTHLY_LOST_LIMIT} lost requests per month. Your limit will reset next month.`,
    };
  }

  return {
    allowed: true,
    remaining: MONTHLY_LOST_LIMIT - (user.monthlyLostRequestsCount ?? 0),
  };
}

export function canPostFoundAnnouncement(user) {
  const MONTHLY_FOUND_LIMIT = 2;

  if ((user.monthlyFoundAnnouncementsCount ?? 0) >= MONTHLY_FOUND_LIMIT) {
    return {
      allowed: false,
      message: `Monthly limit reached. You can only post ${MONTHLY_FOUND_LIMIT} found announcements per month. Your limit will reset next month.`,
    };
  }

  return {
    allowed: true,
    remaining:
      MONTHLY_FOUND_LIMIT - (user.monthlyFoundAnnouncementsCount ?? 0),
  };
}

export function canMarkItemAsFound(user) {
  const DAILY_MARK_LIMIT = 1;

  if ((user.dailyMarkFoundCount ?? 0) >= DAILY_MARK_LIMIT) {
    return {
      allowed: false,
      message: `Daily limit reached. You can only mark ${DAILY_MARK_LIMIT} item as found per day. Try again tomorrow.`,
    };
  }

  return {
    allowed: true,
    remaining: DAILY_MARK_LIMIT - (user.dailyMarkFoundCount ?? 0),
  };
}

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
