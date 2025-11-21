Commune-Level Field Survey App (C06) – README

Purpose: This Expo (React Native) mobile app enables commune police officers in Vietnam to perform field surveys of physical locations (houses, buildings, shops, infrastructure, etc.) as part of the National Location Identification System (C06). Officers can start a new survey, capture GPS coordinates, take photos of the location, enter object metadata, optionally draw a rough polygon boundary, review all inputs, and then submit the survey. The app works offline-first, storing all data locally (via SQLite or AsyncStorage) and then syncing to a Supabase backend when online. Data captured includes survey sessions, photos, GPS point, optional polygon, officer info, timestamps, and status.

Tech Stack: Expo (React Native), Supabase (PostgreSQL + PostGIS), Supabase Auth, Supabase Storage, Supabase Realtime.

Offline-first: All user actions (GPS capture, photo taking, data entry) update a local store instantly. When the device is online, local changes are synced to Supabase (with retry and conflict logic). This ensures the app “feels fast” and is reliable offline
docs.expo.dev
medium.com
.

Workflow: Login ➔ Dashboard ➔ Start Survey ➔ Capture GPS ➔ Take Photos ➔ Enter Object Info ➔ Draw Polygon ➔ Review & Submit ➔ Submission Success. Each step corresponds to a screen or UI action. The officer can also view History of past surveys and manage Settings. The app indicates Offline Mode when not connected.

Screens
Login Screen

Purpose: Authenticate the officer via Supabase Auth. Supports email/password or OTP login.

UI Components: Text inputs for Email or Phone, OTP/Password field, and Login button. (Optionally a toggle or separate view for OTP vs. password flow.)

User Actions: Enter credentials or request OTP, then tap Login. On success, navigate to Dashboard. On error, show message.

Data/Fields Captured:

Email/Phone (for Supabase Auth)

Password or OTP code.

Local vs Remote: Uses Supabase Auth client (supabase-js) to sign in. Session is persisted locally using expo-sqlite/AsyncStorage
docs.expo.dev
. No survey data is stored yet.

Supabase Schema: No dedicated table; Supabase Auth manages users. In the database we will link surveys to auth.uid() (officer’s UUID).

Offline Behavior: Must be online to authenticate. If offline, disable login or allow viewing cached History only.

Security: The Supabase anonymous key is used (safe due to RLS
docs.expo.dev
). All requests require valid session.

// Example supabase auth code (React Native):
const { data, error } = await supabase.auth.signInWithPassword({
  email: userEmail,
  password: userPassword
});
if (error) throw error;
// Or for OTP:
const { data, error } = await supabase.auth.signInWithOtp({
  phone: userPhone, 
  options: { /* channel: 'sms' */ }
});


(Supabase Auth handles email/password and OTP sign-in
supabase.com
supabase.com
.)

Dashboard Screen

Purpose: Main hub after login. Shows summary and navigation (start new survey, history, settings). Indicates online/offline status.

UI Components:

Header: Welcome message with officer’s name (from Auth profile or Officers table).

New Survey button to begin.

History button/link to past surveys.

Status Indicator: “Online” or “Offline” badge.

Offline Queue Count: (optional) count of pending surveys waiting to sync.

User Actions: Tap New Survey, History, or Settings.

Data/Fields Captured: None here; just navigation.

Local vs Remote: Reads officer profile (could be stored locally or fetched from Supabase) to display name. No writes except maybe local caching of user info.

Supabase Schema: Might fetch officers table or user metadata (e.g. name, rank). Use RLS so officer sees only own profile
supabase.com
.

Offline Behavior: If offline, disable New Survey? (We still allow starting a survey offline.) The status indicator clearly shows offline. History can show cached data.

Offline Caching: The app can cache list of past surveys locally (SQLite).

Start Survey Screen

Purpose: Begin a new survey session. Optionally select the type of object or assign an internal ID.

UI Components:

Drop-down or buttons for Object Type (e.g. House, Shop, Infrastructure).

Text field for Object Name/Code.

Button Capture GPS to record location.

Button Proceed to Photos (or it auto-advances after GPS).

User Actions: Select object type/name, then tap Capture GPS.

Fields Captured:

