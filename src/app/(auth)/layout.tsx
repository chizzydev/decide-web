// decide-web/src/app/(auth)/layout.tsx
// Auth pages layout — no navbar, no mobile nav.
// Clean centered layout for login, register, forgot/reset password.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}