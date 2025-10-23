// Utilitários para formatação numérica brasileira

/**
 * Formata um número para o padrão brasileiro (00.000,00)
 * @param {number|string} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} - Valor formatado no padrão brasileiro
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') {
    return '0,00';
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return '0,00';
  }
  
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formata um valor em USD ($ 00.000,00)
 * @param {number|string} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} - Valor formatado com símbolo USD
 */
export const formatUSD = (value, decimals = 2) => {
  const formatted = formatNumber(value, decimals);
  return `$ ${formatted}`;
};

/**
 * Formata um valor em RMB (¥ 00.000,00)
 * @param {number|string} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} - Valor formatado com símbolo RMB
 */
export const formatRMB = (value, decimals = 2) => {
  const formatted = formatNumber(value, decimals);
  return `¥ ${formatted}`;
};

/**
 * Formata um valor em BRL (R$ 00.000,00)
 * @param {number|string} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} - Valor formatado com símbolo BRL
 */
export const formatBRL = (value, decimals = 2) => {
  const formatted = formatNumber(value, decimals);
  return `R$ ${formatted}`;
};

/**
 * Converte string formatada brasileira para número
 * @param {string} formattedValue - Valor formatado (ex: "1.234,56")
 * @returns {number} - Valor numérico
 */
export const parseFormattedNumber = (formattedValue) => {
  if (!formattedValue || formattedValue === '') {
    return 0;
  }
  
  // Remove símbolos de moeda e espaços
  let cleanValue = formattedValue.replace(/[$¥R$\s]/g, '');
  
  // Se não há vírgula, tratar como número inteiro
  if (!cleanValue.includes(',')) {
    // Remove pontos (separadores de milhares) e converte
    cleanValue = cleanValue.replace(/\./g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }
  
  // Substitui ponto por vazio (separador de milhares) e vírgula por ponto (decimal)
  cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
};

/**
 * Formata código NCM no padrão 0000.00.00
 * @param {string|number} value - Valor a ser formatado
 * @returns {string} - Código NCM formatado
 */
export const formatNCM = (value) => {
  if (!value && value !== 0) return 'N/A';
  
  // Remove caracteres não numéricos
  const cleanValue = String(value).replace(/\D/g, '');
  
  if (cleanValue.length === 0) return 'N/A';
  
  // Formata no padrão 0000.00.00
  if (cleanValue.length <= 4) {
    return cleanValue.padStart(4, '0');
  } else if (cleanValue.length <= 6) {
    return `${cleanValue.substring(0, 4)}.${cleanValue.substring(4).padStart(2, '0')}`;
  } else {
    return `${cleanValue.substring(0, 4)}.${cleanValue.substring(4, 6).padStart(2, '0')}.${cleanValue.substring(6, 8).padStart(2, '0')}`;
  }
};

/**
 * Formata número sem decimais com separador de milhares
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} - Valor formatado sem decimais
 */
export const formatInteger = (value) => {
  if (!value && value !== 0) return 'N/A';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'N/A';
  
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

/**
 * Formata peso com 2 decimais e separação brasileira
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} - Peso formatado
 */
export const formatWeight = (value) => {
  if (!value && value !== 0) return 'N/A';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'N/A';
  
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
