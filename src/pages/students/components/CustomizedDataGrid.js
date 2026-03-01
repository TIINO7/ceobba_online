import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Student Name', flex: 1, minWidth: 200 },
  { field: 'level', headerName: 'Level', width: 150 },
  { field: 'enrollment_date', headerName: 'Enrollment Date', width: 150 },
];

export default function CustomizedDataGrid({ data }) {
  // Use data from API or fallback to empty array
  const rows = data || [];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Recently Enrolled Students
      </Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        pageSizeOptions={[5, 10, 20]}
        disableColumnResize
        density="compact"
      />
    </Box>
  );
}