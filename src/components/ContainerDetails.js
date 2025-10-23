import React from 'react';
import { X, Calendar, DollarSign, Scale, Package, Ship, FileText } from 'lucide-react';

const ContainerDetails = ({ container, onClose }) => {
  const formatCurrency = (value, currency = 'USD') => {
    if (!value) return 'N/A';
    return currency === 'USD' ? `$${value.toLocaleString()}` : `¥${value.toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatWeight = (value) => {
    if (!value) return 'N/A';
    return `${value}kg`;
  };

  const formatCBM = (value) => {
    if (!value) return 'N/A';
    return `${value}m³`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Detalhes do Container: {container.numeroContainer}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Informações completas do container
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <div className="space-y-8">
            
            {/* Informações Básicas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Número do Container</label>
                  <p className="text-lg font-semibold text-gray-900">{container.numeroContainer || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Agente</label>
                  <p className="text-lg font-semibold text-gray-900">{container.agente || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Exportador</label>
                  <p className="text-lg font-semibold text-gray-900">{container.exportador || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Container</label>
                  <p className="text-lg font-semibold text-gray-900">{container.tipoContainer || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Datas e Viagem */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Datas e Viagem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">ETD</label>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(container.etd)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">ETA</label>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(container.eta)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Dias de Viagem</label>
                  <p className="text-lg font-semibold text-gray-900">{container.diasViagem || 'N/A'} dias</p>
                </div>
              </div>
            </div>

            {/* Valores Financeiros */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Valores Financeiros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-green-700 mb-1">Valor do Frete USD</label>
                  <p className="text-lg font-semibold text-green-900">{formatCurrency(container.valorFreteUsd)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Total RMB</label>
                  <p className="text-lg font-semibold text-blue-900">{formatCurrency(container.totalRmb, 'RMB')}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-green-700 mb-1">Total USD</label>
                  <p className="text-lg font-semibold text-green-900">{formatCurrency(container.totalUsd)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <label className="block text-sm font-medium text-purple-700 mb-1">Total Invoice USD</label>
                  <p className="text-lg font-semibold text-purple-900">{formatCurrency(container.totalInvoiceUsd)}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <label className="block text-sm font-medium text-yellow-700 mb-1">USD -> RMB</label>
                  <p className="text-lg font-semibold text-yellow-900">{formatCurrency(container.usdParaRmb)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <label className="block text-sm font-medium text-indigo-700 mb-1">USD China</label>
                  <p className="text-lg font-semibold text-indigo-900">{formatCurrency(container.usdChina)}</p>
                </div>
              </div>
            </div>

            {/* CBM e Peso */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Scale className="h-5 w-5 mr-2" />
                CBM e Peso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">CBM Nominal</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCBM(container.cbmNominal)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">CBM do Pedido</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCBM(container.cbmPedido)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">CBM Pck List</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCBM(container.cbmPckList)}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-orange-700 mb-1">G.W.T</label>
                  <p className="text-lg font-semibold text-orange-900">{formatWeight(container.gwt)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-700 mb-1">N.W.T</label>
                  <p className="text-lg font-semibold text-blue-900">{formatWeight(container.nwt)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <label className="block text-sm font-medium text-red-700 mb-1">Peso Total</label>
                  <p className="text-lg font-semibold text-red-900">{formatWeight(container.pesoTotal)}</p>
                </div>
              </div>
            </div>

            {/* Taxas e Custos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Taxas e Custos Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Taxa Siscomex</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(container.taxaSiscomex)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Marinha Mercante</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(container.marinhaMercante)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">SDA</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(container.sda)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Armazenagem</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(container.armazenagem)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Despachante</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(container.despachante)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Expediente</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(container.expediente)}</p>
                </div>
              </div>
            </div>

            {/* Observações */}
            {container.complemento && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{container.complemento}</p>
                </div>
              </div>
            )}

            {/* Informações de Criação */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Criado em</label>
                  <p className="text-sm text-gray-900">{formatDate(container.createdAt)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Última atualização</label>
                  <p className="text-sm text-gray-900">{formatDate(container.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContainerDetails;
