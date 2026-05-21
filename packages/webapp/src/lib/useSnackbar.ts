import React from 'react';

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

export const SNACKBAR_CLOSED: SnackbarState = { open: false, message: '', severity: 'info' };

export function useSnackbar() {
  const [snackbar, setSnackbar] = React.useState<SnackbarState>(SNACKBAR_CLOSED);

  const showSnackbar = React.useCallback((message: string, severity: SnackbarState['severity']) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = React.useCallback(() => {
    setSnackbar((current) => ({ ...current, open: false }));
  }, []);

  return { snackbar, showSnackbar, closeSnackbar };
}
