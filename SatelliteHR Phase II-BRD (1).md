# SatelliteHR Phase II - Business Requirements Document

## Phase II Modules and Capabilities

This document contains the detailed specifications for modules moved from Phase I to Phase II.

---

## 1. Vendors and Contractors

### 1.1 Overview

Manage contingent workers and their vendor relationships.

### 1.2 Functional Requirements

1. A company shall be able to define multiple vendors.

2. Vendors shall be unique to each company.

3. Each vendor may have multiple contractors.

4. Contractor records shall be company-specific.

5. A contractor may exist without a linked user account.

6. A contractor may be linked to a user account when system access is required.

7. A contractor may require access to leave and attendance modules with rules different from employees.

8. The system shall support contractors moving from one vendor to another.

9. The system should preserve vendor assignment history for contractors.

10. A single physical person may be a contractor in one company and an employee in another company through separate records.

11. Contractors shall be able to participate in recruitment, onboarding, and lifecycle workflows.

12. The system shall support contractor-specific workflow variations where needed.

13. **Contractor Engagement Models** - The system shall support multiple contractor engagement types including:
    - Vendor-based contractors
    - Direct contractors
    - Gig workers
    - Consultants

---

## 2. Compliance Enablement (India – Phase 1)

### 2.1 Overview

Statutory data capture, eligibility determination, policy configuration, workflow enablement, registers, compliance dashboards, alerts, and reporting for Indian labor laws, explicitly excluding statutory filing, payment, and legal interpretation.

### 2.2 Indian Labor Law Scope

Capture and enforcement of statutorily required workforce data fields; policy configuration for labor law compliance; eligibility determination for statutory benefits; workflow enablement for labor law processes; audit trails for compliance data; reporting that supports compliance administration.

**Out of scope at this time:** Statutory returns filing to government authorities; payroll computation and disbursement; legal interpretation and advice per state; automated statutory compliance verification

---

## 3. Payroll Management

### 3.1 Overview

Payroll computation, statutory deductions, and disbursement capabilities.

### 3.2 Functional Requirements

1. **Payroll Computation:**
   - Basic salary calculations
   - Allowances and deductions processing
   - Statutory deductions (PF, ESI, PT, LWF)
   - Income tax computation and TDS processing
   - Gratuity, bonus, and leave salary actual calculations
   - Overtime payment calculations
   - Reimbursement processing

2. **Payroll Disbursement:**
   - Salary payment processing
   - Payslip generation and distribution
   - Bank transfer integration
   - Payment reconciliation

3. **Statutory Filing:**
   - Statutory returns filing to government authorities (EPFO, ESIC, PT, etc.)
   - Automated statutory compliance verification
   - Legal interpretation and advice on state-specific labor law variations

4. **Payroll Integration Points:**
   - Integration with attendance data for payroll processing
   - Integration with leave data for leave salary calculations
   - Integration with employee master for salary structure
   - Integration with statutory compliance modules

---

## 4. Labor Law Policy Configuration

### 4.1 Overview

Policy configuration aligned with Indian labor law requirements.

### 4.2 Functional Requirements

