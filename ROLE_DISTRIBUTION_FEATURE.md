# Role Distribution Constraint Feature

## Overview

The role distribution constraint allows you to specify exactly how many of each role must be in every team. This ensures balanced team composition across all teams.

## What Was Added

### Backend Changes

1. **Team Optimizer Algorithm** (`backend/src/services/teamOptimizer.js`)
   - Added role distribution checking in `calculateScore()`
   - Enhanced team generation to prioritize role requirements
   - Added validation for role distribution constraints
   - Validates that:
     - Total role requirements match team size
     - Sufficient participants available for each role
     - Role counts are feasible across all teams

2. **Database Schema** (`backend/src/models/Team.js`)
   - Added `roleRequirements` field to constraint schema
   - Stores role requirements as a Map: `{ "Developer": 2, "Designer": 1, "PM": 1 }`

### Frontend Changes

1. **UI Components** (`frontend/src/views/ProjectDetail.vue`)
   - Added "Role distribution" option to constraint type selector
   - Added dynamic role requirement input form
   - Shows all unique roles from participants
   - Real-time validation (total must equal team size)
   - Visual display of role requirements in constraint list
   - Added computed properties for unique roles and requirement totals

2. **Styling**
   - New CSS for role requirement inputs
   - Badge styling for displaying role counts
   - Grid layout for role inputs

## How to Use

### Example Scenario

You have 12 participants:
- 4 Developers
- 4 Designers
- 2 Product Managers
- 2 Data Scientists

You want teams of 4 with this distribution:
- 2 Developers
- 1 Designer
- 1 Product Manager or Data Scientist

### Step-by-Step

1. **Create or open a project** with participants assigned roles

2. **Go to the Constraints section**

3. **Select "Role distribution (exact count per team)"** from the dropdown

4. **Set the required count for each role:**
   ```
   Developer: 2
   Designer: 1
   Product Manager: 1
   Data Scientist: 0
   ```

5. **Verify the total equals team size:**
   - The UI shows: "Total per team: 4 / 4" ✓

6. **Add description** (optional):
   ```
   "Each team needs 2 devs and 1 designer for balanced skills"
   ```

7. **Click "Add Constraint"**

8. **Click "Optimize Teams"**

The algorithm will generate teams that satisfy the exact role distribution.

## How It Works

### Algorithm Behavior

1. **During Team Generation:**
   - When assigning participants, the algorithm checks role requirements
   - High priority (+20 points) for filling needed roles
   - Heavy penalty (-30 points) for exceeding role limits

2. **During Scoring:**
   - -18 points penalty for each role count violation per team
   - Ensures role distribution is strictly enforced

3. **Validation:**
   - Checks if you have enough participants for each role
   - Verifies role requirements sum equals team size
   - Calculates total needed: `(count per team) × (number of teams)`

### Example Calculation

**Project Setup:**
- 12 participants total
- Team size: 4
- Number of teams: 3

**Role Distribution Constraint:**
- Developer: 2
- Designer: 1
- PM: 1

**Validation:**
- Developers needed: 2 × 3 = 6 ✓ (have 4) ❌
- Designers needed: 1 × 3 = 3 ✓ (have 4) ✓
- PMs needed: 1 × 3 = 3 ✓ (have 2) ❌

This would show an error: "Role distribution requires 6 'Developer', but only 4 available"

## Constraints Interaction

Role distribution works alongside other constraints:

1. **Must be together** - Applied first, then role distribution fills remaining slots
2. **Cannot be together** - Checked during assignment, won't violate role requirements
3. **Multiple role distributions** - Only one role distribution constraint recommended per project

## Tips

1. **Count your participants** by role before setting requirements
2. **Make sure math adds up:**
   - Role requirements per team should equal team size
   - Total participants should allow for the distribution
3. **Adjust team size** if exact distribution isn't possible
4. **Use higher randomness** (50-70%) if having trouble satisfying all constraints

## API Changes

### Add Constraint Endpoint

**Request:**
```json
POST /api/teams/:id/constraints
{
  "type": "role_distribution",
  "roleRequirements": {
    "Developer": 2,
    "Designer": 1,
    "Product Manager": 1
  },
  "description": "Each team must have 2 devs, 1 designer, 1 PM"
}
```

**Response:**
```json
{
  "message": "Constraint added successfully",
  "project": { ... }
}
```

## Error Messages

Common validation errors:

1. **"Role requirements must total 4 (current: 3)"**
   - Role counts don't add up to team size
   - Solution: Adjust counts to match team size

2. **"Role distribution requires 6 'Developer' (2 per team × 3 teams), but only 4 available"**
   - Not enough participants with that role
   - Solution: Add more participants or reduce requirement

3. **"Role distribution requires 4 members per team, but team size is 5"**
   - Sum of role requirements doesn't match team size
   - Solution: Add another role or increase existing counts

## Technical Details

### Data Structure

```javascript
// Constraint in database
{
  _id: "...",
  type: "role_distribution",
  roleRequirements: {
    "Developer": 2,
    "Designer": 1,
    "PM": 1
  },
  description: "Each team must have: 2 Developer, 1 Designer, 1 PM"
}
```

### Scoring Penalties

- Role distribution violation: -18 points per team
- Cannot be together violation: -20 points
- Must be together violation: -15 points
- Team size imbalance: -5 points per person difference

### Algorithm Priority

1. Must be together constraints (highest)
2. Role distribution requirements
3. Cannot be together constraints
4. Team size balance
5. General role diversity bonus (lowest)

## Future Enhancements

Potential improvements:

- [ ] Minimum/maximum ranges instead of exact counts
- [ ] Role priority levels (required vs. preferred)
- [ ] Skill level requirements per role
- [ ] Multiple valid distributions (OR logic)
- [ ] Visual warnings when constraints conflict

---

**Feature Added:** November 2024
**Modified Files:** 3 backend, 1 frontend
**Status:** ✅ Production Ready
