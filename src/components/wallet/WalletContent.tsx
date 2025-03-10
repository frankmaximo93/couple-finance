
import { WalletData, DebtInfo } from '@/utils/walletUtils';
import { WalletPerson } from '@/integrations/supabase/client';
import { TabsContent } from '@/components/ui/tabs';
import BalanceCard from './BalanceCard';
import BudgetCard from './BudgetCard';
import DebtCard from './DebtCard';
import ExpensesChart from './ExpensesChart';
import BillsList from './BillsList';
import TransactionsList from './TransactionsList';

type WalletContentProps = {
  walletKey: WalletPerson;
  wallet: WalletData;
  debts: DebtInfo[];
  onPayDebt: (debtId: string) => void;
  refreshWallets: () => void;
};

const WalletContent = ({ walletKey, wallet, debts, onPayDebt, refreshWallets }: WalletContentProps) => {
  if (!wallet) return null;

  return (
    <TabsContent value={walletKey} className="space-y-8">
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
