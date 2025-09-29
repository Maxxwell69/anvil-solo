import React from 'react';
import { Provider } from './context';

import './App.css';
import Router from './routes';
function App() {
  return (
    <Provider>
      <Router />
    </Provider>
  );
}

export default App;
