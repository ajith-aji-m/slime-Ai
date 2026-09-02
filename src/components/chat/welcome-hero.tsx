import { Icon } from "@/components/ui";

export function WelcomeHero() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl text-center">
      <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-low text-primary shadow-sm">
        <Icon name="auto_awesome" size={32} />
      </div>
      <h2 className="text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
        Welcome back.
      </h2>
      <p className="mt-3 text-xl font-normal text-on-surface-variant md:text-2xl">
        How can we accelerate your work today?
      </p>
    </div>
  );
}
