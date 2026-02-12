# LinkedIn POST API Debug

## Issue
POST requests to LinkedIn API timeout after ~10 seconds.

## What We Have
✅ LinkedIn OAuth working
✅ Access token valid (60 days)
✅ Scope: `w_member_social` 

## Problem
`w_member_social` only allows posting to **personal profile**, NOT company pages.

## Solution
Need to add **Organization** scope:

### Required Scopes for Company Page Posting:
1. `w_member_social` - post to personal profile ✅ (we have this)
2. `w_organization_social` - post to company page ❌ (need this)

### How to Fix:
1. Go to LinkedIn Developer Portal: https://www.linkedin.com/developers/apps
2. Click "ArcadiaB Social" app
3. Go to "Products" tab
4. Request: **Marketing Developer Platform** product
   - This gives `w_organization_social` scope
   - Allows posting to company pages
   - Usually approved within 24-48 hours

### Alternative (Quick Test):
Try posting to Boyd's PERSONAL LinkedIn profile with current token to verify API works.

If personal posting works → it's a scope/permissions issue (need organization access)
If personal posting also fails → it's an API implementation bug

---

## Next Steps:
**Option A:** Request Marketing Developer Platform product (takes 24-48h)
**Option B:** Test posting to personal profile (5 minutes)
**Option C:** Skip LinkedIn for MVP, add later when approved

**Recommendation:** Option B (test personal), then Option C (skip for MVP)
