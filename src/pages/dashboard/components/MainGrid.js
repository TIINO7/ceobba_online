import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import DownloadIcon from '@mui/icons-material/Download';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';

// Import PDF libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import api from '../../../api'; 

// Helper function to handle both MUI DataGrid v6 and v7 valueFormatter differences
const safeCurrencyFormatter = (value) => {
  // If v6, 'value' is a params object. If v7, it's the raw value.
  const actualValue = (value && value.value !== undefined) ? value.value : value;
  
  if (actualValue == null || isNaN(actualValue)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(actualValue));
};

export default function MainGrid() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [revenueFilter, setRevenueFilter] = React.useState('monthly');
  const [revenueData, setRevenueData] = React.useState([]);
  const [unpaidData, setUnpaidData] = React.useState([]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsRes = await api.get('/analytics/summary');
        setStats(statsRes.data);

        const unpaidRes = await api.get('/analytics/unpaid-fees');
        setUnpaidData(unpaidRes.data || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  React.useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const response = await api.get(`/analytics/revenue?period=${revenueFilter}`);
        setRevenueData(response.data || []);
      } catch (error) {
        console.error("Failed to fetch revenue data", error);
      }
    };
    fetchRevenueData();
  }, [revenueFilter]);

  // Frontend PDF Generation Handler
  const handleDownloadReport = async () => {
    try {
      // Fetch exhaustive data (all time) for the report
      const response = await api.get('/analytics/revenue?period=all');
      const allData = response.data || [];

      // Initialize jsPDF
      const doc = new jsPDF();
      
      // Add Title
      doc.setFontSize(18);
      doc.text("Exhaustive Revenue Report", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Define table columns and rows
      const tableColumns = ["Transaction ID", "Date", "Student Name", "Description", "Amount Paid"];
      const tableRows = [];

      let totalCashFlow = 0;

      allData.forEach(transaction => {
        const rowData = [
          transaction.id,
          transaction.date,
          transaction.student_name,
          transaction.description,
          `$${Number(transaction.amount).toFixed(2)}`
        ];
        tableRows.push(rowData);
        totalCashFlow += Number(transaction.amount);
      });

      // Add table to PDF using the safe autoTable syntax
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 36,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
      });

      // Add Total at the bottom of the table safely
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 36 + (tableRows.length * 10);
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Total Cash Flow: $${totalCashFlow.toFixed(2)}`, 14, finalY + 10);

      // Save the PDF
      doc.save(`Revenue_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("Failed to download report:", error);
      alert("Could not generate the PDF report. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const totalUnpaid = unpaidData.reduce((sum, row) => sum + Number(row.amount_owing), 0);

  
  // Updated formatting safely 
  const revenueColumns = [
    { field: 'date', headerName: 'Date', width: 150 },
    { field: 'student_name', headerName: 'Student Name', width: 200, flex: 1 },
    { field: 'description', headerName: 'Description (Fees)', width: 250, flex: 1 },
    { field: 'amount', headerName: 'Amount Paid', width: 150, valueFormatter: safeCurrencyFormatter },
  ];

  const unpaidColumns = [
    { field: 'student_name', headerName: 'Student Name', width: 250, flex: 1 },
    { field: 'grade', headerName: 'Class/Grade', width: 150 },
    { field: 'amount_owing', headerName: 'Amount Owing', width: 200, valueFormatter: safeCurrencyFormatter },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      
      
      <Grid container spacing={3} columns={12}>
       
        
        {/* 2. Revenue Table Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Revenue Breakdown</Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="revenue-filter-label">Period</InputLabel>
                  <Select
                    labelId="revenue-filter-label"
                    value={revenueFilter}
                    label="Period"
                    onChange={(e) => setRevenueFilter(e.target.value)}
                  >
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>

                <Button 
                  variant="contained" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadReport}
                >
                  Download Report
                </Button>
              </Box>
            </Box>
            
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid 
                rows={revenueData} 
                columns={revenueColumns} 
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5 } },
                  sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
                }}
                disableRowSelectionOnClick
              />
            </div>
          </Paper>
        </Grid>

        {/* 3. Unpaid Fees Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Unpaid & Owing Fees</Typography>
              <Typography variant="h6" color="error.main">
                Total Outstanding: {totalUnpaid.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
            </Box>

            <div style={{ height: 400, width: '100%' }}>
              <DataGrid 
                rows={unpaidData} 
                columns={unpaidColumns} 
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5 } },
                  sorting: { sortModel: [{ field: 'amount_owing', sort: 'desc' }] },
                }}
                disableRowSelectionOnClick
              />
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}