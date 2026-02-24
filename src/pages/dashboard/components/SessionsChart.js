import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import api from '../../../api'

export default function StudentStatsLineChart() {
  const theme = useTheme();
  const [data, setData] = useState({ labels: [], registered: [], deleted: [] });

  useEffect(() => {
    api.get('/report/student-stats')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  const colorPalette = [
    theme.palette.primary.main,   // blue for registrations
    theme.palette.error.main      // red for deletions
  ];

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Student Registrations & Deletions
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
          Monthly counts for the current year
        </Typography>
        <LineChart
          colors={colorPalette}
          xAxis={[
            { scaleType: 'band', data: data.labels }
          ]}
          series={[
            { id: 'registered', label: 'Registered', data: data.registered, showMark: false, curve: 'linear' },
            { id: 'deleted',   label: 'Deleted',    data: data.deleted,    showMark: false, curve: 'linear' }
          ]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
          grid={{ horizontal: true }}
          slotProps={{ legend: { hidden: true } }}
        />
      </CardContent>
    </Card>
  );
}