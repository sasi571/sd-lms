# 🎓 LeaveFlow: Academic Leave Management System

A production-grade **Leave Management System** built with **React**, **Node.js/Express**, and **SQLite (Native `node:sqlite`)**, implementing comprehensive **Role-Based Access Control (RBAC)** across Students, Class Tutors, and the Principal.

---

## 🌟 Key Features & Workflow

1. **Student Leave Application**:
   - Students apply for leave by specifying Category (`ACADEMIC`, `MEDICAL`, `CASUAL`, `EMERGENCY`, `DUTY`), start date, end date (with auto-computed day count), and reason.
   - Applications start in state `PENDING_TUTOR`.

2. **Class Tutor Physical Verification & Forwarding**:
   - **Mandatory Guardrail**: Tutor reviews the application and cannot forward without confirming physical verification.
   - Records verification mode (`In-Person Interview`, `Parent Phone Call`, `Medical Slip Examined`, `Warden Check`) and detailed observations.
   - Action choices:
     - **Verify & Forward to Principal** ➔ Updates status to `FORWARDED_TO_PRINCIPAL`
     - **Reject Request** ➔ Requires mandatory reason; updates status to `REJECTED_BY_TUTOR` and notifies student.

3. **Principal Executive Sanction**:
   - Principal inspects the request along with the Tutor's physical verification proof and comments.
   - Action choices:
     - **Approve Leave** ➔ Updates status to `APPROVED`
     - **Reject Leave** ➔ Updates status to `REJECTED_BY_PRINCIPAL`

4. **Automated Notification Dispatch**:
   - Instant in-app notification alerts the student as soon as the Principal approves or rejects the leave.
   - Notification bell features real-time badge count, unread filter, and mark-as-read toggles.

5. **Interactive 1-Click Persona Switcher**:
   - Switch effortlessly between **Rahul Sharma (Student)**, **Prof. Arvind Kumar (Tutor)**, and **Dr. K. Ramanathan (Principal)** directly from the top bar to inspect and evaluate the entire workflow without logging out.

---

## 👥 Pre-configured Demo Accounts

| Persona | Role | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `STUDENT` | `rahul@college.edu` | `student123` | Roll: 2024-CS-042 (CSE) |
| **Priya Patel** | `STUDENT` | `priya@college.edu` | `student123` | Roll: 2024-CS-055 (CSE) |
| **Prof. Arvind Kumar** | `TUTOR` | `arvind@college.edu` | `tutor123` | Class Tutor (CSE Dept) |
| **Dr. K. Ramanathan** | `PRINCIPAL`| `principal@college.edu` | `principal123` | Head of Institution |
| **Administrator** | `ADMIN` | `admin@college.edu` | `admin123` | System Administrator |

---

## 🚀 Getting Started

### 1. Start the Backend API (Port 5000)
```powershell
cd backend
node src/server.js
```
*Note: Uses Node's built-in `node:sqlite` database. Tables and initial seed data are populated automatically.*

### 2. Start the React Frontend (Port 3000)
```powershell
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏛 Low-Level Design (LLD)
Refer to the complete design artifact:
- [leave_management_system_lld.md](file:///C:/Users/sasik/.gemini/antigravity-ide/brain/dc7df7b6-14cd-4f02-a3fd-eede9734be19/leave_management_system_lld.md)
