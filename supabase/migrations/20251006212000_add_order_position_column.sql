-- Adicionar coluna order_position na tabela clientes
ALTER TABLE clientes 
ADD COLUMN order_position INTEGER;

-- Definir valores iniciais baseados na ordem atual (por data de criação)
UPDATE clientes 
SET order_position = row_number() OVER (ORDER BY created_at) - 1;

-- Adicionar índice para melhor performance nas consultas ordenadas
CREATE INDEX idx_clientes_order_position ON clientes(order_position);