import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';

function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 3,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        mb: 3,
      }}
    >
      <Stack spacing={1} sx={{ maxWidth: 760 }}>
        {eyebrow ? (
          <Chip
            label={eyebrow}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(15, 118, 110, 0.12)',
              color: 'primary.dark',
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          />
        ) : null}

        <Typography variant="h4" fontWeight={800} letterSpacing={-0.6}>
          {title}
        </Typography>

        {description ? (
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {description}
          </Typography>
        ) : null}
      </Stack>

      {actions ? (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="flex-end">
          {actions}
        </Stack>
      ) : null}
    </Box>
  );
}

export default PageHeader;
