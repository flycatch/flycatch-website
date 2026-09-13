declare global {
  interface Window {
    dataLayer?: Array<Record<string, string>>;
  }
}

const isProduction = import.meta.env.PUBLIC_ENVIRONMENT === 'production';

if (isProduction) {
  window.dataLayer = window.dataLayer || [];
  window.addEventListener('load', () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-5SK96WK';
    document.head.appendChild(script);
  });
}
