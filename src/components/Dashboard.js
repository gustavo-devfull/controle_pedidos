import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, Clock, Ship, Calendar } from 'lucide-react';
import { hybridProductService } from '../services/hybridProductService';
import { containerService } from '../services/containerService';
import { linkedProductService } from '../services/linkedProductService';
import { ORDER_STATUS } from '../services/productService';
import { formatNumber, formatUSD, formatRMB } from '../utils/numberFormat';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    desenvolvimento: 0,
    fabricacao: 0,
    embarcado: 0,
    nacionalizado: 0
  });

  useEffect(() => {
    loadProducts();
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      const data = await containerService.getAllContainers();
      setContainers(data);
    } catch (error) {
      console.error('Erro ao carregar containers:', error);
    }
  };

  // Função para calcular progresso de chegada do container
  const getContainerProgress = (container) => {
    if (!container) return { percentage: 0, status: 'Sem dados', color: 'bg-gray-500' };
    
    const now = new Date();
    const etaDate = container.eta ? new Date(container.eta) : null;
    const etdDate = container.etd ? new Date(container.etd) : null;
    
    // Se não tem ETA, não pode calcular progresso
    if (!etaDate) return { percentage: 0, status: 'Sem ETA', color: 'bg-gray-500' };
    
    let percentage = 0;
    let status = 'Sem dados';
    let color = 'bg-gray-500';
    
    // Se tem ETD, calcular progresso baseado nas datas reais
    if (etdDate) {
      const totalDays = Math.ceil((etaDate - etdDate) / (24 * 60 * 60 * 1000));
      const daysPassed = Math.ceil((now - etdDate) / (24 * 60 * 60 * 1000));
      
      percentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
      
      if (now > etaDate) {
        percentage = 100;
        status = 'Chegou';
        color = 'bg-green-500';
      } else if (daysPassed < 0) {
        percentage = 0;
        status = 'Aguardando embarque';
        color = 'bg-yellow-500';
      } else {
        status = 'Em trânsito';
        color = 'bg-purple-500';
      }
    } else {
      // Se não tem ETD, apenas verificar se já passou do ETA
      if (now > etaDate) {
        percentage = 100;
        status = 'Chegou';
        color = 'bg-green-500';
      } else {
        status = 'Sem ETD';
        color = 'bg-orange-500';
      }
    }
    
    return { percentage, status, color };
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await linkedProductService.getAllLinkedProducts();
      setProducts(data);
      
      // Calcular estatísticas
      const newStats = {
        total: data.length,
        desenvolvimento: data.filter(p => p.status === ORDER_STATUS.DESENVOLVIMENTO).length,
        gerarPedido: data.filter(p => p.status === ORDER_STATUS.GERAR_PEDIDO).length,
        fabricacao: data.filter(p => p.status === ORDER_STATUS.FABRICACAO).length,
        embarcado: data.filter(p => p.status === ORDER_STATUS.EMBARCADO).length,
        nacionalizado: data.filter(p => p.status === ORDER_STATUS.NACIONALIZADO).length
      };
      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.DESENVOLVIMENTO:
        return 'bg-blue-500';
      case ORDER_STATUS.GERAR_PEDIDO:
        return 'bg-orange-500';
      case ORDER_STATUS.FABRICACAO:
        return 'bg-yellow-500';
      case ORDER_STATUS.EMBARCADO:
        return 'bg-purple-500';
      case ORDER_STATUS.NACIONALIZADO:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.DESENVOLVIMENTO:
        return <Clock className="h-5 w-5 text-white" />;
      case ORDER_STATUS.GERAR_PEDIDO:
        return <Package className="h-5 w-5 text-white" />;
      case ORDER_STATUS.FABRICACAO:
        return <Package className="h-5 w-5 text-white" />;
      case ORDER_STATUS.EMBARCADO:
        return <Ship className="h-5 w-5 text-white" />;
      case ORDER_STATUS.NACIONALIZADO:
        return <Package className="h-5 w-5 text-white" />;
      default:
        return <Package className="h-5 w-5 text-white" />;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de gerenciamento de pedidos</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.total, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Desenvolvimento</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.desenvolvimento, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gerar Pedido</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.gerarPedido, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fabricação</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.fabricacao, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Ship className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Embarcado</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.embarcado, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nacionalizado</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.nacionalizado, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card de Acompanhamento de Containers */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Ship className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Acompanhamento de Containers</h3>
            <p className="text-sm text-gray-600">Status de chegada dos containers com produtos embarcados</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {(() => {
            // Obter containers únicos que têm produtos embarcados
            const embarkedContainers = [...new Set(
              products
                .filter(product => product.status === ORDER_STATUS.EMBARCADO && product.container)
                .map(product => product.container)
            )];
            
            return embarkedContainers.map((containerNumber) => {
              const container = containers.find(c => c.numeroContainer === containerNumber);
              const progress = getContainerProgress(container);
              const etaDate = container?.eta ? new Date(container.eta) : null;
              
              // Contar produtos embarcados neste container
              const embarkedProductsCount = products.filter(
                product => product.status === ORDER_STATUS.EMBARCADO && product.container === containerNumber
              ).length;
              
              return (
                <div key={containerNumber} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 bg-blue-100 rounded">
                        <Ship className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Container: {containerNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          Agente: {container?.agente || 'N/A'} • {embarkedProductsCount} produto(s) embarcado(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        <div>ETD: {container?.etd ? new Date(container.etd).toLocaleDateString('pt-BR') : 'N/A'}</div>
                        <div>ETA: {etaDate ? etaDate.toLocaleDateString('pt-BR') : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">Status da Viagem</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${progress.color} text-white`}>
                        {progress.status}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${progress.color}`}
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatNumber(Math.round(progress.percentage), 0)}% concluído</span>
                      {etaDate && (
                        <span className="font-medium text-blue-600">
                          Faltam: {formatNumber(Math.ceil((etaDate - new Date()) / (24 * 60 * 60 * 1000)), 0)} dias para chegar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
          
          {products.filter(product => product.status === ORDER_STATUS.EMBARCADO && product.container).length === 0 && (
            <div className="text-center py-8">
              <Ship className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto embarcado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Não há produtos com status "Embarcado" no momento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total RMB</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatRMB(products.reduce((sum, p) => sum + (p.totalRmb || 0), 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Invoice U$</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatUSD(products.reduce((sum, p) => sum + (p.valorInvoiceUs || 0), 0), 3)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Peso Total (kg)</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatNumber(products.reduce((sum, p) => sum + (p.gw || 0), 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">CBM Total</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatNumber(products.reduce((sum, p) => sum + (p.cbm || 0), 0), 3)}
            </p>
          </div>
        </div>
      </div>

      {/* Distribuição por Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Status</h3>
        <div className="space-y-3">
          {Object.values(ORDER_STATUS).map((status) => {
            const count = products.filter(p => p.status === status).length;
            const statsKey = status === ORDER_STATUS.GERAR_PEDIDO ? 'gerarPedido' : 
                            status === ORDER_STATUS.DESENVOLVIMENTO ? 'desenvolvimento' :
                            status === ORDER_STATUS.FABRICACAO ? 'fabricacao' :
                            status === ORDER_STATUS.EMBARCADO ? 'embarcado' :
                            status === ORDER_STATUS.NACIONALIZADO ? 'nacionalizado' : 'total';
            
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatNumber(count, 0)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Produtos Recentes */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Recentes</h3>
        <div className="space-y-3">
          {products.slice(0, 5).map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{product.referencia}</p>
                <p className="text-xs text-gray-500">{product.nomeRaviProfit || product.nomeRavi || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatRMB(product.totalRmb || 0)}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(product.status)} text-white`}>
                  {product.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;