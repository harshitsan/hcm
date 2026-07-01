# Employee Asset Management — User Stories

## ASM-01: Categorize assets
- Role: Company Admin
- Story: As a Company Admin, I want to organize every asset into a defined category, so that inventory is structured, searchable, and reportable by type.
- Priority: High
- Source: FR 6.20.1 (Asset Categories)

## ASM-02: Track asset lifecycle states
- Role: Company Admin
- Story: As a Company Admin, I want each asset to move through the defined lifecycle states, so that I always know the current status of every asset and only valid transitions occur.
- Priority: High
- Source: FR 6.20.2 (Asset Lifecycle States)

## ASM-03: Issue an asset to an employee
- Role: Company Admin
- Story: As a Company Admin, I want to issue an available asset to a workforce member, so that the item is formally allocated and tracked to that person.
- Priority: High
- Source: FR 6.20.3 (Asset Transactions - Issue)

## ASM-04: Return an asset
- Role: Company Admin
- Story: As a Company Admin, I want to record the return of an issued asset with a condition check, so that it can be reassessed and returned to inventory.
- Priority: High
- Source: FR 6.20.3 (Asset Transactions - Return)

## ASM-05: Transfer an asset between employees
- Role: Company Admin
- Story: As a Company Admin, I want to transfer an asset from one employee to another, so that reassignment is tracked without a full return and reissue.
- Priority: Medium
- Source: FR 6.20.3 (Asset Transactions - Transfer)

## ASM-06: Recover an asset
- Role: Company Admin
- Story: As a Company Admin, I want to record recovery of an outstanding asset, so that unreturned items are reclaimed and accounted for.
- Priority: Medium
- Source: FR 6.20.3 (Asset Transactions - Recovery)

## ASM-07: Digitally acknowledge asset receipt
- Role: Employee (User)
- Story: As an Employee (User), I want to digitally acknowledge receipt of an asset with a condition assessment, so that there is a clear record of what I received and its state at handover.
- Priority: High
- Source: FR 6.20.4 (Asset Acknowledgements - Receipt)

## ASM-08: Digitally acknowledge asset return
- Role: Employee (User)
- Story: As an Employee (User), I want to digitally acknowledge return of an asset with a condition assessment, so that the condition at return is documented and disputes are avoided.
- Priority: Medium
- Source: FR 6.20.4 (Asset Acknowledgements - Return)

## ASM-09: Integrate asset actions with onboarding and exit workflows
- Role: Company Admin
- Story: As a Company Admin, I want asset issuance and recovery to be integrated with onboarding and exit workflows, so that assets are handled automatically at the right point in an employee's lifecycle.
- Priority: High
- Source: FR 6.20.5 (Workflow Integration)

## ASM-10: Report on asset assignment, inventory, and outstanding items
- Role: Company Admin
- Story: As a Company Admin, I want reports on asset assignment, inventory, pending acknowledgements, and overdue returns, so that I can monitor asset usage and follow up on exceptions.
- Priority: Medium
- Source: FR 6.20.6 (Reporting)

## ASM-11: Register and maintain assets
- Role: Company Admin
- Story: As a Company Admin, I want to register new assets and maintain their details, so that the inventory accurately reflects owned equipment available for allocation.
- Priority: High
- Source: FR 6.20.1, FR 6.20.2 (Asset Categories & Lifecycle - registration)

## ASM-12: Send assets for repair and back to service
- Role: Company Admin
- Story: As a Company Admin, I want to move an asset into and out of the In Repair state, so that unserviceable equipment is tracked and only serviceable assets are reissued.
- Priority: Medium
- Source: FR 6.20.2 (Asset Lifecycle States - In Repair)

## ASM-13: Retire and dispose of assets
- Role: Company Admin
- Story: As a Company Admin, I want to retire and dispose of assets at end of life, so that inventory reflects only usable equipment and disposal is auditable.
- Priority: Medium
- Source: FR 6.20.2 (Asset Lifecycle States - Retired/Disposed)

## ASM-14: Record acknowledgement on behalf of non-user employees
- Role: Company Admin
- Story: As a Company Admin, I want to capture asset receipt and return acknowledgements with condition assessments on behalf of Employee (Non-User) workforce members, so that assets issued to staff without system access are still fully documented.
- Priority: High
- Source: FR 6.20.4 (Asset Acknowledgements - Non-User)