survey_id (temporary local ID),

object_type, object_name.

Local vs Remote: Store fields in local state or SQLite immediately. Will later sync to surveys table with officer_id, status, etc.

Supabase Schema: Will map to surveys table columns: object_type TEXT, object_name TEXT, etc.

Offline Behavior: Works offline; data saved locally until sync.

GPS Capture Screen

Purpose: Record precise latitude/longitude of the location.

UI Components:

A map view (optional) centered on device location.

Button Get Current Location.

Display of Latitude, Longitude, Accuracy.

Option to Re-capture or Adjust on Map (optional).

User Actions: Tap Get Location; optionally drag pin or recalc.

Fields Captured:

latitude, longitude, accuracy, timestamp.

Local vs Remote: Save the GPS point to local survey data. Later mapped to a PostGIS point column in Supabase (e.g. location GEOMETRY(Point,4326))
supabase.com
.

Supabase Schema: location GEOMETRY(Point,4326) or GEOGRAPHY(POINT,4326) column in surveys. Indexed with GIST
supabase.com
.

Offline Behavior: Absolutely offline-capable: use Expo Location to get coordinates and store locally.

Photo Capture Screen

Purpose: Take one or more photos of the surveyed object.

UI Components:

Camera preview (using expo-camera).

Button Capture Photo (camera shutter).

Thumbnails of captured photos.

Button Done to proceed.

User Actions: Capture photos (multiple). Each press takes a picture. Review or delete before continuing.

Fields Captured: For each photo:

Image file (URI/path).

Timestamp (when taken).

(Optionally) GPS point from photo EXIF or taken again.

Local vs Remote:

Locally: Save image URIs in local storage and record metadata in SQLite (e.g. a survey_media entry). The image itself can be saved to file system or AsyncStorage (but better the file system).

Remotely: On sync, upload images to Supabase Storage bucket and save reference URL or path in survey_media table.

Supabase Schema:

Table survey_media: columns id PK, survey_id FK, file_path TEXT, latitude FLOAT, longitude FLOAT, captured_at TIMESTAMPTZ.

Geospatial: Could also store location GEOMETRY(Point,4326) for where photo was taken (optional).

Offline Storage: Store photos in device filesystem (e.g. with FileSystem) and save paths in local DB
medium.com
. Avoid storing raw binary in DB (it bloat DB
medium.com
).

Upload on Sync: When online, read file URI, fetch blob/arrayBuffer, then call supabase.storage.from('photos').upload(path, data)
medium.com
. For example:

const response = await fetch(photoUri);
const blob = await response.blob();
const arrayBuffer = await new Response(blob).arrayBuffer();
const fileName = `photos/${surveyId}/${Date.now()}.jpg`;
const { error } = await supabase
    .storage
    .from('survey-photos')
    .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });


Supabase Storage snippet from example
medium.com
. After upload, save the fileName (or public URL) to survey_media.file_path.

Offline Behavior: Always allow taking photos offline; queue uploads for later.

Object Info Screen

Purpose: Enter descriptive metadata for the surveyed object.

UI Components: Form fields such as:

Owner Name/ID, Address, Legal Status, Notes.

Dropdowns for Usage Type, Construction Material, etc.

Button Next (to polygon) or Review.

User Actions: Fill in details.

Fields Captured: Each field maps to a column. E.g. owner_name TEXT, address TEXT, usage_type TEXT, notes TEXT.

Local vs Remote: Store values in local survey record. Later synced to surveys table columns.

Supabase Schema: Add these as columns on the surveys table (e.g. owner_name, address, usage_type).

Offline Behavior: Works offline; data saved in local DB.

Rough Polygon Screen

Purpose: Let officer draw an approximate boundary around the location (useful for areas).

UI Components:

Map with drawing tools (e.g. tap-to-add-vertex polygon).

Buttons Save Polygon or Clear.

User Actions: Tap on map to create polygon vertices. Finish with Save.

Fields Captured:

Array of coordinates (lat/lng pairs) defining polygon.

Local vs Remote: Store polygon coordinates locally. On sync, save to Supabase as a POLYGON geometry.

Supabase Schema:

Table polygons: id, survey_id (FK), boundary GEOMETRY(Polygon,4326). (Or include boundary column in surveys if only one polygon per survey.)

