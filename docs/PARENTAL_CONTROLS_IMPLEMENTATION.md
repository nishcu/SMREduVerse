# Parental Controls Implementation

## Overview

This document describes the comprehensive parental controls system implemented in SMREduVerse, including activity logging, configurable notifications, and parent dashboard.

## Features Implemented

### 1. Parent-Child Relationship System

**Data Model:**
- `parentId`: Reference to parent account (for child accounts)
- `isChildAccount`: Boolean flag to identify child accounts
- `children`: Array of child user IDs (for parent accounts)
- `parentalCode`: Hashed secret code for accessing parental controls

**Location:** `src/lib/types.ts`

### 2. Parental Control Settings

**Settings Available:**
- `restrictSpending`: Disable coin spending
- `restrictChat`: Restrict chat interactions
- `restrictTalentHub`: Hide age-inappropriate content
- `restrictAITasks`: Disable AI task generation spending
- `restrictContests`: Prevent joining contests with entry fees
- `restrictMarketplace`: Prevent marketplace purchases
- `enableActivityLogs`: Enable activity tracking
- `notificationInterval`: Configurable interval for parent notifications (in minutes)

**Default Values:**
- All restrictions: `false` (disabled by default)
- Activity logs: `true` (enabled by default)
- Notification interval: `120` minutes (2 hours)

**Storage:** Settings are stored in Firestore at:
- `users/{userId}/parental-controls/settings`
- Also synced to `users/{userId}/profile/{userId}.settings`

**Location:** 
- `src/app/(app)/settings/actions.ts` - Server actions
- `src/app/(app)/settings/page.tsx` - UI component

### 3. Activity Logging System

**Activity Types Tracked:**
- `spending`: Coin spending activities
- `chat`: Chat interactions
- `purchase`: Marketplace purchases
- `course_enrollment`: Course enrollments
- `game_play`: Game activities
- `challenge_join`: Challenge participation
- `other`: Other activities

**Activities Logged:**
1. **Challenge Joining** - When child joins a challenge (with coin cost)
2. **Marketplace Purchases** - When child purchases content
3. **AI Task Generation** - When child spends coins on AI tasks
4. **Chat Activities** - (To be implemented)
5. **Other Spending** - Any coin spending activity

**Storage:** Activity logs are stored in:
- `users/{userId}/activity-logs/{logId}`

**Location:** `src/lib/activity-logger.ts`

### 4. Parent Notification System

**Notification Types:**
- `activity_summary`: Periodic summary of child's activities
- `spending_alert`: Alert when child spends coins
- `restriction_triggered`: Alert when a restriction is triggered
- `custom`: Custom notifications

**How It Works:**
1. When a child performs an activity, `logActivity()` is called
2. The system checks if the child has a parent (`parentId`)
3. If parent exists, it checks the notification interval setting
4. If enough time has passed since last notification, it:
   - Collects all activities since last notification
   - Creates a notification document
   - Updates the `lastNotificationSent` timestamp
   - Sends notification to parent

**Configurable Interval:**
- Parents can set notification interval from 15 minutes to 24 hours
- Default: 2 hours (120 minutes)
- Options: 15min, 30min, 1hr, 2hr, 4hr, 8hr, 12hr, 24hr

**Storage:** Notifications are stored in:
- `users/{parentId}/parent-notifications/{notificationId}`

**Location:** `src/lib/activity-logger.ts` (checkAndSendParentNotification function)

### 5. Parent Dashboard

**Features:**
- Overview statistics (total children, notifications, activities)
- Activity notifications tab
- Children list tab
- Activity logs tab (coming soon)

**Statistics Displayed:**
- Total Children: Number of connected child accounts
- Notifications: Total and unread count
- Total Activities: All tracked activities
- Recent Activity: Activities in last report

**Location:** `src/app/(app)/parent-dashboard/page.tsx`

**API Routes:**
- `/api/parent/notifications` - Fetch parent notifications
- `/api/parent/children` - Fetch connected children

### 6. Enhanced Settings Page

**Features:**
- Parental code verification (hashed with bcryptjs)
- All restriction toggles
- Activity logs toggle
- Notification interval selector
- Change parental code option
- Save/Lock controls

**Security:**
- Parental code is hashed using bcryptjs before storage
- Code verification happens server-side
- Settings are locked by default

**Location:** `src/app/(app)/settings/page.tsx`

## Implementation Details

### Activity Logging Integration

Activity logging is integrated into the following actions:

1. **Challenge Actions** (`src/app/(app)/challenges/actions.ts`):
   - Logs when child joins a challenge
   - Includes coin cost and challenge details

