# Tigelinha Painel V3

Painel administrativo em HTML/CSS/JavaScript puro, pronto para abrir localmente ou publicar como protótipo estático.

## O que entrou nesta versão
- Dashboard com faturamento, vendas, estoque e alertas de estoque baixo
- Produtos personalizados separados em Conta e Key
- Cadastro de novos produtos sem precisar alterar o código
- Estoque por item, com status Disponível/Reservado/Vendido/Indisponível
- Campos específicos para contas (nick, senha, email) e keys (key, validade)
- Clientes com Discord, observações, compras e total gasto
- Nova venda vinculada diretamente a um item do estoque
- Baixa automática do estoque ao confirmar a venda
- ID único de venda no padrão TG-AAAA-XXXXXX
- Mensagem automática de entrega com variáveis
- Modelos de entrega editáveis
- Financeiro e desempenho por produto
- Busca global
- Auditoria das ações
- Exportação de backup JSON
- Configurações
- Layout responsivo

## Como abrir
1. Extraia o ZIP.
2. Abra `index.html` no navegador.
3. Os dados da demonstração são salvos no localStorage do navegador.

## IMPORTANTE — uso real
Esta V3 ainda é um protótipo front-end. Não coloque senhas reais, cookies, tokens ou chaves sensíveis neste localStorage.
Para a versão de produção, a arquitetura recomendada é:
- autenticação de usuários;
- banco de dados com regras de acesso;
- criptografia/controle de acesso para credenciais sensíveis;
- logs no servidor;
- backups;
- variáveis secretas fora do repositório;
- GitHub apenas para o código.

O próximo passo natural é transformar esta V3 em uma aplicação com backend/banco e login.
