import { useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';

type TabProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const Navigation = ({ activeTab, setActiveTab }: TabProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  const tabs = [
    { id: 'dashboard-section', label: 'Visão Geral' },
    { id: 'transaction-form-section', label: 'Registrar Transação' },
    { id: 'transactions-list-section', label: 'Lista de Transações' },
    { id: 'categories-list-section', label: 'Categorias' },
    { id: 'wallets-section', label: 'Carteiras' },
    { id: 'reports-section', label: 'Relatórios' },
    { id: 'monthly-bills-section', label: 'Contas do Mês' },
    {
      id: 'account-linking-section',
      label: 'Vincular Contas',
      icon: <UsersRound className="h-5 w-5" />
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`sticky top-0 z-10 w-full transition-all duration-300 ${isScrolled ? 'py-2 bg-white/80 backdrop-blur-md shadow-md' : 'py-3 bg-white'}`}>
      <div className="container mx-auto">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex space-x-1 px-2 py-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md hover:shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
