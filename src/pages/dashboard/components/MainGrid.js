import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HighlightedCard from './HighlightedCard';
import PageViewsBarChart from './PageViewsBarChart';
import SessionsChart from './SessionsChart';
import Copyright from '../internals/components/Copyright';
import api from '../../../api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../../../assets/logo.PNG';

export default function MainGrid() {

   const [activeCount, setActiveCount] = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);

  useEffect(() => {
    api.get('/report/active')
      .then(res => setActiveCount(res.data))
      .catch(err => console.error('Failed to fetch active students:', err));

    api.get('/report/subjects-students')
      .then(res => setSubjectStats(res.data.map((s) => ({ subject_name: s.subject_name, students_count: s.students_count }))))
      .catch(err => console.error('Failed to fetch subjects stats:', err));
  }, []);

  const handleGeneratePdf = async () => {
    try {
      const { data } = await api.get('/report/outstanding-balances');

      const doc = new jsPDF();
      doc.addImage(logoImage, 'PNG', 15, 10, 30, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      const title = 'Outstanding Balances Report';
      doc.setFontSize(18);
      doc.text(title, 14, 20);

      const tableColumn = ['ID', 'Name', 'Surname', 'Balance', 'Last Billed', 'Last Payment'];
      const tableRows = [];

      data.forEach((item) => {
        tableRows.push([
          item.student_id,
          item.name,
          item.surname,
          item.outstanding_balance,
          item.last_billed_date || '-',
          item.last_payment_date || '-'
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 10 },
      });

      doc.save('outstanding_balances.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Overview
      </Typography>
      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography component="h2"
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: '600' }}>Active Students</Typography>
              <Typography variant="h4">
                {activeCount !== null ? activeCount : '...'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography component="h2"
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: '600' }}>
                Subjects Enrollment
              </Typography>
              {subjectStats.length > 0 ? (
                subjectStats.map((s) => (
                  <Typography key={s.subject_name} sx={{ color: 'text.secondary', mb: '8px' }}>
                    {s.subject_name}: {s.students_count}
                  </Typography>
                ))
              ) : (
                <Typography sx={{ color: 'text.secondary', mb: '8px' }}>...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card onClick={handleGeneratePdf} sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Typography component="h2"
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: '600' }}>
                Outstanding Balance Report
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: '8px' }}>
                Click to generate & download PDF
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <HighlightedCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SessionsChart />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageViewsBarChart />
        </Grid>
      </Grid>

      <Grid container spacing={2} columns={12}>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
          </Stack>
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
