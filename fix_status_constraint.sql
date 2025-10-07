-- Script para aplicar diretamente no SQL Editor do Supabase
-- Atualizar o enum de status para incluir os novos valores

-- Primeiro, remover a constraint existente
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_status_check;

-- Adicionar a nova constraint com todos os status
ALTER TABLE clientes ADD CONSTRAINT clientes_status_check 
CHECK (status IN ('Pausado', 'Não iniciado', 'Negotiation', 'Problemático', 'Fixo', 'Aguardando feedback', 'Em andamento', 'Concluído'));

-- Verificar se a constraint foi aplicada corretamente
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'clientes'::regclass 
AND conname = 'clientes_status_check';