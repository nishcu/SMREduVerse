# Pre-Deployment Testing Checklist

## 1. Authentication Testing

### ✅ Google Authentication
- [ ] Click "Sign In with Google" button
- [ ] Select a Google account
- [ ] Verify user is redirected to dashboard
- [ ] Verify user profile is created in Firestore
- [ ] Verify user can access all protected routes
- [ ] Test logout functionality
- [ ] Test sign in again with same Google account

### ✅ Email/Password Signup
- [ ] Enter valid email (e.g., test@example.com)
- [ ] Enter valid password meeting all requirements:
  - [ ] At least 8 characters
  - [ ] One uppercase letter
  - [ ] One lowercase letter
  - [ ] One number
  - [ ] One special character
- [ ] Enter matching confirm password
- [ ] Verify form validation prevents submission with invalid data
- [ ] Submit form and verify account is created
- [ ] Verify mobile number dialog appears after signup
- [ ] Test skipping mobile number (optional)
- [ ] Test adding mobile number
- [ ] Verify user profile is created with all fields

### ✅ Email/Password Login
- [ ] Enter valid email and password
- [ ] Verify successful login
- [ ] Test with incorrect password (should show error)
- [ ] Test with non-existent email (should show error)
- [ ] Verify user is redirected to dashboard

### ✅ Password Validation
- [ ] Test password less than 8 characters (should fail)
- [ ] Test password without uppercase (should fail)
- [ ] Test password without lowercase (should fail)
- [ ] Test password without number (should fail)
- [ ] Test password without special character (should fail)
- [ ] Test password with all requirements (should pass)
- [ ] Verify real-time password strength indicator

### ✅ Email Validation
- [ ] Test invalid email formats (should show error)
- [ ] Test valid email format (should show success indicator)
- [ ] Test duplicate email signup (should show error)

### ✅ Mobile Number Collection
- [ ] Verify mobile number dialog appears after signup
- [ ] Test entering valid mobile number (10-15 digits)
- [ ] Test mobile number formatting
- [ ] Test skipping mobile number
- [ ] Verify mobile number is saved to user profile
- [ ] Verify mobile number can be updated later in profile

## 2. Core Features Testing

### ✅ User Profile
- [ ] View own profile
- [ ] Edit profile (name, bio, avatar, etc.)
- [ ] Verify profile updates are saved
- [ ] View other user profiles
- [ ] Test profile not found scenario

### ✅ Dashboard
- [ ] Verify dashboard loads correctly
- [ ] Check all navigation items are accessible
- [ ] Verify user data is displayed correctly

### ✅ Social Feed
- [ ] Create a new post
- [ ] View posts in "For You" tab
- [ ] View posts in "Following" tab
- [ ] View posts in "Trending" tab
- [ ] Like/unlike posts
- [ ] Comment on posts
- [ ] Verify comments display correctly
- [ ] Follow/unfollow users
- [ ] Verify notifications work

### ✅ Chat System
- [ ] Start a new chat with another user
- [ ] Send messages
- [ ] Verify online/offline status
- [ ] Verify read receipts (single/double tick)
- [ ] Verify typing indicators
- [ ] Verify unread message badges
- [ ] Test file/image uploads
- [ ] Verify notifications for new messages

### ✅ Games
- [ ] Play Memory Match game
- [ ] Play Sudoku game
- [ ] Verify each game starts fresh
- [ ] Verify games reset when reopened
- [ ] Test all game types

### ✅ Courses
- [ ] Browse courses
- [ ] Enroll in a course
- [ ] Access course content
- [ ] Create a course (if applicable)

### ✅ Challenges
- [ ] View all challenges
- [ ] Create a new challenge
- [ ] Join a challenge
- [ ] Update challenge progress
- [ ] View leaderboard

### ✅ AI Learning Feed
- [ ] View personalized recommendations
- [ ] Filter by type (Courses, Study Buddies, Content)
- [ ] Verify recommendations load correctly

### ✅ Marketplace
- [ ] Browse marketplace content
- [ ] Filter by subject and type
- [ ] Create marketplace content
- [ ] Purchase content
- [ ] Leave reviews
- [ ] View reviews

## 3. Error Handling

### ✅ Network Errors
- [ ] Test with slow network
- [ ] Test with no network (offline mode)
- [ ] Verify error messages are user-friendly

### ✅ Validation Errors
- [ ] Test form validation
- [ ] Verify error messages are clear
- [ ] Test edge cases

### ✅ Permission Errors
- [ ] Test accessing protected routes without auth
- [ ] Test accessing other users' private data
- [ ] Verify proper error messages

## 4. Performance Testing

### ✅ Page Load Times
- [ ] Dashboard loads quickly
- [ ] Social feed loads efficiently
- [ ] Chat messages load in real-time
- [ ] Games load without lag

### ✅ Real-time Updates
- [ ] Verify real-time chat updates
- [ ] Verify real-time notifications
- [ ] Verify real-time typing indicators
- [ ] Verify real-time online status

## 5. Mobile Responsiveness

### ✅ Mobile View
- [ ] Test on mobile device/browser
- [ ] Verify all features work on mobile
- [ ] Verify touch interactions work
- [ ] Verify responsive design

## 6. Security Testing

### ✅ Authentication Security
- [ ] Verify passwords are hashed (Firebase handles this)
- [ ] Verify JWT tokens are stored securely
- [ ] Test session expiration
- [ ] Verify logout clears all session data

### ✅ Data Security
- [ ] Verify Firestore security rules are active
- [ ] Test unauthorized data access
- [ ] Verify sensitive data is not exposed

## 7. Browser Compatibility

### ✅ Cross-Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

## 8. Google Auth Configuration

### ✅ Firebase Console Setup
- [ ] Go to Firebase Console → Authentication → Sign-in method
- [ ] Enable Email/Password provider
- [ ] Enable Google provider
- [ ] Configure OAuth consent screen:
  - [ ] Application name
  - [ ] Support email
  - [ ] Authorized domains
  - [ ] Privacy policy URL (if available)
  - [ ] Terms of service URL (if available)
- [ ] Add authorized domains:
  - [ ] Your production domain (e.g., yourdomain.com)
  - [ ] localhost (for development)
- [ ] Test Google OAuth flow

## 9. Production Readiness

### ✅ Environment Variables
- [ ] Verify all Firebase Admin SDK variables are set in Vercel
- [ ] Verify Firebase client config is correct
- [ ] Test environment-specific configurations

### ✅ Monitoring
- [ ] Set up error tracking (consider Sentry)
- [ ] Set up analytics (Firebase Analytics)
- [ ] Monitor Firebase Console for errors
- [ ] Monitor Vercel logs

### ✅ Documentation
- [ ] User documentation is available
- [ ] API documentation is up to date
- [ ] Deployment guide is complete

## 10. Post-Deployment Testing

### ✅ Smoke Tests
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test core features
- [ ] Verify no console errors
- [ ] Verify no build errors

### ✅ User Acceptance Testing
- [ ] Have real users test the application
- [ ] Collect feedback
- [ ] Fix critical issues

---

## Testing Notes

- **Test Account**: Create a test account for each authentication method
- **Test Data**: Use realistic but fake data for testing
- **Error Logging**: Monitor console and network tabs for errors
- **Performance**: Use browser DevTools to check performance
- **Security**: Test with different user roles if applicable

---

## Quick Test Commands

```bash
# Build test
npm run build

# Type check
npm run typecheck

# Lint check
npm run lint

# Start development server
npm run dev
```

