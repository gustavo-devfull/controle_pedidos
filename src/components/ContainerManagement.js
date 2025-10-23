import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, Eye, Calendar, DollarSign, Weight, Ship, Copy, X } from 'lucide-react';
import { containerService } from '../services/containerService';
import { hybridProductService } from '../services/hybridProductService';
import { linkedProductService } from '../services/linkedProductService';
import { formatNumber, formatUSD, formatRMB } from '../utils/numberFormat';
import ContainerForm from './ContainerForm';
import ContainerDetails from './ContainerDetails';

const ContainerManagement = () => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [embarkedProducts, setEmbarkedProducts] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [containerToDuplicate, setContainerToDuplicate] = useState(null);
  const [newContainerNumber, setNewContainerNumber] = useState('');
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedContainerProducts, setSelectedContainerProducts] = useState([]);
  const [selectedContainerNumber, setSelectedContainerNumber] = useState('');

  useEffect(() => {
    loadContainers();
    loadEmbarkedProducts();
  }, []);

  const loadEmbarkedProducts = async () => {
    try {
      // Primeiro, verificar e sincronizar automaticamente todos os produtos
      console.log('Verificando atualizações da base externa...');
      try {
        const syncResult = await linkedProductService.checkAndSyncAllProducts();
        console.log('Resultado da sincronização:', syncResult);
        
        if (syncResult.updatedCount > 0) {
          console.log(`${syncResult.updatedCount} produtos foram atualizados automaticamente`);
        }
      } catch (syncError) {
        console.warn('Erro na sincronização automática (continuando mesmo assim):', syncError);
      }
      
      // Depois, carregar os produtos atualizados
      const products = await linkedProductService.getAllLinkedProducts();
      const embarked = products.filter(product => 
        product.status === 'Embarcado' && product.container
      );
      setEmbarkedProducts(embarked);
    } catch (error) {
      console.error('Erro ao carregar produtos embarcados:', error);
    }
  };

  // Função para calcular TOTAL RMB de um container
  const calculateContainerTotalRmb = (containerNumber) => {
    const containerProducts = embarkedProducts.filter(product => 
      product.container === containerNumber
    );
    
    return containerProducts.reduce((sum, product) => {
      return sum + (parseFloat(product.totalRmb) || 0);
    }, 0);
  };

  // Função para verificar se um container tem produtos embarcados
  const hasEmbarkedProducts = (containerNumber) => {
    return embarkedProducts.some(product => product.container === containerNumber);
  };

  const loadContainers = async () => {
    try {
      setLoading(true);
      const data = await containerService.getAllContainers();
      
      // Verificar se há containers sem ID
      const containersWithoutId = data.filter(container => !container.id || container.id === null);
      if (containersWithoutId.length > 0) {
        console.warn(`Encontrados ${containersWithoutId.length} containers sem ID:`, containersWithoutId);
        console.log('Chamando função de correção...');
        const wasFixed = await containerService.fixContainersWithoutId();
        
        if (wasFixed) {
          console.log('Recarregando containers após correção...');
          const correctedData = await containerService.getAllContainers();
          setContainers(correctedData);
        } else {
          setContainers(data);
        }
      } else {
        setContainers(data);
      }
      
      // Recarregar produtos embarcados para atualizar o destaque
      await loadEmbarkedProducts();
    } catch (error) {
      console.error('Erro ao carregar containers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para duplicar container
  const handleDuplicateContainer = (container) => {
    setContainerToDuplicate(container);
    setNewContainerNumber('');
    setShowDuplicateModal(true);
  };

  // Função para confirmar duplicação
  const handleConfirmDuplicate = async () => {
    if (!newContainerNumber.trim()) {
      alert('Por favor, informe o número do container');
      return;
    }

    // Verificar se já existe um container com esse número
    const existingContainer = containers.find(c => 
      c.numeroContainer.toLowerCase() === newContainerNumber.toLowerCase()
    );

    if (existingContainer) {
      alert('Já existe um container com esse número');
      return;
    }

    try {
      // Criar novo container baseado no original
      const duplicatedContainer = {
        ...containerToDuplicate,
        id: null, // Remove ID para criar novo
        numeroContainer: newContainerNumber.trim(),
        // Limpar campos específicos que devem ser únicos
        etd: '',
        eta: '',
        dataPedido: new Date().toISOString().split('T')[0],
        // Manter outros campos como estão
      };

      await containerService.createContainer(duplicatedContainer);
      await loadContainers();
      
      setShowDuplicateModal(false);
      setContainerToDuplicate(null);
      setNewContainerNumber('');
      
      alert(`Container ${newContainerNumber} criado com sucesso!`);
    } catch (error) {
      console.error('Erro ao duplicar container:', error);
      alert('Erro ao duplicar container');
    }
  };

  // Função para cancelar duplicação
  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setContainerToDuplicate(null);
    setNewContainerNumber('');
  };

  // Função para abrir modal de produtos do container
  const handleShowContainerProducts = (containerNumber) => {
    const containerProducts = embarkedProducts.filter(product => 
      product.container === containerNumber
    );
    setSelectedContainerProducts(containerProducts);
    setSelectedContainerNumber(containerNumber);
    setShowProductsModal(true);
  };

  // Função para fechar modal de produtos
  const handleCloseProductsModal = () => {
    setShowProductsModal(false);
    setSelectedContainerProducts([]);
    setSelectedContainerNumber('');
  };

  const handleCreateContainer = async (containerData) => {
    try {
      await containerService.createContainer(containerData);
      await loadContainers();
      setShowForm(false);
      alert('Container criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar container:', error);
      alert(error.message || 'Erro ao criar container');
    }
  };

  const handleUpdateContainer = async (containerId, containerData) => {
    try {
      console.log('handleUpdateContainer chamado com:', { containerId, containerData });
      console.log('editingContainer atual:', editingContainer);
      
      if (!containerId) {
        console.error('ID do container não fornecido');
        console.error('editingContainer:', editingContainer);
        alert('Erro: ID do container não encontrado');
        return;
      }
      
      console.log('Atualizando container:', { containerId, containerData });
      await containerService.updateContainer(containerId, containerData);
      await loadContainers();
      setEditingContainer(null);
      alert('Container atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar container:', error);
      alert('Erro ao atualizar container: ' + error.message);
    }
  };

  const handleDeleteContainer = async (containerId) => {
    if (!containerId) {
      console.error('ID do container não fornecido para exclusão');
      alert('Erro: ID do container não encontrado');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este container?')) {
      try {
        console.log('Excluindo container:', containerId);
        await containerService.deleteContainer(containerId);
        await loadContainers();
        alert('Container excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir container:', error);
        alert('Erro ao excluir container: ' + error.message);
      }
    }
  };

  const filteredContainers = containers.filter(container => {
    const matchesSearch = 
      (container.numeroContainer?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (container.agente?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (container.exportador?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'EMBARCADO':
        return 'bg-blue-100 text-blue-800';
      case 'EM_TRANSITO':
        return 'bg-yellow-100 text-yellow-800';
      case 'CHEGOU':
        return 'bg-green-100 text-green-800';
      case 'LIBERADO':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Ship className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Containers</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Container</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por número do container, agente ou exportador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Containers - Todos os Campos */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '3000px' }}>
            <thead className="bg-gray-50">
              <tr>
                {/* Informações Básicas */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Número Container
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Agente
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Exportador
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Tipo Container
                </th>
                
                {/* Datas */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  ETD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  ETA
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Dias Viagem
                </th>
                
                {/* Valores Financeiros */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Valor Frete USD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Total RMB
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Total USD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Total Invoice USD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  USD -> RMB
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  USD China
                </th>
                
                {/* CBM */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  CBM Nominal
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  CBM Pedido
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  CBM Pck List
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Perda
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Frete/m³
                </th>
                
                {/* Peso */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  G.W.T
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  N.W.T
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Peso Total
                </th>
                
                {/* Taxas */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Taxa Siscomex
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Marinha Mercante
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  SDA
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Armazenagem
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Despachante
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Expediente
                </th>
                
                {/* Custos Adicionais */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Frete Rodoviário
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Diferença Câmbio Frete
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Handling USD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Capatazia
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  BL Fee
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  TRS Taxa Registro
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Drop Off USD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Desconsolidação USD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  ISPS USD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Logistic Charge USD
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Total Agente Marítimo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  In Land Charge
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Comissões
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Custo Total China RMB
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Invoice + Frete
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  VLR Estimado Liberação
                </th>
                
                {/* Observações */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Complemento
                </th>
                
                {/* Ações */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContainers.map((container) => (
                <tr 
                  key={container.id} 
                  className={`hover:bg-gray-50 ${
                    hasEmbarkedProducts(container.numeroContainer)
                      ? 'bg-yellow-50 hover:bg-yellow-100' 
                      : ''
                  }`}
                >
                  {/* Informações Básicas */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    <button
                      onClick={() => handleShowContainerProducts(container.numeroContainer)}
                      className="text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                      title="Clique para ver produtos associados"
                    >
                      {container.numeroContainer || 'N/A'}
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.agente || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.exportador || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.tipoContainer || 'N/A'}
                  </td>
                  
                  {/* Datas */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.etd ? new Date(container.etd).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.eta ? new Date(container.eta).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.diasViagem || 'N/A'}
                  </td>
                  
                  {/* Valores Financeiros */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.valorFreteUsd ? formatUSD(container.valorFreteUsd) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {(() => {
                      const calculatedTotalRmb = calculateContainerTotalRmb(container.numeroContainer);
                      return calculatedTotalRmb > 0 ? formatRMB(calculatedTotalRmb) : 'N/A';
                    })()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.totalUsd ? formatUSD(container.totalUsd) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.totalInvoiceUsd ? formatUSD(container.totalInvoiceUsd) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.usdParaRmb ? formatRMB(container.usdParaRmb) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.usdChina ? formatUSD(container.usdChina) : 'N/A'}
                  </td>
                  
                  {/* CBM */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.cbmNominal ? formatNumber(container.cbmNominal, 3) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.cbmPedido ? formatNumber(container.cbmPedido, 3) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.cbmPckList ? formatNumber(container.cbmPckList, 3) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.perda ? formatNumber(container.perda, 3) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.fretePorM3 ? formatUSD(container.fretePorM3, 3) : 'N/A'}
                  </td>
                  
                  {/* Peso */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.gwt ? `${container.gwt}kg` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.nwt ? `${container.nwt}kg` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.pesoTotal ? `${container.pesoTotal}kg` : 'N/A'}
                  </td>
                  
                  {/* Taxas */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.taxaSiscomex ? `$${container.taxaSiscomex}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.marinhaMercante ? `$${container.marinhaMercante}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.sda ? `$${container.sda}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.armazenagem ? `$${container.armazenagem}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.despachante ? `$${container.despachante}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.expediente ? `$${container.expediente}` : 'N/A'}
                  </td>
                  
                  {/* Custos Adicionais */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.freteRodoviario ? `$${container.freteRodoviario}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.diferencaCambioFrete ? `$${container.diferencaCambioFrete}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.handlingUsd ? `$${container.handlingUsd}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.capatazia ? `$${container.capatazia}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.blFee ? `$${container.blFee}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.trsTaxaRegistroSiscargaUsd ? `$${container.trsTaxaRegistroSiscargaUsd}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.dropOffUsd ? `$${container.dropOffUsd}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.desconsolidacaoUsd ? `$${container.desconsolidacaoUsd}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.ispsUsd ? `$${container.ispsUsd}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.logisticChargeUsd ? `$${container.logisticChargeUsd}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.totalAgenteMaritimo ? `$${container.totalAgenteMaritimo}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.inLandCharge ? `$${container.inLandCharge}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.comissoes ? `$${container.comissoes}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.custoTotalChinaRmb ? `¥${container.custoTotalChinaRmb}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.invoiceMaisFrete ? `$${container.invoiceMaisFrete}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {container.vlrEstimadoLiberacao ? `$${container.vlrEstimadoLiberacao}` : 'N/A'}
                  </td>
                  
                  {/* Observações */}
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate">
                    {container.complemento || 'N/A'}
                  </td>
                  
                  {/* Ações */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedContainer(container);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalhes"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          console.log('Editando container:', container);
                          console.log('Container ID:', container.id);
                          if (!container.id) {
                            alert('Erro: Container sem ID válido');
                            return;
                          }
                          setEditingContainer(container);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDuplicateContainer(container)}
                        className="text-green-600 hover:text-green-900"
                        title="Duplicar container"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteContainer(container.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredContainers.length === 0 && (
          <div className="text-center py-12">
            <Ship className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum container encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando um novo container.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      {showForm && (
        <ContainerForm
          onSubmit={handleCreateContainer}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingContainer && (
        <ContainerForm
          container={editingContainer}
          onSubmit={(data) => handleUpdateContainer(editingContainer.id, data)}
          onClose={() => setEditingContainer(null)}
        />
      )}

      {showDetails && selectedContainer && (
        <ContainerDetails
          container={selectedContainer}
          onClose={() => {
            setShowDetails(false);
            setSelectedContainer(null);
          }}
        />
      )}

      {/* Modal de Duplicação */}
      {showDuplicateModal && containerToDuplicate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Duplicar Container
                </h3>
                <button
                  onClick={handleCancelDuplicate}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Duplicando container: <span className="font-semibold">{containerToDuplicate.numeroContainer}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Informe o novo número do container:
                </p>
              </div>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={newContainerNumber}
                  onChange={(e) => setNewContainerNumber(e.target.value)}
                  placeholder="Ex: CONT001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDuplicate}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDuplicate}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Duplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Produtos do Container */}
      {showProductsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Produtos do Container: {selectedContainerNumber}
                </h3>
                <button
                  onClick={handleCloseProductsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {selectedContainerProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Foto
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          Referência
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Nome Ravi (Profit)
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          QTY
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          U.PRICE RMB
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          AMOUNT RMB
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedContainerProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex justify-center">
                              <img 
                                src={product.referencia ? `https://nyc3.digitaloceanspaces.com/moribr/base-fotos/${product.referencia}.jpg` : '/placeholder-product.png'} 
                                alt={product.referencia || 'Produto'}
                                className="object-cover rounded-lg border border-gray-200"
                                style={{ width: '60px', height: '60px' }}
                                onError={(e) => {
                                  e.target.src = '/placeholder-product.png';
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                            {product.referencia || 'N/A'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            {product.nomeRaviProfit || 'N/A'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-center">
                            {product.orderQtyUn || 'N/A'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-center">
                            {product.unitPriceRmb ? formatRMB(product.unitPriceRmb) : 'N/A'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-center font-medium">
                            {product.totalRmb ? formatRMB(product.totalRmb) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Resumo */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Total de Produtos: {selectedContainerProducts.length}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        Total RMB: {formatRMB(selectedContainerProducts.reduce((sum, product) => sum + (parseFloat(product.totalRmb) || 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto associado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este container não possui produtos embarcados.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseProductsModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainerManagement;
