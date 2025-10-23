import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { ORDER_STATUS } from '../services/productService';
import { hybridProductService } from '../services/hybridProductService';

const ProductForm = ({ product, onSubmit, onClose }) => {
  // Verificar se o produto tem campos bloqueados (vinculado a produto externo)
  const camposBloqueados = product?.camposBloqueados || [];
  const isFieldLocked = (fieldName) => camposBloqueados.includes(fieldName);
  
  const [existingProducts, setExistingProducts] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  
  const [formData, setFormData] = useState({
    // Campos básicos
    referencia: product?.referencia || '',
    nomeRaviProfit: product?.nomeRaviProfit || product?.nomeRavi || '',
    profit: product?.profit || 0,
    ncm: product?.ncm || '',
    
    // Quantidades
    orderQtyBox: product?.orderQtyBox || 0,
    unitCtn: product?.unitCtn || 0,
    orderQtyUn: product?.orderQtyUn || 0,
    
    // Datas e identificação
    dataPedido: product?.dataPedido ? new Date(product.dataPedido).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    lote: product?.lote || '',
    status: product?.status || ORDER_STATUS.DESENVOLVIMENTO,
    
    // Logística
    container: product?.container || '',
    eta: product?.eta || '',
    
    // Preços RMB
    unitPriceRmb: product?.unitPriceRmb || 0,
    totalRmb: product?.totalRmb || 0,
    
    // Preços USD
    valorInvoiceUs: product?.valorInvoiceUs || 0,
    totalInvoice: product?.totalInvoice || 0,
    
    // Pesos
    pesoUnitario: product?.pesoUnitario || product?.pesoUnitarioKg || 0,
    nw: product?.nw || 0,
    totalPesoLiq: product?.totalPesoLiq || 0,
    gw: product?.gw || 0,
    totalPesoBruto: product?.totalPesoBruto || 0,
    
    // Preços por peso
    usKg: product?.usKg || 0,
    usKgMin: product?.usKgMin || 0,
    
    // Volume
    cbm: product?.cbm || 0,
    cbmTotal: product?.cbmTotal || 0,
    
    // Informações adicionais
    dataGeracaoPedido: product?.dataGeracaoPedido ? new Date(product.dataGeracaoPedido).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    fabrica: product?.fabrica || '',
    itemNo: product?.itemNo || '',
    description: product?.description || '',
    name: product?.name || product?.nomeRaviProfit || '',
    remark: product?.remark || '',
    obs: product?.obs || '',
    unit: product?.unit || '',
    
    // Dimensões
    l: product?.l || 0,
    w: product?.w || 0,
    h: product?.h || 0,
    
    // Informações de invoice
    nomeInvoiceEn: product?.nomeInvoiceEn || '',
    obsPedido: product?.obsPedido || ''
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Não permitir edição de campos bloqueados
    if (isFieldLocked(name)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Verificar duplicatas quando referência ou status mudarem
    if (name === 'referencia' || name === 'status') {
      checkForDuplicates(name === 'referencia' ? value : formData.referencia, 
                         name === 'status' ? value : formData.status);
    }
  };

  // Verificar se já existe produto com mesma referência e status
  const checkForDuplicates = async (referencia, status) => {
    if (!referencia || !status || product?.id) return; // Não verificar para edição
    
    try {
      const existing = await hybridProductService.getProductsByReference(referencia);
      const duplicate = existing.find(p => p.status === status);
      
      if (duplicate) {
        setExistingProducts(existing);
        setShowDuplicateWarning(true);
      } else {
        setShowDuplicateWarning(false);
        setExistingProducts([]);
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Função helper para renderizar inputs com visual diferenciado para campos bloqueados
  const renderInput = (name, label, type = 'text', required = false) => {
    const isLocked = isFieldLocked(name);
    return (
      <div>
        <label className={`block text-sm font-medium mb-1 ${isLocked ? 'text-gray-500' : 'text-gray-700'}`}>
          {label} {required && '*'}
          {isLocked && <span className="text-xs text-blue-600 ml-1">(Bloqueado)</span>}
        </label>
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          disabled={isLocked}
          required={required && !isLocked}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isLocked 
              ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Campos conforme especificação */}
            <div className="md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Produto</h3>
              
              {/* Aviso de duplicata */}
              {showDuplicateWarning && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        Produto já existe com este status!
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Já existe um produto com a referência "{formData.referencia}" e status "{formData.status}".
                      </p>
                      <div className="mt-2">
                        <p className="text-xs text-yellow-600 font-medium">Produtos existentes com esta referência:</p>
                        <ul className="text-xs text-yellow-600 mt-1">
                          {existingProducts.map((p, index) => (
                            <li key={index} className="flex justify-between">
                              <span>Status: {p.status}</span>
                              <span>Criado: {new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 1. Referência */}
            {renderInput('referencia', 'Referência', 'text', true)}

            {/* 2. Nome Ravi (Profit) */}
            {renderInput('nomeRaviProfit', 'Nome Ravi (Profit)', 'text', true)}

            {/* 3. NCM */}
            {renderInput('ncm', 'NCM', 'text')}

            {/* 4. ORDER QTY / BOX */}
            {renderInput('orderQtyBox', 'ORDER QTY / BOX', 'number')}

            {/* 5. UNIT/CTN */}
            {renderInput('unitCtn', 'UNIT/CTN', 'number')}

            {/* 6. ORDER QTY / UN */}
            {renderInput('orderQtyUn', 'ORDER QTY / UN', 'number')}

            {/* 7. Data do pedido */}
            {renderInput('dataPedido', 'Data do pedido', 'date')}

            {/* 8. Lote */}
            {renderInput('lote', 'Lote', 'text')}

            {/* 9. Status */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isFieldLocked('status') ? 'text-gray-500' : 'text-gray-700'}`}>
                Status
                {isFieldLocked('status') && <span className="text-xs text-blue-600 ml-1">(Bloqueado)</span>}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isFieldLocked('status')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('status') 
                    ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              >
                <option value={ORDER_STATUS.DESENVOLVIMENTO}>Desenvolvimento</option>
                <option value={ORDER_STATUS.GERAR_PEDIDO}>Gerar Pedido</option>
                <option value={ORDER_STATUS.FABRICACAO}>Fabricação</option>
                <option value={ORDER_STATUS.EMBARCADO}>Embarcado</option>
                <option value={ORDER_STATUS.NACIONALIZADO}>Nacionalizado</option>
              </select>
            </div>

            {/* 10. Container */}
            {renderInput('container', 'Container', 'text')}

            {/* 11. ETA */}
            {renderInput('eta', 'ETA', 'text')}

            {/* 12. UNIT PRICE RMB */}
            {renderInput('unitPriceRmb', 'UNIT PRICE RMB', 'number')}

            {/* 13. TOTAL RMB */}
            {renderInput('totalRmb', 'TOTAL RMB', 'number')}

            {/* 14. Valor invoice U$ */}
            {renderInput('valorInvoiceUs', 'Valor invoice U$', 'number')}

            {/* 15. TOTAL INVOICE */}
            {renderInput('totalInvoice', 'TOTAL INVOICE', 'number')}

            {/* 16. Peso (N) unitario (kg) */}
            {renderInput('pesoUnitario', 'Peso (N) unitario (kg)', 'number')}

            {/* 17. N.W */}
            {renderInput('nw', 'N.W', 'number')}

            {/* 18. Total peso liq */}
            {renderInput('totalPesoLiq', 'Total peso liq', 'number')}

            {/* 19. G.W */}
            {renderInput('gw', 'G.W', 'number')}

            {/* 20. Total peso bruto */}
            {renderInput('totalPesoBruto', 'Total peso bruto', 'number')}

            {/* 21. U$ /kg */}
            {renderInput('usKg', 'U$ /kg', 'number')}

            {/* 22. U$/KG min */}
            {renderInput('usKgMin', 'U$/KG min', 'number')}

            {/* 23. CBM */}
            {renderInput('cbm', 'CBM', 'number')}

            {/* 24. CBM TOTAL */}
            {renderInput('cbmTotal', 'CBM TOTAL', 'number')}

            {/* 25. Data Geração Pedido */}
            {renderInput('dataGeracaoPedido', 'Data Geração Pedido', 'date')}

            {/* 26. Fabrica */}
            {renderInput('fabrica', 'Fabrica', 'text')}

            {/* 27. ITEM NO */}
            {renderInput('itemNo', 'ITEM NO', 'text')}

            {/* 28. DESCRIPTION */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${isFieldLocked('description') ? 'text-gray-500' : 'text-gray-700'}`}>
                DESCRIPTION
                {isFieldLocked('description') && <span className="text-xs text-blue-600 ml-1">(Bloqueado)</span>}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isFieldLocked('description')}
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('description') 
                    ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>

            {/* 29. NAME */}
            {renderInput('name', 'NAME', 'text')}

            {/* 30. REMARK */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${isFieldLocked('remark') ? 'text-gray-500' : 'text-gray-700'}`}>
                REMARK
                {isFieldLocked('remark') && <span className="text-xs text-blue-600 ml-1">(Bloqueado)</span>}
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                disabled={isFieldLocked('remark')}
                rows="2"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('remark') 
                    ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>

            {/* 31. OBS */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${isFieldLocked('obs') ? 'text-gray-500' : 'text-gray-700'}`}>
                OBS
                {isFieldLocked('obs') && <span className="text-xs text-blue-600 ml-1">(Bloqueado)</span>}
              </label>
              <textarea
                name="obs"
                value={formData.obs}
                onChange={handleChange}
                disabled={isFieldLocked('obs')}
                rows="2"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('obs') 
                    ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>

            {/* 32. UNIT */}
            {renderInput('unit', 'UNIT', 'text')}

            {/* 33. L */}
            {renderInput('l', 'L', 'number')}

            {/* 34. W */}
            {renderInput('w', 'W', 'number')}

            {/* 35. H */}
            {renderInput('h', 'H', 'number')}

            {/* 36. Nome invoice (EN) */}
            {renderInput('nomeInvoiceEn', 'Nome invoice (EN)', 'text')}

            {/* 37. OBS PEDIDO */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${isFieldLocked('obsPedido') ? 'text-gray-500' : 'text-gray-700'}`}>
                OBS PEDIDO
                {isFieldLocked('obsPedido') && <span className="text-xs text-blue-600 ml-1">(Bloqueado)</span>}
              </label>
              <textarea
                name="obsPedido"
                value={formData.obsPedido}
                onChange={handleChange}
                disabled={isFieldLocked('obsPedido')}
                rows="2"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('obsPedido') 
                    ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{product ? 'Atualizar' : 'Criar'} Produto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;