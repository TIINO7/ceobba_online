import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';

export default function SessionsChart({ data }) {
  const theme = useTheme();

  // Map incoming backend data
  const chartData = data && data.length > 0 ? data : [
    { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 }
  ];

  const xLabels = chartData.map((item) => item.month);
  const revenueSeries = chartData.map((item) => item.revenue);
  const totalPeriodRevenue = revenueSeries.reduce((a, b) => a + b, 0);

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Revenue (Last 6 Months)
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
              ${totalPeriodRevenue.toLocaleString()}
            </Typography>
          </Stack>
        </Stack>
        <LineChart
          colors={[theme.palette.primary.main]}
          xAxis={[
            {
              scaleType: 'point',
              data: xLabels,
              tickInterval: (index, i) => (i + 1) % 1 === 0,
            },
          ]}
          series={[
            {
              id: 'revenue',
              label: 'Revenue',
              showMark: true,
              curve: 'linear',
              stack: 'total',
              area: true,
              stackOrder: 'ascending',
              data: revenueSeries,
            },
          ]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
          grid={{ horizontal: true }}
          sx={{
            '& .MuiAreaElement-series-revenue': {
              fill: "url('#revenue')",
            },
          }}
        >
          <defs>
            <linearGradient id="revenue" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
              <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
            </linearGradient>
          </defs>
        </LineChart>
      </CardContent>
    </Card>
  );
}

SessionsChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      revenue: PropTypes.number.isRequired,
    })
  ),
};