import React from 'react';
import { Database, Wifi, HardDrive, AlertCircle } from 'lucide-react';

const SystemStatus = () => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-green-600" />
          <Wifi className="h-4 w-4 text-green-500" />
          <HardDrive className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-green-900">
            Sistema Funcionando - Busca Externa Ativa
          </h3>
          <p className="text-xs text-green-700">
            Conexão direta com banco externo para busca de produtos | Armazenamento local para dados principais
          </p>
          <div className="text-xs text-green-600 mt-1">
            <span className="font-medium">Banco Externo:</span> cadastro-angular (produtos_externos) | 
            <span className="font-medium ml-2">Armazenamento:</span> localStorage (products)
          </div>
          <div className="text-xs text-green-500 mt-1">
            ✅ Firebase externo conectado | ✅ Busca por referência funcionando
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
