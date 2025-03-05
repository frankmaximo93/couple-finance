
import { useState } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import TransactionForm from '@/components/TransactionForm';
import TransactionsList from '@/components/TransactionsList';
import CategoriesList from '@/components/CategoriesList';
import Wallets from '@/components/Wallets';
import Reports from '@/components/Reports';
import MonthlyBills from '@/components/MonthlyBills';
import AccountLinking from '@/components/AccountLinking';
import Footer from '@/components/Footer';

const tabTitles: Record<string, string> = {
  'dashboard-section': 'Visão Geral',
  'transaction-form-section': 'Registrar Transação',
  'transactions-list-section': 'Lista de Transações',
  'categories-list-section': 'Categorias',
  'wallets-section': 'Carteiras',
  'reports-section': 'Relatórios',
  'monthly-bills-section': 'Contas do Mês',
  'account-linking-section': 'Vincular Contas'
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard-section');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <Header activeTab={tabTitles[activeTab]} />
      
      <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />
      
      <main className="container mx-auto px-4 py-8">
        <Dashboard isActive={activeTab === 'dashboard-section'} />
        <TransactionForm isActive={activeTab === 'transaction-form-section'} />
        <TransactionsList isActive={activeTab === 'transactions-list-section'} />
        <CategoriesList isActive={activeTab === 'categories-list-section'} />
        <Wallets isActive={activeTab === 'wallets-section'} />
        <Reports isActive={activeTab === 'reports-section'} />
        <MonthlyBills isActive={activeTab === 'monthly-bills-section'} />
        <AccountLinking isActive={activeTab === 'account-linking-section'} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
