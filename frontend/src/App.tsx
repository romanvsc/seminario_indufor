import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { UpdatePrompt } from '@/shared/components/UpdatePrompt'

export default function App() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" width={36} height={36} />
          <span className="text-lg font-semibold text-primary">INDUFOR</span>
        </div>
        <ConnectionBadge />
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold text-primary">Sistema Integral de Gestión y Control</h1>
        <p className="mt-2 text-secondary">Fase 1 en construcción: autenticación, usuarios, roles y frentes.</p>
      </main>
      <UpdatePrompt />
    </div>
  )
}
