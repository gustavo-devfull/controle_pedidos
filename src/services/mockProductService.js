// Serviço mockado para desenvolvimento quando Firebase não está disponível
export const mockProductService = {
  products: [
    {
      id: 'mock-1',
      referencia: 'TEST-001',
      nomeRavi: 'Produto Teste para Vinculação',
      profit: 15.5,
      ncm: '12345678',
      orderQtyBox: 100,
      unitCtn: 10,
      orderQtyUn: 1000,
      dataPedido: new Date(),
      lote: 'LOTE-TEST-001',
      status: 'Desenvolvimento',
      container: 'CONT-TEST-001',
      eta: '2024-02-15',
      unitPriceRmb: 25.50,
      totalRmb: 25500,
      valorInvoiceUs: 3500,
      totalInvoice: 3500,
      pesoUnitarioKg: 0.5,
      nw: 500,
      totalPesoLiq: 500,
      gw: 550,
      totalPesoBruto: 550,
      usKg: 6.36,
      usKgMin: 6.00,
      cbm: 0.1,
      cbmTotal: 100,
      dataGeracaoPedido: new Date(),
      fabrica: 'Fábrica Teste',
      itemNo: 'ITEM-TEST-001',
      description: 'Este é um produto de teste para demonstrar a funcionalidade de vinculação',
      name: 'Produto Teste',
      remark: 'Produto criado automaticamente para teste',
      obs: 'Produto de teste - pode ser excluído',
      unit: 'UN',
      l: 10,
      w: 10,
      h: 10,
      nomeInvoiceEn: 'Test Product',
      obsPedido: 'Produto de teste para vinculação',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  async createProduct(productData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProduct = {
          id: `mock-${Date.now()}`,
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.products.unshift(newProduct);
        resolve({ id: newProduct.id, ...newProduct });
      }, 500);
    });
  },

  async getAllProducts() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.products]);
      }, 300);
    });
  },

  async getProductsByStatus(status) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = this.products.filter(p => p.status === status);
        resolve(filtered);
      }, 300);
    });
  },

  async updateProduct(productId, updateData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            ...updateData,
            updatedAt: new Date()
          };
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  },

  async deleteProduct(productId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
          this.products.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  },

  async updateProductStatus(productId, newStatus) {
    return this.updateProduct(productId, { status: newStatus });
  },

  async linkExternalProduct(productId, externalProduct) {
    return this.updateProduct(productId, {
      produtoExternoId: externalProduct.id,
      produtoExternoRef: externalProduct.REF,
      produtoExternoNome: externalProduct.NOME || externalProduct.DESCRICAO,
      produtoExternoPreco: externalProduct.PRECO,
      produtoExternoCategoria: externalProduct.CATEGORIA,
      produtoExternoStock: externalProduct.STOCK,
      vinculadoEm: new Date(),
      vinculadoPor: 'sistema'
    });
  },

  async unlinkExternalProduct(productId) {
    return this.updateProduct(productId, {
      produtoExternoId: null,
      produtoExternoRef: null,
      produtoExternoNome: null,
      produtoExternoPreco: null,
      produtoExternoCategoria: null,
      produtoExternoStock: null,
      vinculadoEm: null,
      vinculadoPor: null
    });
  }
};
