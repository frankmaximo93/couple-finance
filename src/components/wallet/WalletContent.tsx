
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
import { Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type WalletContentProps = {
  walletKey: WalletPerson;
  wallet: WalletData;
  debts: DebtInfo[];
  onPayDebt: (debtId: string, amount?: number) => void;
  refreshWallets: () => void;
};

const WalletContent = ({ walletKey, wallet, debts, onPayDebt, refreshWallets }: WalletContentProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSavingsGoalDialog, setShowSavingsGoalDialog] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState<number>(wallet?.savings_goal || 0);
  const [isUpdatingSavingsGoal, setIsUpdatingSavingsGoal] = useState(false);
  
  if (!wallet) return null;
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshWallets();
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const handleSaveSavingsGoal = async () => {
    setIsUpdatingSavingsGoal(true);
    try {
      // Atualizar a meta de economia no banco de dados
      const { error } = await supabase
        .from('wallets')
        .update({ savings_goal: savingsGoal })
        .eq('name', walletKey === 'franklin' ? 'Franklin' : 'Michele');
        
      if (error) throw error;
      
      toast.success('Meta de economia atualizada!');
      refreshWallets();
      setShowSavingsGoalDialog(false);
    } catch (error) {
      console.error('Erro ao atualizar meta de economia:', error);
      toast.error('Não foi possível atualizar a meta de economia');
    } finally {
      setIsUpdatingSavingsGoal(false);
    }
  };

  return (
    <TabsContent value={walletKey} className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{walletKey === 'franklin' ? 'Franklim' : 'Michele'}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSavingsGoalDialog(true)}
            className="flex items-center gap-1"
          >
            <Target className="h-4 w-4" />
            <span>Meta de Economia</span>
          </Button>
          
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
      
      <Dialog open={showSavingsGoalDialog} onOpenChange={setShowSavingsGoalDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Definir Meta de Economia</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="savings-goal" className="col-span-4">
                Quanto deseja economizar?
              </Label>
              <Input
                id="savings-goal"
                type="number"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(Number(e.target.value))}
                className="col-span-4"
                placeholder="R$ 0,00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button" 
              variant="outline" 
              onClick={() => setShowSavingsGoalDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSavingsGoal}
              disabled={isUpdatingSavingsGoal}
            >
              {isUpdatingSavingsGoal ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
};

export default WalletContent;
