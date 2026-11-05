import React, { useEffect, useState } from 'react'; import { createRoot } from 'react-dom/client';
import './index.css'; import App from './App.jsx'; import Admin from './Admin.jsx';
function Root() { const [h, setH] = useState(location.hash);
  useEffect(() => { const f = () => setH(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h === '#/admin' ? <Admin /> : <App />; }
createRoot(document.getElementById('root')).render(<Root />);