## ASM-15: View my allocated assets
- Role: Employee (User)
- Story: As an Employee (User), I want to view the assets currently allocated to me and their acknowledgement status, so that I know what I hold and what actions I still owe.
- Priority: Medium
- Source: FR 6.20.4, FR 6.20.6 (Employee self-service view)

## ASM-16: Oversee asset inventory across companies in the group
- Role: Group Company Admin
- Story: As a Group Company Admin, I want consolidated visibility of asset inventory, assignments, and outstanding items across the companies in my group, so that I can monitor asset usage and exceptions group-wide.
- Priority: Medium
- Source: FR 6.20.6 (Reporting - group oversight)

## ASM-17: Maintain effective-dated auditable asset history
- Role: Company Admin
- Story: As a Company Admin, I want every asset transaction and state change to be persisted as an effective-dated, append-only history record, so that I can reconstruct an asset's exact status and holder as of any past date and trust the audit trail.
- Priority: High
- Source: FR 6.20.2 (L1 domain/data - bitemporal history)

## ASM-18: Enforce asset identity uniqueness and tenant isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want each asset to have a tenant-unique identifier and be stored under strict tenant-scoped isolation, so that inventories never collide across tenants and no tenant can read another tenant's assets.
- Priority: High
- Source: FR 6.20.1, FR 6.20.3 (L1 data - uniqueness, RLS, integrity)

## ASM-19: Configure the asset category taxonomy
- Role: Company Admin
- Story: As a Company Admin, I want to govern the asset category taxonomy as versioned, effective-dated configuration, so that the categories the inventory engine uses can be tailored per tenant without code changes.
- Priority: Medium
- Source: FR 6.20.1 (L2 config - category taxonomy)

## ASM-20: Configure the condition-assessment questionnaire
- Role: Company Admin
- Story: As a Company Admin, I want to configure the condition-assessment questionnaire used at receipt and return as governed config, so that the fields captured on acknowledgement match our policy without custom development.
- Priority: Medium
- Source: FR 6.20.4 (L2 config - condition questionnaire/UDF)

## ASM-21: Configure acknowledgement rules and overdue-return thresholds
- Role: Company Admin
- Story: As a Company Admin, I want to configure whether acknowledgement is required and the overdue-return thresholds as per-tenant governed config, so that the engines enforce our asset policy consistently.
- Priority: Medium
- Source: FR 6.20.4, FR 6.20.6 (L2 config - ack toggles, overdue thresholds)

## ASM-22: Receive notifications for pending acknowledgements and overdue returns
- Role: Employee (User)
- Story: As an Employee (User), I want to be notified when I have a pending asset acknowledgement or an overdue return, so that I act on my outstanding asset obligations without manual chasing.
- Priority: Medium
- Source: FR 6.20.4, FR 6.20.6 (L3 Notification/Template engine)

## ASM-23: Enforce valid lifecycle transitions via the rules engine
- Role: Company Admin
- Story: As a Company Admin, I want asset lifecycle transitions to be validated against a configurable decision table, so that only permitted state changes execute and invalid ones are blocked consistently.
- Priority: High
- Source: FR 6.20.2 (L3 Rules engine - transition decision table)

## ASM-24: Complete the dynamic condition-assessment form
- Role: Employee (User)
- Story: As an Employee (User), I want the acknowledgement screen to render the condition-assessment form dynamically from configuration, so that I capture exactly the required condition details at receipt and return.
- Priority: Medium
- Source: FR 6.20.4 (L3 Forms/Dynamic-Fields engine)

## ASM-25: Drive asset issuance and recovery tasks through the workflow engine
- Role: Company Admin
- Story: As a Company Admin, I want onboarding and exit workflows to generate and track asset issuance and recovery tasks via the workflow engine reading configured steps, so that asset handling is orchestrated automatically at the right lifecycle point.
- Priority: High
- Source: FR 6.20.5 (L3 Workflow/Approval engine)

## ASM-26: Oversee asset inventory and exceptions across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want consolidated, read-consistent visibility of asset inventory, assignments, pending acknowledgements, and overdue returns across all group companies and companies in my portfolio, so that I can monitor asset utilisation and exceptions portfolio-wide without taking over operational control.
- Priority: Medium
- Source: FR 6.20.6 (Reporting - portfolio oversight, L4 presentation)
