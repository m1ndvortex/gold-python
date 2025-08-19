import React from 'react';
import { CustomerList } from '../components/customers/CustomerList';

export const Customers: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <CustomerList />
      </div>
    </div>
  );
};