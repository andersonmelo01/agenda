import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

/**
 * Componente de tabela responsiva
 * Em desktop: mostra tabela normal
 * Em mobile: mostra cards com os dados
 * 
 * @param {Object} props
 * @param {Array} props.columns - Definição das colunas: [{field: 'id', label: 'ID', renderCell: (row) => ...}, ...]
 * @param {Array} props.rows - Dados para renderizar
 * @param {boolean} props.loading - Estado de carregamento
 * @param {React.ReactNode} props.loadingComponent - Componente a mostrar enquanto carrega
 * @param {React.ReactNode} props.emptyComponent - Componente a mostrar quando vazio
 */
export default function ResponsiveTable({
  columns = [],
  rows = [],
  loading = false,
  loadingComponent = null,
  emptyComponent = null,
  stickyHeader = true,
  dense = false,
  sx = {},
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) {
    return loadingComponent;
  }

  if (!rows || rows.length === 0) {
    return (
      emptyComponent || (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="textSecondary">Nenhum item encontrado</Typography>
        </Box>
      )
    );
  }

  // Vista móvel: Cards
  if (isMobile) {
    return (
      <Stack spacing={2} sx={{ px: 2, py: 2, ...sx }}>
        {rows.map((row, index) => (
          <Card
            key={row.id || index}
            sx={{
              borderRadius: 2.5,
              border: '1px solid rgba(15, 23, 42, 0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.08)',
              },
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack spacing={1.5}>
                {columns.map((column) => (
                  <Box key={column.field}>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}
                    >
                      {column.label}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {column.renderCell ? column.renderCell(row) : <Typography>{row[column.field]}</Typography>}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  // Vista desktop: Tabela
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2.5, ...sx }}>
      <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'rgba(15, 118, 110, 0.02)' }}>
            {columns.map((column) => (
              <TableCell
                key={column.field}
                align={column.align || 'left'}
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  backgroundColor: 'rgba(15, 118, 110, 0.04)',
                  minWidth: column.minWidth,
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row.id || index}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(15, 118, 110, 0.02)',
                },
                '&:last-child td, &:last-child th': {
                  border: 0,
                },
              }}
            >
              {columns.map((column) => (
                <TableCell key={column.field} align={column.align || 'left'}>
                  {column.renderCell ? column.renderCell(row) : row[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
