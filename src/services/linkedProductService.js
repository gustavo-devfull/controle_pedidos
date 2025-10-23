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
        where('isActive', '==', true)
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
      
      // Ordenar por data de criação (mais recente primeiro)
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
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

  // Buscar produto vinculado por referência que pode ser atualizado (não Embarcado ou Nacionalizado)
  async getLinkedProductByRefForUpdate(referencia) {
    try {
      console.log('Buscando produto vinculado por referência para atualização:', referencia);
      const q = query(
        collection(db, 'linkedProducts'),
        where('referencia', '==', referencia),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Buscar produto que não seja Embarcado ou Nacionalizado
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.status !== 'Embarcado' && data.status !== 'Nacionalizado') {
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date()
          };
        }
      }
      
      // Se não encontrou produto atualizável, retornar null para permitir criação de novo
      return null;
    } catch (error) {
      console.error('Erro ao buscar produto vinculado por referência para atualização:', error);
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
        where('productId', '==', productId)
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
      
      // Ordenar por data de mudança de status (mais recente primeiro)
      history.sort((a, b) => new Date(b.statusChangeDate) - new Date(a.statusChangeDate));
      
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
      
      // Buscar produto vinculado existente que pode ser atualizado
      const existingProduct = await this.getLinkedProductByRefForUpdate(referencia);
      
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
          codRavi: externalProductData.codRavi || externalProductData.COD_RAVI || existingProduct.codRavi,
          obsPedido: externalProductData.obsPedido || externalProductData.OBS_PEDIDO || existingProduct.obsPedido,
          description: externalProductData.description || externalProductData.DESCRIPTION || existingProduct.description,
          remark: externalProductData.remark || externalProductData.REMARK || existingProduct.remark,
          obs: externalProductData.obs || externalProductData.OBS || existingProduct.obs,
          l: externalProductData.l || externalProductData.L || existingProduct.l,
          w: externalProductData.w || externalProductData.W || existingProduct.w,
          h: externalProductData.h || externalProductData.H || existingProduct.h,
          unit: externalProductData.unit || externalProductData.UNIT || existingProduct.unit,
          fabrica: externalProductData.fabrica || externalProductData.FABRICA || existingProduct.fabrica,
          itemNo: externalProductData.itemNo || externalProductData.ITEM_NO || existingProduct.itemNo,
          name: externalProductData.name || externalProductData.NAME || existingProduct.name,
          nomeInvoiceEn: externalProductData.nomeInvoiceEn || externalProductData.NOME_INVOICE_EN || existingProduct.nomeInvoiceEn,
          usKg: externalProductData.usKg || externalProductData.US_KG || existingProduct.usKg,
          usKgMin: externalProductData.usKgMin || externalProductData.US_KG_MIN || existingProduct.usKgMin,
          cbmTotal: externalProductData.cbmTotal || externalProductData.CBM_TOTAL || existingProduct.cbmTotal,
          totalPesoLiq: externalProductData.totalPesoLiq || externalProductData.TOTAL_PESO_LIQ || existingProduct.totalPesoLiq,
          totalPesoBruto: externalProductData.totalPesoBruto || externalProductData.TOTAL_PESO_BRUTO || existingProduct.totalPesoBruto,
          totalInvoice: externalProductData.totalInvoice || externalProductData.TOTAL_INVOICE || existingProduct.totalInvoice,
          
          // Atualizar campos de vinculação
          produtoExternoId: externalProductData.id,
          produtoExternoRef: externalProductData.referencia,
          produtoExternoNome: externalProductData.nomeRaviProfit || externalProductData.name,
          produtoExternoPreco: externalProductData.unitPriceRmb,
          produtoExternoCategoria: externalProductData.marca,
          produtoExternoStock: externalProductData.qtMinVenda,
          vinculadoEm: existingProduct.vinculadoEm || new Date(),
          vinculadoPor: existingProduct.vinculadoPor || 'sistema',
          
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
          
          // Campos adicionais da base externa
          nomeDiNb: externalProductData.nomeDiNb || externalProductData.NOME_DI_NB || '',
          marca: externalProductData.marca || externalProductData.MARCA || '',
          linhaCotacoes: externalProductData.linhaCotacoes || externalProductData.LINHA_COTACOES || '',
          moq: externalProductData.moq || externalProductData.MOQ || 0,
          qtMinVenda: externalProductData.qtMinVenda || externalProductData.QT_MIN_VENDA || 0,
          dun: externalProductData.dun || externalProductData.DUN || '',
          cest: externalProductData.cest || externalProductData.CEST || '',
          ean: externalProductData.ean || externalProductData.EAN || '',
          codRavi: externalProductData.codRavi || externalProductData.COD_RAVI || '',
          obsPedido: externalProductData.obsPedido || externalProductData.OBS_PEDIDO || '',
          description: externalProductData.description || externalProductData.DESCRIPTION || '',
          remark: externalProductData.remark || externalProductData.REMARK || '',
          obs: externalProductData.obs || externalProductData.OBS || '',
          l: externalProductData.l || externalProductData.L || 0,
          w: externalProductData.w || externalProductData.W || 0,
          h: externalProductData.h || externalProductData.H || 0,
          unit: externalProductData.unit || externalProductData.UNIT || '',
          fabrica: externalProductData.fabrica || externalProductData.FABRICA || '',
          itemNo: externalProductData.itemNo || externalProductData.ITEM_NO || '',
          name: externalProductData.name || externalProductData.NAME || '',
          nomeInvoiceEn: externalProductData.nomeInvoiceEn || externalProductData.NOME_INVOICE_EN || '',
          usKg: externalProductData.usKg || externalProductData.US_KG || 0,
          usKgMin: externalProductData.usKgMin || externalProductData.US_KG_MIN || 0,
          cbmTotal: externalProductData.cbmTotal || externalProductData.CBM_TOTAL || 0,
          totalPesoLiq: externalProductData.totalPesoLiq || externalProductData.TOTAL_PESO_LIQ || 0,
          totalPesoBruto: externalProductData.totalPesoBruto || externalProductData.TOTAL_PESO_BRUTO || 0,
          totalInvoice: externalProductData.totalInvoice || externalProductData.TOTAL_INVOICE || 0,
          
          // Campos de vinculação
          produtoExternoId: externalProductData.id,
          produtoExternoRef: externalProductData.referencia,
          produtoExternoNome: externalProductData.nomeRaviProfit || externalProductData.name,
          produtoExternoPreco: externalProductData.unitPriceRmb,
          produtoExternoCategoria: externalProductData.marca,
          produtoExternoStock: externalProductData.qtMinVenda,
          vinculadoEm: new Date(),
          vinculadoPor: 'sistema',
          
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

  // Verificar e sincronizar automaticamente todos os produtos vinculados
  async checkAndSyncAllProducts() {
    try {
      console.log('Verificando e sincronizando todos os produtos vinculados...');
      
      // Buscar todos os produtos vinculados
      const linkedProducts = await this.getAllLinkedProducts();
      console.log(`Encontrados ${linkedProducts.length} produtos para verificação`);
      
      let updatedCount = 0;
      let errorCount = 0;
      
      // Processar cada produto
      for (const product of linkedProducts) {
        try {
          if (!product.referencia) {
            console.warn(`Produto ${product.id} sem referência, pulando...`);
            continue;
          }
          
          // Pular produtos com status Embarcado ou Nacionalizado
          if (product.status === 'Embarcado' || product.status === 'Nacionalizado') {
            console.log(`Produto ${product.referencia} com status ${product.status} - pulando sincronização`);
            continue;
          }
          
          console.log(`Verificando produto: ${product.referencia}`);
          
          // Buscar dados atualizados da base externa
          const externalProducts = await this.searchExternalProduct(product.referencia);
          
          if (externalProducts && externalProducts.length > 0) {
            const externalProduct = externalProducts[0];
            
            // Verificar se há diferenças significativas
            const hasChanges = this.hasSignificantChanges(product, externalProduct);
            
            if (hasChanges) {
              console.log(`Atualizando produto ${product.referencia} com dados da base externa`);
              
              // Sincronizar com base externa
              await this.syncWithExternalBase(product.referencia, externalProduct);
              updatedCount++;
            } else {
              console.log(`Produto ${product.referencia} já está atualizado`);
            }
          } else {
            console.warn(`Produto ${product.referencia} não encontrado na base externa`);
          }
          
          // Pequena pausa para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Erro ao verificar produto ${product.referencia}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Sincronização concluída: ${updatedCount} produtos atualizados, ${errorCount} erros`);
      return { updatedCount, errorCount, totalChecked: linkedProducts.length };
      
    } catch (error) {
      console.error('Erro ao verificar e sincronizar produtos:', error);
      throw error;
    }
  }

  // Buscar produto na base externa
  async searchExternalProduct(referencia) {
    try {
      // Importar o serviço externo dinamicamente para evitar dependência circular
      const { externalProductService } = await import('./externalProductService');
      return await externalProductService.searchProductsByRef(referencia);
    } catch (error) {
      console.error('Erro ao buscar produto na base externa:', error);
      return null;
    }
  }

  // Verificar se há mudanças significativas entre produto local e externo
  hasSignificantChanges(localProduct, externalProduct) {
    const fieldsToCheck = [
      'nomeRaviProfit', 'NOME', 'DESCRICAO',
      'ncm', 'NCM',
      'unitCtn', 'UNIT_CTN',
      'unitPriceRmb', 'UNIT_PRICE_RMB',
      'valorInvoiceUsd', 'VALOR_INVOICE_USD',
      'pesoUnitario', 'PESO_UNITARIO',
      'nw', 'NW',
      'gw', 'GW',
      'cbm', 'CBM',
      'marca', 'MARCA',
      'linhaCotacoes', 'LINHA_COTACOES',
      'moq', 'MOQ',
      'qtMinVenda', 'QT_MIN_VENDA',
      'nomeDiNb', 'NOME_DI_NB',
      'dun', 'DUN',
      'cest', 'CEST',
      'ean', 'EAN',
      'codRavi', 'COD_RAVI',
      'obsPedido', 'OBS_PEDIDO',
      'description', 'DESCRIPTION',
      'remark', 'REMARK',
      'obs', 'OBS',
      'l', 'L',
      'w', 'W',
      'h', 'H',
      'unit', 'UNIT',
      'fabrica', 'FABRICA',
      'itemNo', 'ITEM_NO',
      'name', 'NAME',
      'nomeInvoiceEn', 'NOME_INVOICE_EN',
      'usKg', 'US_KG',
      'usKgMin', 'US_KG_MIN',
      'cbmTotal', 'CBM_TOTAL',
      'totalPesoLiq', 'TOTAL_PESO_LIQ',
      'totalPesoBruto', 'TOTAL_PESO_BRUTO',
      'totalInvoice', 'TOTAL_INVOICE'
    ];
    
    for (const field of fieldsToCheck) {
      const localValue = localProduct[field];
      const externalValue = externalProduct[field];
      
      // Verificar se os valores são diferentes (considerando null/undefined como vazio)
      const localNormalized = localValue === null || localValue === undefined ? '' : String(localValue);
      const externalNormalized = externalValue === null || externalValue === undefined ? '' : String(externalValue);
      
      if (localNormalized !== externalNormalized) {
        console.log(`Campo ${field} mudou: "${localNormalized}" -> "${externalNormalized}"`);
        return true;
      }
    }
    
    return false;
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