PostGIS supports Polygon type
supabase.com
.

Offline Behavior: Allow drawing offline; polygon saved locally as e.g. GeoJSON.

Review Screen

Purpose: Show a summary of all captured data for verification.

UI Components:

Display GPS coordinates, metadata fields, and photo thumbnails.

Display drawn polygon overlay (if any).

Buttons Edit (go back to relevant screen) and Submit.

User Actions: Verify that all data is correct. Tap Edit to revise (returns to that screen), or Submit to queue data for upload.

Data Behavior: When Submit is tapped:

Mark the survey’s status = 'pending' locally.

Enqueue the survey for sync (see Sync Queue below).

Move to Submission Success screen.

Supabase Schema: When actually syncing, insert into surveys table and related tables. Until then, data remains in local draft storage.

Submission Success Screen

Purpose: Confirm successful submission of the survey (or show error).

UI Components: Simple message “Survey submitted successfully” or “Error: …” with icon.

User Actions: Tap Done to return to Dashboard.

Data Behavior:

If online submission, remote API responded OK: mark survey status = 'synced'.

If offline or queued, just indicate queued and will sync later.

Show remaining offline queue count (optional).

History Screen

Purpose: List of past surveys (synced and pending).

UI Components:

List (scroll) of survey entries, showing date, object name, status (online/offline), maybe photo thumbnail.

Filters or tabs (e.g. All, Pending, Submitted).

User Actions: Tap an entry to view details (readonly) or to edit if still pending (opens Review/edit screens).

Data Behavior:

Data is fetched from local cache (for offline mode) and from Supabase when online.

Show most recent and allow pull-to-refresh (which triggers sync).

Supabase Schema: Query surveys where officer_id = auth.uid() (RLS ensures only own data)
supabase.com
.

Offline Behavior: Show local saved surveys. On reconnect, merge with server data.

Offline Mode Indicator

Purpose: Inform user the app is offline (no connectivity).

UI: Banner or icon at top (e.g. ⚠️ Offline).

Behavior:

When offline, automatically disable online-only actions (like real-time fetch).

Still allow all data entry; queue any network calls.

Settings Screen

Purpose: App settings and account management.

UI Components:

Officer Info (name, ID).

Sync Now button (manual sync trigger).

Sign Out button.

App version, About info.

User Actions: Sign out (clears session), force sync queue, etc.

Data: May clear local storage on sign-out.

Data Model & Supabase Schema

The backend (Supabase PostgreSQL) will have the following tables (with PostGIS extension enabled):

officers: Profiles for each officer (linked to Supabase Auth).

id UUID PRIMARY KEY (auth UID),

name TEXT, rank TEXT, etc.

RLS POLICY: e.g. USING ( auth.uid() = id ) so each user sees only their own row
docs.expo.dev
supabase.com
.

surveys: One row per survey session. Columns include:

id SERIAL PRIMARY KEY,

officer_id UUID REFERENCES officers(id) NOT NULL,

location GEOMETRY(Point, 4326), or GEOGRAPHY(Point,4326) for GPS
supabase.com
,

status TEXT (e.g. 'pending','synced'),

created_at TIMESTAMPTZ DEFAULT NOW(),

Object metadata: object_type TEXT, object_name TEXT, owner_name TEXT, address TEXT, usage_type TEXT, etc.

If drawing polygon is stored here: boundary GEOMETRY(Polygon, 4326) (PostGIS supports Polygon type
supabase.com
).

Alternatively store polygon in separate table (see below).

Index: GIST index on location for geo queries
supabase.com
.

survey_media: Photos per survey.

id SERIAL PRIMARY KEY,

survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,

file_path TEXT (path in Supabase Storage),

latitude DOUBLE PRECISION, longitude DOUBLE PRECISION (captured point),

captured_at TIMESTAMPTZ,

(Optionally) location GEOMETRY(Point,4326) for geotag.

polygons: (If separate table for polygons)

id SERIAL PRIMARY KEY,

survey_id INT REFERENCES surveys(id),

boundary GEOMETRY(Polygon, 4326).

