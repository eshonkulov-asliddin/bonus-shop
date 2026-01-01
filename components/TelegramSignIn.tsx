import React from 'react';

interface TelegramSignInProps {
  onAuth: (user: any) => void;
}

const TELEGRAM_BOT = 'FoydaBonus_bot'; // Replace with your bot username

export const TelegramSignIn: React.FC<TelegramSignInProps> = ({ onAuth }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // @ts-ignore
    window.onTelegramAuth = (user) => {
      onAuth(user);
    };

    // Remove any previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?7';
      script.setAttribute('data-telegram-login', TELEGRAM_BOT);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-userpic', 'false');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-embed', '1'); // Ensure widget works in embedded web apps
      containerRef.current.appendChild(script);
    }
  }, [onAuth]);

  return <div ref={containerRef} />;
};
