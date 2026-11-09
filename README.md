# connect-corporate

Portal corporativo para empresas gerenciarem colaboradores e consultarem faturas do benefício.

## Requisitos

- Node.js 20+
- [connect-api](../connect-api) rodando na porta **8787**
- MariaDB configurado (mesmo banco da API)

## Desenvolvimento

```bash
cd connect-corporate
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

1. **Cadastro** em `/cadastro` — empresa fica `pending` até aprovação no connect-adm
2. **Admin** aprova em `/companies` no painel connect-adm
3. **Login** do gestor RH em `/login`
4. **Colaboradores** — cadastro individual ou **importação em lote** (CSV / colar do Excel: nome, e-mail, celular, CPF opcional); convite por e-mail conforme fluxo (link visível na resposta em dev)
5. **Ativação** — colaborador acessa `/ativar?token=...` e define senha
6. **Faturas** — consulta mensal (colaboradores ativos × valor do benefício)

Cadastros (empresas, parceiros, modalidades, financeiro etc.) devem ser criados pelo **connect-adm** ou pelos portais correspondentes. Não há seed automático de dados de demonstração.

## Portas

| App | Porta |
|-----|-------|
| connect-api | 8787 |
| connect-corporate | 5177 |
| connect-adm | 5175 (padrão) |
| connect-partner | 5176 |
