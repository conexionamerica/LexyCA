# Scripts SQL antigos — NÃO EXECUTAR

Estes arquivos são do projeto Supabase anterior e ficam aqui só como histórico.
Eles se contradizem (duas versões da tabela `payout_requests`, tabelas `students`/`teachers`
que o app não usa) e têm erros de sintaxe (`$$$`).

O banco atual é criado pelas migrações em `supabase/migrations/`, nesta ordem:

1. `20261124000000_esquema_base.sql` — tabelas, colunas, índices e realtime
2. `20261125000000_seguranca_rls.sql` — RLS, triggers e funções
