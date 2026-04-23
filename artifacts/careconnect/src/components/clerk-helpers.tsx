import { useAuth } from "@clerk/react";

// ✅ Drop-in replacements for SignedIn / SignedOut
// Works with @clerk/react v6 which removed these as named exports

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return <>{children}</>;
}
