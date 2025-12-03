import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AuthGuard({ children }) {
  // Defensive check for SSR/environment without window
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    return <Navigate to="/auth/sign-in" replace />;
  }
  return <>{children}</>;
}
