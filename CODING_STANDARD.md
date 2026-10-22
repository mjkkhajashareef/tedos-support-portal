# TEDOS Support Project-Wide Coding Standard
## Version 1.0.0 (Foundation Certified)

This document establishes the mandatory engineering and coding standards for all developers contributing to the **TEDOS Support** portal. Adherence to these guidelines is strictly audited during automated build verification.

---

## 1. Naming Conventions

Consistency in identifiers prevents syntax confusion and optimizes codebase scanability.

| Artifact | Convention | Case Style | Example |
| :--- | :--- | :--- | :--- |
| **Folders** | Kebab Case | `lowercase-with-hyphens` | `components/views`, `utils/formatting` |
| **Files** | Camel/Pascal Case | Aligned to content type | `appConfig.ts`, `LoginView.tsx` |
| **React Components** | Pascal Case | `UpperCamelCase` | `MaterialCard.tsx`, `Header.tsx` |
| **Types / Interfaces** | Pascal Case | `UpperCamelCase` | `UserSession`, `SupportClient` |
| **Enum Declarations** | Pascal Case | `UpperCamelCase` | `ClientHealthStatus`, `UserRole` |
| **Enum Members** | Scream Case | `UPPERCASE_WITH_UNDERSCORES` | `UserRole.SUPPORT_EXECUTIVE` |
| **Global Constants** | Scream Case | `UPPERCASE_WITH_UNDERSCORES` | `TEDOS_BRAND_ASSETS`, `SYSTEM_ERRORS` |
| **Variables / State** | Camel Case | `lowerCamelCase` | `activeTheme`, `isSubmitting` |
| **Functions** | Camel Case | `lowerCamelCase` | `formatShortDate`, `generateId` |
| **Custom Hooks** | Camel Case | Prefixed with `use` | `useApp`, `useLocalStorage` |

---

## 2. Directory & Component Design Rules

### 2.1 File Separation Policy
- **No Mega-Files**: Files must never exceed 500 lines of code. If a file grows beyond 500 lines, sub-components, types, and utility functions must be aggressively refactored into dedicated files.
- **Explicit Type Declarations**: All shared or persistent types must be defined in `/src/types/index.ts`. Never declare shared interfaces inline inside component files.

### 2.2 Functional Component Paradigm
- All React components **must** be written as functional components using the standard ES6 arrow function declaration:
  ```tsx
  export const ComponentName: React.FC<ComponentProps> = ({ propA, propB }) => { ... };
  ```
- **Implicit Keys**: Always provide unique, stable `id` or `key` attributes when iterating over list elements (avoid using array indices as keys).
- **Element Identifiers**: Meaningful interactive elements (buttons, inputs, cards) must carry explicit `id` parameters for automated end-to-end testing and localized selector target styling.

---

## 3. Asynchronous Functions & API Layer Standards

### 3.1 Fetch Protocol
- Direct execution of standard `fetch` is strictly forbidden in UI view code. All outgoing transactions must be delegated through the standardized `secureFetch` wrapper in `/src/utils/helpers.ts`.
- **Typing Return Values**: Async functions returning API results must carry explicit type definitions:
  ```typescript
  export const fetchClients = async (): Promise<SupportClient[]> => {
    return await secureFetch<SupportClient[]>('/clients');
  };
  ```

### 3.2 Retries and Network Resilience
- Non-idempotent write calls (POST, PUT, DELETE) must implement transaction retry limits using our safe-retrier pattern to mitigate transient cellular or Wi-Fi disconnection drops.
- **Loading and Disabled States**: All network-bound buttons must immediately disable themselves and render a spinner/loading state upon being clicked to prevent double-submission bugs.

---

## 4. Robust Error Handling & Telemetry Logging

### 4.1 Strict Exception Staging
- Every asynchronous block, storage interaction, or parsing mechanism must be wrapped inside a `try/catch` statement.
- Captured exceptions must be parsed through `parseError(error)` to guarantee type safety before rendering alerts or logging details.

```typescript
try {
  const result = await processTransaction();
} catch (err) {
  const parsed = parseError(err);
  Logger.error('TransactionManager.submit', parsed.message, parsed);
  // Display standard system notification
}
```

### 4.2 Logging Discretion
- Console output must be routed through the customized `Logger` utility to ensure structural metadata logs.
- Direct calls to `console.log` are strictly forbidden. The system logger will automatically suppress verbose debug blocks in production environments to prevent sensitive enterprise leakages.

---

## 5. Comment and Documentation Guidelines

- **Self-Documenting Code**: Prioritize descriptive variable and function naming over inline comments.
- **JSDoc Style Headers**: Publicly exported helper methods, custom hooks, and shared providers must have a standard JSDoc header describing inputs, outputs, and behaviors:
  ```typescript
  /**
   * Transforms and standardizes international numbers to E.164 formats.
   * @param rawPhone The unsanitized phone number string.
   * @param defaultPrefix International area prefix if missing.
   * @returns Syntactically validated E.164 compliant string.
   */
  export const formatE164Phone = (rawPhone: string, defaultPrefix = '+91'): string => { ... }
  ```
- **Regulatory Marking**: Standard `@license SPDX-License-Identifier: Apache-2.0` headers must remain at the top of all newly created source files.
