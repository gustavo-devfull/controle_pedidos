import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Plus, Loader2, AlertCircle } from 'lucide-react';
import { externalProductService } from '../services/externalProductService';

const ProductSearchModal = ({ 
  isOpen, 
  onClose, 
  onLinkProduct, 
  currentProduct, 
  title = "Buscar produto por REF",
  description = "Digite a referência do produto para buscar e vincular"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linking, setLinking] = useState(null);

  // Debounce para evitar muitas queries
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (term) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (term.trim().length >= 2) {
            performSearch(term);
          } else {
            setSearchResults([]);
          }
        }, 500);
      };
    })(),
    []
  );

  const performSearch = async (term) => {
    try {
      setLoading(true);
      setError(null);
      const results = await externalProductService.searchProductsByRef(term);
      setSearchResults(results);
    } catch (err) {
      setError('Erro ao buscar produtos. Tente novamente.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, debouncedSearch]);

  const handleLinkProduct = async (externalProduct) => {
    try {
      setLinking(externalProduct.id);
      await onLinkProduct(externalProduct);
      
      // Mostrar feedback de sucesso
      setTimeout(() => {
        onClose();
        setSearchTerm('');
        setSearchResults([]);
        setLinking(null);
      }, 1000);
    } catch (err) {
      setError('Erro ao vincular produto. Tente novamente.');
      setLinking(null);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    setLinking(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentProduct ? 
                `Vincular produto externo ao produto: ${currentProduct.referencia}` : 
                description
              }
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Digite a referência do produto para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              autoFocus
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-3 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resultados da busca ({searchResults.length})
              </h3>
              <div className="space-y-3">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {product.referencia || 'N/A'}
                          </h4>
                          {product.nome && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {product.nome}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {product.descricao && (
                            <div>
                              <span className="font-medium text-gray-500">Descrição:</span>
                              <p className="text-gray-900">{product.descricao}</p>
                            </div>
                          )}
                          {product.categoria && (
                            <div>
                              <span className="font-medium text-gray-500">Categoria:</span>
                              <p className="text-gray-900">{product.categoria}</p>
                            </div>
                          )}
                          {product.preco && (
                            <div>
                              <span className="font-medium text-gray-500">Preço:</span>
                              <p className="text-gray-900">R$ {product.preco}</p>
                            </div>
                          )}
                          {product.estoque && (
                            <div>
                              <span className="font-medium text-gray-500">Estoque:</span>
                              <p className="text-gray-900">{product.estoque}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => handleLinkProduct(product)}
                          disabled={linking === product.id}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                            linking === product.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {linking === product.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Vinculando...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span>{currentProduct ? 'Vincular' : 'Adicionar ao Sistema'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchTerm.length >= 2 && !loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600">
                Tente buscar por uma referência diferente ou verifique se o produto existe no sistema externo.
              </p>
            </div>
          ) : searchTerm.length < 2 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Digite pelo menos 2 caracteres</h3>
              <p className="text-gray-600">
                Digite a referência do produto que deseja buscar e vincular.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {currentProduct ? 
                'Busque produtos do sistema externo para vincular ao produto atual.' :
                'Busque produtos do sistema externo para adicionar ao sistema de pedidos.'
              }
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;
