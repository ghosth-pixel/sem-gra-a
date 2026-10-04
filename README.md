# Tigelinha — Painel conectado ao Supabase

Esta versão usa o Supabase como fonte de dados. Não usa localStorage para produtos, estoque, clientes, vendas ou configurações.

## Já configurado
- Project URL e publishable key em `supabase-config.js`.
- Login por e-mail/senha via Supabase Auth.
- Conta `owner` controla a aba Equipe.
- Produtos, planos Diário/Semanal/Mensal/Lifetime, estoque, clientes, vendas, configurações e auditoria usam o banco.
- Logout e sessão persistente.
- RLS continua protegendo o acesso no banco.

## Execute uma vez
Abra o SQL Editor do Supabase e execute `MIGRATION_FINAL.sql` para adicionar o campo `global_support` às configurações.

## Criar usuários pelo painel
A aba Equipe chama a Edge Function `create-team-user`. O código está em `supabase/functions/create-team-user/index.ts`.
Ela é necessária porque criar usuários com senha exige privilégio administrativo, e a `service_role` NUNCA deve ficar no navegador/GitHub.

Depois de implantar essa Edge Function no Supabase, o Dono poderá criar Administrador, Vendedor/Ajudante e Suporte diretamente no painel.

## Segurança
Nunca coloque `service_role` ou secret key em `supabase-config.js`. A publishable key é a chave correta para o frontend, desde que o RLS permaneça habilitado.
