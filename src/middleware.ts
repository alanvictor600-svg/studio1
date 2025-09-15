import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // A verificação de segurança agora é tratada inteiramente no lado do cliente,
  // dentro dos layouts de rota protegida. Isso evita loops de redirecionamento
  // causados pela dessincronização entre o estado do servidor (middleware)
  // e o estado do cliente (hooks do Firebase).
  return NextResponse.next();
}

// Configuração do Middleware
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * - logo.png (arquivo de logo)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
