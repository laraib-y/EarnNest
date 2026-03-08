**Live Demo:** https://earn-nest-j1qh.vercel.app/

## Inspiration
We kept noticing that most kids’ finance apps are essentially digital piggy banks with a parent dashboard. Apps like Greenlight and BusyKid focus on managing money kids already have, tracking allowances, controlling spending, and monitoring transactions.

But none of them actually focus on teaching kids what money means.

We all remembered being teenagers and realizing we had no idea what a credit score was, why saving mattered, or how interest works. Those concepts only became important once real financial decisions were already happening.

That felt like a fixable problem.

So we asked: what if financial literacy worked like Duolingo, small lessons, simple concepts, and habits built over time?

## What it does
Our app is a **financial literacy learning app** designed for **kids aged 9–12** that helps them build smart money habits in a fun and interactive way.

Kids learn important concepts like saving, budgeting, and making good spending choices through short lessons with our friendly mascot, Raven, who guides them through conversations and activities. 

Each lesson includes an engaging mini-game or story challenge so kids can practice what they learn in a playful way. 

The app also includes an AI helper that can answer questions and help kids plan and reach their financial goals. 

In Parent Mode, parents can view their child’s progress, approve goal requests, and assign chores or tasks, making it easy for families to connect real-world earning and saving with what kids learn in the app.

## Our approach
Most products in this space are wallets.

We built a **learning system**.

We focused on these key principles:
- Understanding first
- Kid-centered design
- Concept-based learning
- Habit-building interactions

Instead of focusing on transactions, our app introduces foundational ideas like needs vs. wants and saving toward a goal.

AI coaching then helps kids apply those concepts when making decisions about spending or saving.

## How we built it
We built a working prototype focused on a small but functional learning loop.

Two core learning modules were implemented:
1. Needs vs. Wants
  - Helps kids understand the difference between essential items and discretionary spending.
2. Saving & Budgeting
  - Allows kids to practice saving coins toward a goal and make simple budgeting decisions.

To support decision-making, we integrated the **Gemini API** to provide contextual guidance

Goal Coach: suggests ways to reach a savings goal faster based on current coins and available chores. This combination allows the app to connect concept learning with real decisions.

## Challenges we ran into
The biggest challenge was scope.

Our team started with many ideas including IOU systems, a credit simulation module, and a full parent reporting dashboard. As the project progressed, we had to narrow our focus and cut several features to ensure we could deliver a working prototype within the hackathon time frame.

Another challenge was coordinating work across design and development under tight time constraints. Splitting tasks required constant communication and quick hand-offs between teams.

Finally, the overnight schedule added a physical challenge. As the hours passed, fatigue became a factor, which made staying focused and productive more difficult.

## Accomplishments that we're proud of
Despite the time pressure, our team successfully delivered a working prototype with both learning modules and AI features.

We are especially proud of how the design and development teams collaborated. Even when tasks were split, we maintained communication and worked together to integrate features quickly. We also successfully implemented Gemini-powered coaching tools that connect learning concepts to real decisions.

Most importantly, we were able to deliver a functional MVP that demonstrates the core idea of the product.

## What we learned
One of the biggest lessons from this project was the importance of prioritizing a clear MVP.

At the beginning, it was easy to focus on ambitious features. But as time progressed, we learned to focus on the core experience that best demonstrated the idea.

We also learned how important communication is when working under tight deadlines. Frequent check-ins and quick adjustments helped keep the project moving forward.

Finally, we learned that even simple features can demonstrate a strong concept when they are implemented clearly and intentionally.

## What's next for EarnNest
### Investing Module
We designed wireframes and mockups for an investing module that introduces the idea of long-term money growth. This module was planned but ultimately cut due to time constraints.

### Credit System Module
Another future feature is a credit system simulation. This would help kids understand how borrowing works and how financial decisions can affect credit over time.

### Expanded Learning Path
Future versions would include additional modules covering topics such as investing, credit, and long-term financial planning.


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
