// Serviço híbrido que usa Firebase externo + localStorage para dados principais
import { externalProductService } from './externalProductService';
import { ORDER_STATUS } from './productService';

// Chave para armazenar produtos no localStorage
const PRODUCTS_STORAGE_KEY = 'sistema_pedidos_produtos';

// Serviço híbrido para produtos
export const hybridProductService = {
  // Carregar produtos do localStorage
  loadProductsFromStorage() {
    try {
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar produtos do localStorage:', error);
      return [];
    }
  },

  // Salvar produtos no localStorage
  saveProductsToStorage(products) {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Erro ao salvar produtos no localStorage:', error);
    }
  },

  // Criar novo produto com validação de duplicatas
  async createProduct(productData) {
    try {
      const products = this.loadProductsFromStorage();
      
      // Verificar se já existe produto com mesma referência e status
      const existingProduct = products.find(p => 
        p.referencia === productData.referencia && 
        p.status === productData.status
      );
      
      if (existingProduct) {
        throw new Error(`Já existe um produto com a referência "${productData.referencia}" e status "${productData.status}". Use um status diferente ou edite o produto existente.`);
      }
      
      const newProduct = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      products.unshift(newProduct);
      this.saveProductsToStorage(products);
      
      console.log('Produto criado:', newProduct.id);
      return { id: newProduct.id, ...newProduct };
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  },

  // Buscar todos os produtos
  async getAllProducts() {
    try {
      const products = this.loadProductsFromStorage();
      console.log('Produtos carregados:', products.length);
      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  },

  // Verificar se produto já existe (mesma referência e status)
  async checkProductExists(referencia, status) {
    try {
      const products = this.loadProductsFromStorage();
      const existingProduct = products.find(p => 
        p.referencia === referencia && 
        p.status === status
      );
      return existingProduct ? true : false;
    } catch (error) {
      console.error('Erro ao verificar produto existente:', error);
      return false;
    }
  },

  // Buscar produtos por referência
  async getProductsByReference(referencia) {
    try {
      const products = this.loadProductsFromStorage();
      return products.filter(p => p.referencia === referencia);
    } catch (error) {
      console.error('Erro ao buscar produtos por referência:', error);
      return [];
    }
  },

  // Buscar produtos por status
  async getProductsByStatus(status) {
    try {
      const products = this.loadProductsFromStorage();
      return products.filter(p => p.status === status);
    } catch (error) {
      console.error('Erro ao buscar produtos por status:', error);
      throw error;
    }
  },

  // Atualizar produto
  async updateProduct(productId, updateData) {
    try {
      const products = this.loadProductsFromStorage();
      const index = products.findIndex(p => p.id === productId);
      
      if (index !== -1) {
        products[index] = {
          ...products[index],
          ...updateData,
          updatedAt: new Date()
        };
        this.saveProductsToStorage(products);
        console.log('Produto atualizado:', productId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  },

  // Excluir produto
  async deleteProduct(productId) {
    try {
      const products = this.loadProductsFromStorage();
      const filteredProducts = products.filter(p => p.id !== productId);
      
      if (filteredProducts.length < products.length) {
        this.saveProductsToStorage(filteredProducts);
        console.log('Produto excluído:', productId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      throw error;
    }
  },

  // Atualizar status do produto
  async updateProductStatus(productId, newStatus) {
    return this.updateProduct(productId, { status: newStatus });
  },

  // Vincular produto externo
  async linkExternalProduct(productId, externalProduct) {
    try {
      // Mapear campos do produto externo para campos locais conforme especificação
      const fieldMapping = {
        // Campos básicos
        referencia: externalProduct.referencia,
        nomeRaviProfit: externalProduct.nomeRaviProfit || externalProduct.nome || externalProduct.descricao,
        ncm: externalProduct.ncm,
        unitCtn: externalProduct.unitCtn,
        unitPriceRmb: externalProduct.preco || externalProduct.unitPriceRmb,
        pesoUnitario: externalProduct.pesoUnitario || externalProduct.pesoUnitarioKg,
        nw: externalProduct.nw,
        gw: externalProduct.gw,
        cbm: externalProduct.cbm,
        fabrica: externalProduct.fabrica,
        itemNo: externalProduct.itemNo,
        
        // Campos de texto
        description: externalProduct.descricao || externalProduct.description,
        name: externalProduct.nome || externalProduct.name,
        remark: externalProduct.remark,
        obs: externalProduct.obs,
        unit: externalProduct.unit,
        
        // Dimensões
        l: externalProduct.l,
        w: externalProduct.w,
        h: externalProduct.h,
        
        // Invoice
        nomeInvoiceEn: externalProduct.nomeInvoiceEn || externalProduct.nome
      };

      // Criar dados de vinculação com campos associados
      const linkData = {
        // Campos de vinculação
        produtoExternoId: externalProduct.id,
        produtoExternoRef: externalProduct.referencia,
        produtoExternoNome: externalProduct.nome || externalProduct.descricao,
        produtoExternoPreco: externalProduct.preco,
        produtoExternoCategoria: externalProduct.categoria,
        produtoExternoStock: externalProduct.estoque,
        vinculadoEm: new Date(),
        vinculadoPor: 'sistema',
        
        // Campos associados automaticamente (não editáveis)
        camposAssociados: fieldMapping,
        camposBloqueados: Object.keys(fieldMapping).filter(key => fieldMapping[key] !== undefined && fieldMapping[key] !== null && fieldMapping[key] !== ''),
        
        // Atualizar campos locais com dados do externo
        ...fieldMapping
      };
      
      return await this.updateProduct(productId, linkData);
    } catch (error) {
      console.error('Erro ao vincular produto externo:', error);
      throw error;
    }
  },

  // Desvincular produto externo
  async unlinkExternalProduct(productId) {
    try {
      const unlinkData = {
        produtoExternoId: null,
        produtoExternoRef: null,
        produtoExternoNome: null,
        produtoExternoPreco: null,
        produtoExternoCategoria: null,
        produtoExternoStock: null,
        vinculadoEm: null,
        vinculadoPor: null,
        // Limpar campos associados
        camposAssociados: null,
        camposBloqueados: []
      };
      
      return await this.updateProduct(productId, unlinkData);
    } catch (error) {
      console.error('Erro ao desvincular produto externo:', error);
      throw error;
    }
  },

  // Buscar produtos externos (delega para o serviço externo)
  async searchExternalProducts(searchTerm) {
    try {
      return await externalProductService.searchProductsByRef(searchTerm);
    } catch (error) {
      console.error('Erro ao buscar produtos externos:', error);
      throw error;
    }
  },

  // Exportar dados (para backup)
  exportData() {
    const products = this.loadProductsFromStorage();
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `produtos_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // Importar dados (para restore)
  async importData(file) {
    try {
      const text = await file.text();
      const products = JSON.parse(text);
      
      if (Array.isArray(products)) {
        this.saveProductsToStorage(products);
        console.log('Dados importados:', products.length, 'produtos');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      throw error;
    }
  }
};
