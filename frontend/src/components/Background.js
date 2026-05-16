import React from 'react';
import { Box } from '@mui/material';

function Background({ children }) {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 68px)',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(45, 212, 191, 0.10), transparent 30%), radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.08), transparent 28%), linear-gradient(180deg, #fbfdff 0%, #eef4fb 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          opacity: 0.34,
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent 84%)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent 84%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '22rem',
          height: '22rem',
          borderRadius: '999px',
          top: '-6rem',
          left: '-6rem',
          filter: 'blur(110px)',
          background: 'rgba(45, 212, 191, 0.16)',
          pointerEvents: 'none',
        },
        '& .background-orb': {
          position: 'absolute',
          width: '22rem',
          height: '22rem',
          borderRadius: '999px',
          bottom: '-8rem',
          right: '-6rem',
          filter: 'blur(110px)',
          background: 'rgba(37, 99, 235, 0.12)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box className="background-orb" />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2.5, sm: 3.5, md: 5 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Background;
