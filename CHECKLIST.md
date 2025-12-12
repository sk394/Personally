# ✅ Implementation Checklist

Use this checklist to ensure everything is set up correctly.

---

## 📦 Initial Setup

### 1. Database Schema

- [ ] Run migrations: `pnpm drizzle-kit push`
- [ ] Verify `project_template` table exists with unique constraint on `category`
- [ ] Verify `project` table has `template_id` foreign key

### 2. Seed Templates

- [ ] Run seed script: `pnpm seed:templates`
- [ ] Verify 4 templates created:
  - [ ] Loans (category: `loans`)
  - [ ] Splitwise (category: `splitwise`)
  - [ ] EMI Tracker (category: `emi`)
  - [ ] Expense Tracking (category: `expense_tracking`)

**Verification SQL:**

```sql
SELECT name, category, is_default FROM project_template;
```

Expected: 4 rows with `is_default = true`

---

## 🧪 Testing New User Flow

### 3. Test User Signup

- [ ] Create a new test user account
- [ ] Check server logs for:
  ```
  🎯 Creating default projects for user: <user-id>
  ✓ Created project: "Loans" (project-id)
  ✓ Created project: "Splitwise" (project-id)
  ✓ Created project: "EMI Tracker" (project-id)
  ✓ Created project: "Expense Tracking" (project-id)
  ✅ Successfully created 4 default projects for user
  ```
- [ ] No errors in console

### 4. Verify Projects Created

**SQL Verification:**

```sql
SELECT
  u.email,
  p.title,
  pt.category,
  p.created_at
FROM project p
JOIN "user" u ON p.user_id = u.id
LEFT JOIN project_template pt ON p.template_id = pt.id
WHERE u.email = 'test-user@example.com';
```

Expected: 4 projects for the test user

### 5. Test Loans Feature

- [ ] Navigate to `/dashboard/loans` (no redirect!)
- [ ] See loan statistics cards (all zeros)
- [ ] Click "Add Loan" button
- [ ] Dialog opens without delay
- [ ] Can create a loan successfully
- [ ] Loan appears in the list
- [ ] Stats update correctly

---

## 🔄 Backfill Existing Users (if applicable)

### 6. Check for Existing Users

```sql
SELECT COUNT(*) FROM "user";
```

If you have existing users:

- [ ] Run backfill script: `pnpm backfill:users`
- [ ] Check output:
  ```
  📊 Backfill Summary
  ====================================
  Total users:        X
  ✅ Success:          X
  ⏭️  Skipped:          X
  ❌ Errors:           0
  ```
- [ ] Verify all existing users now have projects

---

## 🧩 Code Integration Checks

### 7. Verify Auth Hook

**File:** `src/lib/auth/auth.ts`

- [ ] Imports `createDefaultProjectsForUser`
- [ ] Calls it in `databaseHooks.user.create.after`
- [ ] Wrapped in try-catch (won't break signup if it fails)

### 8. Verify Loan Router

**File:** `src/server/routes/loan.ts`

- [ ] Imports `getUserProjectByCategory`
- [ ] No more `ensureLoansProject` mutation
- [ ] `getLoansProject` uses the helper function
- [ ] `getAll` uses the helper function
- [ ] `getStats` uses the helper function

### 9. Verify Create Loan Dialog

**File:** `src/components/project/create-loan-dialog.tsx`

- [ ] Uses `useQuery` instead of mutation
- [ ] Fetches `loansProject` on dialog open
- [ ] Button disabled when loading project
- [ ] Shows loading state while fetching project

---

## 🚀 Production Readiness

### 10. Error Handling

- [ ] Signup still works even if project creation fails
- [ ] Logs show clear error messages
- [ ] Users get welcome email regardless of project creation status

### 11. Performance

- [ ] Project creation doesn't significantly slow down signup
- [ ] Queries are fast (indexes on foreign keys)
- [ ] No N+1 queries

### 12. Documentation

- [ ] Team knows how to add new templates
- [ ] Backfill script documented for future use
- [ ] Troubleshooting guide available

---

## 🎯 Feature-Specific Tests

### For Loans Feature:

- [ ] Create borrowed loan
- [ ] Create lent loan
- [ ] View statistics
- [ ] Edit loan
- [ ] Delete loan
- [ ] Add payment
- [ ] View payment history

### For Future Features (Splitwise, EMI, Expenses):

Similar pattern - just implement routes using `getUserProjectByCategory(userId, 'category')`

---

## 📊 Monitoring

### 13. Production Monitoring

After deployment, check:

- [ ] New user signups create projects successfully
- [ ] No increase in signup errors
- [ ] Project creation time is reasonable (<1s)
- [ ] No memory leaks from project creation

**Monitoring Query:**

```sql
-- Check recent signups and their projects
SELECT
  u.email,
  u.created_at as signup_time,
  COUNT(p.id) as project_count
FROM "user" u
LEFT JOIN project p ON p.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;
```

Expected: Every user should have 4 projects

---

## 🎉 Final Verification

### All Systems Go! ✅

- [ ] Templates seeded
- [ ] New users get projects automatically
- [ ] Existing users backfilled (if applicable)
- [ ] Loans feature works perfectly
- [ ] No errors in production logs
- [ ] Team trained on the system

---

## 🆘 Rollback Plan (if needed)

If something goes wrong:

1. **Stop new signups** from creating projects:

   ```typescript
   // In src/lib/auth/auth.ts
   // Comment out the project creation call:
   // await createDefaultProjectsForUser(user.id)
   ```

2. **Revert to old loan router** (git):

   ```bash
   git checkout HEAD~1 -- src/server/routes/loan.ts
   ```

3. **Fix issues** and try again

---

## 📝 Notes

Use this space to track your progress:

```
Date: ________________
Completed by: ________________
Issues encountered: ________________
Resolution: ________________
Sign-off: ________________
```

---

**Need Help?**

- See `QUICK_START.md` for quick reference
- See `IMPLEMENTATION_SUMMARY.md` for detailed explanation
- See `PROJECT_TEMPLATES_SETUP.md` for comprehensive guide
