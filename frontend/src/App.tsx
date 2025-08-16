import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>Gold Shop Management System</h1>
            <p>طلافروشی - سیستم مدیریت</p>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

function HomePage() {
  return (
    <div>
      <h2>Welcome to Gold Shop Management</h2>
      <p>System is ready for development</p>
    </div>
  );
}

export default App;