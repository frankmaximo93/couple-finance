
import { useState } from 'react';
import { WalletData, DebtInfo } from '@/utils/walletUtils';
import { WalletPerson } from '@/integrations/supabase/client';
import { TabsContent } from '@/components/ui/tabs';
import BalanceCard from './BalanceCard';
import BudgetCard from './BudgetCard';
import DebtCard from './DebtCard';
import ExpensesChart from './ExpensesChart';
import BillsList from './BillsList';
import TransactionsList from './TransactionsList';
import { Loader2 } from 'lucide-react';

type WalletContentProps = {
  walletKey: WalletPerson;
  wallet: WalletData;
  debts: DebtInfo[];
  onPayDebt: (debtId: string) => void;
  refreshWallets: () => void;
};

const WalletContent = ({ walletKey, wallet, debts, onPayDebt, refreshWallets }: WalletContentProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  if (!wallet) return null;
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshWallets();
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <TabsContent value={walletKey} className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{walletKey === 'franklin' ? 'Franklim' : 'Michele'}</h2>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Atualizando...</span>
            </>
          ) : (
            <span>Atualizar dados</span>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard wallet={wallet} />
        <BudgetCard wallet={wallet} />
        <DebtCard walletKey={walletKey} debts={debts} onPayDebt={onPayDebt} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpensesChart wallet={wallet} />
        <TransactionsList walletKey={walletKey} refreshWallets={refreshWallets} />
      </div>
    </TabsContent>
  );
};

export default WalletContent;
