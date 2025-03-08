
import { WalletData, formatCurrency, formatDate } from '@/utils/walletUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BillsListProps = {
  wallet: WalletData;
};

const BillsList = ({ wallet }: BillsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas a pagar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {wallet.bills.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Não há contas pendentes.</p>
          ) : (
            wallet.bills.map((bill, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium">{bill.description}</p>
                  <p className="text-sm text-gray-500">Vencimento: {formatDate(bill.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${bill.status === 'to_receive' || bill.status === 'received' ? 'text-green-600' : 'text-finance-expense'}`}>
                    {formatCurrency(bill.amount)}
                  </p>
                  <span 
                    className={`text-xs px-2 py-1 rounded-full ${
                      bill.status === 'paid' || bill.status === 'received'
                        ? 'bg-green-100 text-green-800' 
                        : bill.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : bill.status === 'to_receive'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {bill.status === 'paid' 
                      ? 'Pago' 
                      : bill.status === 'overdue'
                        ? 'Atrasado'
                        : bill.status === 'to_receive'
                          ? 'A Receber'
                          : bill.status === 'received'
                            ? 'Recebido'
                            : 'Pendente'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BillsList;
