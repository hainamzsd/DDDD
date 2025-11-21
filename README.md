# Commune-Level Field Survey App (C06) – UI/UX README

> **Scope of this document**  
> This README describes **ONLY the front-end UI/UX** of the Expo React Native app.  
> **Auth, Supabase, database schemas, PostGIS, RLS, etc. are out of scope and intentionally removed.**  
> Backend is assumed to exist and expose APIs; the app will call them via services layer.

All UI/UX must follow the **LocationID Tracker** design export you provided (gradients, cards, paddings, typography, icon usage, etc.).:contentReference[oaicite:0]{index=0}  
The goal is to make the app look and feel as close as possible to those HTML mockups.

---

## 1. Product Overview

This mobile app helps **commune-level police officers** perform field surveys of physical locations (houses, shops, small businesses, infrastructure, etc.) as part of the **National Location Identification System (C06)**.

Core flow:

1. Login  
2. Dashboard / Home (Start Survey + Unsynced list + Status)  
3. Start Survey (basic object info)  
4. GPS Capture  
5. Photo Capture  
6. Object Info (details)  
7. Polygon / Boundary (optional)  
8. Review & Submit  
9. Submission Success  
10. History & Settings

The app is **offline-first** from a UX perspective:  
- When offline, UI clearly shows “Offline / Unsynced” state.  
- Actions still work; data is queued for sync.  
- There is a clear **unsynced counter / list** on the home screen.

---

## 2. Global Visual Design

### 2.1 Layout & Safe Area

- Design for **real devices**, not just Figma/HTML:
  - Target: iPhone 13 / 14, 6" Android phones.
- Must respect **SafeArea** (no content behind notch / home indicator).
- All main screens are **scrollable** (`ScrollView`) so that:
  - **No important text is cut off** on smaller devices.
  - Cards and buttons never extend beyond visible viewport without scroll.

### 2.2 Gradients & Background

- Use the **same gradient style** as the HTML export:
  - Main header / hero sections: dark green → lighter green gradient (see Start Survey & Login mockups).:contentReference[oaicite:1]{index=1}  
- Background of the app:
  - Soft neutral background (light, slightly tinted) behind cards.
  - No flat pure white full-screen unless inside cards.

### 2.3 Cards & Containers

- Cards use:
  - Rounded corners (`borderRadius` ~ 20–24).
  - Subtle shadow (soft, not harsh).
  - Generous padding (_at least_ 16–20 px inside).
- Important blocks (e.g., current survey info, unsynced list) are grouped into cards:
  - Title row with label + icon/badge.
  - Content area with readable spacing.

### 2.4 Typography & Text Rules

**Critical requirement (fix current problem):**

- **No button or label text is allowed to be half-visible or cut off on a real phone.**
- All important text must:
  - Use font sizes big enough for Vietnamese labels.
  - Wrap correctly when longer than one line.
  - Not collide with icons or container edges.

Guidelines:

- Headings:  
  - H1/H2 around 20–24 px, **bold**.
  - H3 around 16–18 px, semi-bold.
- Body text: 14–16 px, normal weight, comfortable line-height.
- Labels / chip text: 12–14 px, semi-bold.
- Vietnamese labels must be tested in full (no “…” truncation on critical labels).

---

## 3. Buttons & Interaction (Important for Claude)

### 3.1 Primary Buttons

- Style:
  - Full-width or large width.
  - Gradient background (like “Start New Survey”).
  - Rounded corners (~16–20).
  - Centered icon + text with spacing between them.
  - Strong drop shadow similar to HTML design.:contentReference[oaicite:2]{index=2}  
- **Text behavior:**
  - If text is long (2 lines), it must wrap **inside** the button with enough vertical padding.
  - No text is allowed to be “squeezed” at top/bottom or clipped.
- **Touch target:**
  - Minimum height: 44 px, ideally 48–52 px.
  - Horizontal padding: at least 16 px left/right.

### 3.2 Secondary / Tertiary Buttons

- Secondary:
  - Outlined or soft solid background with lighter colors.
  - Used for less important actions (e.g., “View History”, “Sync Now”).
- Tertiary:
  - Text-only actions (“Edit”, “View details”, “Đăng xuất →”), with clear tap feedback.

### 3.3 Button Copy Constraints

