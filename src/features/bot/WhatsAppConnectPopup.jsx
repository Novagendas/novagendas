import { useEffect, useState } from 'react';

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const EMBEDDED_SIGNUP_CONFIG_ID = import.meta.env.VITE_EMBEDDED_SIGNUP_CONFIG_ID;

const loadFbSdk = () =>
  new Promise((resolve) => {
    if (window.FB) { resolve(); return; }
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FB_APP_ID, cookie: true, xfbml: false, version: 'v22.0' });
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/es_LA/sdk.js';
    script.async = true;
    document.body.appendChild(script);
  });

export default function WhatsAppConnectPopup() {
  const [status, setStatus] = useState('connecting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const wabaData = { waba_id: null, phone_number_id: null };

    const onMetaMessage = (event) => {
      if (event.origin !== 'https://www.facebook.com') return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'WA_EMBEDDED_SIGNUP' && msg.event === 'FINISH') {
          wabaData.waba_id = msg.data?.waba_id ?? null;
          wabaData.phone_number_id = msg.data?.phone_number_id ?? null;
        }
      } catch { /* ignorar mensajes no JSON */ }
    };
    window.addEventListener('message', onMetaMessage);

    const run = async () => {
      try {
        await loadFbSdk();
        const authResponse = await new Promise((resolve, reject) => {
          window.FB.login((response) => {
            if (response.authResponse) resolve(response.authResponse);
            else reject(new Error('El usuario canceló el inicio de sesión'));
          }, {
            config_id: EMBEDDED_SIGNUP_CONFIG_ID,
            extras: {
              setup: {},
              sessionInfoVersion: 2,
            },
          });
        });

        const { waba_id, phone_number_id } = wabaData;
        if (!waba_id || !phone_number_id) {
          throw new Error('No se recibió WABA ID o Phone Number ID de Meta');
        }

        setStatus('success');
        if (window.opener) {
          window.opener.postMessage({
            type: 'WA_CONNECT_RESULT',
            data: { waba_id, phone_number_id, access_token: authResponse.accessToken },
          }, '*');
        }
        setTimeout(() => window.close(), 1500);
      } catch (err) {
        setErrorMsg(err.message);
        setStatus('error');
        if (window.opener) {
          window.opener.postMessage({ type: 'WA_CONNECT_ERROR', error: err.message }, '*');
        }
        setTimeout(() => window.close(), 2500);
      } finally {
        window.removeEventListener('message', onMetaMessage);
      }
    };

    run();
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'sans-serif', background: '#fff',
      color: '#111', padding: '24px', textAlign: 'center', gap: '16px',
    }}>
      {status === 'connecting' && (
        <>
          <svg style={{ animation: 'spin 1s linear infinite' }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p style={{ margin: 0, fontSize: '15px' }}>Conectando con WhatsApp Business...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
      {status === 'success' && (
        <>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
          </svg>
          <p style={{ margin: 0, fontSize: '15px' }}>WhatsApp conectado correctamente. Cerrando...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ margin: 0, fontSize: '15px' }}>{errorMsg || 'Error al conectar WhatsApp'}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Esta ventana se cerrará automáticamente.</p>
        </>
      )}
    </div>
  );
}