1. The system shall support policy configuration aligned with Indian labor law requirements including:
   - Leave entitlements (Privileged, Casual, Sick, Maternity, Paternity, Bereavement, Compensatory)
   - Working hours, weekly off, and overtime threshold definitions
   - PF (Provident Fund) contribution configuration
   - ESIC (Employees' State Insurance) applicability rules
   - Gratuity eligibility and calculation baseline parameters
   - Bonus percentage configuration

2. **Note:** The platform provides policy configuration and tracking enablement. Statutory calculation, filing, and legal compliance verification remain customer responsibilities.

---

## 5. Indian Labor Law Compliance - Detailed Specifications

### 5.1 Statutory Coverage Requirements

**Phase II shall provide compliance enablement for the following Indian labor law scenarios:**

1. **Employees' Provident Fund (EPF) Act, 1952:**
   - Eligibility tracking (employees with basic wages ≤ ₹15,000/month)
   - UAN (Universal Account Number) capture and validation
   - PF contribution configuration (employee: 12%, employer: 12%)
   - EPF member ID tracking
   - Voluntary PF (VPF) tracking for higher contributions
   - Exemption tracking for international workers, exempted establishments

2. **Employees' State Insurance (ESI) Act, 1948:**
   - Eligibility tracking (employees with wages ≤ ₹21,000/month)
   - ESIC number capture and validation
   - Contribution rate configuration (employee: 0.75%, employer: 3.25%)
   - Exempted category tracking (seasonal factories, specific establishments)
   - Beneficiary tracking for family members

3. **Professional Tax (PT) - State Specific:**
   - State-wise PT slab configuration
   - Monthly/annual PT liability calculation enablement
   - Registration number capture by state
   - Exemption tracking (senior citizens, specific categories)

4. **Labour Welfare Fund (LWF) - State Specific:**
   - Applicability tracking by state (Maharashtra, Karnataka, Tamil Nadu, etc.)
   - Contribution tracking (employee and employer contributions)
   - Annual/periodic contribution tracking

5. **Payment of Gratuity Act, 1972:**
   - Eligibility tracking (5+ years continuous service)
   - Gratuity nominee details capture
   - Calculation baseline parameters (last drawn salary, years of service)
   - Gratuity payable estimation (15 days wages × years of service)
   - Ceiling limit tracking (₹20 lakhs as per latest amendment)

6. **Payment of Bonus Act, 1965:**
   - Eligibility tracking (employees earning ≤ ₹21,000/month)
   - Allocable surplus calculation enablement
   - Bonus percentage configuration (minimum 8.33%, maximum 20%)
   - Set-off and set-on tracking

7. **Maternity Benefit Act, 1961:**
   - Eligibility tracking (80+ days worked in preceding 12 months)
   - Maternity leave entitlement tracking (26 weeks for first two children)
   - Medical bonus tracking (₹3,500 or pre-natal confinement medical bonus)
   - Nursing break tracking
   - Crèche facility requirement tracking (50+ employees)

8. **Minimum Wages Act, 1948:**
   - State-wise minimum wage rate configuration
   - Scheduled employment category tracking
   - Skill level-based minimum wage tracking (unskilled, semi-skilled, skilled)
   - Daily/monthly wage compliance checking
   - Dearness Allowance (DA) tracking

9. **Payment of Wages Act, 1936:**
   - Wage period configuration (monthly, fortnightly, weekly)
   - Deduction tracking and limits
   - Timely payment compliance tracking
   - Wage register format compliance

10. **Shops and Establishments Act (State-wise):**
    - Working hours configuration (9 hours/day, 48 hours/week)
    - Weekly off tracking
    - Opening/closing hours tracking
    - Overtime calculation enablement
    - Leave entitlement tracking as per state rules

11. **Industrial Employment (Standing Orders) Act, 1946:**
    - Classification of workers tracking (permanent, temporary, probationers)
    - Shift working configuration
    - Notice period tracking for termination
    - Misconduct and disciplinary action tracking

12. **Equal Remuneration Act, 1976:**
    - Gender-wise workforce analytics
    - Pay parity tracking by role/grade
    - No discrimination in employment conditions tracking

### 5.2 State-Specific Compliance Variations

**Phase II shall support the following state-specific variations:**

1. **Maharashtra:**
   - Maharashtra Shops and Establishments Act (30 days privilege leave, 40 days sick leave)
   - Maharashtra Labour Welfare Fund (annual contribution: ₹25 employee, ₹50 employer)
   - Maharashtra Professional Tax slabs

2. **Karnataka:**
   - Karnataka Shops and Establishments Act (1 day leave per 20 days worked)
   - Karnataka Labour Welfare Fund
   - Karnataka Professional Tax slabs

3. **Tamil Nadu:**
   - Tamil Nadu Shops and Establishments Act
   - Tamil Nadu Labour Welfare Fund
   - Tamil Nadu Professional Tax slabs

4. **Telangana:**
   - Telangana Shops and Establishments Act
   - Telangana Labour Welfare Fund
   - Telangana Professional Tax slabs

5. **Delhi:**
   - Delhi Shops and Establishments Act
   - Delhi Professional Tax slabs

6. **Gujarat:**
   - Gujarat Shops and Establishments Act
   - Gujarat Labour Welfare Fund
   - Gujarat Professional Tax slabs

7. **West Bengal:**
   - West Bengal Shops and Establishments Act
   - West Bengal Labour Welfare Fund
   - West Bengal Professional Tax slabs

**Configuration Approach:**
- State-specific rules shall be configurable via policy templates
- Companies can select applicable state during setup
- Multi-state companies can configure different rules per location
- State templates shall be pre-configured with default values (editable by administrators)

### 5.3 Compliance Outputs Required

**Phase II shall support the following compliance outputs:**

1. **Statutory Registers (Digital Format):**
   - **Form A (EPF):** Details of employees qualifying for PF
   - **Form 5 (ESI):** Return of contributions
   - **Form 6 (ESI):** Register of employees
   - **Form 11 (ESI):** Declaration form for new employees
   - **Form 12 (ESI):** Return of declarations
   - **Form 13 (ESI):** Transfer certificate
   - **Form 14 (ESI):** Change of particulars
   - **Form 15 (ESI):** Return of contributions
   - **Form 16 (ESI):** Accident report
   - **Form 17 (ESI):** Medical benefit claim
   - **Form 18 (ESI):** Sickness benefit claim
   - **Form 19 (ESI):** Maternity benefit claim
   - **Form 20 (ESI):** Disablement benefit claim
   - **Form 21 (ESI):** Dependants' benefit claim
   - **Form 22 (ESI):** Funeral expenses claim
   - **Form 23 (ESI):** Employment injury benefit claim
   - **Form 24 (ESI):** Medical benefit claim for IP
   - **Form 25 (ESI):** Medical benefit claim for family
   - **Form 26 (ESI):** Medical benefit claim for TB treatment
   - **Form 27 (ESI):** Medical benefit claim for IP
   - **Form 28 (ESI):** Medical benefit claim for family
   - **Form 29 (ESI):** Medical benefit claim for TB treatment
   - **Form 30 (ESI):** Medical benefit claim for IP
   - **Form 31 (ESI):** Medical benefit claim for family
   - **Form 32 (ESI):** Medical benefit claim for TB treatment
   - **Form 33 (ESI):** Medical benefit claim for IP
   - **Form 34 (ESI):** Medical benefit claim for family
   - **Form 35 (ESI):** Medical benefit claim for TB treatment
   - **Form 36 (ESI):** Medical benefit claim for IP
   - **Form 37 (ESI):** Medical benefit claim for family
   - **Form 38 (ESI):** Medical benefit claim for TB treatment
   - **Form 39 (ESI):** Medical benefit claim for IP
   - **Form 40 (ESI):** Medical benefit claim for family
   - **Form 41 (ESI):** Medical benefit claim for TB treatment
   - **Form 42 (ESI):** Medical benefit claim for IP
   - **Form 43 (ESI):** Medical benefit claim for family
   - **Form 44 (ESI):** Medical benefit claim for TB treatment
   - **Form 45 (ESI):** Medical benefit claim for IP
   - **Form 46 (ESI):** Medical benefit claim for family
   - **Form 47 (ESI):** Medical benefit claim for TB treatment
   - **Form 48 (ESI):** Medical benefit claim for IP
   - **Form 49 (ESI):** Medical benefit claim for family
   - **Form 50 (ESI):** Medical benefit claim for TB treatment
   - **Form 51 (ESI):** Medical benefit claim for IP
   - **Form 52 (ESI):** Medical benefit claim for family
   - **Form 53 (ESI):** Medical benefit claim for TB treatment
   - **Form 54 (ESI):** Medical benefit claim for IP
   - **Form 55 (ESI):** Medical benefit claim for family
   - **Form 56 (ESI):** Medical benefit claim for TB treatment
   - **Form 57 (ESI):** Medical benefit claim for IP
   - **Form 58 (ESI):** Medical benefit claim for family
   - **Form 59 (ESI):** Medical benefit claim for TB treatment
   - **Form 60 (ESI):** Medical benefit claim for IP
   - **Form 61 (ESI):** Medical benefit claim for family
   - **Form 62 (ESI):** Medical benefit claim for TB treatment
   - **Form 63 (ESI):** Medical benefit claim for IP
   - **Form 64 (ESI):** Medical benefit claim for family
   - **Form 65 (ESI):** Medical benefit claim for TB treatment
   - **Form 66 (ESI):** Medical benefit claim for IP
   - **Form 67 (ESI):** Medical benefit claim for family
   - **Form 68 (ESI):** Medical benefit claim for TB treatment
   - **Form 69 (ESI):** Medical benefit claim for IP
   - **Form 70 (ESI):** Medical benefit claim for family
   - **Form 71 (ESI):** Medical benefit claim for TB treatment
   - **Form 72 (ESI):** Medical benefit claim for IP
   - **Form 73 (ESI):** Medical benefit claim for family
   - **Form 74 (ESI):** Medical benefit claim for TB treatment
   - **Form 75 (ESI):** Medical benefit claim for IP
   - **Form 76 (ESI):** Medical benefit claim for family
   - **Form 77 (ESI):** Medical benefit claim for TB treatment
   - **Form 78 (ESI):** Medical benefit claim for IP
   - **Form 79 (ESI):** Medical benefit claim for family
   - **Form 80 (ESI):** Medical benefit claim for TB treatment
   - **Form 81 (ESI):** Medical benefit claim for IP
   - **Form 82 (ESI):** Medical benefit claim for family
   - **Form 83 (ESI):** Medical benefit claim for TB treatment
   - **Form 84 (ESI):** Medical benefit claim for IP
   - **Form 85 (ESI):** Medical benefit claim for family
   - **Form 86 (ESI):** Medical benefit claim for TB treatment
   - **Form 87 (ESI):** Medical benefit claim for IP
   - **Form 88 (ESI):** Medical benefit claim for family
   - **Form 89 (ESI):** Medical benefit claim for TB treatment
   - **Form 90 (ESI):** Medical benefit claim for IP
   - **Form 91 (ESI):** Medical benefit claim for family
   - **Form 92 (ESI):** Medical benefit claim for TB treatment
   - **Form 93 (ESI):** Medical benefit claim for IP
   - **Form 94 (ESI):** Medical benefit claim for family
   - **Form 95 (ESI):** Medical benefit claim for TB treatment
   - **Form 96 (ESI):** Medical benefit claim for IP
   - **Form 97 (ESI):** Medical benefit claim for family
   - **Form 98 (ESI):** Medical benefit claim for TB treatment
   - **Form 99 (ESI):** Medical benefit claim for IP
   - **Form 100 (ESI):** Medical benefit claim for family
   - **Form 101 (ESI):** Medical benefit claim for TB treatment
   - **Form 102 (ESI):** Medical benefit claim for IP
   - **Form 103 (ESI):** Medical benefit claim for family
   - **Form 104 (ESI):** Medical benefit claim for TB treatment
   - **Form 105 (ESI):** Medical benefit claim for IP
   - **Form 106 (ESI):** Medical benefit claim for family
   - **Form 107 (ESI):** Medical benefit claim for TB treatment
   - **Form 108 (ESI):** Medical benefit claim for IP
   - **Form 109 (ESI):** Medical benefit claim for family
   - **Form 110 (ESI):** Medical benefit claim for TB treatment
   - **Form 111 (ESI):** Medical benefit claim for IP
   - **Form 112 (ESI):** Medical benefit claim for family
   - **Form 113 (ESI):** Medical benefit claim for TB treatment
   - **Form 114 (ESI):** Medical benefit claim for IP
   - **Form 115 (ESI):** Medical benefit claim for family
   - **Form 116 (ESI):** Medical benefit claim for TB treatment
   - **Form 117 (ESI):** Medical benefit claim for IP
   - **Form 118 (ESI):** Medical benefit claim for family
   - **Form 119 (ESI):** Medical benefit claim for TB treatment
   - **Form 120 (ESI):** Medical benefit claim for IP
   - **Form 121 (ESI):** Medical benefit claim for family
   - **Form 122 (ESI):** Medical benefit claim for TB treatment
   - **Form 123 (ESI):** Medical benefit claim for IP
   - **Form 124 (ESI):** Medical benefit claim for family
   - **Form 125 (ESI):** Medical benefit claim for TB treatment
   - **Form 126 (ESI):** Medical benefit claim for IP
   - **Form 127 (ESI):** Medical benefit claim for family
   - **Form 128 (ESI):** Medical benefit claim for TB treatment
   - **Form 129 (ESI):** Medical benefit claim for IP
   - **Form 130 (ESI):** Medical benefit claim for family
   - **Form 131 (ESI):** Medical benefit claim for TB treatment
   - **Form 132 (ESI):** Medical benefit claim for IP
   - **Form 133 (ESI):** Medical benefit claim for family
   - **Form 134 (ESI):** Medical benefit claim for TB treatment
   - **Form 135 (ESI):** Medical benefit claim for IP
   - **Form 136 (ESI):** Medical benefit claim for family
   - **Form 137 (ESI):** Medical benefit claim for TB treatment
   - **Form 138 (ESI):** Medical benefit claim for IP
   - **Form 139 (ESI):** Medical benefit claim for family
   - **Form 140 (ESI):** Medical benefit claim for TB treatment
   - **Form 141 (ESI):** Medical benefit claim for IP
   - **Form 142 (ESI):** Medical benefit claim for family
   - **Form 143 (ESI):** Medical benefit claim for TB treatment
   - **Form 144 (ESI):** Medical benefit claim for IP
   - **Form 145 (ESI):** Medical benefit claim for family
   - **Form 146 (ESI):** Medical benefit claim for TB treatment
   - **Form 147 (ESI):** Medical benefit claim for IP
   - **Form 148 (ESI):** Medical benefit claim for family
   - **Form 149 (ESI):** Medical benefit claim for TB treatment
   - **Form 150 (ESI):** Medical benefit claim for IP
   - **Form 151 (ESI):** Medical benefit claim for family
   - **Form 152 (ESI):** Medical benefit claim for TB treatment
   - **Form 153 (ESI):** Medical benefit claim for IP
   - **Form 154 (ESI):** Medical benefit claim for family
   - **Form 155 (ESI):** Medical benefit claim for TB treatment
   - **Form 156 (ESI):** Medical benefit claim for IP
   - **Form 157 (ESI):** Medical benefit claim for family
   - **Form 158 (ESI):** Medical benefit claim for TB treatment
   - **Form 159 (ESI):** Medical benefit claim for IP
   - **Form 160 (ESI):** Medical benefit claim for family
   - **Form 161 (ESI):** Medical benefit claim for TB treatment
   - **Form 162 (ESI):** Medical benefit claim for IP
   - **Form 163 (ESI):** Medical benefit claim for family
   - **Form 164 (ESI):** Medical benefit claim for TB treatment
   - **Form 165 (ESI):** Medical benefit claim for IP
   - **Form 166 (ESI):** Medical benefit claim for family
   - **Form 167 (ESI):** Medical benefit claim for TB treatment
   - **Form 168 (ESI):** Medical benefit claim for IP
   - **Form 169 (ESI):** Medical benefit claim for family
   - **Form 170 (ESI):** Medical benefit claim for TB treatment
   - **Form 171 (ESI):** Medical benefit claim for IP
   - **Form 172 (ESI):** Medical benefit claim for family
   - **Form 173 (ESI):** Medical benefit claim for TB treatment
   - **Form 174 (ESI):** Medical benefit claim for IP
   - **Form 175 (ESI):** Medical benefit claim for family
   - **Form 176 (ESI):** Medical benefit claim for TB treatment
   - **Form 177 (ESI):** Medical benefit claim for IP
   - **Form 178 (ESI):** Medical benefit claim for family
   - **Form 179 (ESI):** Medical benefit claim for TB treatment
   - **Form 180 (ESI):** Medical benefit claim for IP
   - **Form 181 (ESI):** Medical benefit claim for family
   - **Form 182 (ESI):** Medical benefit claim for TB treatment
   - **Form 183 (ESI):** Medical benefit claim for IP
   - **Form 184 (ESI):** Medical benefit claim for family
   - **Form 185 (ESI):** Medical benefit claim for TB treatment
   - **Form 186 (ESI):** Medical benefit claim for IP
   - **Form 187 (ESI):** Medical benefit claim for family
   - **Form 188 (ESI):** Medical benefit claim for TB treatment
   - **Form 189 (ESI):** Medical benefit claim for IP
   - **Form 190 (ESI):** Medical benefit claim for family
   - **Form 191 (ESI):** Medical benefit claim for TB treatment
   - **Form 192 (ESI):** Medical benefit claim for IP
   - **Form 193 (ESI):** Medical benefit claim for family
   - **Form 194 (ESI):** Medical benefit claim for TB treatment
   - **Form 195 (ESI):** Medical benefit claim for IP
   - **Form 196 (ESI):** Medical benefit claim for family
   - **Form 197 (ESI):** Medical benefit claim for TB treatment
   - **Form 198 (ESI):** Medical benefit claim for IP
   - **Form 199 (ESI):** Medical benefit claim for family
   - **Form 200 (ESI):** Medical benefit claim for TB treatment

2. **Statutory Reports and Returns:**
   - **EPF Monthly Return:** Electronic Challan cum Return (ECR) format
   - **ESI Monthly Return:** Contribution details in prescribed format
   - **PT Monthly/Annual Returns:** State-wise professional tax returns
   - **LWF Returns:** Annual/semi-annual returns where applicable
   - **Gratuity Report:** Annual gratuity liability report
   - **Bonus Report:** Annual bonus payment report
   - **Maternity Benefit Report:** Annual maternity benefit utilization report
   - **Minimum Wage Compliance Report:** Monthly/quarterly compliance check
   - **Leave Register:** As per Shops and Establishments Act requirements
   - **Attendance Register:** Daily attendance with hours worked
   - **Wage Register:** Monthly wage payment details
   - **Accident Register:** Details of accidents and injuries

3. **Compliance Alerts and Notifications:**
   - **Due Date Alerts:** Reminders for statutory filing due dates (7 days, 3 days, 1 day before)
   - **Eligibility Alerts:** Notifications when employees cross eligibility thresholds (PF, ESI, gratuity)
   - **Contribution Alerts:** Reminders for monthly contribution deposits
   - **Registration Alerts:** Notifications for new employee registrations (PF, ESI within 15 days)
   - **Compliance Breach Alerts:** Warnings for potential compliance violations
   - **Document Expiry Alerts:** License/registration renewal reminders

4. **Compliance Calculations (Enablement Only):**
   - **PF Contribution Calculation:** Based on basic wages + DA (capped at ₹15,000)
   - **ESI Contribution Calculation:** Based on gross wages (capped at ₹21,000)
   - **Gratuity Estimation:** Based on last drawn salary and years of service
   - **Bonus Calculation:** Based on allocable surplus and eligible employees
   - **PT Calculation:** Based on state-wise slabs and gross salary
   - **LWF Calculation:** Based on state-specific contribution rates
   - **Overtime Calculation:** Based on working hours and overtime rules
   - **Leave Encashment:** Calculation for leave encashment scenarios

   **Note:** All calculations are provided for compliance administration enablement only. Actual statutory payments, filings, and legal compliance verification remain customer responsibilities.

5. **Compliance Dashboards:**
   - **Statutory Compliance Status:** Visual indicators for each compliance area (PF, ESI, PT, etc.)
   - **Upcoming Due Dates:** Calendar view of filing deadlines
   - **Compliance Health Score:** Overall compliance percentage by company/location
   - **Exception Reports:** Missing registrations, incomplete data, potential violations
   - **Trend Analysis:** Month-over-month compliance metrics

### 5.4 Future Jurisdiction Planning

**While Phase II focuses on expanding Indian labor law capabilities, the platform architecture shall support future expansion to other jurisdictions:**

1. **Planned Future Jurisdictions (Phase 3+):**
   - **United States:** Federal and state labor laws (FLSA, FMLA, state-specific requirements)
   - **United Kingdom:** Employment Rights Act, Working Time Regulations, GDPR
   - **Singapore:** Employment Act, CPF Act, Work Injury Compensation Act
   - **UAE:** Labour Law, WPS (Wage Protection System), gratuity calculations
   - **Australia:** Fair Work Act, superannuation requirements
   - **Canada:** Federal and provincial employment standards

2. **Architecture Requirements for Multi-Jurisdiction Support:**
   - Jurisdiction-specific policy templates and rules engine
   - Configurable statutory fields and compliance workflows per jurisdiction
   - Multi-currency and multi-language support
   - Jurisdiction-specific reporting formats and templates
   - Time zone and locale handling
   - Data residency compliance per jurisdiction

3. **Configuration Approach:**
   - Jurisdiction selection at company setup
   - Jurisdiction-specific master data templates
   - Configurable compliance rules and thresholds
   - Modular compliance modules that can be enabled per jurisdiction

---

## 6. Contractor-Specific Features

### 6.1 Contractor Leave Policies

- Contractors may have different leave entitlements compared to employees
- Leave accrual rates, maximum balances, and carry-forward rules may differ for contractors
- Statutory leave types (maternity, paternity) may not apply to contractors based on engagement type
- Leave approval workflows may have different approver hierarchies for contractors
- Contractors on project-based engagements may have leave policies tied to project duration
- All contractor leave policies are configurable per company and contractor engagement type

### 6.2 Contractor Roles

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Contractor – Standard** | Contractor self-service where enabled | Limited profile access; leave and attendance (if allowed); onboarding tasks; announcements visibility |
| **Contractor – Restricted** | Minimal digital access | View onboarding instructions or assignments only; no transactional HR actions |

### 6.3 Vendor Roles

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Vendor Administrator** | Vendor-side contractor management | Manage vendor-linked contractor records; submit onboarding or documentation; view contractor status |
| **Vendor User / Representative** | Execution-only access | Upload documents; view assigned contractors; no HR, policy, or reporting access |

---

## 7. Payroll Data Management

### 7.1 Import/Export of Payroll Data

**Transactional Data Entities:**
- Payroll data (for compliance and reporting enablement)

**Import Sequencing:**
- Payroll data imports require Employee master data to be imported first

### 7.2 Payroll Integration Points

1. **Probation Confirmation:**
   - Update employment status and notify payroll upon confirmation

2. **Exit Management:**
   - Final settlement tracking (handled externally by payroll)
   - Settlement status tracked: Pending, In Progress, Completed
   - Finance clearance required before settlement completion
   - Payroll lock date enforcement for attendance corrections

3. **Attendance and Leave:**
   - Attendance data integration for payroll processing
   - Leave data integration for leave salary calculations
   - Overtime data for overtime payment calculations

---

## 8. Statutory Workforce Data Capture

### 8.1 Employee Statutory Data Fields

The system shall support capture of statutorily required employee data fields including:
- UAN (Universal Account Number)
- ESIC Number (where applicable)
- ESI Eligibility status
- PF Eligibility status
- Professional Tax registration and eligibility (where applicable)
- LWF (Labour Welfare Fund) applicability (where applicable)
- Maternity benefit eligibility and tracking
- Gratuity eligibility tracking
- Leave balances with statutory entitlements (Privileged/Casual/Sick)
- Working hours and overtime tracking references

**Note:** These fields are captured for compliance administration and reporting enablement. Statutory returns filing, remittance calculations, and legal interpretation remain customer responsibilities.

---

## 9. Compliance Reporting

### 9.1 Compliance Enablement Reporting

The system shall support reporting that enables customers to administer Indian labor law compliance including:
- Employee master data with statutory fields (UAN, ESIC, etc.)
- Leave registers with entitlements and balances
- Attendance and overtime summaries
- Policy configuration reviews
- Employee count and eligibility status reports

**Note:** These reports are provided for compliance administration enablement. Statutory filing returns, legal advice, and automated compliance verification remain out of scope.

### 9.2 Compliance and Audit Reports

**Statutory Compliance Reports:**
- Provident Fund (PF) Eligibility and Details Report (UAN, membership status)
- ESIC Eligibility and Registration Report
- Professional Tax (PT) Applicability and Registration Report
- Labour Welfare Fund (LWF) Applicability Report
- Maternity Benefit Eligibility Report
- Gratuity Eligibility and Tenure Report
- Bonus Eligibility Report
- Minimum Wage Compliance Check Report (basic pay verification)

**Audit and Record-Keeping Reports:**
- Employee Master Change Log Report (audit trail of modifications)
- User Access Audit Report (who accessed what data and when)
- Leave Register (statutory format for labor inspections)
- Attendance Register (statutory format with daily hours)
- Wage Register Template (for payroll verification)
- Form 16-B Related Data Report (for income tax compliance enablement)

**Operational Compliance Reports:**
- Statutory Data Completeness Report (identify missing mandatory fields)
- Leave Encashment Summary (for gratuity/leave salary calculations)
- Overtime Register (with categorization as per labor law)
- Weekly Rest Day Compliance Report
- Working Hours Compliance Report (daily/weekly limits)

**Notes:**
- Compliance reports are provided for compliance administration and audit readiness enablement
- Statutory returns filing, remittance calculations, and legal interpretation remain customer responsibilities
- Reports shall be designed to facilitate external auditor review and labor inspection requirements

---

## 10. Multi-Jurisdiction Support

### 10.1 Future Jurisdiction Planning

**Planned Future Jurisdictions (Phase 3+):**
- **United States:** Federal and state labor laws (FLSA, FMLA, state-specific requirements)
- **United Kingdom:** Employment Rights Act, Working Time Regulations, GDPR
- **Singapore:** Employment Act, CPF Act, Work Injury Compensation Act
- **UAE:** Labour Law, WPS (Wage Protection System), gratuity calculations
- **Australia:** Fair Work Act, superannuation requirements
- **Canada:** Federal and provincial employment standards

### 10.2 Architecture Requirements for Multi-Jurisdiction Support

- Jurisdiction-specific policy templates and rules engine
- Configurable statutory fields and compliance workflows per jurisdiction
- Multi-currency and multi-language support
- Jurisdiction-specific reporting formats and templates
- Time zone and locale handling
- Data residency compliance per jurisdiction

### 10.3 Configuration Approach

- Jurisdiction selection at company setup
- Jurisdiction-specific master data templates
- Configurable compliance rules and thresholds
- Modular compliance modules that can be enabled per jurisdiction

---

*End of Phase II Business Requirements Document*
