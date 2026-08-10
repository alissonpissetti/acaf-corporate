# acaf-corporate

Portal corporativo para empresas gerenciarem colaboradores e consultarem faturas do benefício ACAF Connect.

## Requisitos

- Node.js 20+
- [acaf-api](../acaf-api) rodando na porta **8787**
- MariaDB configurado (mesmo banco da API)

## Desenvolvimento

```bash
cd acaf-corporate
npm install
npm run dev
```

Abre em [http://127.0.0.1:5177](http://127.0.0.1:5177). Requisições `/api/*` são proxy para a API local.

### Variáveis de ambiente

Copie `.env.example` para `.env` (opcional em dev):

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL da API (vazio em dev usa proxy Vite) |

## Fluxo MVP

1. **Cadastro** em `/cadastro` — empresa fica `pending` até aprovação no acaf-adm
2. **Admin** aprova em `/companies` no painel acaf-adm
3. **Login** do gestor RH em `/login`
4. **Colaboradores** — cadastro dispara convite por e-mail (link visível na resposta em dev)
5. **Ativação** — colaborador acessa `/ativar?token=...` e define senha
6. **Faturas** — consulta mensal (colaboradores ativos × valor do benefício)

## Seed demo

Com a API em dev, o `CorporateSeedService` cria automaticamente (se não houver empresas):

- Empresa **Empresa Demo** (CNPJ `11.222.333/0001-81`, status `active`)
- Gestor: `gestor@empresademo.com.br` / `demo123`
- 3 colaboradores (ativo, convidado, inativo)

## Portas

| App | Porta |
|-----|-------|
| acaf-api | 8787 |
| acaf-corporate | 5177 |
| acaf-adm | 5175 (padrão) |
| acaf-partner | 5176 |
