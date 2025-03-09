
import { useState } from 'react';
import { Card } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { WalletPerson } from '@/integrations/supabase/client';
import { useWalletData } from '@/hooks/useWalletData';
import WalletContent from './wallet/WalletContent';

type WalletsProps = {
  isActive: boolean;
};

const Wallets = ({ isActive }: WalletsProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WalletPerson>('franklin');
  
  const {
    wallets,
    debts,
    isLoading,
    showLinkedMessage,
    handlePayDebt,
    refreshWallets
  } = useWalletData(isActive, user?.id);

  if (!isActive) return null;

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card rounded-2xl p-8 shadow-md">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-8 shadow-md">
        {showLinkedMessage && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Nenhuma conta vinculada encontrada. Vá para a página de Vincular Contas para compartilhar dados financeiros.
            </p>
          </div>
        )}
        
        <Tabs defaultValue="franklin" value={activeTab} onValueChange={(value) => setActiveTab(value as WalletPerson)}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="franklin">Carteira do Franklim</TabsTrigger>
            <TabsTrigger value="michele">Carteira da Michele</TabsTrigger>
          </TabsList>
          
          {['franklin', 'michele'].map((walletKey) => (
            <WalletContent
              key={walletKey}
              walletKey={walletKey as WalletPerson}
              wallet={wallets[walletKey]}
              debts={debts}
              onPayDebt={handlePayDebt}
              refreshWallets={refreshWallets}
            />
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Wallets;
