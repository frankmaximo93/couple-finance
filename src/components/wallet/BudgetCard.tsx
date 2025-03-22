
import { WalletData } from '@/utils/walletUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/walletUtils';

type BudgetCardProps = {
  wallet: WalletData;
};

const BudgetCard = ({ wallet }: BudgetCardProps) => {
  const savingsProgress = wallet.savings_goal > 0 ? (wallet.balance / wallet.savings_goal) * 100 : 0;
  const budgetUsedPercentage = wallet.income > 0 ? Math.round((wallet.expenses / wallet.income) * 100) : 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Orçamento utilizado</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-between">
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-500">Gastos vs. Receitas</span>
            <span className="text-sm font-medium">
              {budgetUsedPercentage}%
            </span>
          </div>
          <Progress 
            value={budgetUsedPercentage} 
            className="h-2 bg-gray-200"
          />
        </div>
        
        {wallet.savings_goal > 0 && (
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-500">Meta de Economia</span>
              <span className="text-sm font-medium">
                {Math.min(100, Math.round(savingsProgress))}%
              </span>
            </div>
            <Progress 
              value={Math.min(100, savingsProgress)} 
              className="h-2 bg-gray-200"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                {formatCurrency(wallet.balance)} / {formatCurrency(wallet.savings_goal)}
              </span>
              <span className="text-xs text-gray-500">
                {wallet.balance >= wallet.savings_goal ? 'Meta atingida!' : 'Em progresso'}
              </span>
            </div>
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Consumo total</p>
          <p className="text-xl font-medium text-finance-expense">{formatCurrency(wallet.expenses)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;
