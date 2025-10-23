import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

class LinkedProductService {
  // Criar produto vinculado
  async createLinkedProduct(productData) {
    try {
      console.log('Criando produto vinculado:', productData);
      const docRef = await addDoc(collection(db, 'linkedProducts'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar produto vinculado:', error);
      throw error;
    }
  }

  // Buscar todos os produtos vinculados
  async getAllLinkedProducts() {
    try {
      console.log('Buscando produtos vinculados...');
      const q = query(
        collection(db, 'linkedProducts'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        });
      });
      
      console.log(`Encontrados ${products.length} produtos vinculados`);
      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos vinculados:', error);
      throw error;
    }
  }

  // Atualizar produto vinculado
  async updateLinkedProduct(productId, updateData) {
    try {
      console.log('Atualizando produto vinculado:', { productId, updateData });
      const productRef = doc(db, 'linkedProducts', productId);
      await updateDoc(productRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar produto vinculado:', error);
      throw error;
    }
  }

  // Excluir produto vinculado (soft delete)
  async deleteLinkedProduct(productId) {
    try {
      console.log('Excluindo produto vinculado:', productId);
      const productRef = doc(db, 'linkedProducts', productId);
      await updateDoc(productRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erro ao excluir produto vinculado:', error);
      throw error;
    }
  }

  // Buscar produto vinculado por referência
  async getLinkedProductByRef(referencia) {
    try {
      console.log('Buscando produto vinculado por referência:', referencia);
      const q = query(
        collection(db, 'linkedProducts'),
        where('referencia', '==', referencia),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      };
    } catch (error) {
      console.error('Erro ao buscar produto vinculado por referência:', error);
      throw error;
    }
  }

  // Salvar histórico de status (quando mudar para Embarcado ou Nacionalizado)
  async saveStatusHistory(productId, productData, newStatus, previousStatus) {
    try {
      console.log('Salvando histórico de status:', { productId, newStatus, previousStatus });
      
      // Criar registro no histórico
      await addDoc(collection(db, 'productStatusHistory'), {
        productId,
        productData: { ...productData }, // Dados completos do produto
        previousStatus,
        newStatus,
        statusChangeDate: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Atualizar o produto vinculado com o novo status
      await this.updateLinkedProduct(productId, {
        status: newStatus,
        lastStatusChange: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar histórico de status:', error);
      throw error;
    }
  }

  // Buscar histórico de status de um produto
  async getProductStatusHistory(productId) {
    try {
      console.log('Buscando histórico de status do produto:', productId);
      const q = query(
        collection(db, 'productStatusHistory'),
        where('productId', '==', productId),
        orderBy('statusChangeDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const history = [];
      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data(),
          statusChangeDate: doc.data().statusChangeDate?.toDate?.() || new Date(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        });
      });
      
      return history;
    } catch (error) {
      console.error('Erro ao buscar histórico de status:', error);
      throw error;
    }
  }

  // Sincronizar com base externa
  async syncWithExternalBase(referencia, externalProductData) {
    try {
      console.log('Sincronizando produto com base externa:', referencia);
      
      // Buscar produto vinculado existente
      const existingProduct = await this.getLinkedProductByRef(referencia);
      
      if (existingProduct) {
        // Atualizar produto existente com dados da base externa
        const updatedData = {
          // Manter dados locais importantes
          status: existingProduct.status,
          container: existingProduct.container,
          eta: existingProduct.eta,
          orderQtyBox: existingProduct.orderQtyBox,
          lote: existingProduct.lote,
          dataPedido: existingProduct.dataPedido,
          
          // Atualizar com dados da base externa
          nomeRaviProfit: externalProductData.nomeRaviProfit || externalProductData.NOME || externalProductData.DESCRICAO || existingProduct.nomeRaviProfit,
          ncm: externalProductData.ncm || externalProductData.NCM || existingProduct.ncm,
          unitCtn: externalProductData.unitCtn || externalProductData.UNIT_CTN || existingProduct.unitCtn,
          unitPriceRmb: externalProductData.unitPriceRmb || externalProductData.UNIT_PRICE_RMB || existingProduct.unitPriceRmb,
          valorInvoiceUs: externalProductData.valorInvoiceUsd || externalProductData.VALOR_INVOICE_USD || existingProduct.valorInvoiceUs,
          pesoUnitario: externalProductData.pesoUnitario || externalProductData.PESO_UNITARIO || existingProduct.pesoUnitario,
          nw: externalProductData.nw || externalProductData.NW || existingProduct.nw,
          gw: externalProductData.gw || externalProductData.GW || existingProduct.gw,
          cbm: externalProductData.cbm || externalProductData.CBM || existingProduct.cbm,
          
          // Campos adicionais da base externa
          nomeDiNb: externalProductData.nomeDiNb || externalProductData.NOME_DI_NB || existingProduct.nomeDiNb,
          marca: externalProductData.marca || externalProductData.MARCA || existingProduct.marca,
          linhaCotacoes: externalProductData.linhaCotacoes || externalProductData.LINHA_COTACOES || existingProduct.linhaCotacoes,
          moq: externalProductData.moq || externalProductData.MOQ || existingProduct.moq,
          qtMinVenda: externalProductData.qtMinVenda || externalProductData.QT_MIN_VENDA || existingProduct.qtMinVenda,
          dun: externalProductData.dun || externalProductData.DUN || existingProduct.dun,
          cest: externalProductData.cest || externalProductData.CEST || existingProduct.cest,
          ean: externalProductData.ean || externalProductData.EAN || existingProduct.ean,
          
          // Recalcular campos derivados
          orderQtyUn: this.calculateOrderQtyUn(
            externalProductData.orderQtyBox || existingProduct.orderQtyBox,
            externalProductData.unitCtn || externalProductData.UNIT_CTN || existingProduct.unitCtn
          ),
          totalRmb: this.calculateTotalRmb(
            this.calculateOrderQtyUn(
              externalProductData.orderQtyBox || existingProduct.orderQtyBox,
              externalProductData.unitCtn || externalProductData.UNIT_CTN || existingProduct.unitCtn
            ),
            externalProductData.unitPriceRmb || externalProductData.UNIT_PRICE_RMB || existingProduct.unitPriceRmb
          ),
          
          lastSyncDate: serverTimestamp()
        };
        
        await this.updateLinkedProduct(existingProduct.id, updatedData);
        return existingProduct.id;
      } else {
        // Criar novo produto vinculado
        const newProductData = {
          referencia: externalProductData.referencia,
          nomeRaviProfit: externalProductData.nomeRaviProfit || externalProductData.NOME || externalProductData.DESCRICAO || '',
          ncm: externalProductData.ncm || externalProductData.NCM || '',
          unitCtn: externalProductData.unitCtn || externalProductData.UNIT_CTN || 0,
          unitPriceRmb: externalProductData.unitPriceRmb || externalProductData.UNIT_PRICE_RMB || 0,
          valorInvoiceUs: externalProductData.valorInvoiceUsd || externalProductData.VALOR_INVOICE_USD || 0,
          pesoUnitario: externalProductData.pesoUnitario || externalProductData.PESO_UNITARIO || 0,
          nw: externalProductData.nw || externalProductData.NW || 0,
          gw: externalProductData.gw || externalProductData.GW || 0,
          cbm: externalProductData.cbm || externalProductData.CBM || 0,
          
          // Campos adicionais
          nomeDiNb: externalProductData.nomeDiNb || externalProductData.NOME_DI_NB || '',
          marca: externalProductData.marca || externalProductData.MARCA || '',
          linhaCotacoes: externalProductData.linhaCotacoes || externalProductData.LINHA_COTACOES || '',
          moq: externalProductData.moq || externalProductData.MOQ || 0,
          qtMinVenda: externalProductData.qtMinVenda || externalProductData.QT_MIN_VENDA || 0,
          dun: externalProductData.dun || externalProductData.DUN || '',
          cest: externalProductData.cest || externalProductData.CEST || '',
          ean: externalProductData.ean || externalProductData.EAN || '',
          
          // Campos padrão
          orderQtyBox: 0,
          orderQtyUn: 0,
          totalRmb: 0,
          status: 'Desenvolvimento',
          container: '',
          eta: '',
          lote: '',
          dataPedido: new Date().toISOString().split('T')[0],
          
          lastSyncDate: serverTimestamp()
        };
        
        return await this.createLinkedProduct(newProductData);
      }
    } catch (error) {
      console.error('Erro ao sincronizar com base externa:', error);
      throw error;
    }
  }

  // Funções auxiliares para cálculos
  calculateOrderQtyUn(orderQtyBox, unitCtn) {
    return (parseFloat(orderQtyBox) || 0) * (parseFloat(unitCtn) || 0);
  }

  calculateTotalRmb(orderQtyUn, unitPriceRmb) {
    return (parseFloat(orderQtyUn) || 0) * (parseFloat(unitPriceRmb) || 0);
  }
}

export const linkedProductService = new LinkedProductService();
