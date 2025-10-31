import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, DollarSign, Scale, Ruler, Factory, Link, Unlink, CheckCircle } from 'lucide-react';
import { ORDER_STATUS } from '../services/productService';
import { hybridProductService } from '../services/hybridProductService';
import { containerService } from '../services/containerService';
import ProductSearchModal from './ProductSearchModal';

const ProductDetails = ({ product, onClose }) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(product);
  const [linkedContainer, setLinkedContainer] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.DESENVOLVIMENTO:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.FABRICACAO:
        return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.EMBARCADO:
        return 'bg-purple-100 text-purple-800';
      case ORDER_STATUS.NACIONALIZADO:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  // Parse data local sem problemas de timezone
  const parseLocalDate = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(value);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const localDate = parseLocalDate(date);
    if (!localDate) return 'N/A';
    return localDate.toLocaleDateString('pt-BR');
  };

  const formatRMB = (value) => {
    if (!value && value !== 0) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
    if (isNaN(num)) return 'N/A';
    return `¥${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  };

  // Buscar container vinculado ao produto
  useEffect(() => {
    const loadContainer = async () => {
      if (currentProduct?.container) {
        try {
          const container = await containerService.getContainerByNumber(currentProduct.container);
          setLinkedContainer(container);
        } catch (error) {
          console.error('Erro ao buscar container:', error);
          setLinkedContainer(null);
        }
      } else {
        setLinkedContainer(null);
      }
    };
    loadContainer();
  }, [currentProduct?.container]);

  const handleLinkProduct = async (externalProduct) => {
    try {
      await hybridProductService.linkExternalProduct(currentProduct.id, externalProduct);
      
      // Atualizar o produto local com campos mapeados
      const updatedProduct = {
        ...currentProduct,
        // Campos mapeados conforme especificação
        referencia: externalProduct.referencia,
        nomeRaviProfit: externalProduct.nome || externalProduct.descricao,
        ncm: externalProduct.ncm,
        unitCtn: externalProduct.unitCtn,
        unitPriceRmb: externalProduct.preco || externalProduct.unitPriceRmb,
        pesoUnitario: externalProduct.pesoUnitario || externalProduct.pesoUnitarioKg,
        nw: externalProduct.nw,
        gw: externalProduct.gw,
        cbm: externalProduct.cbm,
        fabrica: externalProduct.fabrica,
        itemNo: externalProduct.itemNo,
        description: externalProduct.descricao || externalProduct.description,
        name: externalProduct.nome || externalProduct.name,
        remark: externalProduct.remark,
        obs: externalProduct.obs,
        unit: externalProduct.unit,
        l: externalProduct.l,
        w: externalProduct.w,
        h: externalProduct.h,
        nomeInvoiceEn: externalProduct.nomeInvoiceEn || externalProduct.nome,
        // Campos de vinculação
        produtoExternoId: externalProduct.id,
        produtoExternoRef: externalProduct.referencia,
        produtoExternoNome: externalProduct.nome || externalProduct.descricao,
        produtoExternoPreco: externalProduct.preco,
        produtoExternoCategoria: externalProduct.categoria,
        produtoExternoStock: externalProduct.estoque,
        vinculadoEm: new Date(),
        vinculadoPor: 'sistema'
      };
      
      setCurrentProduct(updatedProduct);
      setShowSuccessMessage(true);
      
      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao vincular produto:', error);
      throw error;
    }
  };

  const handleUnlinkProduct = async () => {
    try {
      await hybridProductService.unlinkExternalProduct(currentProduct.id);
      
      // Atualizar o produto local
      const updatedProduct = {
        ...currentProduct,
        produtoExternoId: null,
        produtoExternoRef: null,
        produtoExternoNome: null,
        produtoExternoPreco: null,
        produtoExternoCategoria: null,
        produtoExternoStock: null,
        vinculadoEm: null,
        vinculadoPor: null
      };
      
      setCurrentProduct(updatedProduct);
      setShowSuccessMessage(true);
      
      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao desvincular produto:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Detalhes do Produto</h2>
          <div className="flex items-center space-x-3">
            {currentProduct.produtoExternoId ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Vinculado: {currentProduct.produtoExternoRef}</span>
                </div>
                <button
                  onClick={handleUnlinkProduct}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 text-sm"
                >
                  <Unlink className="h-4 w-4" />
                  <span>Desvincular</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Link className="h-4 w-4" />
                <span>Vincular Produto</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Mensagem de sucesso */}
          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Sucesso!</h4>
                <p className="text-sm text-green-700">
                  {currentProduct.produtoExternoId ? 'Produto vinculado com sucesso!' : 'Produto desvinculado com sucesso!'}
                </p>
              </div>
            </div>
          )}

          {/* Header com informações principais */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{currentProduct.referencia}</h3>
                  <p className="text-gray-600">{currentProduct.nomeRavi}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentProduct.status)}`}>
                {currentProduct.status}
              </span>
            </div>
            
            {currentProduct.description && (
              <p className="text-gray-700">{currentProduct.description}</p>
            )}
          </div>

          {/* Grid de informações */}
          <div className="grid grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Informações Básicas
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Referência:</span>
                  <p className="text-gray-900">{currentProduct.referencia || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Nome Ravi (Profit):</span>
                  <p className="text-gray-900">{currentProduct.nomeRaviProfit || currentProduct.nomeRavi || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Item No:</span>
                  <p className="text-gray-900">{currentProduct.itemNo || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">NCM:</span>
                  <p className="text-gray-900">{currentProduct.ncm || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Profit:</span>
                  <p className="text-gray-900">{currentProduct.profit || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Unit:</span>
                  <p className="text-gray-900">{currentProduct.unit || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Quantidades */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Quantidades
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Order QTY / BOX:</span>
                  <p className="text-gray-900">{currentProduct.orderQtyBox || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">UNIT / CTN:</span>
                  <p className="text-gray-900">{currentProduct.unitCtn || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">ORDER QTY / UN:</span>
                  <p className="text-gray-900">{currentProduct.orderQtyUn || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Lote:</span>
                  <p className="text-gray-900">{currentProduct.lote || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Preços */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                Preços
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">UNIT PRICE RMB:</span>
                  <p className="text-gray-900">{formatRMB(currentProduct.unitPriceRmb)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">TOTAL RMB:</span>
                  <p className="text-gray-900">{formatRMB(currentProduct.totalRmb)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Valor Invoice U$:</span>
                  <p className="text-gray-900">{currentProduct.valorInvoiceUs ? `$${currentProduct.valorInvoiceUs}` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">TOTAL INVOICE:</span>
                  <p className="text-gray-900">{currentProduct.totalInvoice ? `$${currentProduct.totalInvoice}` : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Pesos */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <Scale className="h-5 w-5 mr-2 text-blue-600" />
                Pesos
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Peso Unitário (kg):</span>
                  <p className="text-gray-900">{currentProduct.pesoUnitario || currentProduct.pesoUnitarioKg || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">N.W:</span>
                  <p className="text-gray-900">{currentProduct.nw || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Peso Líquido:</span>
                  <p className="text-gray-900">{currentProduct.totalPesoLiq || (currentProduct.nw ? (currentProduct.nw * (currentProduct.orderQtyBox || 0)) : 'N/A')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">G.W:</span>
                  <p className="text-gray-900">{currentProduct.gw || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Peso Bruto:</span>
                  <p className="text-gray-900">{currentProduct.totalPesoBruto || (currentProduct.gw ? (currentProduct.gw * (currentProduct.orderQtyBox || 0)) : 'N/A')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">U$ /kg:</span>
                  <p className="text-gray-900">{currentProduct.usKg ? `$${currentProduct.usKg}` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">U$/KG min:</span>
                  <p className="text-gray-900">{currentProduct.usKgMin ? `$${currentProduct.usKgMin}` : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Dimensões */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <Ruler className="h-5 w-5 mr-2 text-blue-600" />
                Dimensões
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Largura (L):</span>
                  <p className="text-gray-900">{currentProduct.l || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Largura (W):</span>
                  <p className="text-gray-900">{currentProduct.w || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Altura (H):</span>
                  <p className="text-gray-900">{currentProduct.h || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">CBM:</span>
                  <p className="text-gray-900">{currentProduct.cbm || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">CBM TOTAL:</span>
                  <p className="text-gray-900">{currentProduct.cbmTotal || ((currentProduct.cbm || 0) * (currentProduct.orderQtyBox || 0)) || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Datas e Logística */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Datas e Logística
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Data do Pedido:</span>
                  <p className="text-gray-900">{currentProduct.dataPedido ? formatDate(currentProduct.dataPedido) : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Data Geração Pedido:</span>
                  <p className="text-gray-900">{currentProduct.dataGeracaoPedido ? formatDate(currentProduct.dataGeracaoPedido) : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <p className="text-gray-900">{currentProduct.status || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Container:</span>
                  <p className="text-gray-900">{currentProduct.container || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">ETA:</span>
                  <p className="text-gray-900">
                    {linkedContainer?.eta 
                      ? formatDate(linkedContainer.eta) 
                      : (currentProduct.eta ? formatDate(currentProduct.eta) : 'N/A')
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Fábrica e Informações Adicionais */}
            <div className="col-span-2 bg-white border rounded-lg p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <Factory className="h-5 w-5 mr-2 text-blue-600" />
                Fábrica e Informações
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Fábrica:</span>
                  <p className="text-gray-900">{currentProduct.fabrica || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">ITEM NO:</span>
                  <p className="text-gray-900">{currentProduct.itemNo || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">DESCRIPTION:</span>
                  <p className="text-gray-900">{currentProduct.description || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">NAME:</span>
                  <p className="text-gray-900">{currentProduct.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">UNIT:</span>
                  <p className="text-gray-900">{currentProduct.unit || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">REMARK:</span>
                  <p className="text-gray-900">{currentProduct.remark || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">Nome Invoice (EN):</span>
                  <p className="text-gray-900">{currentProduct.nomeInvoiceEn || 'N/A'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal de busca de produtos */}
        <ProductSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onLinkProduct={handleLinkProduct}
          currentProduct={currentProduct}
        />
      </div>
    </div>
  );
};

export default ProductDetails;
