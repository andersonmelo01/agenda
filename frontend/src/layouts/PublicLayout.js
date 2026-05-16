import React from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from '../components/Navbar';

function PublicLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/';

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {!hideNavbar ? <Navbar /> : null}
      <Outlet />
    </Box>
  );
}

export default PublicLayout;