- Claude must:
  - Use **short, clear labels** for buttons on small screens.
  - Avoid 3–4 line labels entirely.
  - For Vietnamese, prefer concise phrases:
    - Example: “Bắt đầu khảo sát”, “Chụp ảnh”, “Lưu vị trí”, “Tiếp tục”, “Quay lại”.

---

## 4. Status, Badges & Offline UX

### 4.1 Online / Offline Status

- Top-level header shows:
  - A small colored dot (green = online, red/orange = offline).
  - Text: “Trực tuyến” or “Ngoại tuyến”.
- When offline:
  - Show a subtle banner or badge indicating offline mode.
  - Disable actions that strictly require network (e.g., “Force Sync Now”), but **do not** block core survey actions.

### 4.2 Unsynced Surveys UI

- On the Start / Dashboard screen:
  - Section: **“Unsynced Surveys” / “Khảo sát chưa đồng bộ”**.
  - Badge with icon (e.g., `wifi-off` or `upload-cloud`) and count number.
  - List of unsynced items as cards or rows:
    - Icon (map-pin / photo).
    - Survey ID (e.g., `Survey #2024-0847` or local code).
    - Date/time.
    - Chevron icon indicating that item is tappable (view / resume survey).:contentReference[oaicite:3]{index=3}  

---

## 5. Screen-by-Screen UI/UX (Front-end Only)

> All screens must reuse shared components: **Header, GradientHero, Card, PrimaryButton, Badge, StatusChip, ListItem**, etc.  
> Backend fields, DB schema, auth flow are **not** described here; just UI.

### 5.1 Login Screen (NLIS Login)

- Hero area:
  - Center badge with shield icon.
  - Text: “Bộ Công An” (small), “NLIS Field Survey” (big).
  - Short welcome paragraph, centered, with **two lines max** and good line-height.:contentReference[oaicite:4]{index=4}  
- Form:
  - Two inputs stacked vertically:
    - “Mã Cán Bộ”
    - “Mật Khẩu”
  - Each input:
    - Left icon (user/lock).
    - Clear placeholder.
    - Full width with generous padding.
  - Login button:
    - Gradient, full width.
    - Icon + text “Đăng Nhập”.
    - Must look good with 1 or 2 lines of text on small devices.
- Help section:
  - Short text “Cần hỗ trợ đăng nhập?”
  - Link-style button “Liên hệ hỗ trợ kỹ thuật” with icon.:contentReference[oaicite:5]{index=5}  

### 5.2 Dashboard / Start Survey Screen

- Header:
  - Gradient header with badge (shield icon) and officer name.
  - Right-aligned settings icon.
  - Small “Xin chào,” line above officer name.:contentReference[oaicite:6]{index=6}  
- Main CTA:
  - Large text: “Ready to Start a New Survey?” (or Vietnamese equivalent).
  - Big primary button “Start New Survey / Bắt đầu khảo sát”.
- Unsynced section:
  - Title + badge with count.
  - List of survey rows as designed in HTML (map-pin icon, ID, time, chevron).:contentReference[oaicite:7]{index=7}  
- On smaller screens:
  - Ensure the “Start” button and at least first unsynced item are visible above the fold, with the rest scrollable.

### 5.3 Start Survey Screen (Object Type & Name)

- Simple step indicator (e.g., “Bước 1/6 – Thông tin cơ bản”).
- Card with:
  - Dropdown or segmented control for object type: Nhà dân, Cửa hàng, Cơ sở sản xuất, Hạ tầng, …  
  - Text input for “Tên / Mã đối tượng”.
- Navigation:
  - Primary button: “Tiếp tục” (Next to GPS).
  - Secondary (top-left or footer): “Quay lại” (back to dashboard).

### 5.4 GPS Capture Screen

- Header:
  - Gradient or solid header with title “Ghi nhận vị trí GPS”.
- Map area:
  - Map preview card or placeholder card when map not implemented.
  - Big icon + coordinates display (Lat, Lng, accuracy).
- Actions:
  - Primary button: “Lấy vị trí hiện tại”.
  - Optional link/button: “Lấy lại vị trí” or “Điều chỉnh trên bản đồ”.
- UX:
  - While fetching location, show spinner + message.
  - If error (permission denied), show clear error text and a link to open settings.

### 5.5 Photo Capture Screen

