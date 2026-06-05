import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import LogoMark from '../../ui/LogoMark.jsx';

export default function PageLoader({ message = '' }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        bgcolor: 'background.default',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        {/* Logo + spinner */}
        <Box sx={{ position: 'relative', width: 64, height: 64 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: 3,
            background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(25,118,210,0.3)',
          }}>
            <LogoMark size={38} color="#ffffff" />
          </Box>
          <CircularProgress
            size={80}
            thickness={2.5}
            sx={{
              position: 'absolute',
              top: -8, left: -8,
              color: 'primary.main',
              opacity: 0.6,
            }}
          />
        </Box>

        {message && (
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {message}
          </Typography>
        )}
      </motion.div>
    </Box>
  );
}
