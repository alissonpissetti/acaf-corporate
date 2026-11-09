import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FlashProvider } from './flashContext';
import { CorporateProvider } from './corporateContext';
import './styles/fonts.css';
import './styles/global.css';
import './components/extras.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CorporateProvider>
        <FlashProvider>
          <App />
        </FlashProvider>
      </CorporateProvider>
    </BrowserRouter>
  </StrictMode>,
);
