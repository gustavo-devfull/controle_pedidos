import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { externalDb } from '../firebase/externalConfig';

// Serviço para buscar produtos externos diretamente no Firebase
export const externalProductService = {
  // Buscar produtos externos por referência
  async searchProductsByRef(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      console.log('=== BUSCA DIRETA NO BANCO EXTERNO ===');
      console.log('Termo de busca:', searchTerm);
      console.log('Banco externo configurado:', externalDb);
      
      // Testar diferentes nomes de coleção
      const possibleCollections = ['produtos_externos', 'produtos', 'products', 'items', 'cadastro'];
      let foundCollection = null;
      let foundData = null;
      
      for (const collectionName of possibleCollections) {
        try {
          console.log(`Testando coleção: ${collectionName}`);
          const testRef = collection(externalDb, collectionName);
          const testQuery = query(testRef, limit(1));
          const testSnapshot = await getDocs(testQuery);
          
          if (!testSnapshot.empty) {
            console.log(`✅ Coleção ${collectionName} encontrada!`);
            foundCollection = collectionName;
            foundData = testSnapshot.docs[0].data();
            console.log('Primeiro documento:', foundData);
            console.log('Campos disponíveis:', Object.keys(foundData));
            break;
          } else {
            console.log(`❌ Coleção ${collectionName} vazia ou não existe`);
          }
        } catch (error) {
          console.log(`❌ Erro ao acessar coleção ${collectionName}:`, error.message);
        }
      }
      
      if (!foundCollection) {
        console.error('Nenhuma coleção válida encontrada!');
        return [];
      }
      
      console.log(`Usando coleção: ${foundCollection}`);
      const productsRef = collection(externalDb, foundCollection);
      
      // Tentar diferentes estratégias de busca
      let products = [];
      
      // 1. Busca por referência exata primeiro
      console.log('Tentando busca por referência exata...');
      try {
        const exactQuery = query(
          productsRef,
          where('referencia', '==', searchTerm.toUpperCase()),
          limit(5)
        );
        const exactSnapshot = await getDocs(exactQuery);
        if (!exactSnapshot.empty) {
          console.log('✅ Encontrado por referência exata!');
          products = exactSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`=== DOCUMENTO EXATO ${doc.id} ===`);
            console.log('Dados completos:', data);
            console.log('Campos disponíveis:', Object.keys(data));
            return { id: doc.id, ...data };
          });
        }
      } catch (error) {
        console.log('❌ Erro na busca exata:', error.message);
      }
      
      // 2. Se não encontrou por exata, tentar busca por prefixo
      if (products.length === 0) {
        console.log('Executando busca por prefixo...');
        const searchQuery = query(
          productsRef, 
          where('referencia', '>=', searchTerm.toUpperCase()),
          where('referencia', '<=', searchTerm.toUpperCase() + '\uf8ff'),
          orderBy('referencia'),
          limit(20)
        );
        
        const querySnapshot = await getDocs(searchQuery);
        products = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`=== DOCUMENTO PREFIXO ${doc.id} ===`);
          console.log('Dados completos:', data);
          console.log('Campos disponíveis:', Object.keys(data));
          return {
            id: doc.id,
            ...data
          };
        });
      }
      
      console.log('Produtos encontrados:', products.length);
      if (products.length > 0) {
        console.log('Primeiro produto encontrado:', products[0]);
        console.log('Campos do primeiro produto:', Object.keys(products[0]));
      }
      
      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos externos:', error);
      console.error('Detalhes do erro:', error.code, error.message);
      throw error;
    }
  },

  // Buscar produtos externos por referência exata
  async searchProductByExactRef(ref) {
    try {
      if (!ref) {
        return null;
      }

      console.log('Buscando produto externo por referência exata:', ref);
      
      const productsRef = collection(externalDb, 'produtos_externos');
      const q = query(productsRef, where('referencia', '==', ref.toUpperCase()));
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Erro ao buscar produto externo por referência exata:', error);
      throw error;
    }
  },

  // Buscar todos os produtos externos
  async getAllExternalProducts() {
    try {
      console.log('Buscando todos os produtos externos');
      
      const productsRef = collection(externalDb, 'produtos_externos');
      const q = query(productsRef, orderBy('referencia'), limit(100));
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Total de produtos externos:', products.length);
      return products;
    } catch (error) {
      console.error('Erro ao buscar todos os produtos externos:', error);
      throw error;
    }
  },

  // Função de teste para debug - buscar produtos que contenham "RV"
  async testSearchRV() {
    try {
      console.log('=== TESTE DE CONEXÃO COM BANCO EXTERNO ===');
      
      const productsRef = collection(externalDb, 'produtos_externos');
      
      // Teste 1: Verificar se conseguimos acessar o banco
      console.log('1. Testando conexão com Firebase externo...');
      console.log('Banco configurado:', externalDb);
      
      // Teste 2: Listar todas as coleções disponíveis (se possível)
      console.log('2. Tentando acessar coleção produtos_externos...');
      const testQuery = query(productsRef, limit(1));
      const testSnapshot = await getDocs(testQuery);
      console.log('Coleção produtos_externos existe?', !testSnapshot.empty);
      
      if (!testSnapshot.empty) {
        console.log('Primeiro documento encontrado:', testSnapshot.docs[0].data());
        console.log('Campos disponíveis:', Object.keys(testSnapshot.docs[0].data()));
      }
      
      // Teste 3: Tentar outras possíveis coleções
      console.log('3. Testando outras possíveis coleções...');
      const possibleCollections = ['produtos', 'products', 'items', 'cadastro'];
      
      for (const collectionName of possibleCollections) {
        try {
          console.log(`Testando coleção: ${collectionName}`);
          const testCollectionRef = collection(externalDb, collectionName);
          const testCollectionQuery = query(testCollectionRef, limit(1));
          const testCollectionSnapshot = await getDocs(testCollectionQuery);
          console.log(`Coleção ${collectionName} existe?`, !testCollectionSnapshot.empty);
          
          if (!testCollectionSnapshot.empty) {
            console.log(`Primeiro documento de ${collectionName}:`, testCollectionSnapshot.docs[0].data());
          }
        } catch (error) {
          console.log(`Erro ao testar coleção ${collectionName}:`, error.message);
        }
      }
      
      // Teste 4: Busca específica por "RV" na coleção produtos_externos
      console.log('4. Buscando produtos com RV na coleção produtos_externos...');
      const rvQuery = query(
        productsRef,
        where('referencia', '>=', 'RV'),
        where('referencia', '<=', 'RV\uf8ff'),
        limit(10)
      );
      
      const rvSnapshot = await getDocs(rvQuery);
      console.log('Produtos com RV encontrados:', rvSnapshot.docs.length);
      
      if (rvSnapshot.docs.length > 0) {
        console.log('Produtos RV encontrados:');
        rvSnapshot.docs.forEach((doc, index) => {
          console.log(`RV ${index + 1}:`, doc.data());
        });
      }
      
      return rvSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }
};
