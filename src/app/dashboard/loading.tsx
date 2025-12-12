
'use client';

// Este componente é exibido AUTOMATICAMENTE pelo Next.js enquanto a página (`page.tsx`) carrega.
// Ele é renderizado DENTRO do layout (`layout.tsx`).
export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <p className="text-white text-xl">Carregando painel...</p>
        <p className="text-white/70 text-sm">Buscando seus dados e bilhetes.</p>
      </div>
    </div>
  );
}
