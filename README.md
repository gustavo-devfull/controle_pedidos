# Sistema de Gerenciamento de Pedidos - Ravi

Sistema completo para gerenciar pedidos de produtos com acompanhamento de status (Desenvolvimento, Fabricação, Embarcado e Nacionalizado).

## 🚀 Funcionalidades

- **Dashboard** com estatísticas e visão geral dos pedidos
- **Gerenciamento de Produtos** com todos os campos solicitados
- **Sistema de Status** para acompanhar o andamento dos pedidos
- **Interface Moderna** e responsiva
- **Integração com Firebase** para persistência de dados

## 📋 Campos do Produto

O sistema gerencia todos os campos solicitados:

- Referência, Nome Ravi, Profit, NCM
- Quantidades (ORDER QTY / BOX, UNIT / CTN, ORDER QTY / UN)
- Preços (UNIT PRICE RMB, TOTAL RMB, Valor Invoice U$, TOTAL INVOICE)
- Pesos (Peso Unitário, N.W, Total Peso Líquido, G.W, Total Peso Bruto)
- Dimensões (L, W, H, CBM, CBM TOTAL)
- Datas (Data Pedido, Data Geração Pedido, ETA)
- Informações adicionais (Fábrica, Item No, Description, Name, Remark, OBS, OBS Pedido)

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework frontend
- **Firebase** - Backend e banco de dados
- **Tailwind CSS** - Estilização
- **React Router** - Navegação
- **Lucide React** - Ícones

## 📦 Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd Pedidos
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o Firebase**
   - Acesse o [Firebase Console](https://console.firebase.google.com/)
   - Crie um novo projeto
   - Ative o Firestore Database
   - Copie as credenciais do projeto
   - Edite o arquivo `src/firebase/config.js` com suas credenciais:

   ```javascript
   const firebaseConfig = {
     apiKey: "sua-api-key",
     authDomain: "seu-projeto.firebaseapp.com",
     projectId: "seu-projeto-id",
     storageBucket: "seu-projeto.appspot.com",
     messagingSenderId: "123456789",
     appId: "seu-app-id"
   };
   ```

4. **Execute o projeto**
   ```bash
   npm start
   ```

5. **Acesse a aplicação**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🗄️ Estrutura do Banco de Dados

### Coleção: `products`

Cada documento representa um produto com os seguintes campos:

```javascript
{
  referencia: string,
  nomeRavi: string,
  profit: number,
  ncm: string,
  orderQtyBox: number,
  unitCtn: number,
  orderQtyUn: number,
  dataPedido: timestamp,
  lote: string,
  status: string, // 'Desenvolvimento', 'Fabricação', 'Embarcado', 'Nacionalizado'
  container: string,
  eta: string,
  unitPriceRmb: number,
  totalRmb: number,
  valorInvoiceUs: number,
  totalInvoice: number,
  pesoUnitarioKg: number,
  nw: number,
  totalPesoLiq: number,
  gw: number,
  totalPesoBruto: number,
  usKg: number,
  usKgMin: number,
  cbm: number,
  cbmTotal: number,
  dataGeracaoPedido: timestamp,
  fabrica: string,
  itemNo: string,
  description: string,
  name: string,
  remark: string,
  obs: string,
  unit: string,
  l: number,
  w: number,
  h: number,
  nomeInvoiceEn: string,
  obsPedido: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 📱 Como Usar

### 1. Dashboard
- Visualize estatísticas gerais dos produtos
- Acompanhe a distribuição por status
- Veja resumo financeiro e produtos recentes

### 2. Gerenciar Produtos
- **Criar**: Clique em "Novo Produto" e preencha os dados
- **Editar**: Clique no ícone de edição na tabela
- **Visualizar**: Clique no ícone de visualização para ver detalhes completos
- **Alterar Status**: Use o dropdown na coluna Status
- **Excluir**: Clique no ícone de lixeira (com confirmação)

### 3. Filtros e Busca
- Use a barra de busca para encontrar produtos por referência, nome ou descrição
- Filtre por status usando o dropdown
- A tabela é atualizada em tempo real

## 🔧 Scripts Disponíveis

- `npm start` - Executa a aplicação em modo de desenvolvimento
- `npm build` - Cria a versão de produção
- `npm test` - Executa os testes
- `npm eject` - Ejecta do Create React App (não recomendado)

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Dashboard.js     # Dashboard principal
│   ├── ProductList.js   # Lista de produtos
│   ├── ProductForm.js   # Formulário de produto
│   └── ProductDetails.js # Detalhes do produto
├── services/            # Serviços e lógica de negócio
│   └── productService.js # Serviços do Firebase
├── firebase/            # Configuração do Firebase
│   └── config.js        # Configuração do Firebase
├── App.js               # Componente principal
├── index.js             # Ponto de entrada
└── index.css            # Estilos globais
```

## 🚀 Deploy

Para fazer deploy da aplicação:

1. **Build da aplicação**
   ```bash
   npm run build
   ```

2. **Deploy no Firebase Hosting**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas, entre em contato através dos canais oficiais da empresa.
