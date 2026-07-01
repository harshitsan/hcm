# Employee Asset Management — User Stories

_Derived from SatelliteHR Phase I BRD — module "Employee Asset Management". 10 user stories._

---

## ASM-01: Categorize assets

**User story:** As a Company/HR Admin, I want to organize assets into defined categories, so that inventory is structured and easy to search and report on.

**Acceptance criteria:**
- Given I am registering an asset, when I select its category, then I can choose from IT Equipment, Mobile Devices, Network Equipment, Peripherals, Furniture, Security & Access, Software Licenses, and Other Equipment.
- Given an asset is saved, when I view the inventory, then each asset displays its assigned category.
- Given I filter the inventory, when I select a category, then only assets in that category are shown.

**Priority:** High
**Source:** FR 6.20.1 (Asset Categories)

---

## ASM-02: Track asset lifecycle states

**User story:** As a Company/HR Admin, I want each asset to move through defined lifecycle states, so that I always know the current status of every asset.

**Acceptance criteria:**
- Given an asset exists, when I view it, then its state is one of Available, Allocated, Issued, In Repair, Returned, Retired, or Disposed.
- Given an asset changes status, when the change is recorded, then the asset's lifecycle state is updated accordingly.
- Given I review inventory, when I filter by state, then only assets in that lifecycle state are listed.

**Priority:** High
**Source:** FR 6.20.2 (Asset Lifecycle States)

---

## ASM-03: Issue an asset to an employee

**User story:** As a Company/HR Admin, I want to issue an asset to a workforce member, so that the item is formally allocated and tracked to that person.

**Acceptance criteria:**
- Given an available asset, when I record an Issue transaction to an employee, then the asset is linked to that employee and its state reflects issuance.
- Given an issue transaction is completed, when I view the asset history, then the issue event is logged with the recipient and date.

**Priority:** High
**Source:** FR 6.20.3 (Asset Transactions — Issue)

---

## ASM-04: Return an asset

**User story:** As a Company/HR Admin, I want to record the return of an issued asset, so that it can be reassessed and returned to inventory.

**Acceptance criteria:**
- Given an issued asset, when I record a Return transaction, then the asset is unlinked from the employee and its state is updated to Returned.
- Given a return is recorded, when I view the asset history, then the return event is logged with date and returning employee.

**Priority:** High
**Source:** FR 6.20.3 (Asset Transactions — Return)

---

## ASM-05: Transfer an asset between employees

**User story:** As a Company/HR Admin, I want to transfer an asset from one employee to another, so that reassignment is tracked without a full return and reissue.

**Acceptance criteria:**
- Given an allocated asset, when I record a Transfer transaction to a new employee, then the asset ownership moves to the new employee.
- Given a transfer is completed, when I view the asset history, then both the source and destination employees are recorded with the transfer date.

**Priority:** Medium
**Source:** FR 6.20.3 (Asset Transactions — Transfer)

---

## ASM-06: Recover an asset

**User story:** As a Company/HR Admin, I want to record recovery of an asset, so that outstanding items are reclaimed and accounted for.

**Acceptance criteria:**
- Given an asset held by an employee, when I record a Recovery transaction, then the asset is marked as recovered and reflected in its lifecycle state.
- Given a recovery is recorded, when I view the asset history, then the recovery event is logged with date and employee.

**Priority:** Medium
**Source:** FR 6.20.3 (Asset Transactions — Recovery)

---

## ASM-07: Digitally acknowledge asset receipt

**User story:** As an Employee, I want to digitally acknowledge receipt of an asset with a condition assessment, so that there is a clear record of what I received and its state.

**Acceptance criteria:**
- Given an asset is issued to me, when I acknowledge receipt, then my digital acknowledgement and a condition assessment are captured against the asset.
- Given I have acknowledged an asset, when the record is saved, then the acknowledgement is timestamped and linked to me and the asset.

**Priority:** High
**Source:** FR 6.20.4 (Asset Acknowledgements)

---

## ASM-08: Digitally acknowledge asset return

**User story:** As an Employee, I want to digitally acknowledge return of an asset with a condition assessment, so that the condition at return is documented and disputes are avoided.

**Acceptance criteria:**
- Given I am returning an asset, when I complete the return acknowledgement, then my digital acknowledgement and a condition assessment are captured.
- Given the return acknowledgement is saved, when the asset is reviewed, then the return condition is available on the asset record.

**Priority:** Medium
**Source:** FR 6.20.4 (Asset Acknowledgements)

---

## ASM-09: Integrate asset actions with onboarding and exit workflows

**User story:** As a Company/HR Admin, I want asset issuance and recovery to be integrated with onboarding and exit workflows, so that assets are handled automatically at the right point in an employee's lifecycle.

**Acceptance criteria:**
- Given an employee is onboarding, when the onboarding workflow runs, then asset issuance tasks are triggered as part of the workflow.
- Given an employee is exiting, when the exit workflow runs, then asset recovery tasks are triggered as part of the workflow.
- Given assets remain outstanding, when the exit workflow is reviewed, then unrecovered assets are surfaced for follow-up.

**Priority:** High
**Source:** FR 6.20.5 (Workflow Integration)

---

## ASM-10: Report on asset assignment, inventory, and outstanding items

**User story:** As a Company/HR Admin, I want reports on asset assignment, inventory, pending acknowledgements, and overdue returns, so that I can monitor asset usage and follow up on exceptions.

**Acceptance criteria:**
- Given assets exist, when I run the asset assignment report, then I see which assets are assigned to which employees.
- Given assets exist, when I run the inventory report, then I see all assets with their categories and lifecycle states.
- Given acknowledgements are pending, when I run the pending acknowledgements report, then I see all assets awaiting acknowledgement.
- Given returns are due, when I run the overdue returns report, then I see all assets whose return is overdue.

**Priority:** Medium
**Source:** FR 6.20.6 (Reporting)
