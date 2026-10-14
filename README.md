# Fodinha Online

Jogo de Fodinha para jogar com amigos pelo navegador. O projeto usa React e Vite.

## Para abrir o site no seu computador

O Live Server do VS Code não inicia este projeto. Use o terminal do VS Code:

1. Instale o Node.js (versão LTS) no computador.
2. No VS Code, abra a pasta `Truco Online` e selecione **Terminal > Novo Terminal**.
3. Execute estes comandos:

   ```bash
   npm install
   npm run dev
   ```

4. Abra no navegador o endereço que aparecer no terminal. Normalmente é `http://localhost:5173/`.
5. Para parar o site, volte ao terminal e pressione `Ctrl+C`.

## Salas online

Sem configurar o Supabase, a tela inicial abre, mas criar e entrar em salas não funciona. Para habilitar partidas online:

1. Crie um projeto no Supabase.
2. Copie `.env.example` para um arquivo chamado `.env` nesta pasta.
3. No Supabase, abra **Project Settings > API** e copie a URL do projeto e a chave publicável para `.env`:

   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
   VITE_SUPABASE_ALLOW_SPECTATORS_AFTER_START=true
   ```

4. No Supabase, execute o conteúdo de `supabase/schema.sql` no SQL Editor e habilite Realtime para a tabela `rooms`.
5. Pare e inicie novamente o site com `npm run dev`.

Não compartilhe nem publique o arquivo `.env`.

## Preparar para publicação no GitHub

Este projeto tem um repositório Git próprio. Depois de criar um repositório vazio no seu GitHub, conecte-o pelo terminal:

```bash
git remote add origin URL_DO_SEU_REPOSITORIO
git add .
git commit -m "Meu jogo de Fodinha"
git push -u origin main
```

Substitua `URL_DO_SEU_REPOSITORIO` pelo endereço do repositório que você criou. Não envie `.env` ao GitHub.



## Site parta jogar:

https://truco-online-delta.vercel.app/


## Sera Feito atualizações para poder jogar truco normal gaucho no site tambem.

