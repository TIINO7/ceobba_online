import * as React from 'react';
import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';
import api from '../../../api';

export default function FinancialSummaryBarChart() {
  const theme = useTheme();
  const [data, setData] = useState({ labels: [], income: [], expenses: [], profit: [] });
  const colorPalette = [
    (theme.vars || theme).palette.primary.dark,
    (theme.vars || theme).palette.primary.main,
    (theme.vars || theme).palette.primary.light,
  ];

  useEffect(() => {
    api.get('/report/financial-summary')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  const totalIncome = data.income.reduce((a, b) => a + b, 0).toLocaleString();
  // compute an un-padded max if you want to start at zero:
  
  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Income, Expenses & Profit
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h4" component="p">
              {totalIncome}
            </Typography>
            
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Financial summary for the last 12 months
          </Typography>
        </Stack>
        <BarChart
          borderRadius={8}
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'band',
              categoryGapRatio: 0.5,
              data: data.labels,
            },
          ]}
          series={[
            { id: 'income', label: 'Income', data: data.income, stack: 'A' },
            { id: 'expenses', label: 'Expenses', data: data.expenses, stack: 'A' },
            { id: 'profit', label: 'Profit', data: data.profit, stack: 'A' },
          ]}
          height={250}
          yAxis={[{ nice: 'strict' }]}
          
          margin={{ left: 50, right: 0, top: 20, bottom: 20 }}
          grid={{ horizontal: true }}
          slotProps={{ legend: { hidden: true } }}
        />
      </CardContent>
    </Card>
  );
}