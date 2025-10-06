-- Criar tabela de clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Fixo', 'Em andamento', 'Aguardando feedback', 'Pausado', 'Concluído')),
    tarefa TEXT NOT NULL,
    prioridade VARCHAR(20) NOT NULL CHECK (prioridade IN ('High', 'Normal', 'Low')),
    descricao TEXT,
    data_inicio DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_clientes_user_id ON clientes(user_id);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_prioridade ON clientes(prioridade);
CREATE INDEX idx_clientes_created_at ON clientes(created_at DESC);

-- Configurar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem apenas seus próprios clientes
CREATE POLICY "Users can view own clientes" ON clientes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes" ON clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes" ON clientes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes" ON clientes
    FOR DELETE USING (auth.uid() = user_id);

-- Conceder permissões básicas
GRANT SELECT ON clientes TO anon;
GRANT ALL PRIVILEGES ON clientes TO authenticated;