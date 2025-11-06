# Google Authentication Testing Guide

## ✅ Google Auth Implementation Status

Google Authentication is **fully implemented** and ready for testing.

### Implementation Details
- **Location**: `src/contexts/auth-context.tsx` (line 117-120)
- **Method**: Firebase Google Auth Provider with popup
- **Flow**: OAuth popup → User selects account → Profile created → Redirect to dashboard

## 🧪 Testing Google Authentication

### Step 1: Verify Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `studio-4485772157-5c03f`
3. Navigate to **Authentication → Sign-in method**
4. Verify **Google** is enabled
5. Check that support email is set

### Step 2: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `studio-4485772157-5c03f`
3. Navigate to **APIs & Services → OAuth consent screen**
4. Configure:
   - **User Type**: External (for public access)
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Scopes**: email, profile, openid (Firebase handles this)
   - **Test users**: Add test emails (if in testing mode)
5. Save and continue

### Step 3: Add Authorized Domains

1. In Firebase Console → Authentication → Settings
2. Under **Authorized domains**, add:
   - Your production domain (if deployed)
   - Your Vercel domain (e.g., `your-app.vercel.app`)
   - Keep `localhost` for development

### Step 4: Test Google Auth Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth`

3. Click "Sign In with Google" button

4. Expected behavior:
   - Google OAuth popup appears
   - You can select a Google account
   - After selection, popup closes
   - You are redirected to dashboard
   - User profile is created in Firestore

5. Verify in Firebase Console:
   - Go to Authentication → Users
   - Check that new user appears
   - Verify email and display name are correct

### Step 5: Test Google Auth in Production

1. Deploy to Vercel (or your hosting platform)

2. Navigate to your production URL

3. Test Google Auth:
   - Click "Sign In with Google"
   - Complete OAuth flow
   - Verify successful login

4. **Important**: If Google Auth fails in production:
   - Check authorized domains in Firebase Console
   - Verify OAuth consent screen is published (not in testing mode)
   - Check browser console for errors
   - Verify Firebase client config matches production domain

## 🔍 Troubleshooting

### Issue: "Popup blocked"
**Solution**: 
- Allow popups for your domain
- Check browser popup blocker settings

### Issue: "OAuth consent screen not configured"
**Solution**:
- Configure OAuth consent screen in Google Cloud Console
- Publish the app (not just testing mode)

### Issue: "Unauthorized domain"
**Solution**:
- Add your domain to Firebase authorized domains
- Wait a few minutes for changes to propagate

### Issue: "Account already exists"
**Solution**:
- This is normal if email was used for email/password signup
- User can link accounts in Firebase Console

## 📋 Checklist

- [ ] Google provider enabled in Firebase Console
- [ ] OAuth consent screen configured
- [ ] Authorized domains added
- [ ] Tested locally
- [ ] Tested in production
- [ ] User profile created correctly
- [ ] Mobile number dialog appears (if not set)
- [ ] User can access all features after Google login

## 🎯 Next Steps

After testing:
1. Monitor Firebase Console for new Google signups
2. Check for any errors in console
3. Verify user profiles are created correctly
4. Test mobile number collection for Google users
5. Consider adding more social login providers (optional)

---

## Quick Test Commands

```bash
# Test build
npm run build

# Start dev server
npm run dev

# Test Google Auth
# 1. Open http://localhost:3000/auth
# 2. Click "Sign In with Google"
# 3. Complete OAuth flow
# 4. Verify redirect to dashboard
```

