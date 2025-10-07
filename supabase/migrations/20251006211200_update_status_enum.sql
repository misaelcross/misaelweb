-- Atualizar o enum de status para incluir os novos valores
-- Primeiro, remover a constraint existente
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_status_check;

-- Adicionar a nova constraint com todos os status
ALTER TABLE clientes ADD CONSTRAINT clientes_status_check 
CHECK (status IN ('Pausado', 'Não iniciado', 'Negotiation', 'Problemático', 'Fixo', 'Aguardando feedback', 'Em andamento', 'Concluído'));

-- Atualizar registros existentes se necessário (manter compatibilidade)
-- Os status existentes já estão incluídos na nova lista, então não precisamos alterar dados