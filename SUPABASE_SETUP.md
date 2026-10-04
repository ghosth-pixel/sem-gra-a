# Supabase — Tigelinha

O projeto já está configurado em `supabase-config.js` com Project URL e publishable key.

1. O schema principal já foi executado no Supabase.
2. Execute `MIGRATION_FINAL.sql` uma vez no SQL Editor.
3. O login usa Supabase Auth e os dados são carregados do banco.
4. Para criar usuários pela aba Equipe, implante a Edge Function em `supabase/functions/create-team-user/index.ts`.

Nunca coloque `service_role`/secret key no frontend ou no GitHub.
