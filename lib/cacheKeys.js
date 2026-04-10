export const CACHE_TTL = {
  ALL_LOST_ITEMS: 90,
  ALL_FOUND_ITEMS: 90,
  TOP_PERFORMERS: 120,
  USER_PROFILE: 60,
  USER_LOST_REQUESTS: 60,
  USER_FOUND_ANNOUNCEMENTS: 60,
};

export const cacheKeys = {
  allLostItems: () => "lnf:items:lost:all",
  allFoundItems: () => "lnf:items:found:all",
  topPerformers: () => "lnf:users:top-performers",
  userProfile: (email) =>
    email ? `lnf:user:profile:${email.toLowerCase()}` : null,
  userLostRequests: (userId) =>
    userId ? `lnf:user:${userId}:lost-requests` : null,
  userFoundAnnouncements: (userId) =>
    userId ? `lnf:user:${userId}:found-announcements` : null,
};

export function getGlobalFeedCacheKeys() {
  return [
    cacheKeys.allLostItems(),
    cacheKeys.allFoundItems(),
    cacheKeys.topPerformers(),
  ];
}

export function getUserScopedCacheKeys({ userId, email } = {}) {
  return [
    cacheKeys.userProfile(email),
    cacheKeys.userLostRequests(userId),
    cacheKeys.userFoundAnnouncements(userId),
  ].filter(Boolean);
}
