# LocationID Tracker (C06) - Implementation Tasks

This file tracks the incremental implementation of the Commune-Level Field Survey App based on README.md requirements.

## Task Organization

Tasks are organized by category with IDs like (1.1), (1.2), etc.
- [ ] = Pending
- [x] = Completed

---

## 1. Foundation & Design System

### 1.1 Theme & Design Tokens
- [x] (1.1.1) Review and enhance theme/index.ts with gradient definitions matching HTML mockups
  - NOTE: Created theme/gradients.ts with React Native-friendly gradient configs using expo-linear-gradient format
  - Includes primary, secondary, accent, hero, button, and background gradients matching HTML mockups
- [x] (1.1.2) Add typography scale (H1: 20-24px bold, H2: 18-20px, H3: 16-18px, body: 14-16px, labels: 12-14px)
  - NOTE: Updated theme/typography.ts to match README specs exactly:
    - H1: 24px bold, H2: 20px bold
    - H3: 18px semibold, H4: 16px semibold
    - Body: 16px (standard), 14px (small)
    - Labels: 14px semibold
    - Captions/chips: 12px
    - Buttons: 16px (primary), 14px (secondary)
- [x] (1.1.3) Define spacing tokens (ensure padding >= 16-20px for cards)
  - NOTE: Already implemented in theme/spacing.ts with base:16, lg:20, xl:24, etc.
- [x] (1.1.4) Define shadow styles (soft shadows for cards, strong for primary buttons)
  - NOTE: Already implemented in theme/spacing.ts with sm, md, lg, xl variants plus color-specific shadows
- [x] (1.1.5) Add borderRadius tokens (20-24 for cards, 16-20 for buttons)
  - NOTE: Already implemented in theme/spacing.ts with 2xl:20, 3xl:24 for cards, xl:16 for buttons
- [x] (1.1.6) Define gradient presets (dark green → light green for headers/heroes)
  - NOTE: Implemented in theme/gradients.ts with all gradient variants from design

### 1.2 Core UI Components
- [ x] (1.2.1) Create/enhance GradientHeader component (with shield badge, officer name, settings icon)
- [ x] (1.2.2) Create/enhance PrimaryButton component (gradient bg, icon+text, min height 48px, text wrapping)
- [ x] (1.2.3) Create/enhance SecondaryButton component (outlined/soft solid)
- [ x] (1.2.4) Create/enhance Card component (rounded corners, shadow, generous padding)
- [ x] (1.2.5) Create StatusBadge component (online/offline indicator with colored dot)
- [ x] (1.2.6) Create StatusChip component (for survey status: Synced/Pending)
- [ x] (1.2.7) Create ListItem component (for unsynced surveys with icon, text, chevron)
- [ x] (1.2.8) Create OfflineBanner component (subtle banner for offline mode)
- [ x] (1.2.9) Create GradientHero component (for login/splash screens)
- [ x] (1.2.10) Create SectionTitle component (for screen section headers)

---

## 2. Navigation Structure

### 2.1 Navigation Setup
- [ ] (2.1.1) Set up React Navigation stack structure
- [ ] (2.1.2) Define navigation types for all screens
- [ ] (2.1.3) Configure safe area handling for notch/home indicator
- [ ] (2.1.4) Set up auth flow navigation (login vs authenticated stack)

---

## 3. State Management

### 3.1 Survey State
- [ ] (3.1.1) Create useSurveyStore with Zustand (currentSurvey, draft survey data)
- [ ] (3.1.2) Add local persistence for survey drafts (AsyncStorage)
- [ ] (3.1.3) Implement survey step navigation state

### 3.2 Sync State
- [ ] (3.2.1) Create useSyncStore for managing unsynced surveys queue
- [ ] (3.2.2) Add network state detection (NetInfo integration)
- [ ] (3.2.3) Implement sync queue persistence

### 3.3 Settings State
- [ ] (3.3.1) Create useSettingsStore for app preferences
- [ ] (3.3.2) Track last sync timestamp

---

## 4. Screen Implementation

### 4.1 Login Screen (NLIS Login)
- [ x] (4.1.1) Refactor LoginScreen to match HTML design (hero area with shield badge)
- [ x] (4.1.2) Add gradient hero section with centered badge
- [ x] (4.1.3) Add form inputs with left icons (user/lock)
- [ x] (4.1.4) Add gradient login button with proper text wrapping
- [ x] (4.1.5) Add help section with "Liên hệ hỗ trợ kỹ thuật" link
- [ x] (4.1.6) Test on small device (ensure no text clipping)
- [ x] (4.1.7) Make entire screen scrollable (SafeArea + ScrollView)

