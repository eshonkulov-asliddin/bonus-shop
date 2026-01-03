import React from 'react';

interface TelegramSignInProps {
  onAuth: (user: any) => void;
}

const TELEGRAM_BOT = 'FoydaBonus_bot'; // Replace with your bot username

export const TelegramSignIn: React.FC<TelegramSignInProps> = ({ onAuth }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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
      script.setAttribute('data-embed', '1');
      script.onload = () => {
        // Widget takes a moment to render after script loads
        setTimeout(() => setIsLoading(false), 300);
      };
      containerRef.current.appendChild(script);
    }
  }, [onAuth]);

  return (
    <div className="relative min-h-[40px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-48 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.65-2.89 7.99-3.45 3.8-1.6 4.59-1.88 5.1-1.89.11 0 .37.03.54.18.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
            </svg>
            <span className="text-slate-400 text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'} />
    </div>
  );
};
