# Sistema de Controle de Pedidos

Sistema completo para gerenciamento de pedidos, produtos e containers com integração Firebase e base externa de produtos.

## 🚀 Funcionalidades

### 📊 Dashboard
- **Estatísticas gerais** do sistema
- **Acompanhamento de containers** com progresso visual
- **Resumo financeiro** com totais em RMB e USD
- **Distribuição por status** dos produtos
- **Produtos recentes** com informações principais

### 📦 Gerenciamento de Produtos
- **Lista completa** com todos os campos do produto
- **Filtros avançados**:
  - Busca por texto (referência, nome, descrição)
  - Filtro por status
  - Filtro por container
- **Ordenação** em todas as colunas principais
- **Edição inline** de campos
- **Imagens dos produtos** com lightbox
- **Exportação Excel** com imagens e formatação
- **Atualização da base externa** de produtos

### 🚢 Gerenciamento de Containers
- **CRUD completo** de containers
- **Duplicação de containers** com novo número
- **Modal de produtos associados** ao clicar no número do container
- **Cálculo automático** do TOTAL RMB baseado nos produtos
- **Destaque visual** para containers com produtos embarcados

### 💰 Formatação Numérica
- **Formato brasileiro** (00.000,00)
- **Moedas**: USD ($ 00.000,00) e RMB (¥ 00.000,00)
- **NCM**: formato 0000.00.00
- **Pesos**: 2-3 casas decimais com vírgula
- **Volumes**: CBM com 3 casas decimais

## 🛠️ Tecnologias

- **React 18** com Hooks
- **Firebase Firestore** para persistência
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **ExcelJS** para exportação de planilhas
- **React Router DOM** para navegação

## 📋 Status dos Produtos

1. **Desenvolvimento** - Produto em fase inicial
2. **Gerar Pedido** - Pronto para gerar pedido
3. **Fabricação** - Em produção
4. **Embarcado** - Associado a container
5. **Nacionalizado** - Processo concluído

## 🔧 Instalação

```bash
# Clone o repositório
git clone https://github.com/gustavo-devfull/controle_pedidos.git

# Instale as dependências
npm install

# Configure o Firebase
# Edite src/firebase/config.js com suas credenciais

# Execute o projeto
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Dashboard.js     # Dashboard principal
│   ├── ProductList.js   # Lista de produtos
│   ├── ProductForm.js   # Formulário de produtos
│   ├── ContainerManagement.js # Gerenciamento de containers
│   └── ...
├── services/            # Serviços de dados
│   ├── productService.js
│   ├── containerService.js
│   └── ...
├── firebase/           # Configuração Firebase
├── utils/              # Utilitários
└── config/             # Configurações
```

## 🔑 Configuração Firebase

Configure suas credenciais Firebase em `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  // ... outras configurações
};
```

## 📊 Funcionalidades Principais

### Filtros e Ordenação
- **Busca inteligente** por múltiplos campos
- **Filtros combinados** (status + container + texto)
- **Ordenação** em todas as colunas principais
- **Interface responsiva** para mobile

### Exportação Excel
- **Imagens dos produtos** inseridas automaticamente
- **Formatação profissional** com cabeçalhos coloridos
- **Cálculos automáticos** de totais
- **Altura de linhas** ajustada às imagens

### Integração Externa
- **Base de produtos externa** via Firebase
- **Sincronização automática** de dados
- **Mapeamento inteligente** de campos
- **Fallbacks** para diferentes formatos

## 🎯 Próximas Funcionalidades

- [ ] Relatórios avançados
- [ ] Notificações de status
- [ ] Histórico de alterações
- [ ] Backup automático
- [ ] API REST

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👨‍💻 Desenvolvedor

**Gustavo** - [@gustavo-devfull](https://github.com/gustavo-devfull)

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!