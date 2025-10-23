import { MOCK_CONFIG } from '../config/systemConfig';

// Serviço mockado para produtos externos
export const mockExternalProductService = {
  externalProducts: MOCK_CONFIG.externalProducts,

  async searchProductsByRef(searchTerm) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!searchTerm || searchTerm.trim().length < 2) {
          resolve([]);
          return;
        }

        const filtered = this.externalProducts.filter(product =>
          product.REF.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.NOME.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.DESCRICAO.toLowerCase().includes(searchTerm.toLowerCase())
        );
        resolve(filtered);
      }, 500);
    });
  },

  async searchProductByExactRef(ref) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const product = this.externalProducts.find(p => p.REF === ref.toUpperCase());
        resolve(product || null);
      }, 300);
    });
  },

  async getAllExternalProducts() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.externalProducts]);
      }, 300);
    });
  }
};
