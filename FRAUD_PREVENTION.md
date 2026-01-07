# Fraud Prevention - User Posting & Marking Limits

## Overview

This document describes the fraud prevention system implemented to prevent abuse of the lost and found platform. The system implements rate limits on user activities to prevent collusion and gaming of the reputation system.

## Problem Statement

Without limits, malicious users could:

1. Post unlimited fake lost requests
2. Post unlimited fake found announcements
3. Mark multiple items as found in a single day
4. Collude with friends to artificially inflate their items returned count

## Solution

### Three-Tier Limit System

#### 1. Monthly Lost Request Limit

- **Limit**: 2 lost requests per month per user
- **Resets**: Automatically at the start of each month
- **Reason**: Prevents spam of fake lost items and collusion

#### 2. Monthly Found Announcement Limit

- **Limit**: 2 found announcements per month per user
- **Resets**: Automatically at the start of each month
- **Reason**: Prevents users from posting fake found items

#### 3. Daily Mark-as-Found Limit

- **Limit**: 1 item marked as found per day per user
- **Resets**: Automatically every 24 hours
- **Reason**: Prevents users from rapidly marking multiple items as found in collusion with friends

## Database Schema Changes

### User Model Updates

New fields added to the User schema:

```javascript
// Monthly posting limits
monthlyLostRequestsCount: {
  type: Number,
  default: 0,
},
monthlyFoundAnnouncementsCount: {
  type: Number,
  default: 0,
},
lastMonthlyReset: {
  type: Date,
  default: () => new Date(),
},

// Daily mark-as-found limit
dailyMarkFoundCount: {
  type: Number,
  default: 0,
},
lastDailyReset: {
  type: Date,
  default: () => new Date(),
}
```

## API Changes

### Affected Endpoints

#### 1. POST `/api/user/[userid]/new-lost-request`

- **New Behavior**: Checks if user has reached monthly limit (2) before allowing post
- **Error Response** (429):
  ```json
  {
    "error": "Monthly limit reached. You can only post 2 lost requests per month. Your limit will reset next month."
  }
  ```
- **Counter Increment**: Increments `monthlyLostRequestsCount` on success

#### 2. POST `/api/user/[userid]/new-found-announcement`

- **New Behavior**: Checks if user has reached monthly limit (2) before allowing post
- **Error Response** (429):
  ```json
  {
    "error": "Monthly limit reached. You can only post 2 found announcements per month. Your limit will reset next month."
  }
  ```
- **Counter Increment**: Increments `monthlyFoundAnnouncementsCount` on success

#### 3. PATCH `/api/items/[itemid]/found`

- **New Behavior**: Checks if user has already marked 1 item as found today
- **Error Response** (429):
  ```json
  {
    "error": "Daily limit reached. You can only mark 1 item as found per day. Try again tomorrow."
  }
  ```
- **Counter Increment**: Increments `dailyMarkFoundCount` on success

#### 4. GET `/api/user/limits` (New Endpoint)

- **Purpose**: Fetch current user's limit status
- **Response**:
  ```json
  {
    "success": true,
    "limits": {
      "monthly": {
        "lostRequests": {
          "used": 1,
          "limit": 2,
          "remaining": 1,
          "resetDate": "2026-01-01T00:00:00.000Z"
        },
        "foundAnnouncements": {
          "used": 0,
          "limit": 2,
          "remaining": 2,
          "resetDate": "2026-01-01T00:00:00.000Z"
        }
      },
      "daily": {
        "markAsFound": {
          "used": 1,
          "limit": 1,
          "remaining": 0,
          "resetDate": "2026-01-07T00:00:00.000Z"
        }
      }
    }
  }
  ```

## Helper Functions

### New Utility File: `lib/limitHelpers.js`

#### Functions:

1. **`shouldResetMonthlyLimits(user)`**: Check if monthly limits need reset
2. **`shouldResetDailyLimit(user)`**: Check if daily limit needs reset
3. **`resetMonthlyLimits(user)`**: Reset monthly counters
4. **`resetDailyLimit(user)`**: Reset daily counter
5. **`canPostLostRequest(user)`**: Validate if user can post lost request
6. **`canPostFoundAnnouncement(user)`**: Validate if user can post found announcement
7. **`canMarkItemAsFound(user)`**: Validate if user can mark item as found
8. **`getUserLimitStatus(user)`**: Get comprehensive limit status for display

## Auto-Reset Logic

### Monthly Reset

- Compares current month/year with `lastMonthlyReset`
- Automatically resets counters when a new month is detected
- Sets `lastMonthlyReset` to current date

