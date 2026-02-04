# Following/Followers System & Universal Search Guide

## Following/Followers System

### How It Works

The following/followers system allows users to:
- **Follow** other users (students, tutors, partners)
- **Unfollow** users they're following
- View their **followers** (people following them)
- View their **following** list (people they're following)
- See follower/following counts on profiles

### Features

1. **Follow/Unfollow Actions**
   - Click "Follow" button on any user profile
   - Button changes to "Following" when you follow someone
   - Click again to unfollow
   - Follow status is checked automatically when viewing profiles

2. **Followers Page** (`/profile/[uid]/followers`)
   - Shows all users following a specific user
   - Displays user cards with avatars, names, usernames, and bios
   - Allows you to follow/unfollow directly from the followers list
   - Shows follow status for each user

3. **Following Page** (`/profile/[uid]/following`)
   - Shows all users that a specific user is following
   - Displays user cards with avatars, names, usernames, and bios
   - Allows you to follow/unfollow directly from the following list
   - Shows follow status for each user

4. **Profile Header**
   - Shows follower and following counts
   - Clickable links to view followers/following lists
   - Follow/Unfollow button (if viewing someone else's profile)
   - Real-time follow status updates

5. **Notifications**
   - Users receive notifications when someone follows them
   - Notification type: `new_follower`

### Data Structure

**Following Relationship:**
- Stored in: `users/{userId}/following/{targetUserId}`
- Contains: `userId`, `createdAt`

**Followers Relationship:**
- Stored in: `users/{userId}/followers/{followerId}`
- Contains: `userId`, `createdAt`

**User Profile:**
- `followersCount`: Number of followers
- `followingCount`: Number of users being followed

### How to Use

1. **To Follow Someone:**
   - Go to their profile page
   - Click the "Follow" button
   - Button will change to "Following"
   - They'll receive a notification

2. **To Unfollow Someone:**
   - Go to their profile page
   - Click the "Following" button
   - Button will change to "Follow"

3. **To View Followers:**
   - Go to any user's profile
   - Click on the "X Followers" link
   - View the list of followers

4. **To View Following:**
   - Go to any user's profile
   - Click on the "X Following" link
   - View the list of users they're following

## Universal Search System

### How It Works

The universal search allows users to search for **anything** in the application:
- Users (including tutors)
- Courses
- Posts
- Challenges
- Contests
- Marketplace content
- Partners (schools, colleges, universities)
- Study Rooms

### Features

1. **Global Search Bar**
   - Located in the header/navigation
   - Search as you type (debounced)
   - Shows results in a dropdown
   - Organized by content type

2. **Search Results Display**
   - Results are grouped by type:
     - 👥 **Users**: Name, username, avatar
     - 📚 **Courses**: Title, description
     - 💬 **Posts**: Content, author
     - 🎯 **Challenges**: Title, description
     - 🏆 **Contests**: Title, description
     - 🛒 **Marketplace**: Title, price
     - 🏫 **Partners**: Name, type, location
     - ⚡ **Study Rooms**: Name, subject/description

3. **Search Functionality**
   - Searches across multiple fields:
     - **Users**: name, username, bio, email
     - **Courses**: title, description
     - **Posts**: content, title
     - **Challenges**: title, description
     - **Contests**: title, description
     - **Marketplace**: title, description, category
     - **Partners**: name, description, location, type
     - **Study Rooms**: name, description, subject

4. **Performance**
   - Limits results per category (5 results each)
   - Debounced search (300ms delay)
   - Shows loading indicator while searching
   - Closes on navigation

### How to Use

1. **To Search:**
   - Click on the search bar in the header
   - Type your search query (minimum 2 characters)
   - Results appear automatically as you type
   - Click on any result to navigate to it

2. **Search Tips:**
   - Search by name, username, or email for users
   - Search by title or description for content
   - Search by category for marketplace items
   - Search by location or type for partners

### Search Locations

The universal search is available:
- In the header/navigation bar (GlobalSearch component)
- Works across all pages
- Accessible from anywhere in the application

### Technical Details

**Search Action:**
- Location: `src/app/(app)/actions.ts`
- Function: `searchAction(query: string)`
- Searches across all collections in parallel
- Returns results grouped by type

**Search Component:**
- Location: `src/components/global-search.tsx`
- Client-side component
- Debounced input handling
- Popover display for results

**Collections Searched:**
1. `users/{userId}/profile` - User profiles
2. `courses` - Course listings
3. `posts` - Social media posts
4. `challenges` - Learning challenges
5. `contests` - Contests
6. `marketplace` - Marketplace content
7. `partners` - Partner institutions
8. `study-rooms` - Study rooms

### Future Enhancements

For production, consider:
- Using a dedicated search service (Algolia, MeiliSearch, Elasticsearch)
- Full-text search capabilities
- Search filters (by type, date, etc.)
- Search history
- Popular searches
- Search suggestions/autocomplete

## Summary

Both systems are now fully functional:

✅ **Following/Followers System:**
- Follow/unfollow users
- View followers and following lists
- Real-time follow status
- Notifications for new followers

✅ **Universal Search:**
- Search across all content types
- Real-time results as you type
- Organized by content type
- Accessible from anywhere

Both features enhance user engagement and make the platform more discoverable and social!

