# Salary Enroll Pay System — Payroll, PF & ESIC Management System

> **College C++ Object-Oriented Programming (OOP) Academic Project**  
> A high-performance, compliant payroll and statutory management system built for enterprises managing blue-collar and white-collar workers.

---

## 1. Project Overview & Real-World Purpose

Salary calculation in standard spreadsheets quickly fails when companies manage dynamic workforces requiring:
* **Monthly Attendance Proration**: Calculation of payable days vs. absent days.
* **Non-Contributing Period (NCP) Days**: Mandated for EPFO reporting to prevent pension service calculation errors.
* **EPFO (Employees' Provident Fund & MP Act 1952)**:
  * Statutory wage ceiling of ₹15,000 / month (Basic + DA).
  * Employee contribution: 12% (Account 01).
  * Employer Pension Scheme (EPS Account 10): 8.33% strictly capped at **₹1,250 / month**.
  * Employer EPF Difference (Account 01): ~3.67% + rounding adjustments.
  * EDLI (Deposit Linked Insurance Account 21): 0.50%.
  * Admin Charges (Account 02): 0.50%.
* **ESIC (Employees' State Insurance Act 1948)**:
  * Gross wage ceiling of ₹21,000 / month.
  * Employee contribution: 0.75% of earned gross.
  * Employer contribution: 3.25% of earned gross.
  * Minimum daily wage exemption rule: If average daily wage $\le$ ₹176/day, employee contribution is **0% (Exempt)** while employer pays 3.25%.
* **Government Portal Export Files**:
  * Official EPFO ECR 2.0 text format with `#~#` delimiters.
  * Official ESIC Monthly Contribution upload CSV with standard zero-working-day reason codes.
  * Corporate Bank NEFT salary transfer statement.

---

## 2. Academic C++ OOP Architecture

The core statutory and payroll calculation logic is strictly implemented in **modern C++17** using clean OOP design patterns:

```
                  ┌───────────────────────────────┐
                  │    <<abstract interface>>     │
                  │     StatutoryCalculator       │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        ┌────────▼─────────┐           ┌─────────▼────────┐
        │  EPFCalculator   │           │  ESICCalculator  │
        │ - Ceiling: ₹15k  │           │ - Ceiling: ₹21k  │
        │ - EE: 12%        │           │ - EE: 0.75%      │
        │ - EPS: Max ₹1250 │           │ - ER: 3.25%      │
        │ - ER Diff: 3.67% │           │ - Exemption rule │
        └──────────────────┘           └──────────────────┘
```

### Key OOP Principles Demonstrated:

1. **Abstraction & Polymorphism**:
   * Pure virtual base class [`StatutoryCalculator`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/StatutoryCalculator.hpp):
     ```cpp
     virtual void calculate(double basicDA, double gross, int paid, int cal) = 0;
     virtual double getEmployeeContribution() const = 0;
     virtual double getEmployerContribution() const = 0;
     ```
   * Polymorphically overridden by [`EPFCalculator`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/EPFCalculator.hpp) and [`ESICCalculator`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/ESICCalculator.hpp).

2. **Encapsulation & Data Hiding**:
   * [`Employee`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/Employee.hpp), [`SalaryStructure`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/SalaryStructure.hpp), and [`AttendanceRecord`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/AttendanceRecord.hpp) protect member variables with validated getters and mutators.

3. **Object Composition (HAS-A)**:
   * `Employee` composes a `SalaryStructure` object.
   * `PayrollSlip` composes an `Employee`, `AttendanceRecord`, `EPFCalculator`, and `ESICCalculator`.

4. **Design Patterns**:
   * **Facade Pattern ([`PayrollEngine`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/PayrollEngine.hpp))**: Coordinates attendance proration, statutory engines, and batch summaries.
   * **Formatter Pattern ([`ECRExportFormatter`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/ECRExportFormatter.hpp) & [`ESICExportFormatter`](file:///Users/apple/Documents/C++%20PROJECT%20FLODER/soucre%20code/cpp_engine/include/ESICExportFormatter.hpp))**: Formats calculated slips into statutory portal strings.

---

## 3. How to Demonstrate in College Viva (Terminal Mode)

You can run the C++ OOP engine directly in your terminal without opening a web browser:

```bash
# 1. Navigate to the C++ Engine folder
cd cpp_engine

# 2. Compile clean binary
make clean && make

# 3. Run the automated OOP unit test suite (5 tests verifying all concepts)
./bin/payroll_engine --test

# 4. Run interactive console evaluator (enter employee details and print slip in terminal)
./bin/payroll_engine --cli
```

---

## 4. Full Web Application Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Glassmorphism & Enterprise UI.
* **Backend**: Node.js, Express REST API, Mongoose ODM.
* **Database**: MongoDB Atlas cloud cluster (`salary_enroll_pay`).
* **Calculation Engine**: C++17 Object-Oriented Programming (OOP) Engine (`cpp_engine/bin/payroll_engine`).
* **IPC Bridge**: High-speed JSON streaming via Node.js child process (`backend/src/services/cppEngineBridge.js`).
* **Security & Auth**: Admin Sign In & Sign Up (registration), Bcrypt password hashing, JSON Web Tokens (JWT), role-based endpoint protection, and private document storage for E-Pehchan PDFs.

---

## 5. The 12 Application Modules

1. **Dashboard**: Executive KPIs (Total employees, active workforce, PF/ESIC enrolled), gross payroll, employee deductions, net pay, employer liabilities, and professional empty state when no employees are registered.
2. **Employee Master**: Add, edit, view profile, deactivate, search, and filter real employees with unique UAN, ESIC/IP, and PAN validation.
3. **Employee Documents**: Secure upload, validation (PDF, JPG, PNG up to 10MB), and private streaming for E-Pehchan cards and KYC documents.
4. **Attendance and Monthly Wage Entry**: Calendar days, present days, paid leaves, weekly offs, auto-computed NCP days, overtime hours/amount, advance recovery, and separate PF/ESIC wage bases.
5. **Payroll Processing**: 1-click execution of the C++ OOP calculation engine with live preview, Draft saving, and Finalized locking.
6. **PF Processing (EPF)**: Detailed statutory ledger displaying A/c 01 (12%), A/c 10 (EPS ₹1,250 cap), A/c 21 (EDLI 0.5%), and A/c 02 (Admin 0.5%).
7. **ESIC Processing**: Statutory ledger verifying ₹21,000 gross limit, daily wage exemption (≤ ₹176), 0.75% EE, and 3.25% ER liability.
8. **Monthly Payroll History**: Historical runs archive with professional, printable, system-verified salary slips (`window.print()` / PDF export).
9. **Reports**: Bank NEFT transfer statement (CSV download), department cost distribution, and statutory summaries.
10. **PF ECR Export**: Official EPFO ECR 2.0 delimited plain text file (`#~#`) download for instant employer portal upload (locked against unfinalized drafts).
11. **ESIC Excel Export**: Official ESIC Employer Monthly Contribution upload Excel workbook (`.xlsx`) generated via ExcelJS (locked against unfinalized drafts).
12. **Settings and Statutory Rules**: Organization profile, establishment IDs, and editable, effective-dated statutory rules (v2026.1).

---

## 6. How to Run the Complete System

### Quick Start (Single Command):
```bash
./start.sh
```

### Or Run Services Separately:

**Terminal 1 — C++ Engine & Backend API:**
```bash
cd backend
npm install
npm start
# Server listens on http://localhost:5001 (connected to MongoDB Atlas)
```

**Terminal 2 — React Frontend:**
```bash
cd frontend
npm install
npm run dev
# Web application opens on http://localhost:3000
```

---

## 7. Verification & Health Check

1. **Live Health Endpoint**: Visit `http://localhost:5001/api/health` to verify that the C++ Engine binary and MongoDB Atlas database connection are live and operational:
   ```json
   {
     "status": "online",
     "appName": "Salary Enroll Pay System API",
     "cppEngine": { "ready": true },
     "database": { "status": "MongoDB Atlas Connected", "readyState": 1, "name": "salary_enroll_pay" }
   }
   ```

2. **Automated End-to-End Test Suite**:
   ```bash
   cd backend
   npm run test:mongo
   ```
   Executes all 15 real MongoDB database tests (Auth, Employee CRUD, duplicate validation, document uploads, attendance proration, C++ IPC engine, Draft/Finalized states, statutory ECR/XLSX exports, and zero sample-data cleanup).

3. **C++ OOP Engine Self-Tests**:
   ```bash
   cd cpp_engine
   ./bin/payroll_engine --test
   ```
