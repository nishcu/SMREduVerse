# Public Deployment Guide

## Pre-Deployment Checklist

### 1. ✅ Authentication Setup

#### Google Authentication
- **Status**: ✅ Implemented
- **Location**: `src/contexts/auth-context.tsx`
- **Action Required**:
  1. Go to [Firebase Console](https://console.firebase.google.com)
  2. Select your project
  3. Navigate to **Authentication → Sign-in method**
  4. Enable **Google** provider
  5. Configure OAuth consent screen:
     - Application name: Your app name
     - Support email: Your support email
     - Authorized domains: Add your production domain
  6. Add authorized domains:
     - Your production domain (e.g., `yourdomain.com`)
     - `localhost` (for development)

#### Email/Password Authentication
- **Status**: ✅ Enhanced with validation
- **Features**:
  - ✅ Email format validation
  - ✅ Password strength requirements (8+ chars, uppercase, lowercase, number, special char)
  - ✅ Password confirmation matching
  - ✅ Real-time validation feedback
  - ✅ Mobile number collection after signup

### 2. ✅ Enhanced Signup Features

#### Email Validation
- Real-time email format validation
- Clear error messages
- Visual feedback (green checkmark for valid email)

#### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Real-time password strength indicator
- Password confirmation matching

#### Mobile Number Collection
- Dialog appears after successful signup
- Mobile number validation (10-15 digits)
- Optional (users can skip)
- Can be updated later in profile
- Formatted display (e.g., +1 555-123-4567)

### 3. Environment Variables Setup

#### Required in Vercel:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

#### Firebase Client Config:
Verify in `src/lib/firebase.ts` that your Firebase config is correct:
```typescript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### 4. Firebase Console Configuration

#### Authentication Settings:
1. **Sign-in methods**:
   - ✅ Email/Password: Enabled
   - ✅ Google: Enabled and configured

2. **Authorized domains**:
   - Add your production domain
   - Keep `localhost` for development

3. **OAuth consent screen** (for Google):
   - Application name
   - Support email
   - Privacy policy URL (recommended)
   - Terms of service URL (recommended)

### 5. Security Checklist

- ✅ Firestore Security Rules configured
- ✅ Server-side validation with Zod
- ✅ Client-side form validation
- ✅ Password strength requirements
- ✅ Email validation
- ⚠️ **Recommended**: Email verification (to be implemented)
- ⚠️ **Recommended**: Rate limiting for auth endpoints
- ⚠️ **Recommended**: CAPTCHA for signup (to prevent spam)

## Deployment Steps

### Step 1: Build and Test Locally

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test the build
npm start
```

### Step 2: Deploy to Vercel

```bash
# If not already connected to Vercel
vercel login
vercel link

# Deploy to production
vercel --prod
```

Or push to main branch if auto-deployment is enabled.

### Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Go to **Project Settings → Environment Variables**
2. Add all required Firebase variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
3. **Important**: For `FIREBASE_PRIVATE_KEY`:
   - Remove surrounding quotes
   - Use actual newlines (`\n`) not escaped newlines (`\\n`)
   - Example: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n`
4. Redeploy after adding variables

### Step 4: Update Firebase Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Under "Authorized domains", click "Add domain"
3. Add your production domain (e.g., `yourdomain.vercel.app` or your custom domain)
4. Save changes

### Step 5: Update Firebase Client Config (if needed)

If your `authDomain` needs to change, update `src/lib/firebase.ts`:
```typescript
authDomain: "your-project.firebaseapp.com" // or your custom domain
```

## Post-Deployment Testing

### Test Checklist:
1. ✅ Test Google Authentication
   - Click "Sign In with Google"
   - Verify OAuth flow works
   - Verify user profile is created

2. ✅ Test Email/Password Signup
   - Enter valid email
   - Enter strong password (meeting all requirements)
   - Verify password validation works
   - Verify account is created
   - Verify mobile number dialog appears

3. ✅ Test Email/Password Login
   - Login with created account
   - Verify successful authentication

4. ✅ Test Mobile Number Collection
   - Complete signup
   - Enter mobile number
   - Verify number is saved
   - Test skipping mobile number

5. ✅ Test Core Features
   - Dashboard loads
   - Social feed works
   - Chat system works
   - All features are accessible

## Monitoring and Maintenance

### Firebase Console
- Monitor Authentication → Users for new signups
- Monitor Firestore usage
- Check for any errors or warnings

### Vercel Dashboard
- Monitor deployment logs
- Check for build errors
- Monitor performance metrics

### Recommended Tools
- **Error Tracking**: Consider Sentry for production error tracking
- **Analytics**: Firebase Analytics for user behavior
- **Performance**: Vercel Analytics for performance monitoring

## User Communication

### Email Verification (Future Enhancement)
Consider implementing email verification:
1. Send verification email after signup
2. Require email verification before full access
3. Provide resend verification email option

### Password Reset
Already implemented via Firebase:
- Users can reset password from login page
- Firebase handles password reset emails

## Security Best Practices

1. **Rate Limiting**: Consider implementing rate limiting for auth endpoints
2. **CAPTCHA**: Add reCAPTCHA to prevent automated signups
3. **Email Verification**: Require email verification for new accounts
4. **Password Policy**: Already implemented (strong password requirements)
5. **Session Management**: Firebase handles session management securely
6. **HTTPS**: Always use HTTPS in production (Vercel handles this)

## Support and Documentation

### User Documentation
- Create user guide for signup process
- Document password requirements
- Explain mobile number collection (optional)

### Admin Documentation
- Document admin features
- Document user management
- Document monitoring procedures

---

## Quick Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Firebase Google OAuth configured
- [ ] Firebase authorized domains updated
- [ ] Build passes locally (`npm run build`)
- [ ] All tests pass
- [ ] Deployed to production
- [ ] Tested Google authentication
- [ ] Tested email/password signup
- [ ] Tested mobile number collection
- [ ] Verified all features work
- [ ] Monitoring set up
- [ ] Error tracking configured

---

## Troubleshooting

### Google Auth Not Working
- Check Firebase Console → Authentication → Sign-in method → Google
- Verify OAuth consent screen is configured
- Check authorized domains include your production domain
- Verify Firebase client config is correct

### Email Validation Not Working
- Check browser console for errors
- Verify form validation is enabled
- Test with different email formats

### Mobile Number Dialog Not Appearing
- Check if user profile is created successfully
- Verify `mobileNumber` field exists in User type
- Check browser console for errors
- Test with different browsers

### Build Errors
- Check `npm run build` locally
- Verify all dependencies are installed
- Check TypeScript errors
- Review Vercel build logs

---

## Next Steps After Deployment

1. Monitor user signups
2. Collect user feedback
3. Monitor error logs
4. Track performance metrics
5. Plan for email verification feature
6. Consider implementing CAPTCHA
7. Set up automated backups
8. Plan for scaling
