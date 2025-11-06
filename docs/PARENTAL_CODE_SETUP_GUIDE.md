# Parental Code Setup Guide

## Where to Set Up Parental Code

The parental code can be set up in the **Settings** page of the application.

**Location:** `/settings` (accessible from the sidebar navigation)

## How to Set Up Parental Code

### Step 1: Navigate to Settings
1. Log in to your account
2. Click on **Settings** in the sidebar navigation
3. You'll see the **Parental Controls** card on the left side

### Step 2: Initial Setup (If No Code Exists)
If you haven't set up a parental code yet:

1. The page will automatically detect that no code exists
2. You'll see a message: **"Set up a parental code to manage your child's activities."**
3. Enter your desired code (4-10 characters) in the **"New code"** field
4. Confirm the code by entering it again in the **"Confirm code"** field
5. Click **"Set Parental Code"** button
6. Once set, the code will be saved and the controls will be locked

### Step 3: Unlocking Controls (If Code Exists)
If you already have a parental code set:

1. Enter your parental code in the password field
2. Click **"Unlock Controls"** button
3. Once unlocked, you can:
   - Change the parental code (optional)
   - Modify restriction settings
   - Adjust notification intervals
   - Save your changes

### Step 4: Changing the Code
To change your existing parental code:

1. Unlock the controls using your current code
2. Enter your new code in the **"New code"** field
3. Confirm the new code in the **"Confirm code"** field
4. Click **"Save Changes"** button
5. The new code will be saved and controls will remain unlocked

### Step 5: Locking Controls
After making changes:

1. Click **"Lock Controls"** button
2. The controls will be locked again
3. You'll need to enter the code again to unlock in the future

## Code Requirements

- **Minimum Length:** 4 characters
- **Maximum Length:** 10 characters
- **Type:** Alphanumeric (letters and numbers)
- **Security:** Code is hashed using bcrypt before storage

## Features Protected by Parental Code

Once a parental code is set, you can control:

1. **Coin Spending** - Disable Knowledge Coin spending
2. **Chat Restrictions** - Limit chat interactions
3. **Talent Hub** - Hide age-inappropriate content
4. **AI Tasks** - Disable AI task generation spending
5. **Contests** - Prevent joining contests with entry fees
6. **Marketplace** - Prevent marketplace purchases
7. **Activity Logs** - Enable/disable activity tracking
8. **Notification Interval** - Set how often parents receive activity summaries (15 minutes to 24 hours)

## Important Notes

- The parental code is **hashed** and stored securely - it cannot be recovered if forgotten
- The code is required to unlock and modify parental control settings
- If you forget your code, you'll need to contact support to reset it
- The code is unique to each user account
- Parents can set different codes for different child accounts

## Troubleshooting

### "No parental code set" Error
- This means you haven't set up a code yet
- Follow Step 2 above to set your initial code

### "Invalid code" Error
- Check that you're entering the correct code
- Make sure there are no extra spaces
- The code is case-sensitive

### Can't Unlock Controls
- Verify you're entering the correct code
- Make sure the code is at least 4 characters long
- Try refreshing the page and entering the code again

## Security Best Practices

1. **Choose a Strong Code:** Use a combination of letters and numbers
2. **Don't Share:** Keep your parental code private
3. **Change Regularly:** Update your code periodically for security
4. **Remember It:** Write it down in a secure place if needed

