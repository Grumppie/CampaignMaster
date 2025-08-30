import React from 'react';
import { Header } from './Header';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
