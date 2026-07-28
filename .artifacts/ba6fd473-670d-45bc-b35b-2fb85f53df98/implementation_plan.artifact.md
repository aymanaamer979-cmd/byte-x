# Project Checkup and Optimization Plan

Based on the review of the project files, the website is well-structured using a modern stack:
- **Frontend**: React (Vite) with Tailwind CSS.
- **Backend**: Express (Node.js) adapted for Vercel Serverless Functions.
- **Database**: MongoDB Atlas via Mongoose.
- **Authentication**: Firebase (Frontend) and Firebase Admin SDK (Backend).

The following plan outlines the findings and proposed improvements to ensure security, maintainability, and correct deployment on Vercel.

## User Review Required

> [!IMPORTANT]
> **Duplicate Entry Points**: There are duplicate files for the app entry point (`App.tsx`/`main.tsx` vs `App.jsx`/`main.jsx`). The `.jsx` files appear to contain the actual logic, while the `.tsx` files are placeholders. These should be merged or cleaned up.
>
> **Hardcoded MongoDB URI**: The MongoDB connection string is currently hardcoded in `backend/config/db.ts`. This should be moved to a Vercel environment variable for security.

## Open Questions

- Should I proceed with deleting the placeholder `.tsx` files in the `src` directory?
- Would you like me to update the `.env.example` file to include all required variables for local development?

## Proposed Changes

### Configuration & Security

#### [MODIFY] [db.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/db.ts)
- Priority to `process.env.MONGODB_URI`.
- Ensure fallback is only used in development or removed entirely.

#### [MODIFY] [firebase.ts](file:///C:/Users/alfaa/Desktop/getProject/backend/config/firebase.ts)
- Add logic to check for `serviceAccountKey.json` locally if `process.env.FIREBASE_SERVICE_ACCOUNT` is missing, similar to `set-admin.js`.

#### [MODIFY] [.env.example](file:///C:/Users/alfaa/Desktop/getProject/.env.example)
- Add `MONGODB_URI`, `FIREBASE_SERVICE_ACCOUNT`, and other necessary environment variables.

### Cleanup

#### [DELETE] [App.tsx](file:///C:/Users/alfaa/Desktop/getProject/src/App.tsx)
#### [DELETE] [main.tsx](file:///C:/Users/alfaa/Desktop/getProject/src/main.tsx)

## Verification Plan

### Manual Verification
- Verify the API connection via the `/api/debug/config-check` endpoint.
- Confirm that authentication works by logging in via the frontend.
- Check that the user is correctly synced to MongoDB after login.
