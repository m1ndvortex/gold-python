import React from 'react';
import { CustomerList } from '../components/customers/CustomerList';

export const Customers: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <CustomerList />
    </div>
  );
};