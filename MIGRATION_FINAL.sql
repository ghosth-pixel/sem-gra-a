-- TIGELINHA - ajuste final para o painel conectado
-- Execute uma vez no SQL Editor depois do schema principal.
alter table public.settings add column if not exists global_support text;

-- Garante que o próprio usuário consiga ler seu perfil e que owner/admin consultem a equipe.
-- As políticas já existem no schema principal; estes comandos são idempotentes quando possível.
