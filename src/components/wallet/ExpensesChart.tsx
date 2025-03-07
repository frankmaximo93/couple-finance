
import { WalletData, formatCurrency } from '@/utils/walletUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type ExpensesChartProps = {
  wallet: WalletData;
};

const ExpensesChart = ({ wallet }: ExpensesChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por categoria</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="h-[300px] w-full">
          {wallet.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wallet.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {wallet.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Sem despesas registradas
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesChart;
