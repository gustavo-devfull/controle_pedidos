import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  BarChart3, 
  Menu, 
  X,
  Settings,
  LogOut,
  Ship
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ContainerManagement from './components/ContainerManagement';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="w-full pt-16 px-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<ProductList />} />
            <Route path="/containers" element={<ContainerManagement />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const Navigation = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Produtos', href: '/produtos', icon: Package },
    { name: 'Containers', href: '/containers', icon: Ship },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#0175a6]" style={{ backgroundColor: '#0175a6' }}>
      <div className="max-w-full mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/RAVI-LOGO-BRANCO.svg" alt="Pedidos Ravi" style={{ height: 50 }} />
            <span className="font-semibold uppercase" style={{ color: '#fff', fontSize: 16, letterSpacing: '-1px' }}>Gerenciador de Pedidos Ravi</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-white/20 text-white'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4 text-white" />
                  <span className="text-white">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <span className="text-sm font-medium" style={{ color: '#fff' }}>U</span>
            </div>
            <div className="leading-none">
              <p className="text-sm font-medium" style={{ color: '#fff' }}>Usuário</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>admin@ravi.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default App;
