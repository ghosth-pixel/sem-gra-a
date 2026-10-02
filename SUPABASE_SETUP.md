# Tigelinha • Banco gratuito (Supabase)

## 1. Criar o banco
Crie um projeto no Supabase usando o plano Free.

O Free atualmente inclui Postgres, 500 MB de banco por projeto e 50.000 usuários ativos mensais; projetos gratuitos podem ser pausados após um período de inatividade. Consulte a página oficial para limites atuais.

## 2. Criar as tabelas
No painel do Supabase:
1. Abra **SQL Editor**.
2. Abra `supabase-schema.sql`.
3. Cole o conteúdo.
4. Execute.

Isso cria:
- profiles
- products
- clients
- stock
- sales
- audit_log
- settings
- RLS e trigger de usuário

## 3. Pegar as credenciais públicas
No projeto Supabase, abra as configurações de conexão/API e copie:
- Project URL
- Publishable key (ou a chave pública/anon correspondente, conforme a interface do projeto)

Cole somente esses dois valores em `supabase-config.js`.

NUNCA coloque a `service_role` key no navegador ou no GitHub.

## 4. Próxima etapa
A V3 atual ainda roda com localStorage. O schema acima é a base para a migração definitiva.

A próxima versão deve:
- trocar todas as leituras/escritas do localStorage por Supabase;
- adicionar tela de login;
- carregar os dados após autenticação;
- proteger as operações com RLS;
- registrar o usuário real na auditoria;
- fazer exclusão de venda no banco e devolver o item ao estoque;
- tratar concorrência para impedir que dois atendentes vendam a mesma key.

A documentação oficial mostra que `supabase-js` pode ser usado diretamente no navegador e que RLS deve ser habilitado nas tabelas expostas. 
