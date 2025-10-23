import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Serviço para gerenciar containers
export const containerService = {
  // Criar novo container
  async createContainer(containerData) {
    try {
      const containerObject = {
        ...containerData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'containers'), containerObject);
      return { id: docRef.id, ...containerObject };
    } catch (error) {
      console.error('Erro ao criar container:', error);
      throw error;
    }
  },

  // Buscar todos os containers
  async getAllContainers() {
    try {
      console.log('Buscando containers no Firebase...');
      const q = query(collection(db, 'containers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const containers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const container = {
          id: doc.id,
          ...data
        };
        console.log('Container carregado:', { id: doc.id, numeroContainer: data.numeroContainer });
        return container;
      });
      
      console.log(`Total de containers carregados: ${containers.length}`);
      return containers;
    } catch (error) {
      console.error('Erro ao buscar containers:', error);
      throw error;
    }
  },

  // Atualizar container
  async updateContainer(containerId, updateData) {
    try {
      if (!containerId) {
        throw new Error('ID do container é obrigatório');
      }
      
      if (!updateData) {
        throw new Error('Dados para atualização são obrigatórios');
      }
      
      console.log('Atualizando container no Firebase:', { containerId, updateData });
      
      const containerRef = doc(db, 'containers', containerId);
      await updateDoc(containerRef, {
        ...updateData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar container:', error);
      throw error;
    }
  },

  // Excluir container
  async deleteContainer(containerId) {
    try {
      if (!containerId) {
        throw new Error('ID do container é obrigatório');
      }
      
      console.log('Excluindo container do Firebase:', { containerId });
      
      await deleteDoc(doc(db, 'containers', containerId));
      return true;
    } catch (error) {
      console.error('Erro ao excluir container:', error);
      throw error;
    }
  },

  // Buscar container por número
  async getContainerByNumber(containerNumber) {
    try {
      const q = query(
        collection(db, 'containers'),
        where('numeroContainer', '==', containerNumber)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar container por número:', error);
      throw error;
    }
  },

  // Função para corrigir containers sem ID (migração)
  async fixContainersWithoutId() {
    try {
      console.log('Verificando containers sem ID...');
      const q = query(collection(db, 'containers'));
      const querySnapshot = await getDocs(q);
      
      let fixedCount = 0;
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        if (!data.id || data.id === null) {
          console.log('Corrigindo container sem ID:', docSnapshot.id);
          
          // Atualizar o documento com o ID correto
          await updateDoc(doc(db, 'containers', docSnapshot.id), {
            id: docSnapshot.id,
            updatedAt: new Date()
          });
          
          fixedCount++;
        }
      }
      
      if (fixedCount > 0) {
        console.log(`Corrigidos ${fixedCount} containers sem ID`);
        return true;
      }
      
      console.log('Todos os containers têm IDs válidos');
      return false;
    } catch (error) {
      console.error('Erro ao corrigir containers:', error);
      throw error;
    }
  }
};
