"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="card max-w-sm space-y-3 text-center">
        <h1 className="h2">Kichu ekta vul hoyeche</h1>
        <p className="muted">App update hoye thakte pare. Page ta reload korun.</p>
        <div className="flex justify-center gap-2">
          <button className="btn-primary" onClick={() => location.reload()}>Reload</button>
          <button className="btn-ghost" onClick={() => reset()}>Abar cheshta</button>
        </div>
      </div>
    </main>
  );
}
