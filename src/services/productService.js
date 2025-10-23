import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Status possíveis para os pedidos
export const ORDER_STATUS = {
  DESENVOLVIMENTO: 'Desenvolvimento',
  GERAR_PEDIDO: 'Gerar Pedido',
  FABRICACAO: 'Fabricação',
  EMBARCADO: 'Embarcado',
  NACIONALIZADO: 'Nacionalizado'
};

// Modelo de dados para Produto
export class Product {
  constructor(data) {
    this.referencia = data.referencia || '';
    this.nomeRavi = data.nomeRavi || '';
    this.profit = data.profit || 0;
    this.ncm = data.ncm || '';
    this.orderQtyBox = data.orderQtyBox || 0;
    this.unitCtn = data.unitCtn || 0;
    this.orderQtyUn = data.orderQtyUn || 0;
    this.dataPedido = data.dataPedido || new Date();
    this.lote = data.lote || '';
    this.status = data.status || ORDER_STATUS.DESENVOLVIMENTO;
    this.container = data.container || '';
    this.eta = data.eta || '';
    this.unitPriceRmb = data.unitPriceRmb || 0;
    this.totalRmb = data.totalRmb || 0;
    this.valorInvoiceUs = data.valorInvoiceUs || 0;
    this.totalInvoice = data.totalInvoice || 0;
    this.pesoUnitarioKg = data.pesoUnitarioKg || 0;
    this.nw = data.nw || 0;
    this.totalPesoLiq = data.totalPesoLiq || 0;
    this.gw = data.gw || 0;
    this.totalPesoBruto = data.totalPesoBruto || 0;
    this.usKg = data.usKg || 0;
    this.usKgMin = data.usKgMin || 0;
    this.cbm = data.cbm || 0;
    this.cbmTotal = data.cbmTotal || 0;
    this.dataGeracaoPedido = data.dataGeracaoPedido || new Date();
    this.fabrica = data.fabrica || '';
    this.itemNo = data.itemNo || '';
    this.description = data.description || '';
    this.name = data.name || '';
    this.remark = data.remark || '';
    this.obs = data.obs || '';
    this.unit = data.unit || '';
    this.l = data.l || 0;
    this.w = data.w || 0;
    this.h = data.h || 0;
    this.nomeInvoiceEn = data.nomeInvoiceEn || '';
    this.obsPedido = data.obsPedido || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

// Serviços para Produtos
export const productService = {
  // Criar novo produto
  async createProduct(productData) {
    try {
      const product = new Product(productData);
      // Converter o objeto Product para um objeto JavaScript simples
      const productObject = {
        referencia: product.referencia,
        nomeRavi: product.nomeRavi,
        profit: product.profit,
        ncm: product.ncm,
        orderQtyBox: product.orderQtyBox,
        unitCtn: product.unitCtn,
        orderQtyUn: product.orderQtyUn,
        dataPedido: product.dataPedido,
        lote: product.lote,
        status: product.status,
        container: product.container,
        eta: product.eta,
        unitPriceRmb: product.unitPriceRmb,
        totalRmb: product.totalRmb,
        valorInvoiceUs: product.valorInvoiceUs,
        totalInvoice: product.totalInvoice,
        pesoUnitarioKg: product.pesoUnitarioKg,
        nw: product.nw,
        totalPesoLiq: product.totalPesoLiq,
        gw: product.gw,
        totalPesoBruto: product.totalPesoBruto,
        usKg: product.usKg,
        usKgMin: product.usKgMin,
        cbm: product.cbm,
        cbmTotal: product.cbmTotal,
        dataGeracaoPedido: product.dataGeracaoPedido,
        fabrica: product.fabrica,
        itemNo: product.itemNo,
        description: product.description,
        name: product.name,
        remark: product.remark,
        obs: product.obs,
        unit: product.unit,
        l: product.l,
        w: product.w,
        h: product.h,
        nomeInvoiceEn: product.nomeInvoiceEn,
        obsPedido: product.obsPedido,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
      
      const docRef = await addDoc(collection(db, 'products'), productObject);
      return { id: docRef.id, ...productObject };
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  },

  // Buscar todos os produtos
  async getAllProducts() {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  },

  // Buscar produtos por status
  async getProductsByStatus(status) {
    try {
      const q = query(
        collection(db, 'products'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos por status:', error);
      throw error;
    }
  },

  // Atualizar produto
  async updateProduct(productId, updateData) {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        ...updateData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  },

  // Deletar produto
  async deleteProduct(productId) {
    try {
      await deleteDoc(doc(db, 'products', productId));
      return true;
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      throw error;
    }
  },

  // Atualizar status do produto
  async updateProductStatus(productId, newStatus) {
    try {
      return await this.updateProduct(productId, { status: newStatus });
    } catch (error) {
      console.error('Erro ao atualizar status do produto:', error);
      throw error;
    }
  },

  // Vincular produto externo
  async linkExternalProduct(productId, externalProduct) {
    try {
      const linkData = {
        produtoExternoId: externalProduct.id,
        produtoExternoRef: externalProduct.REF,
        produtoExternoNome: externalProduct.NOME || externalProduct.DESCRICAO,
        produtoExternoPreco: externalProduct.PRECO,
        produtoExternoCategoria: externalProduct.CATEGORIA,
        produtoExternoStock: externalProduct.STOCK,
        vinculadoEm: new Date(),
        vinculadoPor: 'sistema' // Pode ser alterado para incluir usuário logado
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
        vinculadoPor: null
      };

      return await this.updateProduct(productId, unlinkData);
    } catch (error) {
      console.error('Erro ao desvincular produto externo:', error);
      throw error;
    }
  }
};

// Serviços para Pedidos (agrupamento de produtos)
export const orderService = {
  // Criar novo pedido
  async createOrder(orderData) {
    try {
      const order = {
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const docRef = await addDoc(collection(db, 'orders'), order);
      return { id: docRef.id, ...order };
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  },

  // Buscar todos os pedidos
  async getAllOrders() {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  },

  // Atualizar pedido
  async updateOrder(orderId, updateData) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        ...updateData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      throw error;
    }
  }
};
