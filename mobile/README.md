# Team Calendar — Mobile Edition

IMPORTANT: DOWNLOAD LINK: https://expo.dev/artifacts/eas/bPY-nD2VtvMJ26ItDCAKGKdgTXf-fDsycqkJiSKzmDs.aab

An Expo (React Native) client for the existing MERN backend, living alongside `web/` in this
same repo. It talks to the exact same Express API on your droplet — no backend changes are
required for it to work.

## What's different from the web app (on purpose)

1. **Athletes no longer tap a tiny calendar cell to log a task.** The mobile app opens straight
   to a scrollable list of tasks (Today / This Week / All), each a full-width card you can't
   mis-tap. Tapping a card opens one screen with one job: enter minutes, hit **Mark Complete**.
2. **Coaches now get an ID for every assignment.** Both the "Assign Exercise" confirmation and
   every row in "Team Progress" show a short, tappable **Assignment ID** chip (last 6 characters
   of the database ID). Tapping it copies the full ID to the clipboard, so a coach has something
   concrete to reference ("assignment 4F2A1C") instead of just a name + due date.

## Feature coverage

**Auth (anyone):** sign in, create a new account (Coach or Athlete), request a password reset
email, and reset a password using the token from that email.

**Coach:**
- **Assign** — pick an exercise + athlete + due date, assign to one athlete or the whole team
- **Progress** — view each athlete's assignments, see completion status, delete an assignment
- **Team** — add an athlete to the team by email, remove an athlete
- **Exercises** — create a new exercise, delete an existing one
- **Games** — create a game date/location, delete a game

**Athlete:**
- **Tasks** — see assignments due today/this week/all, log minutes to mark one complete
- **Meals** — log a meal, edit or delete a logged meal, browse day by day
- **Games** — view the team's upcoming game schedule (read-only)

## Project layout

```
mobile/
  App.js                     entry point
  app.json                   Expo config (API URL lives in extra.apiUrl)
  src/
    api/                     axios calls — same endpoints as web/src/api
    context/AuthContext.js   token/user persisted with AsyncStorage
    navigation/RootNavigator.js
    screens/
      LoginScreen, SignupScreen, ForgotPasswordScreen, ResetPasswordScreen
      AthleteTasksScreen, TaskDetailScreen, AthleteMealsScreen, AthleteGamesScreen
      CoachAssignScreen, CoachProgressScreen, CoachTeamScreen,
      CoachExercisesScreen, CoachGamesScreen
    components/              TaskCard, IdChip
```

## Known limitation (unchanged from before)

Password reset emails link to the *web* app's URL (`CLIENT_URL` in the backend `.env`), since
this mobile app doesn't have a deep link registered for that URL yet. The mobile Reset Password
screen asks you to paste the token from the end of that link rather than opening it
automatically — wiring up `expo-linking` for that URL is the natural next step.

## 1. Install prerequisites (Windows)

1. **Node.js LTS** — download from nodejs.org and install. Verify in PowerShell:
   ```powershell
   node -v
   npm -v
   ```
2. **Expo Go** on your Android phone — install it from the Google Play Store.
3. **Expo CLI** is used via `npx`, so nothing global to install.
4. Make sure your **Windows PC and Android phone are on the same Wi-Fi network** (this is the
   easiest way to connect them; see the tunnel fallback below if that's not possible).

## 2. Install dependencies

Open PowerShell in the project folder:

```powershell
cd calendar\mobile
npm install
```

This pulls in Expo, React Navigation, AsyncStorage, the date/picker components, axios, etc. from
`package.json`.

## 3. Point the app at your backend

By default `app.json` has:

```json
"extra": { "apiUrl": "https://cop4331-9.com/api" }
```

- **Testing against the live droplet** — do nothing, this already works, since your phone just
  needs internet access, not the same network as the backend.
- **Testing against a backend running locally on your Windows PC** — you can't use `localhost`
  from the phone (that means the phone itself). Instead:
  1. Find your PC's LAN IP: `ipconfig` → look for "IPv4 Address" (e.g. `192.168.1.42`).
  2. Start the backend as usual (`npm start` in the repo root) — Express already listens on
     `0.0.0.0` by default, so it's reachable on your LAN IP.
  3. Set the API URL for this session instead of editing `app.json`:
     ```powershell
     $env:EXPO_PUBLIC_API_URL="http://192.168.1.42:5000/api"
     npx expo start
     ```
  4. Make sure Windows Firewall allows inbound connections on that port (Windows will usually
     prompt you the first time Node listens on it — allow it for Private networks).

## 4. Start the dev server and open it on your phone

```powershell
npx expo start
```

This opens a terminal UI with a QR code.

- **On the same Wi-Fi (recommended):** open the **Expo Go** app on your Android phone and use
  its "Scan QR code" option to scan the code from the terminal/browser window. The app bundles
  and loads over your LAN.
- **If the phone and PC can't share a network** (e.g. campus Wi-Fi that isolates clients, or a
  work VPN on the PC): press `s` in the Expo CLI to switch connection mode to **Tunnel**, or
  start directly with:
  ```powershell
  npx expo start --tunnel
  ```
  This routes the connection through Expo's tunneling service instead of your LAN, which is
  slower but works across separate networks.

## 5. Sign in and test both roles

Use the same accounts you already use on the web app (signup/login share the same `User`
collection) — one Coach account, one Athlete account on that coach's team.

**As the Athlete:**
- Land on **Tasks**, confirm assignments show up in Today / This Week / All.
- Tap a card → enter minutes → **Mark Complete** → confirm it flips to "✓ Done" back on the list.

**As the Coach:**
- **Assign** tab: pick an exercise, pick an athlete, pick a due date, tap **Assign to Selected
  Athlete** → confirm the green box shows a new **Assignment ID** chip; tap it and confirm a
  "Copied full ID" hint appears.
- **Progress** tab: tap an athlete's name, confirm each assignment row shows its own ID chip,
  and that deleting an assignment removes it from the list.

## Troubleshooting

- **"Network request failed" on the phone:** almost always a networking issue, not a code
  issue — check that the phone can reach the exact URL in `EXPO_PUBLIC_API_URL` in its own
  browser first; if it can't load that URL from the phone's browser, Expo won't be able to
  either. Fall back to `--tunnel` or to the live droplet URL to isolate the problem.
- **Metro bundler stuck / stale cache:** `npx expo start -c` clears the bundler cache.
- **Picker or DateTimePicker fails to load:** these are native modules; they only work inside
  Expo Go or a real build, not in a plain web browser preview.
