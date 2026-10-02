# Tigelinha — Painel Final

Painel de gestão da Tigelinha, com interface zerada e estrutura preparada para produtos de contas e keys.

## Estrutura de keys

Cada produto de key possui quatro planos padrão:

- Diário
- Semanal
- Mensal
- Lifetime

Cada plano pode ter seu próprio:

- preço;
- Discord;
- template de entrega;
- estoque de keys.

Exemplo: FiveM, Valorant e CS2 podem ter Discords completamente diferentes. A venda usa automaticamente o Discord e o template do plano selecionado.

## Estado inicial

A versão final começa **sem produtos, clientes, estoque, vendas ou auditoria de demonstração**.

## Banco de dados

O projeto inclui `supabase-schema.sql` atualizado com `product_plans`, `plan_id` no estoque e `plan_id` nas vendas.

O arquivo `supabase-config.js` continua sem credenciais. Não coloque `service_role` no frontend. A conexão real com Supabase exige o Project URL e a chave publicável/anon do seu próprio projeto.

## Testes feitos

- Sintaxe do `app.js` validada com Node.js (`node --check`).
- Dados de demonstração removidos da inicialização.
- Chave de armazenamento alterada para uma versão final nova, evitando carregar o demo antigo.
- Fluxo de duração de key incluído no cadastro de produto, estoque, venda e entrega.
- Exclusão de venda preservada, com retorno do item ao estoque quando aplicável.
