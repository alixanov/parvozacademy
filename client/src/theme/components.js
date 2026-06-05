export const getOverrides = (palette) => ({
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      '*, *::before, *::after': {
        boxSizing: 'border-box',
      },
      html: {
        scrollBehavior: 'smooth',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      body: {
        scrollbarWidth: 'thin',
        scrollbarColor:
          theme.palette.mode === 'dark'
            ? '#374151 #0A0E1A'
            : '#CBD5E1 #F5F7FA',
      },
      '*::-webkit-scrollbar': { width: 6, height: 6 },
      '*::-webkit-scrollbar-track': {
        background:
          theme.palette.mode === 'dark' ? '#0A0E1A' : '#F5F7FA',
      },
      '*::-webkit-scrollbar-thumb': {
        background:
          theme.palette.mode === 'dark' ? '#374151' : '#CBD5E1',
        borderRadius: 3,
        '&:hover': {
          background:
            theme.palette.mode === 'dark' ? '#4B5563' : '#94A3B8',
        },
      },
      /* Keyboard focus — visible only, never on click */
      ':focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
      ':focus:not(:focus-visible)': { outline: 'none' },

      /* Smooth page-level transitions */
      '@keyframes fadeInUp': {
        from: { opacity: 0, transform: 'translateY(16px)' },
        to:   { opacity: 1, transform: 'translateY(0)' },
      },
      '@keyframes shimmer': {
        '0%':   { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    }),
  },

  /* ── Button ──────────────────────────────────────────────────── */
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: '0.875rem',
        padding: '9px 22px',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        letterSpacing: 0.2,
        willChange: 'transform, box-shadow',
      },
      contained: {
        boxShadow: 'none',
        position: 'relative',
        overflow: 'hidden',
        /* ── Shine stripe ── */
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
          transform: 'translateX(-110%)',
          transition: 'transform 0.58s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: 'none',
        },
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          transform: 'translateY(-2px)',
        },
        '&:hover::before': {
          transform: 'translateX(110%)',
        },
        '&:active': { transform: 'translateY(0)', boxShadow: 'none' },
        '&.Mui-disabled': { opacity: 0.6 },
      },
      outlined: {
        '&:hover': { transform: 'translateY(-1px)' },
        '&:active': { transform: 'translateY(0)' },
      },
      text: {
        '&:hover': { bgcolor: 'transparent' },
      },
      sizeLarge:  { padding: '13px 30px', fontSize: '1rem',    borderRadius: 12 },
      sizeSmall:  { padding: '5px 14px',  fontSize: '0.8rem',  borderRadius: 8  },
    },
  },

  /* ── IconButton ──────────────────────────────────────────────── */
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: 'background-color 0.18s, color 0.18s, transform 0.18s',
        '&:active': { transform: 'scale(0.92)' },
      },
    },
  },

  /* ── Card ────────────────────────────────────────────────────── */
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 16,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
            : '0 1px 4px rgba(0,0,0,0.5)',
        transition:
          'box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s',
        backgroundImage: 'none',
        /* GPU acceleration on hover for cards with transform */
        '&:hover': { willChange: 'transform, box-shadow' },
        '&:not(:hover)': { willChange: 'auto' },
      }),
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: { '&:last-child': { paddingBottom: 16 } },
    },
  },

  MuiCardActionArea: {
    styleOverrides: {
      root: {
        '&:hover .MuiCardActionArea-focusHighlight': { opacity: 0.04 },
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },

  /* ── Paper ───────────────────────────────────────────────────── */
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
      rounded: { borderRadius: 16 },
      elevation1: { boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)' },
      elevation2: { boxShadow: '0 2px 8px rgba(0,0,0,0.09)' },
      elevation3: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      elevation4: { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' },
      elevation6: { boxShadow: '0 12px 32px rgba(0,0,0,0.14)' },
      elevation8: { boxShadow: '0 16px 40px rgba(0,0,0,0.16)' },
    },
  },

  /* ── TextField / Input ───────────────────────────────────────── */
  MuiTextField: {
    defaultProps: { variant: 'outlined', size: 'small' },
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          transition: 'box-shadow 0.22s, border-color 0.22s',
          '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.light,
          },
          '&.Mui-focused': {
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 0 0 3px rgba(59,130,246,0.22)'
                : '0 0 0 3px rgba(25,118,210,0.14)',
          },
          '&.Mui-error.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(239,68,68,0.16)',
          },
        },
        '& .MuiInputLabel-root': {
          fontSize: '0.9rem',
        },
      }),
    },
  },

  /* ── Chip ────────────────────────────────────────────────────── */
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 600,
        fontSize: '0.78rem',
        transition: 'background-color 0.18s, box-shadow 0.18s, transform 0.18s',
        '&.MuiChip-clickable:hover': { transform: 'translateY(-1px)' },
        '&.MuiChip-clickable:active': { transform: 'translateY(0)' },
      },
      sizeSmall: { fontSize: '0.72rem', height: 24 },
    },
  },

  /* ── Badge ───────────────────────────────────────────────────── */
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontWeight: 700,
        fontSize: '0.68rem',
        minWidth: 18,
        height: 18,
        padding: '0 4px',
      },
    },
  },

  /* ── LinearProgress ──────────────────────────────────────────── */
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 6, overflow: 'hidden' },
      bar:  { borderRadius: 6 },
    },
  },

  /* ── Skeleton ────────────────────────────────────────────────── */
  MuiSkeleton: {
    defaultProps: { animation: 'wave' },
    styleOverrides: {
      root: { borderRadius: 8 },
      rectangular: { borderRadius: 12 },
    },
  },

  /* ── Tabs ────────────────────────────────────────────────────── */
  MuiTabs: {
    styleOverrides: {
      root: {
        '& .MuiTabs-scrollButtons': { transition: 'opacity 0.2s' },
      },
      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
        transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        minWidth: 0,
        padding: '10px 18px',
        transition: 'color 0.18s',
        '&.Mui-selected': { fontWeight: 700 },
      },
    },
  },

  /* ── ListItemButton ──────────────────────────────────────────── */
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        marginBottom: 2,
        transition: 'background-color 0.18s, color 0.18s, padding-left 0.22s',
        '&.Mui-selected': {
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(25,118,210,0.08)'
              : 'rgba(59,130,246,0.12)',
          color: theme.palette.primary.main,
          borderLeft: `3px solid ${theme.palette.primary.main}`,
          paddingLeft: 13,
          '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
          '&:hover': {
            backgroundColor:
              theme.palette.mode === 'light'
                ? 'rgba(25,118,210,0.12)'
                : 'rgba(59,130,246,0.18)',
          },
        },
        '&:hover': {
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(0,0,0,0.04)'
              : 'rgba(255,255,255,0.05)',
        },
      }),
    },
  },

  MuiListItemIcon: {
    styleOverrides: { root: { minWidth: 40 } },
  },

  /* ── Tooltip ─────────────────────────────────────────────────── */
  MuiTooltip: {
    defaultProps: { enterDelay: 200, enterNextDelay: 100 },
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        fontSize: '0.75rem',
        padding: '6px 10px',
        backdropFilter: 'blur(8px)',
      },
      arrow: { fontSize: 10 },
    },
  },

  /* ── Divider ─────────────────────────────────────────────────── */
  MuiDivider: {
    styleOverrides: { root: { borderColor: palette.divider } },
  },

  /* ── Avatar ──────────────────────────────────────────────────── */
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontWeight: 700,
        transition: 'transform 0.2s',
      },
    },
  },

  /* ── Table ───────────────────────────────────────────────────── */
  MuiTableHead: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiTableCell-root': {
          fontWeight: 700,
          color: theme.palette.text.secondary,
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          backgroundColor: theme.palette.action.hover,
          borderBottom: `2px solid ${theme.palette.divider}`,
        },
      }),
    },
  },

  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: '12px 16px',
        fontSize: '0.875rem',
      }),
    },
  },

  MuiTableRow: {
    styleOverrides: {
      root: ({ theme }) => ({
        transition: 'background-color 0.15s',
        '&:hover:not(.MuiTableRow-head)': {
          backgroundColor: theme.palette.action.hover,
        },
      }),
    },
  },

  /* ── Alert ───────────────────────────────────────────────────── */
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        fontWeight: 500,
        alignItems: 'center',
      },
    },
  },

  /* ── Dialog ──────────────────────────────────────────────────── */
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
        backgroundImage: 'none',
      },
    },
    defaultProps: { transitionDuration: { enter: 250, exit: 180 } },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: { fontWeight: 700, fontSize: '1.1rem' },
    },
  },

  /* ── AppBar ──────────────────────────────────────────────────── */
  MuiAppBar: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
    },
  },

  /* ── Drawer ──────────────────────────────────────────────────── */
  MuiDrawer: {
    styleOverrides: {
      paper: { backgroundImage: 'none', borderRight: 'none' },
    },
  },

  /* ── Menu ────────────────────────────────────────────────────── */
  MuiMenu: {
    styleOverrides: {
      paper: { borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        margin: '2px 6px',
        padding: '8px 12px',
        fontSize: '0.875rem',
        transition: 'background-color 0.15s',
      },
    },
  },

  /* ── Select ──────────────────────────────────────────────────── */
  MuiSelect: {
    styleOverrides: {
      select: { borderRadius: 10 },
    },
  },

  /* ── Switch ──────────────────────────────────────────────────── */
  MuiSwitch: {
    styleOverrides: {
      root: { padding: 7 },
      thumb: {
        width: 16,
        height: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.22)',
      },
      track: {
        borderRadius: 10,
        opacity: 0.5,
      },
      switchBase: {
        padding: 8,
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        '&.Mui-checked + .MuiSwitch-track': { opacity: 0.9 },
      },
    },
  },

  /* ── Accordion ───────────────────────────────────────────────── */
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: '12px !important',
        border: `1px solid ${palette.divider}`,
        boxShadow: 'none',
        '&::before': { display: 'none' },
        '&.Mui-expanded': { margin: '8px 0' },
      },
    },
  },

  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        minHeight: 52,
        '&.Mui-expanded': { minHeight: 52 },
        fontWeight: 600,
      },
    },
  },

  /* ── ToggleButton ────────────────────────────────────────────── */
  MuiToggleButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: 20,
        padding: '6px 16px',
        fontSize: '0.85rem',
        transition: 'all 0.18s',
        '&.Mui-selected': { fontWeight: 700 },
      },
    },
  },

  /* ── Breadcrumbs ─────────────────────────────────────────────── */
  MuiBreadcrumbs: {
    styleOverrides: {
      root: { fontSize: '0.8rem' },
      separator: { margin: '0 4px' },
    },
  },

  /* ── Snackbar ────────────────────────────────────────────────── */
  MuiSnackbarContent: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
});