### 4.2 Dashboard / Start Survey Screen
- [ x] (4.2.1) Create DashboardScreen component
- [x ] (4.2.2) Add gradient header with officer name and settings icon
- [ x] (4.2.3) Add main CTA section ("Ready to Start a New Survey?")
- [ x] (4.2.4) Add large primary "Start New Survey" button
- [ x] (4.2.5) Add unsynced surveys section (title + badge with count)
- [ x] (4.2.6) Add list of unsynced survey items (icon, ID, time, chevron)
- [ x] (4.2.7) Add online/offline status indicator
- [ x] (4.2.8) Make screen scrollable, ensure button visible above fold
- [ x] (4.2.9) Test on small device (no text clipping)

### 4.3 Start Survey Screen (Basic Info)
- [ ] (4.3.1) Create StartSurveyScreen component
- [ ] (4.3.2) Add step indicator (e.g., "Bước 1/6 – Thông tin cơ bản")
- [ ] (4.3.3) Add object type selector (dropdown/segmented control)
- [ ] (4.3.4) Add text input for "Tên / Mã đối tượng"
- [ ] (4.3.5) Add primary button "Tiếp tục"
- [ ] (4.3.6) Add secondary "Quay lại" button
- [ ] (4.3.7) Integrate with survey store
- [ ] (4.3.8) Test layout on small device

### 4.4 GPS Capture Screen
- [ ] (4.4.1) Create GPSCaptureScreen component
- [ ] (4.4.2) Add gradient/solid header with title
- [ ] (4.4.3) Add map preview card/placeholder
- [ ] (4.4.4) Add coordinates display (Lat, Lng, accuracy)
- [ ] (4.4.5) Add "Lấy vị trí hiện tại" primary button
- [ ] (4.4.6) Add optional "Lấy lại vị trí" link
- [ ] (4.4.7) Integrate expo-location for GPS
- [ ] (4.4.8) Add loading spinner during GPS fetch
- [ ] (4.4.9) Add error handling UI (permission denied message)
- [ ] (4.4.10) Save GPS data to survey store
- [ ] (4.4.11) Test on small device

### 4.5 Photo Capture Screen
- [ ] (4.5.1) Create PhotoCaptureScreen component
- [ ] (4.5.2) Add instruction text at top
- [ ] (4.5.3) Add camera preview card (full-width, rounded corners)
- [ ] (4.5.4) Add circular shutter button
- [ ] (4.5.5) Add horizontal thumbnails row (scrollable)
- [ ] (4.5.6) Add "Xong / Tiếp tục" button
- [ ] (4.5.7) Integrate expo-camera for photo capture
- [ ] (4.5.8) Implement fullscreen preview on thumbnail tap
- [ ] (4.5.9) Add delete photo functionality
- [ ] (4.5.10) Save photo URIs to survey store
- [ ] (4.5.11) Show warning if no photos captured
- [ ] (4.5.12) Test on small device

### 4.6 Object Info Screen
- [ ] (4.6.1) Create ObjectInfoScreen component
- [ ] (4.6.2) Add "Chủ sở hữu / đại diện" section (name, ID inputs)
- [ ] (4.6.3) Add "Địa chỉ chi tiết" text area
- [ ] (4.6.4) Add "Loại sử dụng" dropdown/chips
- [ ] (4.6.5) Add "Ghi chú" multiline input
- [ ] (4.6.6) Use cards to separate sections
- [ ] (4.6.7) Add primary "Tiếp tục" button
- [ ] (4.6.8) Add optional "Lưu & tiếp tục sau" button
- [ ] (4.6.9) Save data to survey store
- [ ] (4.6.10) Test on small device

### 4.7 Polygon / Boundary Screen
- [ ] (4.7.1) Create PolygonScreen component
- [ ] (4.7.2) Add map card with drawing mode
- [ ] (4.7.3) Add instruction text (2-3 lines max)
- [ ] (4.7.4) Implement tap-to-add points functionality
- [ ] (4.7.5) Add "Xóa hình / Làm lại" button
- [ ] (4.7.6) Add "Bỏ qua bước này" link
- [ ] (4.7.7) Save polygon data to survey store
- [ ] (4.7.8) Test on small device

### 4.8 Review Screen
- [ ] (4.8.1) Create ReviewScreen component
- [ ] (4.8.2) Add location summary section (map snapshot/coordinates)
- [ ] (4.8.3) Add photos section (horizontal thumbnails)
- [ ] (4.8.4) Add object info section
- [ ] (4.8.5) Add polygon summary section
- [ ] (4.8.6) Add "Chỉnh sửa" action for each section
- [ ] (4.8.7) Add primary "Gửi khảo sát / Hoàn tất" button
- [ ] (4.8.8) Add secondary "Lưu bản nháp" button
- [ ] (4.8.9) Test on small device

