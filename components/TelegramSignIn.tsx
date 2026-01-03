import React from 'react';

interface TelegramSignInProps {
  onAuth: (user: any) => void;
}

const TELEGRAM_BOT = 'FoydaBonus_bot'; // Replace with your bot username

export const TelegramSignIn: React.FC<TelegramSignInProps> = ({ onAuth }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    let loadTimeout: ReturnType<typeof setTimeout>;
    
    // @ts-ignore
    window.onTelegramAuth = (user: any) => {
      // Telegram widget provides: id, first_name, last_name, username, photo_url, auth_date, hash
      // Note: phone number is NOT provided by Telegram Login Widget (privacy limitation)
      onAuth(user);
    };

    // Remove any previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', TELEGRAM_BOT);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-userpic', 'false');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-embed', '1');
      
      script.onload = () => {
        // Widget takes a moment to render after script loads
        if (mounted) {
          setTimeout(() => setIsLoading(false), 500);
        }
      };
      
      script.onerror = () => {
        if (mounted) {
          setIsLoading(false);
          setLoadError(true);
        }
      };
      
      containerRef.current.appendChild(script);
      
      // Fallback timeout - if widget doesn't load in 5 seconds, show anyway
      loadTimeout = setTimeout(() => {
        if (mounted && isLoading) {
          setIsLoading(false);
        }
      }, 5000);
    }
    
    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
    };
  }, [onAuth]);

  return (
    <div className="relative min-h-[48px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-full max-w-[240px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-[#0088cc] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            <span className="text-slate-500 text-sm font-semibold">Telegram...</span>
          </div>
        </div>
      )}
      {loadError && (
        <div className="text-center py-2">
          <p className="text-red-500 text-xs mb-2">Telegram yuklanmadi</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-indigo-600 text-xs font-semibold hover:underline"
          >
            Qayta yuklash
          </button>
        </div>
      )}
      <div ref={containerRef} className={isLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 transition-opacity duration-300'} />
    </div>
  );
};
