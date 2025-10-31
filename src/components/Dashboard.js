import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, Clock, Ship, Calendar, Battery } from 'lucide-react';
import { hybridProductService } from '../services/hybridProductService';
import { containerService } from '../services/containerService';
import { linkedProductService } from '../services/linkedProductService';
import { ORDER_STATUS } from '../services/productService';
import { formatNumber, formatUSD, formatRMB, formatInteger } from '../utils/numberFormat';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
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
  // Filtros para Acompanhamento de Containers
  const [etaStart, setEtaStart] = useState('');
  const [etaEnd, setEtaEnd] = useState('');
  const [statusAcomp, setStatusAcomp] = useState('all');
  const [orderContainer, setOrderContainer] = useState('asc');

  // Util: parse "YYYY-MM-DD" como data local (sem deslocamento de fuso)
  const parseLocalDate = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(value);
    // Normalizar para o dia local (zerando hora) para consistência
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const etaDate = container?.eta ? parseLocalDate(container.eta) : null;
    const etdDate = container?.etd ? parseLocalDate(container.etd) : null;
    
    // Se não tem ETA, não pode calcular progresso
    if (!etaDate) return { percentage: 0, status: 'Sem ETA', color: 'bg-gray-500' };
    
    let percentage = 0;
    let status = 'Sem dados';
    let color = 'bg-gray-500';
    
    // Se tem ETD, calcular progresso baseado nas datas reais
    if (etdDate) {
      const totalDays = Math.ceil((etaDate - etdDate) / (24 * 60 * 60 * 1000));
      const daysPassed = Math.ceil((today - etdDate) / (24 * 60 * 60 * 1000));
      
      percentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
      
      if (today.getTime() === etaDate.getTime()) {
        status = 'Descarregando';
        color = 'bg-blue-500';
      } else if (today > etaDate) {
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
      if (today.getTime() === etaDate.getTime()) {
        status = 'Descarregando';
        color = 'bg-blue-500';
      } else if (today > etaDate) {
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

      {/* Resumo Financeiro por Container */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {containers.map((container) => {
            // Calcular total RMB e CBM TOTAL dos produtos deste container
            const containerProducts = products.filter(product => product.container === container.numeroContainer);
            const totalRmb = containerProducts.reduce((sum, product) => sum + (Number(product.totalRmb) || 0), 0);
            const toNumber = (value) => {
              if (value === null || value === undefined || value === '') return 0;
              if (typeof value === 'number') return value;
              if (typeof value === 'string') {
                const normalized = value.replace(/\./g, '').replace(',', '.');
                const parsed = parseFloat(normalized);
                return isNaN(parsed) ? 0 : parsed;
              }
              return 0;
            };
            const totalCbm = containerProducts.reduce((sum, product) => {
              const cbmTotalRaw = product.cbmTotal;
              const cbmRaw = product.cbm;
              const qtyBoxRaw = product.orderQtyBox;
              const cbmTotalVal = toNumber(cbmTotalRaw);
              const cbmVal = toNumber(cbmRaw);
              const qtyBoxVal = toNumber(qtyBoxRaw);
              const perProductTotal = cbmTotalVal > 0 ? cbmTotalVal : (cbmVal * qtyBoxVal);
              return sum + (perProductTotal || 0);
            }, 0);
            
            const handleOpenContainer = () => {
              navigate('/produtos', { state: { selectedContainer: container.numeroContainer } });
            };
            return (
              <div onClick={handleOpenContainer} key={container.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow">
                <div className="flex items-center mb-3">
                  <Battery className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm font-medium text-gray-700">Container</p>
                  <span className="mx-2 text-gray-300">|</span>
                  <p className="text-sm font-semibold text-gray-900">{container.numeroContainer || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {/* Coluna de valores */}
                  <div>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Total RMB</p>
                      <p className="text-xl font-bold text-blue-600">{formatRMB(totalRmb)}</p>
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{containerProducts.length}</span> produtos
                      {/* Removido CBM TOTAL após produtos */}
                    </div>
                  </div>

                  {/* Coluna do gráfico de cubagem */}
                  {(() => {
                    const MAX_CBM = 69;
                    const percent = MAX_CBM > 0 ? (totalCbm / MAX_CBM) * 100 : 0;
                    const clamped = Math.min(Math.max(percent, 0), 100);
                    const isOver = percent > 100;
                    const barColor = isOver ? 'bg-red-500' : (totalCbm > 0 ? 'bg-blue-600' : 'bg-blue-200');
                    const labelColor = isOver ? 'text-red-600' : 'text-blue-700';
                    const diff = totalCbm - MAX_CBM;
                    const isExceeded = diff > 0;
                    const remaining = isExceeded ? 0 : (MAX_CBM - totalCbm);
                    const exceeded = isExceeded ? diff : 0;
                    return (
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-700">Cubagem</p>
                          <p className={`text-xs font-semibold ${labelColor}`}>{formatNumber(percent, 1)}%</p>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`${barColor} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${isOver ? 100 : clamped}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                          <span>{formatNumber(totalCbm, 2)} m³</span>
                          <span className="mx-2 text-gray-300">|</span>
                          {isExceeded ? (
                            <span className="text-red-600">Passou: {formatNumber(exceeded, 2)} m³</span>
                          ) : (
                            <span>Faltam: {formatNumber(Math.max(remaining, 0), 2)} m³</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
          
          {containers.length === 0 && (
            <div className="col-span-full text-center py-8">
              <Ship className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum container cadastrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Cadastre containers para visualizar o resumo financeiro.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card de Acompanhamento de Containers */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ship className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Acompanhamento de Containers</h3>
              <p className="text-sm text-gray-600">Status de chegada dos containers com produtos embarcados</p>
            </div>
          </div>
          {/* Filtros ao lado do título */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ETA de</label>
                <input
                  type="date"
                  value={etaStart}
                  onChange={(e) => setEtaStart(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">até</label>
                <input
                  type="date"
                  value={etaEnd}
                  onChange={(e) => setEtaEnd(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={statusAcomp}
                  onChange={(e) => setStatusAcomp(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="all">Todos</option>
                  <option value="Aguardando embarque">Aguardando embarque</option>
                  <option value="Em trânsito">Em trânsito</option>
                  <option value="Descarregando">Descarregando</option>
                  <option value="Chegou">Chegou</option>
                  <option value="Sem ETD">Sem ETD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ordem</label>
                <select
                  value={orderContainer}
                  onChange={(e) => setOrderContainer(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="asc">Crescente (ult. 3 dígitos)</option>
                  <option value="desc">Decrescente (ult. 3 dígitos)</option>
                </select>
              </div>
              <button
                onClick={() => { setEtaStart(''); setEtaEnd(''); setStatusAcomp('all'); setOrderContainer('asc'); }}
                className="text-xs bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
        
        {/* Grid dos cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            // Obter containers únicos que têm produtos embarcados
            const embarkedContainers = [...new Set(
              products
                .filter(product => product.status === ORDER_STATUS.EMBARCADO && product.container)
                .map(product => product.container)
            )];
            
            // Mapear com dados necessários
            let items = embarkedContainers.map((containerNumber) => {
              const container = containers.find(c => c.numeroContainer === containerNumber);
              const progress = getContainerProgress(container);
              const etaDate = container?.eta ? parseLocalDate(container.eta) : null;
              
              // Contar produtos embarcados neste container
              const embarkedProductsCount = products.filter(
                product => product.status === ORDER_STATUS.EMBARCADO && product.container === containerNumber
              ).length;
              return {
                key: containerNumber,
                container,
                progress,
                etaDate,
                embarkedProductsCount
              };
            });

            // Aplicar filtros
            if (etaStart) {
              const start = parseLocalDate(etaStart);
              items = items.filter(i => !i.etaDate || i.etaDate >= start);
            }
            if (etaEnd) {
              const end = parseLocalDate(etaEnd);
              items = items.filter(i => !i.etaDate || i.etaDate <= end);
            }
            if (statusAcomp !== 'all') {
              items = items.filter(i => i.progress.status === statusAcomp);
            }

            // Ordenação por número do container (considerar os 3 últimos dígitos numéricos)
            const last3 = (v) => {
              const s = (v || '').toString();
              const m = s.match(/(\d{3})$/);
              return m ? parseInt(m[1], 10) : 0;
            };
            items.sort((a, b) => {
              const aNum = last3(a.container?.numeroContainer);
              const bNum = last3(b.container?.numeroContainer);
              if (aNum < bNum) return orderContainer === 'asc' ? -1 : 1;
              if (aNum > bNum) return orderContainer === 'asc' ? 1 : -1;
              return 0;
            });

            return items.map(({ key, container, progress, etaDate, embarkedProductsCount }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 bg-blue-100 rounded">
                        <Ship className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Container: {key}
                        </p>
                        <p className="text-xs text-gray-500">
                          Agente: {container?.agente || 'N/A'} • {embarkedProductsCount} produto(s) embarcado(s) • {container?.valorFreteUsd ? formatUSD(container.valorFreteUsd) : 'Valor Frete USD: N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        <div>ETD: {container?.etd ? parseLocalDate(container.etd).toLocaleDateString('pt-BR') : 'N/A'}</div>
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
                          {(() => {
                            const dayMs = 24 * 60 * 60 * 1000;
                            const now = new Date();
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const etaDay = new Date(etaDate.getFullYear(), etaDate.getMonth(), etaDate.getDate());
                            const diffDays = Math.round((etaDay - today) / dayMs);
                            if (diffDays === 0) return 'Chegou hoje';
                            if (diffDays < 0) {
                              const abs = Math.abs(diffDays);
                              return abs === 1
                                ? 'Chegou faz 1 dia'
                                : `Chegou fazem ${formatNumber(abs, 0)} dias`;
                            }
                            return `Faltam: ${formatNumber(diffDays, 0)} dias para chegar`;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ));
          })()}
          
          {products.filter(product => product.status === ORDER_STATUS.EMBARCADO && product.container).length === 0 && (
            <div className="col-span-full text-center py-8">
              <Ship className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto embarcado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Não há produtos com status "Embarcado" no momento.
              </p>
            </div>
          )}
        </div>
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
    </div>
  );
};

export default Dashboard;