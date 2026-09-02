"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassPanel, Button, Icon } from "@/components/ui";
import { site } from "@/config/site";
import { useSettingsStore } from "@/stores/settings-store";

/** Mock auth — no backend. Persists the email locally and enters onboarding. */
export function LoginForm() {
  const router = useRouter();
  const setProfile = useSettingsStore((s) => s.setProfile);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (email) setProfile({ email });
    router.push("/get-started");
  }

  return (
    <GlassPanel className="w-full max-w-sm p-8">
      <h1 className="text-xl font-semibold text-on-surface">
        Sign in to {site.name}
      </h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Your workstation for multi-model AI.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-on-surface-variant">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-on-surface-variant">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none"
          />
        </label>
        <Button type="submit" size="lg" fullWidth>
          Continue
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-on-surface-variant">
        <span className="h-px flex-1 bg-outline-variant" />
        or
        <span className="h-px flex-1 bg-outline-variant" />
      </div>

      <div className="space-y-2">
        <Button variant="outline" size="lg" fullWidth iconLeft="hub">
          Continue with Google
        </Button>
        <Button variant="outline" size="lg" fullWidth iconLeft="code">
          Continue with GitHub
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-on-surface-variant">
        <Link href="/chat" className="inline-flex items-center gap-1 text-primary hover:underline">
          Skip for now <Icon name="chevron_right" size={14} />
        </Link>
      </p>
    </GlassPanel>
  );
}
