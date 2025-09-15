import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este nome de cookie é um exemplo. O contexto de autenticação no cliente
// o definirá para sinalizar ao middleware que uma sessão *pode* existir.
// A verificação real da sessão ainda é feita no cliente pelo Firebase SDK.
const AUTH_COOKIE_NAME = '__session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);

  // Rotas que exigem autenticação
  const protectedRoutes = ['/admin', '/dashboard', '/cliente', '/vendedor', '/solicitar-saldo'];

  // Se o usuário tenta acessar uma rota protegida e NÃO tem o cookie de sessão,
  // redireciona para a página de login, guardando a página que ele queria acessar.
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário tem um cookie de sessão e tenta acessar /login ou /cadastrar,
  // apenas o deixamos prosseguir. A própria página de login irá redirecioná-lo
  // se ele estiver de fato autenticado no cliente. Isso quebra o loop.
  if (sessionCookie && (pathname === '/login' || pathname === '/cadastrar')) {
    return NextResponse.next();
  }

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
