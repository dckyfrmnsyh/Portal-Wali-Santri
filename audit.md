# Codebase Audit Report: Al-Khairaat Tana Tidung Portal

This document provides a comprehensive technical audit of the **Al-Khairaat Tana Tidung Portal** codebase, detailing its architectural structure, components, state management, and critical paths for production-readiness.

---

## 1. Project Context & Purpose
The application is a modern web-based dashboard and portal designed for **Pondok Pesantren Al-Khairaat Tana Tidung** (covering both SMP and SMA levels).
Its primary features include:
1. **Landing Page & Public Info**: Core school information, PPDB (Pendaftaran Peserta Didik Baru), and contact details.
2. **Guardian (Wali Santri) Self-Service Portal**: Allowing guardians to search for their children via NISN or NIS, review monthly SPP invoice details, installment logs, yearly summaries, and submit payment confirmation proofs.
3. **Admin Dashboard (Akses Pengurus)**: A centralized panel for student management, bulk generating SPP bills, cashier log entries for cash payments, transaction validations (approving/rejecting submitted receipts), and katering (catering/dining) expense/income tracking.

---

## 2. Directory Tree Analysis
The codebase exhibits a clean, logical separation of concerns:
* **Root Configuration**:
  * `index.html`: Entry page referencing the React application bundle.
  * `package.json`: Holds dependencies (React 19, Tailwind CSS v4, Lucide-React, Motion, etc.) and developer tools.
  * `tsconfig.json`: Defines target compiling (ES2022) and module bundling options.
  * `vite.config.ts`: Configures Vite plugins, path aliases (`@/*`), and file-watcher setups for the dev server.
  * `metadata.json`: Defines application metadata matching the school portal credentials.
* **Source Folder (`/src`)**:
  * `App.tsx`: The primary routing controller, global state manager, and event handler hub.
  * `index.css`: Global styles registering Tailwind CSS v4 directives and the default `Plus Jakarta Sans` typography.
  * `main.tsx`: Direct React entry point mounting the `App` component into the DOM.
  * `types/`: Contains strictly-typed interfaces:
    * `student.ts`: Represents student profiles, statuses (`active`, `graduated`, `inactive`), and school levels.
    * `spp.ts`: Models SPP bills and individual payment installments.
    * `payment.ts`: Tracks bank transfers and cash validations.
    * `mealFinance.ts`: Configures catering kitchen budget records.
  * `components/`:
    * Reusable UI primitives (`Button.tsx`, `Card.tsx`, `DataTable.tsx`, `Input.tsx`, `Modal.tsx`, `Select.tsx`, `StatusBadge.tsx`, `StatCard.tsx`, `ExportButton.tsx`).
    * Public school website sections (`Hero.tsx`, `About.tsx`, `Programs.tsx`, `Facilities.tsx`, `News.tsx`, `Gallery.tsx`, `PPDB.tsx`, `Contact.tsx`, `Footer.tsx`).
  * `pages/`:
    * `LandingAccessPage.tsx`: Aggregates school sections and routes portal accesses.
    * `admin/`: Controls admin sub-views (Dashboard, Student management, validation desk, monthly reports, and kitchen logs).
    * `guardian/`: Powers child verification forms and payment submission dialogs.
  * `data/`: Injects initial mocked datasets (`dummyStudents`, `dummySpp`, `dummyPayments`, `dummyMealFinance`).
  * `utils/`: Formats currencies (`formatCurrency.ts`) and provides color-coded labels (`statusHelper.ts`).

---

## 3. Code Quality & Logic Verification

### 3.1 State Management & Persistence
* **State Location**: The global application state resides in [App.tsx](file:///C:/Users/septa/antigravity/Al-Khairaat-Tana-Tidung-Portal/src/App.tsx). Sub-components communicate via callback handlers.
* **Syncing**: State variables (`students`, `bills`, `payments`, `mealFinance`) are automatically saved to `localStorage` upon any change. This ensures that modifications persist across page reloads.
* **Fallback**: Initial runs fall back to the dummy mock datasets (`dummyStudents`, `dummySppBills`, `dummyPayments`, `dummyMealFinanceRecords`).

### 3.2 Data Validation & Safety
* **Student Registration**: In [StudentManagementPage.tsx](file:///C:/Users/septa/antigravity/Al-Khairaat-Tana-Tidung-Portal/src/pages/admin/StudentManagementPage.tsx), validation rules ensure that NISN numbers are exactly 10 digits and numbers-only, NIS codes are numeric, and duplicate NISN or NIS entries are blocked.
* **Double Payment Protection**: In [App.tsx](file:///C:/Users/septa/antigravity/Al-Khairaat-Tana-Tidung-Portal/src/App.tsx#L82-L117), when a guardian submits a payment confirmation, the corresponding bill status is immediately set to `pending` (locked) to prevent redundant transfer confirmation uploads.
* **Soft Deletions**: Deactivating a student does not purge historical records. The status is set to `inactive`, preserving invoices for auditing.

### 3.3 Catering Cash Flow Calculations
* **Belanja Kitchen Helper**: In [MealFinanceManagementPage.tsx](file:///C:/Users/septa/antigravity/Al-Khairaat-Tana-Tidung-Portal/src/pages/admin/MealFinanceManagementPage.tsx), typing quantities and unit prices dynamically calculates total transaction amounts via a `useEffect` loop, preventing arithmetic errors.
* **Cash Balance**: Balanced accounting (`income - expense`) checks the actual cumulative cash reserves.

---

## 4. Visual Design & Responsiveness
* **Tailwind v4**: The layout takes advantage of standard v4 theme variables defined in [index.css](file:///C:/Users/septa/antigravity/Al-Khairaat-Tana-Tidung-Portal/src/index.css#L5-L28). Colors are custom-mapped (e.g., `brand-green` and `brand-gold` reflecting Islamic boarding school aesthetics).
* **Responsive Breakpoints**: Layout components use responsive flex wraps and grids (e.g., `grid-cols-1 md:grid-cols-4`) to transition from desktop browsers down to smartphones.

---

## 5. Security & Architectural Recommendations for Production

1. **Authentication Mechanism**:
   * *Current Status*: Hardcoded credentials (`admin` / `password`) inside [AdminLoginPage.tsx](file:///C:/Users/septa/antigravity/Al-Khairaat-Tana-Tidung-Portal/src/pages/admin/AdminLoginPage.tsx) for testing.
   * *Recommendation*: Replace with a secure server authentication module (e.g., Node.js + Express backend running database validation with hashed passwords and secure JWT/session cookies).
2. **Server-Side API Integration**:
   * *Current Status*: State is held inside client-side `localStorage`.
   * *Recommendation*: Implement RESTful or GraphQL endpoints referencing a database system (e.g., MySQL or PostgreSQL). Move transaction logic, bill generation, and validations to the server to prevent data manipulation on the client.
3. **Storage of Receipt Uploads**:
   * *Current Status*: File receipts are processed as Base64 strings.
   * *Recommendation*: Storing heavy Base64 strings in `localStorage` quickly hits browser size quotas (~5MB). Integrate file storage services (e.g., Amazon S3, Google Cloud Storage, or local file uploads) and reference simple URL paths.
4. **Enhanced Encryption & SSL**:
   * *Recommendation*: SPP invoices contain sensitive personal info (phone numbers, addresses). Enforce TLS/HTTPS across the application.
