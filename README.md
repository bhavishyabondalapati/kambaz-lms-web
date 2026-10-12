# Kambaz LMS: Next.js frontend

## What it does

Kambaz is a Canvas-style learning management system. This repo is the **frontend**: a Next.js + React + Redux app where students see their courses, modules, and assignments and take timed, auto-graded quizzes, while faculty create and edit courses and build quizzes. It talks to a separate Express/MongoDB API (`kambaz-node-server-app`).

Built as a team final project for CS 5610 Web Development at Northeastern University (Fall 2025) by team members Bhavishya Bondalapati, Sree Deepya Bondalapati, and Mohana Harshita Rangubhotla.

## Tools and libraries

| Tool | Why |
|------|-----|
| **Next.js 15 (App Router)** | File-based routing: a folder like `Courses/[cid]/Quizzes` automatically becomes the URL `/Courses/CS101/Quizzes`. Nested `layout.tsx` files share navigation between pages. |
| **React 19 + TypeScript** | Component-based UI. TypeScript catches typos and wrong data shapes at build time. |
| **Redux Toolkit + react-redux** | One shared store for data many pages need (signed-in user, courses, enrollments, quizzes), so pages don't each re-fetch and get out of sync. |
| **axios** | HTTP client. `withCredentials: true` makes it send the session cookie to the API. |
| **Bootstrap + react-bootstrap** | Ready-made layout and form styling, so time went into features instead of CSS. |
| **react-icons** | Icon set for the navigation and control buttons. |
| **uuid** | Temporary IDs for items created in the browser before the server assigns a real one. |
| **Vitest** | Fast test runner that understands TypeScript with no setup. Used for the reducer unit tests. |

## File structure

The app has 150+ files, so this lists every folder plus the important files.

```
package.json                     Dependencies and scripts (dev, build, start, lint, test)
next.config.ts                   Next.js config (allowed external image domains)
tsconfig.json                    TypeScript settings
eslint.config.mjs                Lint rules
postcss.config.mjs               CSS processing config
.env.example                     Template: URL of the API server (copy to .env.local)
.gitignore                       Keeps node_modules, .next, and .env files out of git
__tests__/reducers.test.ts       Unit tests for the Redux reducers
public/images/                   Course card images and logos

app/layout.tsx                   Root HTML layout; loads Bootstrap CSS
app/globals.css                  Global styles
app/favicon.ico                  Browser tab icon
app/_page.tsx                    Unused Next.js starter page (underscore = not a route)

app/(Kambaz)/                    The LMS itself ("(Kambaz)" is a route group: it doesn't appear in URLs)
  page.tsx                       "/" redirects to the sign-in page
  layout.tsx                     Wraps every page in the Redux store, session check, and left nav bar
  Navigation.tsx                 Left sidebar: Account, Dashboard, Courses, Calendar, Inbox, Labs
  store.ts                       Creates the Redux store from all the reducers
  styles.css                     Kambaz-specific styles
  Database/                      Old static JSON from early assignments (before the API existed)

  Account/
    client.ts                    API calls: signin, signup, signout, profile, user CRUD
    reducer.ts                   Redux slice for the signed-in user
    Session.tsx                  On page load, asks the API "who am I?" and restores the session
    layout.tsx, Navigation.tsx   Account section layout and sub-navigation
    page.tsx                     Redirects to Profile or Signin depending on sign-in state
    Signin/, Signup/             Sign-in and sign-up forms
    Profile/                     View and edit your own profile
    Users/                       User table: search, filter by role, edit, delete (nav link shown only to admins)

  Dashboard/page.tsx             Your enrolled courses as cards; faculty can add/edit/delete courses
  Project/page.tsx               Team members page
  Calendar/, Inbox/              Placeholder pages from the course template

  Courses/
    client.ts                    API calls for courses, modules, assignments, enrollments
    reducer.ts                   Redux slice for the course list
    enrollmentsReducer.ts        Redux slice for enrollments
    [cid]/                       Everything inside one course ([cid] = course ID from the URL)
      layout.tsx                 Course header, breadcrumb, and course nav
      Navigation.tsx             Home, Modules, Assignments, Quizzes, Grades, People, ...
      Breadcrumb.tsx             "Course > Section" heading
      Home/                      Course home: modules plus a status sidebar
      Modules/                   Add, edit, and delete modules and lessons (Redux + API)
      Assignments/               Assignment list and the editor page ([aid])
      Quizzes/                   Quiz list, quiz details, editor, preview, take, and attempt review
        client.ts                Quiz CRUD API calls
        attemptClient.ts         Start an attempt, autosave answers, submit, fetch results
        reducer.ts               Redux slice for quizzes
        [qid]/editor/            Details tab (settings) and Questions tab (MC, true/false, fill-in-blank)
        [qid]/take/              Timed quiz-taking page with autosave
        [qid]/attempt/[attemptId]/ Graded results for one attempt
      People/                    Course roster table and a user-details side panel
      Grades/, Piazza/, Zoom/    Simple pages from the course template

app/Labs/                        Weekly course labs (Lab1–Lab5): HTML, CSS, React state, Redux, HTTP
```

