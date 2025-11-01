import React from 'react';

const Loader: React.FC<{ message?: string }> = ({ message = "Generating..." }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center p-8 text-center bg-surface rounded-lg shadow-2xl border border-background">
        <svg className="animate-spin h-10 w-10 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold text-primary">{message}</p>
        <p className="mt-1 text-sm text-secondary">Please wait a moment.</p>
      </div>
    </div>
  );
};

export default Loader;