// Configuração para desabilitar Firebase e usar apenas dados mockados
export const DISABLE_FIREBASE = true;

// Mensagem informativa
export const SYSTEM_MODE = {
  mode: 'MOCK',
  description: 'Sistema funcionando com dados mockados - Firebase desabilitado',
  externalDatabase: 'cadastro-angular (simulado)',
  mainDatabase: 'produtos (simulado)'
};

// Configurações do sistema mockado
export const MOCK_CONFIG = {
  externalProducts: [
    {
      id: 'ext-1',
      REF: 'REF001',
      NOME: 'Produto Externo 1',
      DESCRICAO: 'Descrição do produto externo 1',
      CATEGORIA: 'Categoria A',
      PRECO: 150.00,
      STOCK: 50
    },
    {
      id: 'ext-2',
      REF: 'REF002',
      NOME: 'Produto Externo 2',
      DESCRICAO: 'Descrição do produto externo 2',
      CATEGORIA: 'Categoria B',
      PRECO: 200.00,
      STOCK: 30
    },
    {
      id: 'ext-3',
      REF: 'REF003',
      NOME: 'Produto Externo 3',
      DESCRICAO: 'Descrição do produto externo 3',
      CATEGORIA: 'Categoria C',
      PRECO: 300.00,
      STOCK: 20
    },
    {
      id: 'ext-4',
      REF: 'TEST001',
      NOME: 'Produto Teste Externo',
      DESCRICAO: 'Produto de teste para vinculação',
      CATEGORIA: 'Teste',
      PRECO: 100.00,
      STOCK: 100
    },
    {
      id: 'ext-5',
      REF: 'DEMO001',
      NOME: 'Produto Demo',
      DESCRICAO: 'Produto para demonstração',
      CATEGORIA: 'Demo',
      PRECO: 75.00,
      STOCK: 25
    },
    {
      id: 'ext-6',
      REF: 'CAD001',
      NOME: 'Produto Cadastro Angular',
      DESCRICAO: 'Produto do sistema cadastro-angular',
      CATEGORIA: 'Sistema Externo',
      PRECO: 250.00,
      STOCK: 15
    }
  ]
};
