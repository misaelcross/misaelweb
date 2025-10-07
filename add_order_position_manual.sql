-- Script para adicionar campo order_position na tabela clientes
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Adicionar coluna order_position na tabela clientes
ALTER TABLE clientes 
ADD COLUMN order_position INTEGER;

-- 2. Definir valores iniciais baseados na ordem atual (por data de criação)
UPDATE clientes 
SET order_position = (
  SELECT row_number() OVER (ORDER BY created_at) - 1
  FROM (SELECT id, created_at FROM clientes) AS ordered_clientes
  WHERE ordered_clientes.id = clientes.id
);

-- 3. Adicionar índice para melhor performance nas consultas ordenadas
CREATE INDEX IF NOT EXISTS idx_clientes_order_position ON clientes(order_position);

-- 4. Verificar se a coluna foi adicionada corretamente
SELECT id, nome, order_position, created_at 
FROM clientes 
ORDER BY order_position 
LIMIT 5;