- Top area: short text describing what to photograph: “Chụp mặt tiền, biển hiệu, các góc quan trọng”.
- Camera preview uses full-width card style (with rounded corners on top of scroll area).
- Bottom area:
  - Big circular shutter button.
  - Thumbnails row of captured images (horizontally scrollable).
  - Button “Xong / Tiếp tục”.
- Interaction:
  - Tapping a thumbnail opens fullscreen preview with **Delete** action.
  - At least one photo recommended; show subtle warning if none.

### 5.6 Object Info Screen

- Simple form grouped into logical sections:
  - “Chủ sở hữu / đại diện”: Name, ID (optional).
  - “Địa chỉ chi tiết”: text area with multiple lines.
  - “Loại sử dụng”: dropdown/chips.
  - “Ghi chú”: multiline input.
- Use cards to separate sections, each with title and fields.
- Buttons:
  - Primary: “Tiếp tục” (to Polygon or Review).
  - Secondary: “Lưu & tiếp tục sau” (optional: stores as draft only).

### 5.7 Polygon / Boundary Screen (Optional)

- Map card with drawing mode:
  - Instructions text at top (2–3 short lines max).
  - Tap-to-add points, button “Xóa hình” / “Làm lại”.
- UX:
  - If user skips polygon, provide “Bỏ qua bước này” link under main button.

### 5.8 Review Screen

- Sections stacked vertically:
  - Location summary (map snapshot or coordinates).
  - Photos (horizontal thumbnails).
  - Object info (owner, address, type).
  - Polygon summary (“Đã vẽ đường ranh” / “Chưa có ranh giới”).
- Each section is a card with small “Chỉnh sửa” action that navigates back to that screen.
- Footer:
  - Primary button: “Gửi khảo sát / Hoàn tất”.
  - Secondary: “Lưu bản nháp” (keeps as pending).

### 5.9 Submission Success Screen

- Centered icon (check-circle).
- Title: “Khảo sát đã được gửi” or “Đã lưu để đồng bộ”.
- Subtext:
  - If online: “Dữ liệu đã được gửi lên hệ thống.”
  - If offline: “Dữ liệu sẽ được đồng bộ tự động khi có mạng.”
- Button: “Quay lại trang chính”.

### 5.10 History & Settings Screens

- History:
  - List of past surveys with:
    - Icon, ID, date, status chip (Synced / Pending).
  - Filter chips or tabs: “Tất cả”, “Chờ đồng bộ”, “Đã gửi”.
- Settings:
  - Officer info (name, ID).
  - Status row: Online/Offline + last sync time.
  - Button: “Đồng bộ ngay”.
  - Button: “Đăng xuất” (visually secondary but clear).

---

## 6. Implementation Notes for Developers

- Use **Expo + React Native** with a shared `theme` (colors, spacing, typography) matching the HTML design.
- Build reusable UI components:
  - `GradientHeader`, `PrimaryButton`, `Card`, `StatusBadge`, `SectionTitle`, `ListItem`, `OfflineBanner`, etc.
- Ensure:
  - All screens are tested on at least **one small device** (e.g. iPhone SE / small Android) so **no text is clipped**.
  - Multi-line Vietnamese labels wrap cleanly and do not overlap icons or edges.
  - Scroll behavior is smooth and natural (no nested scrolls that cause jank).

---

## 7. Out of Scope (Handled Elsewhere)

This README intentionally **does not** specify:

- Supabase Auth flows (signInWithPassword, OTP, roles).
- Database schemas (officers, surveys, survey_media, polygons).
- PostGIS details (Point/Polygon types, indices).
- Row-level security (RLS).
- Exact sync algorithm / retry logic.

Those belong to **backend / architecture / data** documentation and should live in separate `.md` files (e.g., `BACKEND.md`, `SCHEMA.md`, `SYNC.md`).

---

## 8. Goal for the AI Coding Loop

When this project is run in an autonomous AI loop (Claude Code or similar), the agent should:

1. **Refactor all existing screens** to strictly follow the UI/UX rules above and the HTML design reference.:contentReference[oaicite:8]{index=8}  
2. Fix all layout issues where:
   - Button text is cramped, overlaps icons, or is partially hidden on small screens.
3. Introduce/reuse a consistent design system:
   - Color tokens, typography, spacings, shadows, gradients.
4. Ensure:
   - All main flows (Login → Start Survey → Submit) are visually polished, readable, and usable on real phones.

This document is the **source of truth** for how the app should look and behave on the front-end.  
If something in code conflicts with this README, **the README wins**.
