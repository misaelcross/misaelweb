-- Adicionar coluna data_termino à tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS data_termino DATE;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.clientes.data_termino IS 'Data de término do projeto/tarefa (opcional)';