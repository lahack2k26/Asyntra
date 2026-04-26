import { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';

function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <WelcomePage onGetStarted={() => setStarted(true)} />;
  }

  return <Dashboard onBack={() => setStarted(false)} />;
}

export default App;
