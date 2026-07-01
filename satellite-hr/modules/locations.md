# 6.5 Locations

## Purpose
Represent physical places of operation for a company.

## Functional Requirements

1. A location shall represent a physical office or operational site, belonging to one jurisdiction.

2. Locations shall be company-specific by default and shall not be shared across related companies unless explicitly configured through group-company relationships.

3. A company may maintain multiple locations within the same jurisdiction.

4. **Shared Locations Across Group Companies:**
   - Shared locations may be owned by one company and referenced by other companies within the same group-company structure
   - Location sharing shall be explicitly configured with audit trail tracking
