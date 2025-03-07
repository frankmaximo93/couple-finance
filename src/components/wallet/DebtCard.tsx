
import { WalletPerson } from '@/integrations/supabase/client';
import { DebtInfo, formatCurrency, getNetDebtAmount } from '@/utils/walletUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type DebtCardProps = {
  walletKey: WalletPerson;
  debts: DebtInfo[];
  onPayDebt: (debtId: string) => void;
};

const DebtCard = ({ walletKey, debts, onPayDebt }: DebtCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Divisão de despesas</CardTitle>
        <CardDescription>Dívidas com o cônjuge</CardDescription>
      </CardHeader>
      <CardContent>
        {getNetDebtAmount(debts, walletKey) > 0 ? (
          <p className="text-lg font-medium text-finance-income">
            A receber: {formatCurrency(getNetDebtAmount(debts, walletKey))}
          </p>
        ) : getNetDebtAmount(debts, walletKey) < 0 ? (
          <p className="text-lg font-medium text-finance-expense">
            A pagar: {formatCurrency(Math.abs(getNetDebtAmount(debts, walletKey)))}
          </p>
        ) : (
          <p className="text-lg font-medium">Sem dívidas pendentes</p>
        )}
        
        <div className="mt-2 text-sm">
          <p className="text-gray-500">Detalhes:</p>
          <ul className="mt-1 space-y-1">
            {debts.filter(debt => !debt.is_paid).map((debt, index) => {
              if (debt.owed_to === walletKey) {
                return (
                  <li key={index} className="text-finance-income flex justify-between items-center">
                    <div>
                      <span>Receber de {debt.owed_by === 'franklin' ? 'Franklim' : 'Michele'}: </span>
                      <span className="font-medium">{formatCurrency(debt.amount)}</span>
                      <span className="block text-xs text-gray-500">{debt.description}</span>
                    </div>
                    <button 
                      onClick={() => onPayDebt(debt.id)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      Marcar Pago
                    </button>
                  </li>
                );
              } else if (debt.owed_by === walletKey) {
                return (
                  <li key={index} className="text-finance-expense flex justify-between items-center">
                    <div>
                      <span>Pagar para {debt.owed_to === 'michele' ? 'Michele' : 'Franklim'}: </span>
                      <span className="font-medium">{formatCurrency(debt.amount)}</span>
                      <span className="block text-xs text-gray-500">{debt.description}</span>
                    </div>
                    <button 
                      onClick={() => onPayDebt(debt.id)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Marcar Pago
                    </button>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebtCard;
