import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './router';

console.log('[App] Module loaded');

const App: React.FC = () => {
  console.log('[App] Rendering');
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e1f22',
            color: '#dbdee1',
            border: '1px solid #2b2d31',
            borderRadius: '8px',
          },
          success: {
            iconTheme: { primary: '#5865f2', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ed4245', secondary: '#fff' },
          },
        }}
      />
    </>
  );
};

export default App;