Relations: One officer has many surveys. One survey has many survey_media. (One-to-many relations; enforce via FK.)

Enable PostGIS extension and run SQL to create these tables. For example
bootstrapped.app
supabase.com
:

-- Enable PostGIS (in Supabase SQL editor):
CREATE EXTENSION IF NOT EXISTS postgis;

-- Example surveys table:
CREATE TABLE public.surveys (
  id SERIAL PRIMARY KEY,
  officer_id UUID NOT NULL,
  location GEOMETRY(Point,4326),
  status TEXT,
  object_type TEXT,
  object_name TEXT,
  owner_name TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- GIST index for fast geo queries:
CREATE INDEX surveys_geo_idx ON public.surveys USING GIST(location);


(The above shows using GEOMETRY(Point) as in Supabase docs
supabase.com
. You may instead use GEOGRAPHY(Point,4326) depending on precision needs.)

Row Level Security (RLS): Enable RLS on tables to enforce that an officer only sees/edits their own data. E.g., ALTER TABLE surveys ENABLE ROW LEVEL SECURITY; CREATE POLICY "Officers can modify own surveys" ON surveys USING (auth.uid() = officer_id);
docs.expo.dev
supabase.com
. Do similarly for survey_media (matching survey’s officer_id) and polygons. Ensure only authenticated users with role “officer” can insert/select on their data.

Offline Caching & Sync Queue

Local Storage: Use a local database (SQLite via expo-sqlite or AsyncStorage) to cache surveys. For modest data, start with AsyncStorage; for larger or relational data, use SQLite
medium.com
. Store pending surveys in a local table (or JSON queue).

Image Storage: Store captured photos on the device filesystem (not in DB) to avoid bloating the DB
medium.com
. Save only file URIs/paths in SQLite.

Sync Queue: Implement a queue of “draft” surveys that need syncing. For example, on Submit, append the survey data to a local queue (in SQLite or AsyncStorage). Each queue item includes all fields and a retry count.

Background Sync: On app start and when network connectivity is detected, attempt to sync queued items. For each draft survey:

Upload Data: Insert the surveys row via Supabase client (supabase.from('surveys').insert(...)).

Upload Media: For each photo, convert the file to a blob/arrayBuffer and use supabase.storage.from(bucket).upload(...)
medium.com
. Then record its path in survey_media.

Upload Polygon: If applicable, include polygon (GeoJSON) in the insert, or insert into polygons table.

On Success: Mark item as synced (remove from queue, update status).

On Failure: If network error, leave in queue with retry count++. Use exponential backoff and drop very old entries
dev.to
.

Retry Logic: For robustness, implement exponential backoff and limits: e.g., retry max 5 times, give up after 72 hours
dev.to
. After each sync attempt, update the queue (remove success, keep/retry failures)
dev.to
.

Triggering Sync: After any successful upload or reconnection, trigger the sync function (possibly via NetInfo listener). Example:

async function syncQueue() {
  const queue = await getLocalQueue();
  for (let item of queue) {
    try {
      // Attempt upload of survey, photos, polygon...
    } catch (e) {
      // On network failure, break to retry later
      break;
    }
  }
  // Update local queue (remove succeeded, update retry counts):contentReference[oaicite:31]{index=31}.
}
// Run syncQueue() on app launch and on reconnection.


The concept of storing pending items and retrying when online is shown in
dev.to
dev.to
.

Supabase Realtime (optional): You may subscribe to realtime changes (e.g. other officers adding data) by supabase.from('surveys').on('INSERT', handler).subscribe(). Supabase provides real-time syncing on tables
docs.expo.dev
, which can be used to pull new data if needed.

File Upload (Supabase Storage)

Photos are uploaded to Supabase Storage. Setup a bucket (e.g. survey-photos) in the Supabase dashboard with appropriate RLS policies (public read or restricted to owners). In the app, after capturing a photo, upload it with:

// Assume supabase client is initialized (see Auth flow below)
const response = await fetch(imageUri);
const blob = await response.blob();
const arrayBuffer = await new Response(blob).arrayBuffer();
const fileName = `photos/${officerId}/${Date.now()}.jpg`;
const { data, error } = await supabase
  .storage
  .from('survey-photos')
  .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
if (error) { console.error(error); }
// Save data.path (file path) to `survey_media.file_path` in the DB:contentReference[oaicite:35]{index=35}.


This follows the pattern in an Expo Camera example
medium.com
. Metadata such as GPS and timestamp can be added to the DB record. After upload, you can get a public URL via supabase.storage.from('survey-photos').getPublicUrl(fileName) if needed.

Auth Flow (Supabase Auth)

Sign Up / Login: Officers authenticate via Supabase Auth. Use email/password or OTP (SMS) methods. For example, in React Native:

// Email/password sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: emailValue,
  password: passwordValue
});
// OTP sign in (will send SMS or email token)
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+841234567890'
});


