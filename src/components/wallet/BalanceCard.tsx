
import { WalletData } from '@/utils/walletUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/walletUtils';

type BalanceCardProps = {
  wallet: WalletData;
};

const BalanceCard = ({ wallet }: BalanceCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Saldo atual</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${wallet.balance >= 0 ? 'text-finance-income' : 'text-finance-expense'}`}>
          {formatCurrency(wallet.balance)}
        </p>
        <div className="flex justify-between mt-4 text-sm">
          <div>
            <p className="text-gray-500">Receitas</p>
            <p className="text-finance-income font-medium">{formatCurrency(wallet.income)}</p>
          </div>
          <div>
            <p className="text-gray-500">Despesas</p>
            <p className="text-finance-expense font-medium">{formatCurrency(wallet.expenses)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
