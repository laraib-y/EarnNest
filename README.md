# EarnNest Starter

This is a mobile-first Next.js starter for your parent-child financial literacy app. It uses:

- Next.js App Router route handlers for backend APIs
- Firebase Authentication for parent Google sign-in
- Cloud Firestore for families, children, chores, completions, and reports
- Signed child session cookies for kid mode
- Gemini API for dynamic parent conversation prompts

## What is already working

- Parent signs in with Google
- Parent account is bootstrapped into a family record
- Parent can create child profiles with a temporary 4-digit PIN
- App generates a kid access code
- Parent can create chores for a child
- Child can log in with access code + PIN
- Child can mark chores as done
- Parent can approve or reject completed chores
- Approved chores update the child coin balance and streak
- Parent report endpoint aggregates totals
- Gemini endpoint can generate a money conversation prompt

## Firestore shape

- `parents/{parentUid}`
- `families/{familyId}`
- `families/{familyId}/children/{childId}`
- `families/{familyId}/chores/{choreId}`
- `families/{familyId}/completions/{completionId}`
- `childAccessCodes/{accessCode}`

## Setup

1. Create a Firebase project.
2. Add a Web App in Firebase.
3. Enable **Authentication -> Sign-in method -> Google**.
4. Enable **Cloud Firestore** in production or test mode.
5. Create a Firebase service account key.
6. Copy `.env.example` to `.env.local` and fill in every value.
7. Install packages:

```bash
npm install
```

8. Run the dev server:

```bash
npm run dev
```

9. Open `http://localhost:3000`.

## Recommended Firebase console steps

### Authentication
Enable Google sign-in because parents are using Google authentication.

### Firestore
Create the database. The app writes collections automatically.

### Service account
Use a service account because the Next.js route handlers verify Firebase ID tokens and write to Firestore server-side.

## Important notes

- The child personalization flow is only partially scaffolded. The route/session system is ready, but the first-login UI still needs to be expanded.
- Coin allocation into save/spend/share is represented in the schema but not fully implemented in the UI yet.
- Learning modules are scaffolded as static metadata for now.
- Firestore rules are locked down because this starter expects all data writes to go through the server route handlers.

## Suggested next steps

1. Add parent and kid logout endpoints.
2. Add first-login kid personalization screen.
3. Add coin allocation API and UI.
4. Add module completion + quiz results storage.
5. Add push notifications or parent in-app notification badges.
6. Add responsive polish and your final visual design.