## Setup

You need **Node.js 20+**. The API server (`kambaz-node-server-app`) must be set up and seeded first; see its README.

```bash
npm install
cp .env.example .env.local     # points the app at http://localhost:4000
```

> This is a JavaScript project, so it doesn't need a conda environment. Packages install into the project's own `node_modules/` folder.

## How to run

Start the API server first (in its own folder: `npm start`), then:

```bash
npm run dev
```

Open http://localhost:3000 and sign in as student `dark_knight` / `wayne123` or faculty `iron_man` / `stark123`. The seeded **React JS** course has a demo quiz under *Quizzes*.

**Run the tests:**

```bash
npm test
```

**Production build:**

```bash
npm run build && npm start
```

## How it was built

1. **Labs 1–3:** HTML, CSS, Bootstrap, and React components, then laid out the Kambaz screens (dashboard, course pages, navigation) with static data.
2. **Lab 4 / Assignment 4:** added React state and Redux Toolkit. Courses, modules, and assignments became editable in a shared store.
3. **Assignment 5:** replaced the static JSON with API calls through axios `client.ts` files, and added sign-in with sessions (`Session.tsx`).
4. **Assignment 6:** the API moved to MongoDB. The frontend added enrollments, the People table, and admin user management.
5. **Final project (quizzes):** quiz list, details/settings editor, question editor for three question types, a timed quiz-taking flow with autosave, and a graded results page.
6. **Deployment:** Vercel (frontend) + Render (API) + MongoDB Atlas.
7. **Clean-up (Oct 2026):** default API URL so a fresh clone works, `.env.example`, reducer unit tests, and this README.

## Key concepts (interview prep)

- **File-based routing and dynamic segments:** `Courses/[cid]/Quizzes/[qid]/page.tsx` handles every course/quiz combination. The values in brackets come from the URL.
- **Nested layouts:** `layout.tsx` files wrap all pages below them, so the course navigation renders once and stays in place as you move between course pages.
- **Client vs. server components:** pages that use state, effects, or Redux are marked `"use client"` because they run in the browser.
- **Redux data flow:** a component *dispatches* an action, the reducer (a pure function) returns new state, and components *subscribed* with `useSelector` re-render. Pure reducers are easy to unit test (see `__tests__`).
- **Talking to an API:** each feature has a `client.ts` that wraps axios calls, so components never build URLs themselves. `withCredentials: true` sends the session cookie.
- **Session restore:** `Session.tsx` calls `/api/users/profile` on load, so a page refresh keeps you signed in.
- **Environment variables in Next.js:** only variables prefixed `NEXT_PUBLIC_` reach the browser, and they're baked in at build time, so changing the API URL on Vercel requires a redeploy.
- **Autosave with debouncing:** the quiz page waits briefly after you stop typing before saving an answer, so it doesn't send a request on every keystroke.
