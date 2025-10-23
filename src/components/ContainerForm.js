import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Scale, Package } from 'lucide-react';
import { hybridProductService } from '../services/hybridProductService';
import { formatNumber, formatUSD, formatRMB, parseFormattedNumber } from '../utils/numberFormat';

const ContainerForm = ({ container, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    numeroContainer: '',
    agente: '',
    exportador: '',
    tipoContainer: '',
    etd: '',
    eta: '',
    diasViagem: 0,
    valorFreteUsd: 0,
    cbmNominal: 0,
    cbmPedido: 0,
    cbmPckList: 0,
    perda: 0,
    fretePorM3: 0,
    gwt: 0,
    nwt: 0,
    pesoTotal: 0,
    totalRmb: 0,
    totalUsd: 0,
    totalInvoiceUsd: 0,
    usdParaRmb: 0,
    usdChina: 0,
    usdDi: 0,
    usdFrete: 0,
    taxaSiscomex: 0,
    marinhaMercante: 0,
    sda: 0,
    armazenagem: 0,
    despachante: 0,
    expediente: 0,
    freteRodoviario: 0,
    diferencaCambioFrete: 0,
    handlingUsd: 0,
    capatazia: 0,
    blFee: 0,
    trsTaxaRegistroSiscargaUsd: 0,
    dropOffUsd: 0,
    desconsolidacaoUsd: 0,
    ispsUsd: 0,
    logisticChargeUsd: 0,
    totalAgenteMaritimo: 0,
    inLandCharge: 0,
    comissoes: 0,
    custoTotalChinaRmb: 0,
    complemento: '',
    invoiceMaisFrete: 0,
    vlrEstimadoLiberacao: 0
  });

  // Função para calcular TOTAL RMB baseado nos produtos associados
  const calculateTotalRmb = async (containerNumber) => {
    if (!containerNumber) return 0;
    
    try {
      const products = hybridProductService.loadProductsFromStorage();
      const containerProducts = products.filter(product => 
        product.container === containerNumber
      );
      
      const totalRmb = containerProducts.reduce((sum, product) => {
        return sum + (parseFloat(product.totalRmb) || 0);
      }, 0);
      
      return totalRmb;
    } catch (error) {
      console.error('Erro ao calcular TOTAL RMB:', error);
      return 0;
    }
  };

  useEffect(() => {
    const loadContainerData = async () => {
      if (container) {
        // Calcular TOTAL RMB automaticamente
        const calculatedTotalRmb = await calculateTotalRmb(container.numeroContainer);
        
        setFormData({
          numeroContainer: container.numeroContainer || '',
          agente: container.agente || '',
          exportador: container.exportador || '',
          tipoContainer: container.tipoContainer || '',
          etd: container.etd || '',
          eta: container.eta || '',
          diasViagem: container.diasViagem || 0,
          valorFreteUsd: container.valorFreteUsd || 0,
          cbmNominal: container.cbmNominal || 0,
          cbmPedido: container.cbmPedido || 0,
          cbmPckList: container.cbmPckList || 0,
          perda: container.perda || 0,
          fretePorM3: container.fretePorM3 || 0,
          gwt: container.gwt || 0,
          nwt: container.nwt || 0,
          pesoTotal: container.pesoTotal || 0,
          totalRmb: calculatedTotalRmb, // Usar valor calculado
          totalUsd: container.totalUsd || 0,
          totalInvoiceUsd: container.totalInvoiceUsd || 0,
          usdParaRmb: container.usdParaRmb || 0,
          usdChina: container.usdChina || 0,
          usdDi: container.usdDi || 0,
          usdFrete: container.usdFrete || 0,
          taxaSiscomex: container.taxaSiscomex || 0,
          marinhaMercante: container.marinhaMercante || 0,
          sda: container.sda || 0,
          armazenagem: container.armazenagem || 0,
          despachante: container.despachante || 0,
          expediente: container.expediente || 0,
          freteRodoviario: container.freteRodoviario || 0,
          diferencaCambioFrete: container.diferencaCambioFrete || 0,
          handlingUsd: container.handlingUsd || 0,
          capatazia: container.capatazia || 0,
          blFee: container.blFee || 0,
          trsTaxaRegistroSiscargaUsd: container.trsTaxaRegistroSiscargaUsd || 0,
          dropOffUsd: container.dropOffUsd || 0,
          desconsolidacaoUsd: container.desconsolidacaoUsd || 0,
          ispsUsd: container.ispsUsd || 0,
          logisticChargeUsd: container.logisticChargeUsd || 0,
          totalAgenteMaritimo: container.totalAgenteMaritimo || 0,
          inLandCharge: container.inLandCharge || 0,
          comissoes: container.comissoes || 0,
          custoTotalChinaRmb: container.custoTotalChinaRmb || 0,
          complemento: container.complemento || '',
          invoiceMaisFrete: container.invoiceMaisFrete || 0,
          vlrEstimadoLiberacao: container.vlrEstimadoLiberacao || 0
        });
      }
    };

    loadContainerData();
  }, [container]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Para campos numéricos, converter valor formatado para número
    let processedValue = value;
    if (type === 'number') {
      processedValue = parseFormattedNumber(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? processedValue : value
    }));
  };

  // Estado para controlar campos em edição
  const [editingFields, setEditingFields] = useState(new Set());

  // Função específica para campos de moeda formatados
  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    
    // Armazenar o valor bruto durante a edição
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para quando o campo perde o foco (onBlur)
  const handleCurrencyBlur = (e) => {
    const { name, value } = e.target;
    
    // Remover do estado de edição
    setEditingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(name);
      return newSet;
    });
    
    // Se o valor estiver vazio, definir como 0
    if (!value || value.trim() === '') {
      setFormData(prev => ({
        ...prev,
        [name]: 0
      }));
      return;
    }
    
    // Converter valor formatado para número
    const processedValue = parseFormattedNumber(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Função para quando o campo ganha foco (onFocus)
  const handleCurrencyFocus = (e) => {
    const { name } = e.target;
    
    // Adicionar ao estado de edição
    setEditingFields(prev => new Set(prev).add(name));
    
    // Mostrar valor bruto durante a edição
    const currentValue = formData[name];
    if (currentValue && typeof currentValue === 'number') {
      // Converter número para string sem formatação para edição
      const rawValue = currentValue.toString().replace('.', ',');
      setFormData(prev => ({
        ...prev,
        [name]: rawValue
      }));
    }
  };

  // Função para renderizar campo numérico com formatação
  const renderNumberField = (name, value, label, currency = null, decimals = 2) => {
    const formatValue = (val) => {
      if (currency === 'USD') return formatUSD(val, decimals);
      if (currency === 'RMB') return formatRMB(val, decimals);
      return formatNumber(val, decimals);
    };
    
    // Se o campo está sendo editado, mostrar valor bruto
    const isEditing = editingFields.has(name);
    const displayValue = isEditing ? value : formatValue(value);
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <input
          type="text"
          name={name}
          value={displayValue}
          onChange={handleCurrencyChange}
          onFocus={handleCurrencyFocus}
          onBlur={handleCurrencyBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={formatValue(0)}
        />
      </div>
    );
  };

  // Função para recalcular TOTAL RMB
  const handleRecalculateTotalRmb = async () => {
    const calculatedTotalRmb = await calculateTotalRmb(formData.numeroContainer);
    setFormData(prev => ({
      ...prev,
      totalRmb: calculatedTotalRmb
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {container ? 'Editar Container' : 'Novo Container'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {container ? 'Atualize as informações do container' : 'Preencha as informações do novo container'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            
            {/* Informações Básicas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Container *
                  </label>
                  <input
                    type="text"
                    name="numeroContainer"
                    value={formData.numeroContainer}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agente
                  </label>
                  <input
                    type="text"
                    name="agente"
                    value={formData.agente}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exportador
                  </label>
                  <input
                    type="text"
                    name="exportador"
                    value={formData.exportador}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Container
                  </label>
                  <select
                    name="tipoContainer"
                    value={formData.tipoContainer}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    <option value="20">20'</option>
                    <option value="40">40'</option>
                    <option value="40HC">40'HC</option>
                    <option value="45">45'</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Datas e Viagem */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Datas e Viagem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ETD
                  </label>
                  <input
                    type="date"
                    name="etd"
                    value={formData.etd}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ETA
                  </label>
                  <input
                    type="date"
                    name="eta"
                    value={formData.eta}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dias de Viagem
                  </label>
                  <input
                    type="number"
                    name="diasViagem"
                    value={formData.diasViagem}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Valores Financeiros */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Valores Financeiros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderNumberField('valorFreteUsd', formData.valorFreteUsd, 'Valor do Frete USD', 'USD')}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total RMB <span className="text-xs text-gray-500">(calculado automaticamente)</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="totalRmb"
                      value={formatRMB(formData.totalRmb)}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleRecalculateTotalRmb}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      title="Recalcular TOTAL RMB baseado nos produtos associados"
                    >
                      ↻
                    </button>
                  </div>
                </div>
                {renderNumberField('totalUsd', formData.totalUsd, 'Total USD', 'USD')}
                {renderNumberField('totalInvoiceUsd', formData.totalInvoiceUsd, 'Total Invoice USD', 'USD')}
                {renderNumberField('usdParaRmb', formData.usdParaRmb, 'USD -> RMB', 'RMB')}
                {renderNumberField('usdChina', formData.usdChina, 'USD China', 'USD')}
              </div>
            </div>

            {/* CBM e Peso */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Scale className="h-5 w-5 mr-2" />
                CBM e Peso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderNumberField('cbmNominal', formData.cbmNominal, 'CBM Nominal', null, 3)}
                {renderNumberField('cbmPedido', formData.cbmPedido, 'CBM do Pedido', null, 3)}
                {renderNumberField('cbmPckList', formData.cbmPckList, 'CBM Pck List', null, 3)}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    G.W.T (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="gwt"
                    value={formData.gwt}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N.W.T (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="nwt"
                    value={formData.nwt}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso Total (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="pesoTotal"
                    value={formData.pesoTotal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Taxas e Custos Adicionais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Taxas e Custos Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa Siscomex
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="taxaSiscomex"
                    value={formData.taxaSiscomex}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marinha Mercante
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="marinhaMercante"
                    value={formData.marinhaMercante}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SDA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sda"
                    value={formData.sda}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Armazenagem
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="armazenagem"
                    value={formData.armazenagem}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Despachante
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="despachante"
                    value={formData.despachante}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expediente
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="expediente"
                    value={formData.expediente}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frete Rodoviário
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="freteRodoviario"
                    value={formData.freteRodoviario}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diferença Câmbio Frete
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="diferencaCambioFrete"
                    value={formData.diferencaCambioFrete}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Handling USD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="handlingUsd"
                    value={formData.handlingUsd}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capatazia
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="capatazia"
                    value={formData.capatazia}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BL Fee
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="blFee"
                    value={formData.blFee}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TRS Taxa Registro Siscarga USD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="trsTaxaRegistroSiscargaUsd"
                    value={formData.trsTaxaRegistroSiscargaUsd}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drop Off USD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="dropOffUsd"
                    value={formData.dropOffUsd}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desconsolidação USD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="desconsolidacaoUsd"
                    value={formData.desconsolidacaoUsd}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISPS USD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="ispsUsd"
                    value={formData.ispsUsd}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logistic Charge USD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="logisticChargeUsd"
                    value={formData.logisticChargeUsd}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Agente Marítimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalAgenteMaritimo"
                    value={formData.totalAgenteMaritimo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    In Land Charge
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="inLandCharge"
                    value={formData.inLandCharge}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comissões
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="comissoes"
                    value={formData.comissoes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custo Total China RMB
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="custoTotalChinaRmb"
                    value={formData.custoTotalChinaRmb}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice + Frete
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="invoiceMaisFrete"
                    value={formData.invoiceMaisFrete}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VLR Estimado Liberação
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="vlrEstimadoLiberacao"
                    value={formData.vlrEstimadoLiberacao}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Campos USD Adicionais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Campos USD Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    USD DI
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="usdDi"
                    value={formData.usdDi}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    USD Frete
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="usdFrete"
                    value={formData.usdFrete}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento / Observações
              </label>
              <textarea
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações adicionais sobre o container..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {container ? 'Atualizar Container' : 'Criar Container'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContainerForm;
