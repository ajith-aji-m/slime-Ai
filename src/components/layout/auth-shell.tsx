import { Brand } from "./brand";

/** Full-bleed centred layout for login + onboarding (no workspace chrome). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-br from-surface to-surface-container-low px-4 py-10">
      <div className="mb-8">
        <Brand href="/" />
      </div>
      {children}
    </div>
  );
}
