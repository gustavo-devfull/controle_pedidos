import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Plus, Search, Edit, Trash2, Eye, X, RefreshCw, FileSpreadsheet, ChevronUp, ChevronDown } from 'lucide-react';
import { ORDER_STATUS } from '../services/productService';
import { hybridProductService } from '../services/hybridProductService';
import { externalProductService } from '../services/externalProductService';
import { containerService } from '../services/containerService';
import { linkedProductService } from '../services/linkedProductService';
import { formatNumber, formatUSD, formatRMB, formatNCM, formatInteger, formatWeight } from '../utils/numberFormat';
import ExcelJS from 'exceljs';
import ProductForm from './ProductForm';
import ProductDetails from './ProductDetails';
import ProductSearchModal from './ProductSearchModal';

const ProductList = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [containerFilter, setContainerFilter] = useState('all');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showExternalSearchModal, setShowExternalSearchModal] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [showContainerSelectionModal, setShowContainerSelectionModal] = useState(false);
  const [productToEmbark, setProductToEmbark] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBatchEditPanel, setShowBatchEditPanel] = useState(false);
  const [batchEditData, setBatchEditData] = useState({
    lote: '',
    status: '',
    container: ''
  });
  const topScrollbarRef = useRef(null);
  const tableScrollRef = useRef(null);
  const tableRef = useRef(null);
  const isSyncingRef = useRef(false);
  const [tableScrollWidth, setTableScrollWidth] = useState(2240);

  useEffect(() => {
    loadProducts();
    loadContainers();
  }, []);

  // Aplicar filtro por container vindo da navegação (state ou query)
  useEffect(() => {
    const state = location.state || {};
    const searchParams = new URLSearchParams(location.search || '');
    const fromState = state.selectedContainer;
    const fromQuery = searchParams.get('container');
    const target = fromState || fromQuery;
    if (target) {
      setContainerFilter(target);
    }
  }, [location.state, location.search]);

  // Medir largura do conteúdo da tabela para a barra superior
  useEffect(() => {
    const updateScrollWidth = () => {
      if (tableRef.current) {
        setTableScrollWidth(tableRef.current.scrollWidth || 2240);
      }
    };
    updateScrollWidth();
    window.addEventListener('resize', updateScrollWidth);
    return () => window.removeEventListener('resize', updateScrollWidth);
  }, [products, containers, sortField, sortDirection]);

  const handleTopScroll = (e) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    isSyncingRef.current = false;
  };

  const handleBodyScroll = (e) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (topScrollbarRef.current) {
      topScrollbarRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    isSyncingRef.current = false;
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await linkedProductService.getAllLinkedProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWithExternalBase = async () => {
    try {
      setLoading(true);
      console.log('Verificando atualizações da base externa...');
      
      const syncResult = await linkedProductService.checkAndSyncAllProducts();
      console.log('Resultado da sincronização:', syncResult);
      
      if (syncResult.updatedCount > 0) {
        alert(`${syncResult.updatedCount} produtos foram atualizados com dados da base externa!`);
        // Recarregar a lista após sincronização
        await loadProducts();
      } else {
        alert('Todos os produtos já estão atualizados com a base externa!');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro ao sincronizar com a base externa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadContainers = async () => {
    try {
      const data = await containerService.getAllContainers();
      setContainers(data);
    } catch (error) {
      console.error('Erro ao carregar containers:', error);
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      await linkedProductService.createLinkedProduct(productData);
      await loadProducts();
      setShowForm(false);
      alert('Produto criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      alert(error.message || 'Erro ao criar produto');
    }
  };

  const handleOpenExternalSearch = () => {
    setShowExternalSearchModal(true);
  };

  const handleLinkExternalProduct = async (externalProduct) => {
    try {
      // Usar o serviço de sincronização para vincular produto externo
      const productId = await linkedProductService.syncWithExternalBase(
        externalProduct.referencia, 
        externalProduct
      );
      
      await loadProducts();
      setShowExternalSearchModal(false);
      alert(`Produto "${externalProduct.referencia}" vinculado com sucesso!`);
    } catch (error) {
      console.error('Erro ao vincular produto externo:', error);
      alert('Erro ao vincular produto: ' + error.message);
    }
  };


  // Funções de cálculo automático
  const calculateOrderQtyUn = (orderQtyBox, unitCtn) => {
    return (orderQtyBox || 0) * (unitCtn || 0);
  };

  const calculateTotalRmb = (orderQtyUn, unitPriceRmb) => {
    return (orderQtyUn || 0) * (unitPriceRmb || 0);
  };

  // Função para iniciar edição inline
  const startInlineEdit = (productId, fieldName, currentValue) => {
    setEditingCell({ productId, fieldName, value: currentValue });
  };

  // Função para salvar edição inline
  const saveInlineEdit = async (productId, fieldName, newValue) => {
    try {
      const updatedProduct = { [fieldName]: newValue };
      
      // Calcular campos dependentes se necessário
      if (fieldName === 'orderQtyBox' || fieldName === 'unitCtn') {
        const product = products.find(p => p.id === productId);
        const orderQtyBox = fieldName === 'orderQtyBox' ? parseFloat(newValue) || 0 : (product.orderQtyBox || 0);
        const unitCtn = fieldName === 'unitCtn' ? parseFloat(newValue) || 0 : (product.unitCtn || 0);
        const orderQtyUn = calculateOrderQtyUn(orderQtyBox, unitCtn);
        updatedProduct.orderQtyUn = orderQtyUn;
        
        // Recalcular TOTAL RMB
        const unitPriceRmb = product.unitPriceRmb || 0;
        updatedProduct.totalRmb = calculateTotalRmb(orderQtyUn, unitPriceRmb);
      } else if (fieldName === 'unitPriceRmb') {
        const product = products.find(p => p.id === productId);
        const orderQtyUn = product.orderQtyUn || 0;
        updatedProduct.totalRmb = calculateTotalRmb(orderQtyUn, parseFloat(newValue) || 0);
      }
      
      // Sincronizar ETA quando container for alterado
      if (fieldName === 'container') {
        const selectedContainer = containers.find(c => c.numeroContainer === newValue);
        if (selectedContainer?.eta) {
          updatedProduct.eta = selectedContainer.eta;
        } else {
          updatedProduct.eta = '';
        }
      }
      
      await linkedProductService.updateLinkedProduct(productId, updatedProduct);
      await loadProducts();
      setEditingCell(null);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto');
    }
  };

  // Função para cancelar edição inline
  const cancelInlineEdit = () => {
    setEditingCell(null);
  };

  // Função para renderizar campo editável inline
  const renderEditableField = (product, fieldName, value, type = 'text') => {
    const isEditing = editingCell?.productId === product.id && editingCell?.fieldName === fieldName;
    
    if (isEditing) {
      // Campo especial para container - dropdown
      if (fieldName === 'container') {
        return (
          <select
            value={editingCell.value}
            onChange={(e) => setEditingCell(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveInlineEdit(product.id, fieldName, editingCell.value);
              } else if (e.key === 'Escape') {
                cancelInlineEdit();
              }
            }}
            onBlur={() => saveInlineEdit(product.id, fieldName, editingCell.value)}
            className="w-full px-1 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          >
            <option value="">Selecione um container...</option>
            {containers.map(container => (
              <option key={container.id} value={container.numeroContainer}>
                {container.numeroContainer} - {container.agente || 'Sem agente'}
              </option>
            ))}
          </select>
        );
      }
      
      // Campos normais
      return (
        <input
          type={type}
          value={editingCell.value}
          onChange={(e) => setEditingCell(prev => ({ ...prev, value: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveInlineEdit(product.id, fieldName, editingCell.value);
            } else if (e.key === 'Escape') {
              cancelInlineEdit();
            }
          }}
          onBlur={() => saveInlineEdit(product.id, fieldName, editingCell.value)}
          className="w-full px-1 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      );
    }
    
    // Campo especial para container - mostrar nome do container
    if (fieldName === 'container') {
      const selectedContainer = containers.find(c => c.numeroContainer === value);
      const displayValue = selectedContainer 
        ? `${selectedContainer.numeroContainer} - ${selectedContainer.agente || 'Sem agente'}`
        : value || 'N/A';
      
      return (
        <span
          onClick={() => startInlineEdit(product.id, fieldName, value)}
          className="cursor-pointer hover:bg-blue-50 px-1 py-1 rounded text-xs"
          title="Clique para editar"
        >
          {displayValue}
        </span>
      );
    }
    
    // Campo especial para ETA - mostrar ETA do container associado
    if (fieldName === 'eta') {
      const selectedContainer = containers.find(c => c.numeroContainer === product.container);
      const displayValue = selectedContainer?.eta 
        ? new Date(selectedContainer.eta).toLocaleDateString('pt-BR')
        : value || 'N/A';
      
      return (
        <span
          onClick={() => startInlineEdit(product.id, fieldName, value)}
          className="cursor-pointer hover:bg-blue-50 px-1 py-1 rounded text-xs bg-blue-50"
          title={selectedContainer ? `ETA do container ${selectedContainer.numeroContainer}` : "Clique para editar"}
        >
          {displayValue}
        </span>
      );
    }
    
    // Campos normais
    const formatValue = (fieldName, value) => {
      if (!value && value !== 0) return 'N/A';
      
      // Campos USD
      if (fieldName === 'valorInvoiceUs') {
        return formatUSD(value, 3);
      }
      
      // Campos RMB
      if (fieldName === 'unitPriceRmb' || fieldName === 'totalInvoice') {
        return formatRMB(value);
      }
      
      // Campos sem decimais (UNIT/CTN, ORDER QTY/BOX)
      if (fieldName === 'unitCtn' || fieldName === 'orderQtyBox') {
        return formatInteger(value);
      }
      
      // Campos numéricos gerais
      if (type === 'number') {
        return formatNumber(value);
      }
      
      return value;
    };
    
    return (
      <span
        onClick={() => startInlineEdit(product.id, fieldName, value)}
        className="cursor-pointer hover:bg-blue-50 px-1 py-1 rounded text-xs"
        title="Clique para editar"
      >
        {formatValue(fieldName, value)}
      </span>
    );
  };

  const handleUpdateProduct = async (productId, productData) => {
    try {
      await linkedProductService.updateLinkedProduct(productId, productData);
      await loadProducts();
      setEditingProduct(null);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await linkedProductService.deleteLinkedProduct(productId);
        await loadProducts();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  // Função para atualizar produto da base externa
  const handleUpdateFromBase = async (product) => {
    if (!product.referencia) {
      alert('Produto não possui referência para buscar na base externa');
      return;
    }

    try {
      // Buscar produto na base externa pela referência
      const externalProducts = await externalProductService.searchProductsByRef(product.referencia);
      const externalProduct = externalProducts.find(ep => ep.referencia === product.referencia);
      
      if (!externalProduct) {
        alert('Produto não encontrado na base externa');
        return;
      }

      // Confirmar atualização
      if (!window.confirm(`Atualizar produto "${product.referencia}" com dados da base externa?`)) {
        return;
      }

      // Mapear TODOS os dados da base externa para o produto
      const updatedData = {
        // Campos básicos
        nomeRaviProfit: externalProduct.nomeRaviProfit || externalProduct.NOME || externalProduct.DESCRICAO || '',
        ncm: externalProduct.ncm || externalProduct.NCM || '',
        
        // Campos de quantidade e preço
        unitCtn: externalProduct.unitCtn || externalProduct.UNIT_CTN || 0,
        unitPriceRmb: externalProduct.unitPriceRmb || externalProduct.UNIT_PRICE_RMB || 0,
        valorInvoiceUs: externalProduct.valorInvoiceUsd || externalProduct.VALOR_INVOICE_USD || 0,
        
        // Campos de peso e dimensões
        pesoUnitario: externalProduct.pesoUnitario || externalProduct.PESO_UNITARIO || 0,
        nw: externalProduct.nw || externalProduct.NW || 0,
        gw: externalProduct.gw || externalProduct.GW || 0,
        cbm: externalProduct.cbm || externalProduct.CBM || 0,
        
        // Campos de identificação
        nomeDiNb: externalProduct.nomeDiNb || externalProduct.NOME_DI_NB || '',
        marca: externalProduct.marca || externalProduct.MARCA || '',
        linhaCotacoes: externalProduct.linhaCotacoes || externalProduct.LINHA_COTACOES || '',
        moq: externalProduct.moq || externalProduct.MOQ || 0,
        qtMinVenda: externalProduct.qtMinVenda || externalProduct.QT_MIN_VENDA || 0,
        dun: externalProduct.dun || externalProduct.DUN || '',
        cest: externalProduct.cest || externalProduct.CEST || '',
        ean: externalProduct.ean || externalProduct.EAN || '',
        codRavi: externalProduct.codRavi || externalProduct.COD_RAVI || '',
        
        // Campos de observações
        obsPedido: externalProduct.obsPedido || externalProduct.OBS_PEDIDO || '',
        description: externalProduct.description || externalProduct.DESCRIPTION || '',
        remark: externalProduct.remark || externalProduct.REMARK || '',
        obs: externalProduct.obs || externalProduct.OBS || '',
        
        // Campos de dimensões físicas
        l: externalProduct.l || externalProduct.L || 0,
        w: externalProduct.w || externalProduct.W || 0,
        h: externalProduct.h || externalProduct.H || 0,
        
        // Campos de unidade e categoria
        unit: externalProduct.unit || externalProduct.UNIT || '',
        fabrica: externalProduct.fabrica || externalProduct.FABRICA || '',
        itemNo: externalProduct.itemNo || externalProduct.ITEM_NO || '',
        
        // Campos de nome e identificação
        name: externalProduct.name || externalProduct.NAME || '',
        nomeInvoiceEn: externalProduct.nomeInvoiceEn || externalProduct.NOME_INVOICE_EN || '',
        
        // Campos de preço adicional
        usKg: externalProduct.usKg || externalProduct.US_KG || 0,
        usKgMin: externalProduct.usKgMin || externalProduct.US_KG_MIN || 0,
        
        // Campos de volume total
        cbmTotal: externalProduct.cbmTotal || externalProduct.CBM_TOTAL || 0,
        
        // Campos de peso total
        totalPesoLiq: externalProduct.totalPesoLiq || externalProduct.TOTAL_PESO_LIQ || 0,
        totalPesoBruto: externalProduct.totalPesoBruto || externalProduct.TOTAL_PESO_BRUTO || 0,
        
        // Campos de invoice
        totalInvoice: externalProduct.totalInvoice || externalProduct.TOTAL_INVOICE || 0,
        
        // Recalcular campos dependentes
        orderQtyUn: calculateOrderQtyUn(product.orderQtyBox, externalProduct.unitCtn || externalProduct.UNIT_CTN || 0),
        totalRmb: calculateTotalRmb(
          calculateOrderQtyUn(product.orderQtyBox, externalProduct.unitCtn || externalProduct.UNIT_CTN || 0), 
          externalProduct.unitPriceRmb || externalProduct.UNIT_PRICE_RMB || 0
        )
      };

      // Atualizar produto
      await linkedProductService.updateLinkedProduct(product.id, updatedData);
      await loadProducts();
      
      alert('Produto atualizado com sucesso da base externa!');
    } catch (error) {
      console.error('Erro ao atualizar produto da base externa:', error);
      alert('Erro ao atualizar produto da base externa');
    }
  };

  // Função de download de imagem para navegador (sem Buffer)
  const downloadImage = async (url) => {
    try {
      if (!url || url.trim() === '') {
        return null;
      }

      console.log(`Baixando imagem: ${url}`);

      // Usar fetch para baixar a imagem
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      // Converter para ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Imagem baixada: ${arrayBuffer.byteLength} bytes`);

      // Usar Image API para obter dimensões
      return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          const result = {
            buffer: arrayBuffer, // Usar ArrayBuffer diretamente
            width: img.naturalWidth,
            height: img.naturalHeight,
            type: 'jpeg',
            source: 'arraybuffer-direct'
          };
          
          console.log(`✅ Imagem processada: ${result.width}x${result.height}px, ${arrayBuffer.byteLength} bytes`);
          resolve(result);
        };
        
        img.onerror = () => {
          console.warn('Erro ao carregar imagem para processamento');
          resolve(null);
        };
        
        // Criar blob URL para a imagem
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        img.src = URL.createObjectURL(blob);
      });
      
    } catch (error) {
      console.error('Erro no download:', error);
      return null;
    }
  };

  // Função para gerar planilha Excel com imagens
  const handleGenerateOrder = async () => {
    try {
      // Filtrar apenas produtos com status "Gerar Pedido"
      const orderProducts = products.filter(product => product.status === ORDER_STATUS.GERAR_PEDIDO);
      
      if (orderProducts.length === 0) {
        alert('Não há produtos com status "Gerar Pedido" para exportar');
        return;
      }

      // Mostrar mensagem de progresso
      alert(`Gerando planilha com ${orderProducts.length} produtos... Isso pode levar alguns minutos.`);

      // Download paralelo de imagens (baseado no projeto exporta_planilha)
      console.log(`Iniciando download paralelo de ${orderProducts.length} imagens...`);
      
      const imagePromises = orderProducts.map(async (produto, i) => {
        const imageUrl = `https://nyc3.digitaloceanspaces.com/moribr/base-fotos/${produto.referencia}.jpg`;
        
        console.log(`🔍 Processando produto ${i + 1}/${orderProducts.length}: ${produto.referencia}`);
        console.log(`📷 URL da imagem: ${imageUrl}`);
        
        if (imageUrl && imageUrl.trim() !== '') {
          try {
            const imageData = await downloadImage(imageUrl);
            if (imageData && imageData.width && imageData.height) {
              console.log(`✅ Imagem ${i + 1}/${orderProducts.length} baixada: ${produto.referencia} (${imageData.width}x${imageData.height}px)`);
              return { index: i, imageData, referencia: produto.referencia };
            } else {
              console.warn(`⚠️ Imagem ${i + 1}/${orderProducts.length} falhou: ${produto.referencia} - dados inválidos`);
            }
          } catch (error) {
            console.error(`❌ Erro ao baixar imagem ${i + 1} (${produto.referencia}):`, error.message);
          }
        } else {
          console.warn(`⚠️ URL da imagem vazia para ${produto.referencia}`);
        }
        return { index: i, imageData: null, referencia: produto.referencia };
      });

      const imageResults = await Promise.all(imagePromises);
      const imageMap = new Map();
      let successCount = 0;
      
      imageResults.forEach(result => {
        if (result.imageData) {
          imageMap.set(result.index, result.imageData);
          successCount++;
        }
      });

      console.log(`📊 Download concluído: ${successCount}/${orderProducts.length} imagens baixadas com sucesso`);

      // Criar workbook com ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pedido');

      // Definir cabeçalhos
      const headers = [
        'Foto', 'Referência', 'Fabrica', 'ITEM NO', 'DESCRIPTION', 'NAME', 'REMARK', 'OBS',
        'CTNS', 'UNIT/CTN', 'QTY', 'UNIT PRICE RMB', 'UNIT', 'AMOUNT RMB', 'L', 'W', 'H',
        'CBM', 'CBM TOTAL', 'G.W', 'G.T.W', 'N.W', 'N.T.W', 'Peso (N) unitario (kg)',
        'Nome invoice (EN)', 'NCM', 'Data do pedido', 'Lote', 'Valor invoice U$',
        'Cores/modelos', 'Obs BRASIL'
      ];

      // Adicionar cabeçalhos
      worksheet.addRow(headers);

      // Formatar cabeçalho
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' } // Azul escuro
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' }, // Branco
          bold: true
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
      });

      // Definir largura das colunas
      worksheet.columns = [
        { width: 25 }, // Foto (aumentada para acomodar imagem maior)
        { width: 12 }, // Referência
        { width: 15 }, // Fabrica
        { width: 10 }, // ITEM NO
        { width: 30 }, // DESCRIPTION
        { width: 20 }, // NAME
        { width: 20 }, // REMARK
        { width: 20 }, // OBS
        { width: 8 },  // CTNS
        { width: 10 }, // UNIT/CTN
        { width: 8 },  // QTY
        { width: 15 }, // UNIT PRICE RMB
        { width: 8 },  // UNIT
        { width: 15 }, // AMOUNT RMB
        { width: 8 },  // L
        { width: 8 },  // W
        { width: 8 },  // H
        { width: 10 }, // CBM
        { width: 12 }, // CBM TOTAL
        { width: 8 },  // G.W
        { width: 10 }, // G.T.W
        { width: 8 },  // N.W
        { width: 10 }, // N.T.W
        { width: 20 }, // Peso (N) unitario (kg)
        { width: 20 }, // Nome invoice (EN)
        { width: 12 }, // NCM
        { width: 12 }, // Data do pedido
        { width: 10 }, // Lote
        { width: 15 }, // Valor invoice U$
        { width: 15 }, // Cores/modelos
        { width: 20 }  // Obs BRASIL
      ];

      // Definir altura das linhas
      worksheet.getRow(1).height = 30; // Cabeçalho

      // Definir índice da coluna Foto
      const fotoColumnIndex = 0; // Coluna A (Foto)

      // Processar cada produto
      for (let i = 0; i < orderProducts.length; i++) {
        const product = orderProducts[i];
        const rowIndex = i + 2; // +2 porque linha 1 é cabeçalho
        
        // Calcular campos derivados
        const orderQtyUn = product.orderQtyUn || calculateOrderQtyUn(product.orderQtyBox, product.unitCtn);
        const totalRmb = product.totalRmb || calculateTotalRmb(orderQtyUn, product.unitPriceRmb);
        
        // Ajustar cálculos conforme solicitado: usar CTNS em vez de orderQtyUn
        const ctns = product.orderQtyBox || 0;
        const cbmTotal = product.cbmTotal || (product.cbm * ctns);
        const totalPesoBruto = product.totalPesoBruto || (product.gw * ctns);
        const totalPesoLiq = product.totalPesoLiq || (product.nw * ctns);
        
        // Formatar AMOUNT RMB com símbolo ¥ e formatação brasileira
        const amountRmbFormatted = formatRMB(totalRmb, 2);

        // Preparar dados da linha
        const rowData = [
          '', // Foto (será preenchida com imagem)
          product.referencia || '',
          product.fabrica || '',
          product.itemNo || '',
          product.description || '',
          product.name || '',
          product.remark || '',
          product.obs || '',
          product.orderQtyBox || 0,
          product.unitCtn || 0,
          orderQtyUn,
          product.unitPriceRmb || 0, // Será formatado depois como número com 2 casas decimais
          product.unit || '',
          amountRmbFormatted, // String formatada com ¥ e formatação brasileira
          product.l || 0,
          product.w || 0,
          product.h || 0,
          product.cbm || 0,
          cbmTotal,
          product.gw || 0,
          totalPesoBruto,
          product.nw || 0,
          totalPesoLiq,
          product.pesoUnitario || 0,
          product.nomeInvoiceEn || '',
          product.ncm || '',
          product.dataPedido ? new Date(product.dataPedido).toLocaleDateString('pt-BR') : '',
          product.lote || '',
          product.valorInvoiceUs || 0,
          '', // Cores/modelos
          product.obsPedido || ''
        ];

        // Adicionar linha
        const row = worksheet.addRow(rowData);

        // Definir altura padrão da linha (será ajustada se tiver imagem)
        row.height = Math.round(250 * 0.75); // Altura padrão em pontos Excel (250px ≈ 188 pontos)

        // Formatar células específicas
        // UNIT PRICE RMB (coluna 12) - formato numérico com 2 casas decimais
        const unitPriceCell = row.getCell(12); // Coluna L (UNIT PRICE RMB)
        unitPriceCell.numFmt = '#,##0.00';
        
        // CBM TOTAL (coluna 19) - formato numérico com 2 casas decimais
        const cbmTotalCell = row.getCell(19); // Coluna S (CBM TOTAL)
        cbmTotalCell.numFmt = '#,##0.00';
        
        // T.G.W (coluna 21) - formato numérico com 2 casas decimais
        const tgwCell = row.getCell(21); // Coluna U (G.T.W)
        tgwCell.numFmt = '#,##0.00';
        
        // N.T.W (coluna 23) - formato numérico com 2 casas decimais
        const ntwCell = row.getCell(23); // Coluna W (N.T.W)
        ntwCell.numFmt = '#,##0.00';

        // Formatar células da linha
        row.eachCell((cell, colNumber) => {
          // Centralizar verticalmente
          cell.alignment = {
            ...cell.alignment,
            vertical: 'middle'
          };

          // Aplicar wrap text para campos de texto
          if (colNumber === 2 || colNumber === 4 || colNumber === 5 || colNumber === 6 || colNumber === 7 || colNumber === 8 || 
              colNumber === 25 || colNumber === 31) { // Campos de texto
            cell.alignment = {
              ...cell.alignment,
              wrapText: true
            };
          }

          // Centralizar campos numéricos
          if (colNumber >= 9 && colNumber <= 24) { // Campos numéricos
            cell.alignment = {
              ...cell.alignment,
              horizontal: 'center'
            };
          }
        });

        // Inserir imagem baseado no projeto exporta_planilha
        const imageData = imageMap.get(i);
        console.log(`🔍 Verificando imagem para ${product.referencia}:`, imageData ? 'DISPONÍVEL' : 'NÃO DISPONÍVEL');
        
        if (imageData) {
          const { width: originalWidth, height: originalHeight, type, buffer } = imageData;
          
          console.log(`📊 Dados da imagem para ${product.referencia}:`, {
            width: originalWidth,
            height: originalHeight,
            type: type,
            bufferLength: buffer ? buffer.byteLength : 'undefined',
            bufferType: typeof buffer,
            isArrayBuffer: buffer instanceof ArrayBuffer
          });
          
          // Validar dimensões
          if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
            console.warn(`⚠️ Dimensões inválidas para ${product.referencia}: ${originalWidth}x${originalHeight}`);
            continue;
          }
          
          // Validar buffer (ArrayBuffer no navegador)
          if (!buffer || !(buffer instanceof ArrayBuffer)) {
            console.warn(`⚠️ Buffer inválido para ${product.referencia}:`, typeof buffer);
            continue;
          }
          
          try {
            console.log(`🖼️ Processando imagem para ${product.referencia}: ${originalWidth}x${originalHeight}px`);
            
            // Adicionar imagem ao workbook (baseado no projeto de referência)
            console.log(`📦 Adicionando imagem ao workbook...`);
            const imageId = workbook.addImage({
              buffer: buffer,
              extension: type || 'jpeg'
            });
            console.log(`🆔 Imagem adicionada com ID: ${imageId}`);
            
            // Calcular dimensões proporcionais (altura fixa 250px)
            const targetHeight = 250;
            const aspectRatio = originalWidth / originalHeight;
            const targetWidth = Math.round(targetHeight * aspectRatio);
            
            console.log(`📐 Dimensões calculadas: ${targetWidth}x${targetHeight}px (proporção: ${aspectRatio.toFixed(2)})`);
            
            // Inserir imagem na célula (método do projeto exporta_planilha)
            console.log(`📍 Inserindo imagem na célula: col=${fotoColumnIndex}, row=${rowIndex - 1}`);
            worksheet.addImage(imageId, {
              tl: { col: fotoColumnIndex, row: rowIndex - 1 },
              ext: { width: targetWidth, height: targetHeight },
              editAs: 'oneCell'
            });
            
            // Ajustar altura da linha para ficar exatamente igual à altura da imagem
            // Converter pixels para pontos Excel (1 pixel ≈ 0.75 pontos)
            const targetRowHeight = Math.round(targetHeight * 0.75); // Converter para pontos Excel
            row.height = targetRowHeight;
            
            console.log(`📏 Altura da linha ajustada para ${product.referencia}: ${targetRowHeight} pontos (imagem: ${targetHeight}px)`);
            
            // Ajustar largura da coluna Foto proporcionalmente
            const fotoColumn = worksheet.getColumn(fotoColumnIndex + 1);
            const targetColWidth = Math.max(25, Math.round(targetWidth * 0.14));
            fotoColumn.width = Math.max(fotoColumn.width, targetColWidth);
            
            // Centralizar imagem na célula
            const imageCell = row.getCell(fotoColumnIndex + 1);
            imageCell.alignment = { vertical: 'middle', horizontal: 'center' };
            
            console.log(`✅ Imagem inserida com sucesso para ${product.referencia} - ${targetWidth}x${targetHeight}px`);
            
          } catch (imgError) {
            console.error(`❌ Erro ao inserir imagem para ${product.referencia}:`, imgError);
            console.error('Detalhes do erro:', {
              message: imgError.message,
              stack: imgError.stack,
              imageData: {
                width: originalWidth,
                height: originalHeight,
                type: type,
                bufferLength: buffer ? buffer.byteLength : 'undefined',
                bufferType: typeof buffer,
                isArrayBuffer: buffer instanceof ArrayBuffer
              }
            });
          }
        } else {
          console.log(`⚠️ Nenhuma imagem disponível para ${product.referencia}`);
        }
      }

      // Gerar nome do arquivo com data atual
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const fileName = `Pedido_${dateStr}.xlsx`;

      // Gerar e baixar arquivo (baseado no projeto exporta_planilha)
      console.log('📄 Gerando arquivo Excel...');
      const buffer = await workbook.xlsx.writeBuffer();
      
      console.log(`📦 Arquivo gerado: ${buffer.byteLength} bytes`);
      
      // Criar blob e fazer download
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Método de download do projeto de referência
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Arquivo ${fileName} baixado com sucesso!`);

      // Atualizar status dos produtos para "Fabricação"
      const updatePromises = orderProducts.map(product => 
        linkedProductService.updateLinkedProduct(product.id, { status: ORDER_STATUS.FABRICACAO, dataGeracaoPedido: new Date().toISOString() })
      );

      await Promise.all(updatePromises);
      
      // Recarregar produtos para refletir as mudanças
      await loadProducts();

      alert(`📊 Planilha "${fileName}" gerada com sucesso!\n\n📈 Estatísticas:\n• ${orderProducts.length} produtos exportados\n• ${successCount} imagens inseridas\n• Status alterado para "Fabricação"\n\n✅ Arquivo baixado automaticamente!`);
    } catch (error) {
      console.error('Erro ao gerar planilha:', error);
      alert('Erro ao gerar planilha Excel');
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      const product = products.find(p => p.id === productId);
      const previousStatus = product.status;
      const updatedProduct = { status: newStatus };
      
      // Se o status for "Embarcado" e não houver container associado, solicitar container
      if (newStatus === ORDER_STATUS.EMBARCADO) {
        if (!product.container && containers.length > 0) {
          // Mostrar modal para seleção de container
          setProductToEmbark(product);
          setShowContainerSelectionModal(true);
          return; // Não atualizar ainda, aguardar seleção do container
        } else if (!product.container && containers.length === 0) {
          alert('Não há containers disponíveis. Crie um container primeiro antes de marcar produtos como embarcados.');
          return;
        }
      }
      
      // Atualizar produto
      await linkedProductService.updateLinkedProduct(productId, updatedProduct);
      
      // Se mudou para Embarcado ou Nacionalizado, salvar histórico completo
      if ((newStatus === ORDER_STATUS.EMBARCADO || newStatus === ORDER_STATUS.NACIONALIZADO) && 
          previousStatus !== newStatus) {
        await linkedProductService.saveStatusHistory(productId, product, newStatus, previousStatus);
      }
      
      await loadProducts();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Função para confirmar embarque com container selecionado
  const handleConfirmEmbarkment = async (containerNumber) => {
    try {
      if (!productToEmbark) return;
      
      const selectedContainer = containers.find(c => c.numeroContainer === containerNumber);
      if (!selectedContainer) {
        alert('Container não encontrado!');
        return;
      }
      
      const previousStatus = productToEmbark.status;
      const updatedProduct = {
        status: ORDER_STATUS.EMBARCADO,
        container: containerNumber,
        eta: selectedContainer.eta || ''
      };
      
      await linkedProductService.updateLinkedProduct(productToEmbark.id, updatedProduct);
      
      // Salvar histórico completo quando mudar para Embarcado
      if (previousStatus !== ORDER_STATUS.EMBARCADO) {
        await linkedProductService.saveStatusHistory(
          productToEmbark.id, 
          { ...productToEmbark, ...updatedProduct }, 
          ORDER_STATUS.EMBARCADO, 
          previousStatus
        );
      }
      
      await loadProducts();
      
      setShowContainerSelectionModal(false);
      setProductToEmbark(null);
    } catch (error) {
      console.error('Erro ao confirmar embarque:', error);
    }
  };

  // Função para abrir lightbox da imagem
  const handleOpenLightbox = (product) => {
    const imageUrl = product.referencia 
      ? `https://nyc3.digitaloceanspaces.com/moribr/base-fotos/${product.referencia}.jpg`
      : '/placeholder-product.png';
    
    setLightboxImage({
      url: imageUrl,
      alt: product.referencia || 'Produto',
      referencia: product.referencia,
      nome: product.nomeRaviProfit || 'N/A'
    });
    setShowLightbox(true);
  };

  // Função para fechar lightbox
  const handleCloseLightbox = () => {
    setShowLightbox(false);
    setLightboxImage(null);
  };

  // Funções para seleção múltipla
  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === sortedAndFilteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(sortedAndFilteredProducts.map(p => p.id)));
    }
  };

  const handleBatchEdit = async () => {
    if (selectedProducts.size === 0) {
      alert('Selecione pelo menos um produto para editar');
      return;
    }

    try {
      const updatePromises = Array.from(selectedProducts).map(async (productId) => {
        const updateData = {};
        
        if (batchEditData.lote.trim() !== '') {
          updateData.lote = batchEditData.lote;
        }
        
        if (batchEditData.status !== '') {
          updateData.status = batchEditData.status;
        }
        
        if (batchEditData.container !== '') {
          updateData.container = batchEditData.container;
          
          // Sincronizar ETA quando container for alterado
          const selectedContainer = containers.find(c => c.numeroContainer === batchEditData.container);
          if (selectedContainer?.eta) {
            updateData.eta = selectedContainer.eta;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await linkedProductService.updateLinkedProduct(productId, updateData);
        }
      });

      await Promise.all(updatePromises);
      await loadProducts();
      
      // Limpar seleção e dados
      setSelectedProducts(new Set());
      setBatchEditData({ lote: '', status: '', container: '' });
      setShowBatchEditPanel(false);
      
      alert(`${selectedProducts.size} produtos atualizados com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar produtos em lote:', error);
      alert('Erro ao atualizar produtos');
    }
  };

  // Adicionar listener para ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showLightbox) {
        handleCloseLightbox();
      }
    };

    if (showLightbox) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLightbox]);

  // Função para ordenar produtos
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para obter ícone de ordenação
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Função para ordenar array de produtos
  const sortProducts = (productsArray) => {
    if (!sortField) return productsArray;

    return [...productsArray].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Tratamento especial para campos específicos
      if (sortField === 'dataPedido') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      } else if (sortField === 'eta') {
        // Para ETA, usar a data do container associado
        const containerA = containers.find(c => c.numeroContainer === a.container);
        const containerB = containers.find(c => c.numeroContainer === b.container);
        aValue = containerA?.eta ? new Date(containerA.eta) : new Date(0);
        bValue = containerB?.eta ? new Date(containerB.eta) : new Date(0);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.referencia?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.nomeRaviProfit?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    const matchesContainer = containerFilter === 'all' || 
      (containerFilter === 'no-container' && !product.container) ||
      (containerFilter !== 'no-container' && product.container === containerFilter);
    
    return matchesSearch && matchesStatus && matchesContainer;
  });

  // Aplicar ordenação aos produtos filtrados
  const sortedAndFilteredProducts = sortProducts(filteredProducts);

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.DESENVOLVIMENTO:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.GERAR_PEDIDO:
        return 'bg-orange-100 text-orange-800';
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
          <Package className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Produtos</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Produto</span>
          </button>
          <button
            onClick={handleSyncWithExternalBase}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar Base Externa</span>
          </button>
          <button
            onClick={handleGenerateOrder}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <FileSpreadsheet className="h-5 w-5" />
            <span>Gerar Pedido</span>
          </button>
          <button
            onClick={handleOpenExternalSearch}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Buscar Produto Externo</span>
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
                placeholder="Buscar por referência, nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value={ORDER_STATUS.DESENVOLVIMENTO}>Desenvolvimento</option>
              <option value={ORDER_STATUS.GERAR_PEDIDO}>Gerar Pedido</option>
              <option value={ORDER_STATUS.FABRICACAO}>Fabricação</option>
              <option value={ORDER_STATUS.EMBARCADO}>Embarcado</option>
              <option value={ORDER_STATUS.NACIONALIZADO}>Nacionalizado</option>
            </select>
          </div>
          <div className="md:w-64">
            <select
              value={containerFilter}
              onChange={(e) => setContainerFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Containers</option>
              <option value="no-container">Sem Container</option>
              {containers.map(container => (
                <option key={container.id} value={container.numeroContainer}>
                  {container.numeroContainer} - {container.agente || 'Sem agente'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Painel de Ações em Lote */}
      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Edição em Lote
                </h3>
                <p className="text-sm text-blue-700">
                  {selectedProducts.size} produto(s) selecionado(s)
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedProducts(new Set());
                setBatchEditData({ lote: '', status: '', container: '' });
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Limpar Seleção
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campo Lote */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lote
              </label>
              <input
                type="text"
                value={batchEditData.lote}
                onChange={(e) => setBatchEditData(prev => ({ ...prev, lote: e.target.value }))}
                placeholder="Digite o lote..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Campo Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={batchEditData.status}
                onChange={(e) => setBatchEditData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Manter status atual</option>
                <option value={ORDER_STATUS.DESENVOLVIMENTO}>Desenvolvimento</option>
                <option value={ORDER_STATUS.GERAR_PEDIDO}>Gerar Pedido</option>
                <option value={ORDER_STATUS.FABRICACAO}>Fabricação</option>
                <option value={ORDER_STATUS.EMBARCADO}>Embarcado</option>
                <option value={ORDER_STATUS.NACIONALIZADO}>Nacionalizado</option>
              </select>
            </div>
            
            {/* Campo Container */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Container
              </label>
              <select
                value={batchEditData.container}
                onChange={(e) => setBatchEditData(prev => ({ ...prev, container: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Manter container atual</option>
                <option value="">Remover container</option>
                {containers.map(container => (
                  <option key={container.id} value={container.numeroContainer}>
                    {container.numeroContainer} - {container.agente || 'Sem agente'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleBatchEdit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Atualizar {selectedProducts.size} Produto(s)</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Produtos - Todos os Campos */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden sticky top-16 z-30">
        <style>{`
          .product-table th:not(:last-child), 
          .product-table td:not(:last-child) {
            border-right: 0.25pt solid #d1d5db;
          }
          .product-table tr:not(:last-child) th,
          .product-table tr:not(:last-child) td {
            border-bottom: 0.25pt solid #d1d5db;
          }
          .product-table th,
          .product-table td {
            height: auto;
            vertical-align: middle;
          }
          .product-table th {
            background-color: #f3f4f6;
            font-size: 12px;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 20;
            box-shadow: 0 1px 0 rgba(0,0,0,0.05);
          }
        `}</style>
        {/* Barra de rolagem horizontal abaixo do cabeçalho */}
        <div className="overflow-x-auto overflow-y-hidden" ref={topScrollbarRef} onScroll={handleTopScroll}>
          <div style={{ width: `${tableScrollWidth}px`, height: '8px' }} />
        </div>
        <div className="overflow-x-auto" ref={tableScrollRef} onScroll={handleBodyScroll}>
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200 product-table" style={{ minWidth: '2240px', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {/* Checkbox de Seleção */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === sortedAndFilteredProducts.length && sortedAndFilteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {/* Ações (movido antes da Imagem) */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Ações
                </th>
                {/* Imagem do Produto */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '300px' }}>
                  Imagem
                </th>
                {/* Campos Básicos */}
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('referencia')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Referência</span>
                    {getSortIcon('referencia')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nomeRaviProfit')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Nome Ravi (Profit)</span>
                    {getSortIcon('nomeRaviProfit')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('ncm')}
                >
                  <div className="flex items-center space-x-1">
                    <span>NCM</span>
                    {getSortIcon('ncm')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('orderQtyBox')}
                >
                  <div className="flex items-center space-x-1">
                    <span>ORDER QTY / BOX</span>
                    {getSortIcon('orderQtyBox')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('unitCtn')}
                >
                  <div className="flex items-center space-x-1">
                    <span>UNIT/CTN</span>
                    {getSortIcon('unitCtn')}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  ORDER QTY / UN
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dataPedido')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Data Pedido</span>
                    {getSortIcon('dataPedido')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lote')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Lote</span>
                    {getSortIcon('lote')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('container')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Container</span>
                    {getSortIcon('container')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('eta')}
                >
                  <div className="flex items-center space-x-1">
                    <span>ETA</span>
                    {getSortIcon('eta')}
                  </div>
                </th>
                
                {/* Campos Financeiros */}
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('unitPriceRmb')}
                >
                  <div className="flex items-center space-x-1">
                    <span>UNIT PRICE RMB</span>
                    {getSortIcon('unitPriceRmb')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalRmb')}
                >
                  <div className="flex items-center space-x-1">
                    <span>TOTAL RMB</span>
                    {getSortIcon('totalRmb')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('valorInvoiceUs')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Valor Invoice U$</span>
                    {getSortIcon('valorInvoiceUs')}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalInvoice')}
                >
                  <div className="flex items-center space-x-1">
                    <span>TOTAL INVOICE</span>
                    {getSortIcon('totalInvoice')}
                  </div>
                </th>
                
                {/* Campos de Peso */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Peso Unitário (kg)
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  N.W
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Total Peso Liq
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  G.W
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Total Peso Bruto
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  U$ /kg
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  U$/KG min
                </th>
                
                {/* Campos de Volume */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  CBM
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  CBM TOTAL
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Data Geração Pedido
                </th>
                
                {/* Campos de Identificação */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Fabrica
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  ITEM NO
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  DESCRIPTION
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  NAME
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  REMARK
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  OBS
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  UNIT
                </th>
                
                {/* Dimensões */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  L
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  W
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  H
                </th>
                
                {/* Campos Finais */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Nome Invoice (EN)
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  OBS PEDIDO
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-50 ${
                    product.status === ORDER_STATUS.EMBARCADO 
                      ? 'bg-yellow-50 hover:bg-yellow-100' 
                      : ''
                  }`}
                >
                  {/* Checkbox de Seleção */}
                  <td className="px-3 py-2 whitespace-nowrap" style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {/* Ações (movido para a 2ª coluna) */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium" style={{ width: '96px' }}>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalhes"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleUpdateFromBase(product)}
                        className="text-green-600 hover:text-green-900"
                        title="Atualizar da Base de Produtos"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  {/* Imagem do Produto */}
                  <td className="px-3 py-2 whitespace-nowrap" style={{ width: '300px' }}>
                    <div className="flex justify-center">
                      <img 
                        src={product.referencia ? `https://nyc3.digitaloceanspaces.com/moribr/base-fotos/${product.referencia}.jpg` : '/placeholder-product.png'} 
                        alt={product.referencia || 'Produto'}
                        className="object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ width: '150px', height: 'auto' }}
                        onClick={() => handleOpenLightbox(product)}
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                    </div>
                  </td>
                  {/* Campos Básicos */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900" style={{ width: '96px' }}>
                    {product.referencia || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900" style={{ width: '108px' }}>
                    {product.nomeRaviProfit || 'N/A'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                    {formatNCM(product.ncm)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {renderEditableField(product, 'orderQtyBox', product.orderQtyBox, 'number')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {renderEditableField(product, 'unitCtn', product.unitCtn, 'number')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-medium bg-blue-50">
                    {formatInteger(product.orderQtyUn || calculateOrderQtyUn(product.orderQtyBox, product.unitCtn))}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.dataPedido ? new Date(product.dataPedido).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {renderEditableField(product, 'lote', product.lote)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <select
                      value={product.status}
                      onChange={(e) => handleStatusChange(product.id, e.target.value)}
                      className={`px-1 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value={ORDER_STATUS.DESENVOLVIMENTO}>Desenvolvimento</option>
                      <option value={ORDER_STATUS.GERAR_PEDIDO}>Gerar Pedido</option>
                      <option value={ORDER_STATUS.FABRICACAO}>Fabricação</option>
                      <option value={ORDER_STATUS.EMBARCADO}>Embarcado</option>
                      <option value={ORDER_STATUS.NACIONALIZADO}>Nacionalizado</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {renderEditableField(product, 'container', product.container)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {renderEditableField(product, 'eta', product.eta)}
                  </td>
                  
                  {/* Campos Financeiros */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {renderEditableField(product, 'unitPriceRmb', product.unitPriceRmb, 'number')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-medium bg-green-50">
                    {product.totalRmb ? formatRMB(product.totalRmb) : formatRMB(calculateTotalRmb(product.orderQtyUn || calculateOrderQtyUn(product.orderQtyBox, product.unitCtn), product.unitPriceRmb))}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {renderEditableField(product, 'valorInvoiceUs', product.valorInvoiceUs, 'number')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {renderEditableField(product, 'totalInvoice', product.totalInvoice, 'number')}
                  </td>
                  
                  {/* Campos de Peso */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.pesoUnitario ? `${formatNumber(product.pesoUnitario, 3)}kg` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {formatWeight(product.nw)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {formatWeight((product.nw || 0) * (product.orderQtyBox || 0))}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {formatWeight(product.gw)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {formatWeight((product.gw || 0) * (product.orderQtyBox || 0))}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.usKg ? `$${product.usKg}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.usKgMin ? `$${product.usKgMin}` : 'N/A'}
                  </td>
                  
                  {/* Campos de Volume */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.cbm ? formatNumber(product.cbm, 3) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {formatNumber(((product.cbm || 0) * (product.orderQtyBox || 0)), 3)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.dataGeracaoPedido ? new Date(product.dataGeracaoPedido).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  
                  {/* Campos de Identificação */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.fabrica || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.itemNo || 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate" title={product.description || 'N/A'}>
                    {product.description || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.name || 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate" title={product.remark || 'N/A'}>
                    {product.remark || 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate" title={product.obs || 'N/A'}>
                    {product.obs || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.unit || 'N/A'}
                  </td>
                  
                  {/* Dimensões */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.l || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.w || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.h || 'N/A'}
                  </td>
                  
                  {/* Campos Finais */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {product.nomeInvoiceEn || 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate" title={product.obsPedido || 'N/A'}>
                    {product.obsPedido || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedAndFilteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || containerFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando um novo produto.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      {showForm && (
        <ProductForm
          onSubmit={handleCreateProduct}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSubmit={(data) => handleUpdateProduct(editingProduct.id, data)}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {showDetails && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => {
            setShowDetails(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Modal de Busca Externa */}
      {showExternalSearchModal && (
        <ProductSearchModal
          isOpen={showExternalSearchModal}
          onClose={() => setShowExternalSearchModal(false)}
          onLinkProduct={handleLinkExternalProduct}
          currentProduct={null}
          title="Buscar Produto Externo por REF"
          description="Selecione um produto do sistema externo para vincular ao sistema de pedidos"
        />
      )}

      {/* Modal de Seleção de Container para Embarque */}
      {showContainerSelectionModal && productToEmbark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Selecionar Container para Embarque
              </h3>
              <button
                onClick={() => {
                  setShowContainerSelectionModal(false);
                  setProductToEmbark(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Produto: <span className="font-medium">{productToEmbark.referencia}</span>
              </p>
              <p className="text-sm text-gray-600">
                Nome: <span className="font-medium">{productToEmbark.nomeRaviProfit || 'N/A'}</span>
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o Container:
              </label>
              <select
                id="containerSelect"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um container...</option>
                {containers.map(container => (
                  <option key={container.id} value={container.numeroContainer}>
                    {container.numeroContainer} - {container.agente || 'Sem agente'} 
                    {container.eta && ` (ETA: ${new Date(container.eta).toLocaleDateString('pt-BR')})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowContainerSelectionModal(false);
                  setProductToEmbark(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const selectElement = document.getElementById('containerSelect');
                  const selectedContainer = selectElement.value;
                  if (selectedContainer) {
                    handleConfirmEmbarkment(selectedContainer);
                  } else {
                    alert('Selecione um container para continuar.');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Confirmar Embarque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox para Imagem do Produto */}
      {showLightbox && lightboxImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleCloseLightbox}
        >
          <div className="relative max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCloseLightbox}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white hover:text-gray-300 hover:bg-opacity-75 rounded-full p-2 z-10 transition-all duration-200"
              title="Fechar (ESC)"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="bg-white rounded-lg p-6 max-w-full max-h-full overflow-auto">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {lightboxImage.referencia}
                </h3>
                <p className="text-sm text-gray-600">
                  {lightboxImage.nome}
                </p>
              </div>
              
              <div className="flex justify-center">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.alt}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.src = '/placeholder-product.png';
                  }}
                />
              </div>
              
              <div className="text-center mt-4 text-xs text-gray-500">
                Pressione ESC ou clique fora para fechar
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