### 4.9 Submission Success Screen
- [ ] (4.9.1) Create SubmissionSuccessScreen component
- [ ] (4.9.2) Add centered check-circle icon
- [ ] (4.9.3) Add title "Khảo sát đã được gửi"
- [ ] (4.9.4) Add conditional subtext (online vs offline)
- [ ] (4.9.5) Add "Quay lại trang chính" button
- [ ] (4.9.6) Test on small device

### 4.10 History Screen
- [ ] (4.10.1) Create HistoryScreen component
- [ ] (4.10.2) Add list of past surveys with icons, IDs, dates
- [ ] (4.10.3) Add status chips (Synced/Pending)
- [ ] (4.10.4) Add filter chips/tabs ("Tất cả", "Chờ đồng bộ", "Đã gửi")
- [ ] (4.10.5) Test on small device

### 4.11 Settings Screen
- [ ] (4.11.1) Create SettingsScreen component
- [ ] (4.11.2) Display officer info (name, ID)
- [ ] (4.11.3) Add online/offline status row
- [ ] (4.11.4) Display last sync time
- [ ] (4.11.5) Add "Đồng bộ ngay" button
- [ ] (4.11.6) Add "Đăng xuất" button
- [ ] (4.11.7) Test on small device

---

## 5. Local Persistence & Offline Support

### 5.1 Local Storage Setup
- [ ] (5.1.1) Set up SQLite or AsyncStorage for survey data
- [ ] (5.1.2) Create schema for pending surveys
- [ ] (5.1.3) Create schema for sync queue

### 5.2 Offline Detection
- [ ] (5.2.1) Integrate @react-native-community/netinfo
- [ ] (5.2.2) Update status badge based on network state
- [ ] (5.2.3) Show offline banner when disconnected

### 5.3 Sync Logic (UI Layer)
- [ ] (5.3.1) Create sync service module
- [ ] (5.3.2) Implement background sync on reconnect
- [ ] (5.3.3) Update UI when sync completes/fails
- [ ] (5.3.4) Show sync progress indicator

---

## 6. Integration with Backend Services

### 6.1 Auth Service Integration
- [ ] (6.1.1) Verify auth service is working correctly
- [ ] (6.1.2) Handle session persistence on app restart
- [ ] (6.1.3) Implement logout flow

### 6.2 Survey Service Integration
- [ ] (6.2.1) Create survey submission service (calls backend API)
- [ ] (6.2.2) Implement photo upload to Supabase Storage
- [ ] (6.2.3) Implement polygon data submission
- [ ] (6.2.4) Handle server errors gracefully

### 6.3 History Service Integration
- [ ] (6.3.1) Fetch past surveys from backend
- [ ] (6.3.2) Merge with local pending surveys
- [ ] (6.3.3) Display in History screen

---

## 7. Testing & Polish

### 7.1 Layout Testing
- [ ] (7.1.1) Test all screens on iPhone SE (small device)
- [ ] (7.1.2) Test all screens on iPhone 14 (standard device)
- [ ] (7.1.3) Test all screens on 6" Android phone
- [ ] (7.1.4) Verify no text clipping on any screen
- [ ] (7.1.5) Verify all buttons have proper touch targets (min 44px)
- [ ] (7.1.6) Verify Vietnamese labels wrap correctly

### 7.2 Flow Testing
- [ ] (7.2.1) Test complete survey flow: Login → Dashboard → Start → GPS → Photo → Info → Polygon → Review → Submit → Success
- [ ] (7.2.2) Test draft save and resume flow
- [ ] (7.2.3) Test offline survey creation
- [ ] (7.2.4) Test sync after going back online
- [ ] (7.2.5) Test navigation back/forward through survey steps

### 7.3 Visual Polish
- [ ] (7.3.1) Match gradients exactly to HTML mockups
- [ ] (7.3.2) Match card shadows to HTML mockups
- [ ] (7.3.3) Verify all spacing matches design (padding, margins)
- [ ] (7.3.4) Ensure smooth scroll behavior (no nested scroll jank)
- [ ] (7.3.5) Add loading states for all async operations

---

## 8. Documentation

### 8.1 Code Documentation
- [ ] (8.1.1) Document all reusable components
- [ ] (8.1.2) Document state stores
- [ ] (8.1.3) Document service modules

### 8.2 Progress Tracking
- [ ] (8.2.1) Keep this tasks.md file updated as work progresses
- [ ] (8.2.2) Add notes for any assumptions made during implementation

---

## Notes

- **Current Status:** Task list created. Ready to start implementation.
- **Next Step:** Begin with foundation work - theme enhancements and core UI components.
- **Assumption:** Using existing theme/ directory structure, will enhance rather than replace.
- **Assumption:** Auth is already implemented (per CLAUDE.md), focusing on UI/UX improvements and new screens.