### Daily Reset

- Calculates days passed since `lastDailyReset`
- Automatically resets counter when 24+ hours have passed
- Sets `lastDailyReset` to current date

## Frontend Integration Guidelines

### 1. Display Remaining Limits

Fetch and display user's current limits before they attempt to post:

```javascript
const response = await fetch("/api/user/limits", {
  headers: {
    Authorization: `Bearer ${userToken}`,
  },
});
const { limits } = await response.json();

// Display: "You have 2 lost requests remaining this month"
```

### 2. Disable Buttons When Limit Reached

```javascript
const canPostLost = limits.monthly.lostRequests.remaining > 0;
const canMarkFound = limits.daily.markAsFound.remaining > 0;

<Button disabled={!canPostLost}>Post Lost Request</Button>
<Button disabled={!canMarkFound}>Mark as Found</Button>
```

### 3. Show Helpful Error Messages

When API returns 429 status, display the error message to inform users about limits.

### 4. Show Reset Countdown

Calculate and display when limits will reset:

```javascript
const resetDate = new Date(limits.monthly.lostRequests.resetDate);
const nextMonth = new Date(
  resetDate.getFullYear(),
  resetDate.getMonth() + 1,
  1
);
// Display: "Resets on February 1, 2026"
```

## Testing Scenarios

### Test Case 1: Monthly Lost Request Limit

1. Create 2 lost requests in current month ✓
2. Attempt 3rd lost request → Should receive 429 error ✓
3. Wait for month to change or manually reset `lastMonthlyReset`
4. Attempt lost request → Should succeed ✓

### Test Case 2: Monthly Found Announcement Limit

1. Create 2 found announcements in current month ✓
2. Attempt 3rd found announcement → Should receive 429 error ✓
3. Reset occurs at month change ✓

### Test Case 3: Daily Mark-as-Found Limit

1. Mark 1 item as found today ✓
2. Attempt to mark another item → Should receive 429 error ✓
3. Wait 24 hours or manually reset `lastDailyReset`
4. Attempt to mark item → Should succeed ✓

## Migration Notes

### For Existing Users

Existing users in the database will automatically receive default values:

- `monthlyLostRequestsCount`: 0
- `monthlyFoundAnnouncementsCount`: 0
- `dailyMarkFoundCount`: 0
- `lastMonthlyReset`: Current date/time
- `lastDailyReset`: Current date/time

No manual migration script is needed as Mongoose will apply defaults.

## Security Considerations

1. **Time Manipulation**: Limits are server-side only; users cannot manipulate their local time to bypass limits
2. **Token Validation**: All endpoints verify JWT tokens before checking limits
3. **Database Atomicity**: Uses MongoDB's `$inc` operator for atomic counter updates
4. **Rate Limit Headers**: Consider adding standard rate limit headers in future (X-RateLimit-Limit, X-RateLimit-Remaining)

## Future Enhancements

1. **Admin Override**: Allow admins to reset user limits manually
2. **Premium Users**: Different limits for verified or premium users
3. **Graduated Limits**: Increase limits for users with high reputation
4. **Analytics Dashboard**: Track limit usage patterns to detect abuse
5. **Notifications**: Notify users when approaching their limits

## Rollback Plan

If issues arise, to rollback:

1. Remove limit checking code from API routes
2. Keep database fields (won't cause errors)
3. Remove helper functions from imports
4. Deploy previous version

Fields can be removed from schema later if needed:

```javascript
// Remove these fields from userSchema
db.users.updateMany(
  {},
  {
    $unset: {
      monthlyLostRequestsCount: "",
      monthlyFoundAnnouncementsCount: "",
      lastMonthlyReset: "",
      dailyMarkFoundCount: "",
      lastDailyReset: "",
    },
  }
);
```

## Support & Troubleshooting

### Common Issues

**Issue**: User claims they can't post but haven't reached limit

- **Solution**: Check `lastMonthlyReset` and `lastDailyReset` dates in database
- Verify limit counters are accurate
- Check for timezone discrepancies

**Issue**: Limits not resetting

- **Solution**: Verify date comparison logic in helper functions
- Check server timezone settings
- Manually reset using admin tools

**Issue**: False positives (blocking valid users)

- **Solution**: Review limit values (currently 2/month, 1/day)
- Consider increasing limits if too restrictive
- Add admin bypass functionality

## Contact

For questions or issues related to this fraud prevention system, please contact:

- Development Team
- Professor (Feature Requester)

---

**Last Updated**: January 7, 2026
**Version**: 1.0.0
