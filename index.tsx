import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro do Service Worker para PWA
// Em ambientes de sandbox como o AI Studio, o registro de Service Worker pode ser restrito
// ou ter comportamentos de origem complexos.
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    /**
     * CORREÇÃO FINAL: Usamos o caminho relativo direto como string.
     * O navegador resolve este caminho em relação ao documento (index.html),
     * o que é o comportamento mais seguro para evitar "Origin Mismatch".
     * Também removemos o construtor 'new URL' que estava falhando em certos contextos de sandbox.
     */
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then(reg => {
        console.log('StreamTV: Service Worker registrado com sucesso:', reg.scope);
      })
      .catch(err => {
        // Logamos o erro mas não deixamos ele quebrar a aplicação
        console.warn('StreamTV: O Service Worker não pôde ser registrado (comum em sandboxes):', err.message);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento root não encontrado");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);