2. **Marketplace Actions** (`src/app/(app)/marketplace/actions.ts`):
   - Logs when child purchases content
   - Includes purchase amount and content details

3. **Brain Lab Actions** (`src/app/(app)/brain-lab/actions.ts`):
   - Logs when child spends coins on AI tasks
   - Includes task type and topic

### Notification Trigger Logic

```typescript
// Check if enough time has passed
const timeSinceLastNotification = now - lastNotification;
const intervalMs = notificationInterval * 60 * 1000;

if (timeSinceLastNotification >= intervalMs) {
  // Collect activities since last notification
  // Create notification
  // Update lastNotificationSent
}
```

### Parent-Child Linking

**To Link a Child to a Parent:**
1. Parent account must exist
2. Update child's profile: `parentId = parentUserId`
3. Update parent's profile: Add child's ID to `children` array
4. Set child's `isChildAccount = true`

**Example:**
```typescript
// Child profile
{
  parentId: 'parent-user-id',
  isChildAccount: true,
}

// Parent profile
{
  children: ['child-user-id-1', 'child-user-id-2'],
}
```

## Usage

### For Parents

1. **Access Parental Controls:**
   - Go to Settings page
   - Enter parental code (4-10 characters)
   - Unlock controls

2. **Configure Settings:**
   - Toggle restrictions as needed
   - Set notification interval
   - Enable/disable activity logs
   - Save changes

3. **View Child Activity:**
   - Go to Parent Dashboard
   - View notifications tab for activity summaries
   - View children tab for connected accounts
   - View activity logs for detailed history

### For Children

- Activities are automatically logged
- Restrictions are enforced based on settings
- No action required from child

## Security Considerations

1. **Parental Code:**
   - Hashed using bcryptjs (10 rounds)
   - Never stored in plain text
   - Verified server-side only

2. **Activity Logs:**
   - Only accessible by parent account
   - Stored securely in Firestore
   - Cannot be modified by child

3. **Notifications:**
   - Only sent to verified parent accounts
   - Include only necessary information
   - Respect privacy settings

## Future Enhancements

1. **Real-time Notifications:**
   - Push notifications for immediate alerts
   - Email notifications option
   - SMS notifications option

2. **Advanced Filtering:**
   - Filter activities by type
   - Filter by time period
   - Export activity reports

3. **Parent-Child Communication:**
   - In-app messaging between parent and child
   - Approval requests for spending
   - Time limit settings

4. **Analytics Dashboard:**
   - Usage statistics
   - Spending trends
   - Learning progress reports

## API Endpoints

### Parent Notifications
- **GET** `/api/parent/notifications`
  - Requires: Bearer token
  - Returns: List of parent notifications

### Parent Children
- **GET** `/api/parent/children`
  - Requires: Bearer token
  - Returns: List of connected children

### Parental Control Settings
- **GET** `/app/(app)/settings/actions.ts` - `getParentalControlSettings()`
- **POST** `/app/(app)/settings/actions.ts` - `saveParentalControlSettings()`
- **POST** `/app/(app)/settings/actions.ts` - `verifyParentalCode()`

## Database Structure

```
users/
  {userId}/
    profile/
      {userId}/
        - settings: { restrictSpending, restrictChat, ... }
        - parentId: string (if child)
        - children: string[] (if parent)
        - parentalCode: string (hashed)
    parental-controls/
      settings/
        - restrictSpending: boolean
        - restrictChat: boolean
        - notificationInterval: number
        - lastNotificationSent: Timestamp
        - ...
    activity-logs/
      {logId}/
        - userId: string
        - activityType: string
        - activityTitle: string
        - timestamp: Timestamp
        - ...
    parent-notifications/
      {notificationId}/
        - parentId: string
        - childId: string
        - notificationType: string
        - activities: ActivityLog[]
        - read: boolean
        - ...
```

## Testing

To test parental controls:

1. **Create Parent Account:**
   - Sign up as parent
   - Set parental code in settings

2. **Create Child Account:**
   - Sign up as child
   - Link to parent (update parentId)

3. **Test Restrictions:**
   - Try to spend coins (should be blocked if restricted)
   - Try to join contests (should be blocked if restricted)
   - Try to purchase from marketplace (should be blocked if restricted)

4. **Test Activity Logging:**
   - Perform activities as child
   - Check activity logs in Firestore
   - Verify notifications are created

5. **Test Notifications:**
   - Wait for notification interval
   - Check parent dashboard for notifications
   - Verify notification contains activities

## Notes

- Notification interval is configurable per parent
- Default interval is 2 hours (120 minutes)
- Activities are logged even if notifications are disabled
- Parental code can be changed anytime (requires current code)
- All restrictions are enforced server-side

