# Firebase Studio

Este é um projeto Next.js no Firebase Studio.

## Primeiros Passos

Para começar a desenvolver, dê uma olhada no arquivo principal da página em `src/app/page.tsx`.

## Arquitetura e Deploy

Este projeto utiliza uma arquitetura híbrida, onde o frontend e o backend são construídos com Next.js e hospedados inteiramente no ecossistema do Firebase.

*   **Firebase Hosting**: Serve os arquivos estáticos da aplicação (HTML, CSS, JavaScript do cliente, imagens). É a camada de frontend visível para o usuário.
*   **Cloud Functions for Firebase**: O código do lado do servidor do Next.js (Server Actions, renderização de páginas) é automaticamente empacotado e implantado como uma Cloud Function.
*   **Vercel**: Não é utilizado. O deploy é feito diretamente para o Firebase.

### Como Funciona?

O arquivo `firebase.json` está configurado para usar a integração nativa do Firebase com frameworks web modernos. Ele utiliza a diretiva `"frameworksBackend"`.

Quando você executa o deploy, o Firebase CLI automaticamente:
1.  Constrói seu aplicativo Next.js.
2.  Identifica quais partes são estáticas e quais são dinâmicas (precisam de um servidor).
3.  Envia os arquivos estáticos para o Firebase Hosting.
4.  Empacota as partes dinâmicas em uma Cloud Function.
5.  Configura os `rewrites` no Firebase Hosting para que todas as solicitações de página sejam enviadas para a Cloud Function que executa o Next.js, garantindo que a renderização no servidor e as Server Actions funcionem corretamente.

### Como Fazer o Deploy

Para publicar sua aplicação, use o seguinte comando no seu terminal:

`firebase deploy`

Este único comando cuidará de todo o processo de build e deploy tanto para o Hosting quanto para as Cloud Functions.
