# Page and Route Discovery Report

Generated on: 2025-08-30T10:41:15.335Z

## Summary

- **Total Pages**: 29
- **Total Routes**: 17
- **Translation Keys Found**: 3
- **Hardcoded Strings Found**: 31
- **Translation Coverage**: 8.82%

## Routes by Category

- **auth**: 4 routes
- **other**: 7 routes
- **main**: 4 routes
- **reports**: 1 routes
- **settings**: 1 routes

## Routes by Priority

- **high**: 4 routes
- **low**: 9 routes
- **medium**: 4 routes

## Detailed Route Analysis

### /login (Login)

- **File**: /app/src/pages/Login.tsx
- **Category**: auth
- **Priority**: high
- **Translation Keys**: 2
- **Hardcoded Strings**: 7

**Translation Keys Used**:
- `app.title`
- `auth.login`

**Hardcoded Strings Found**:
- "{showPassword ? ("
- "{isLoggingIn ? ("
- "text-red-600"
- "border-red-500 focus:border-red-500 focus:ring-red-500"
- "Username must be at least 3 characters"
- "Username can only contain letters, numbers, and underscores"
- "Password must be at least 6 characters"

### /register (Register)

- **File**: /app/src/pages/Register.tsx
- **Category**: auth
- **Priority**: high
- **Translation Keys**: 0
- **Hardcoded Strings**: 12

**Hardcoded Strings Found**:
- "{showPassword ? ("
- "{showConfirmPassword ? ("
- "{isRegistering ? ("
- "text-red-600"
- "border-red-500 focus:border-red-500 focus:ring-red-500"
- "First name must be at least 2 characters"
- "Last name must be at least 2 characters"
- "Invalid email address"
- "Username must be at least 3 characters"
- "Username can only contain letters, numbers, and underscores"
- ... and 2 more

### /forgot-password (ForgotPassword)

- **File**: /app/src/pages/ForgotPassword.tsx
- **Category**: auth
- **Priority**: low
- **Translation Keys**: 0
- **Hardcoded Strings**: 4

**Hardcoded Strings Found**:
- "{isSubmitting ? ("
- "text-red-600"
- "border-red-500 focus:border-red-500 focus:ring-red-500"
- "Invalid email address"

### /reset-password (ResetPassword)

- **File**: /app/src/pages/ResetPassword.tsx
- **Category**: auth
- **Priority**: low
- **Translation Keys**: 1
- **Hardcoded Strings**: 8

**Translation Keys Used**:
- `token`

**Hardcoded Strings Found**:
- "{showPassword ? ("
- "{showConfirmPassword ? ("
- "{isSubmitting ? ("
- "h-10 w-10 text-white"
- "text-red-600"
- "border-red-500 focus:border-red-500 focus:ring-red-500"
- "Password must be at least 8 characters"
- "Password must contain uppercase, lowercase, and number"

### / (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: other
- **Priority**: high
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /dashboard (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: main
- **Priority**: high
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /inventory/* (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: main
- **Priority**: medium
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /universal-inventory (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: other
- **Priority**: low
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /customers (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: main
- **Priority**: medium
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /invoices (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: main
- **Priority**: medium
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /accounting/* (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: other
- **Priority**: low
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /reports/* (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: reports
- **Priority**: medium
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /settings/* (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: settings
- **Priority**: low
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /sms/* (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: other
- **Priority**: low
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /business-adaptability (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: other
- **Priority**: low
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### /system-administration (/AuthGuard)

- **File**: /app/src/components/auth/AuthGuard.tsx
- **Category**: other
- **Priority**: low
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

### * (Navigate)

- **File**: Not found
- **Category**: other
- **Priority**: low
- **Translation Keys**: 0
- **Hardcoded Strings**: 0

## Translation Gaps

### Routes with Most Hardcoded Strings

- **/register** (Register): 12 hardcoded strings
- **/reset-password** (ResetPassword): 8 hardcoded strings
- **/login** (Login): 7 hardcoded strings
- **/forgot-password** (ForgotPassword): 4 hardcoded strings

### High Priority Routes Needing Translation

- **/login**: 7 strings need translation
- **/register**: 12 strings need translation

## Recommendations

1. **Immediate Action Required**: Focus on high-priority routes with hardcoded strings
2. **Translation Keys**: Create translation keys for the 31 hardcoded strings found
3. **Component Audit**: Review components with the most hardcoded strings
4. **Systematic Approach**: Process routes by category to ensure consistent translation coverage

---

*This report was generated automatically by the Page Route Discovery tool.*
