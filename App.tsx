
import React from 'react';
import PluginDevelopmentIDE from './components/PluginDevelopmentIDE';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-primary font-sans">
      <main className="p-4 sm:p-6 lg:p-8">
        <PluginDevelopmentIDE />
      </main>
    </div>
  );
};

export default App;