(Supabase supports passwordless OTP as well
supabase.com
.)

Session Persistence: Initialize Supabase client with persistence (uses expo-sqlite/localStorage behind the scenes) so sessions survive restarts
docs.expo.dev
. E.g.:

import 'expo-sqlite/localStorage/install';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: localStorage, autoRefreshToken: true, persistSession: true }
});


This is safe because RLS is enabled
docs.expo.dev
.

State Listening: Subscribe to auth state changes (supabase.auth.onAuthStateChange) to update UI (logged in/out) and auto-refresh tokens
supabase.com
.

Logout: Call supabase.auth.signOut() to end session and clear local data.

Directory Structure

A suggested React Native project structure:

/src
  /components   # Reusable UI components
  /screens      # Screen components (Login, Dashboard, etc.)
  /navigation   # Navigation stack/setup (React Navigation)
  /services     # API clients, Supabase setup, sync logic
  /models       # Typescript interfaces or models (Survey, Photo, Officer)
  /store        # State management (e.g. Zustand slices or Redux reducers)
  /utils        # Utility functions (GPS, offline detection, etc.)
  /assets       # Static assets (images, icons)
  app.json      # Expo config
  package.json


/src/screens/ contains one screen per file, matching the names above.

/src/services/supabase.js: initializes and exports the Supabase client.

/src/services/sync.js: functions for managing the offline queue and syncing.

/src/store/: global state (e.g. with Redux or Zustand) holding current survey data and auth state.

State Management

Use a global state store to hold the current survey-in-progress and user info. Options include Zustand, Redux, or React Context. For example, using Zustand:

import create from 'zustand';

export const useSurveyStore = create((set) => ({
  currentSurvey: {}, 
  setCurrentSurvey: (survey) => set({ currentSurvey: survey }),
  // ... other state (authStatus, offlineQueueCount, etc.)
}));


This store can hold interim form data as user navigates screens. Alternatively, Redux Toolkit slices can be set up similarly. The store ties into screens via hooks and ensures data persists through navigation.

Security & RLS Policies

Row Level Security: Enable RLS on all tables. For example, on surveys run ALTER TABLE surveys ENABLE ROW LEVEL SECURITY; and create a policy like CREATE POLICY "Allow own surveys" ON surveys USING (auth.uid() = officer_id);
docs.expo.dev
supabase.com
. Do the same for survey_media and polygons, referencing the related survey’s officer_id.

Role Separation: Assign officers only the auth role by default. Admin roles (if any) could bypass RLS. Only allow insert/select on surveys for authenticated users.

Secure Storage: All uploads to Supabase Storage should be in buckets with RLS or restricted to certain prefixes, to prevent one officer from accessing another’s photos unless intended.

Citations

Offline-first data & persistence strategies
docs.expo.dev
medium.com

AsyncStorage vs. SQLite best practices
medium.com
medium.com

Expo SQLite for local-first apps
docs.expo.dev

Supabase Auth usage (signInWithPassword, signInWithOtp)
supabase.com
supabase.com

Supabase client setup in Expo (auth persistence, RLS)
docs.expo.dev
docs.expo.dev

Supabase Storage file upload example
medium.com

Offline sync queue pattern
dev.to
dev.to

PostGIS types (Point, Polygon) in Supabase
supabase.com
supabase.com

RLS importance (users can only access their own data)
supabase.com
docs.expo.dev

Each citation supports a key technical recommendation in this README. Ensure to follow the data shapes and flows exactly as described to implement the app correctly. Good luck with the implementation!