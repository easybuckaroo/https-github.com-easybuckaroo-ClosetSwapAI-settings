import React from 'react';

export const UserIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const TagIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16.5V21l-3-3 3-3z" />
  </svg>
);

export const SparklesIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.22 5.22a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm3.22 4.78a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm9.56-9.56a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM18 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0118 10zm-4.78 4.78a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM10 18a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0110 18z" clipRule="evenodd" />
    </svg>
);

export const SpinnerIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface StarIconProps {
  className?: string;
  filled?: boolean;
}

export const StarIcon: React.FC<StarIconProps> = ({ className = 'w-5 h-5', filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const HeartIcon = ({ className = 'w-6 h-6', filled = false }: { className?: string, filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

export const PayPalIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.324 20.322l.623-3.693c.123-.73.74-1.29 1.483-1.44l8.36-.263c2.943-.37 5.103-2.953 4.623-5.83-.37-2.18-2.313-3.8-4.5-3.92-3.48-.09-5.91 2.5-5.55 5.92.1 1.02.66 1.91 1.52 2.37.89.48 1.99.31 2.68-.42.5-.55.6-1.37.24-2-.4-.68-1.2-1.1-2-1.02-1.07.1-1.86.99-1.76 2.06.03.34.16.66.36.93.24.31.57.51.93.55h.04c.48 0 .9-.29 1.08-.74l.05-.14c.24-.7.9-1.18 1.64-1.18.9 0 1.65.65 1.78 1.52.18 1.18-.59 2.27-1.78 2.39l-8.36.26c-.34.01-.65.17-.84.43-.19.26-.26.59-.19.89l-.62 3.69c-.06.32.02.66.23.91.21.25.52.39.84.39h5.13c.48 0 .9-.28 1.08-.73l.05-.15c.24-.7.9-1.18 1.64-1.18.9 0 1.65.65 1.78 1.52.18 1.18-.59 2.27-1.78 2.39H4.164c-.48 0-.9-.28-1.08-.73l-.05-.14a.927.927 0 00-.71-.56z" fill="#009cde"/>
    </svg>
);

export const CreditCardIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

export const FlagIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
  </svg>
);

export const GoogleIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const AppleIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.22 6.13c.99-.02 1.94.38 2.64 1.05-.33.22-.67.43-1 .66-.78-.8-1.93-.98-2.95-.53-.2.08-.39.18-.58.29-.02.01-.04.02-.06.03l-.09.05c-.32.18-.62.4-.89.66-1.12 1.08-1.46 2.89-.83 4.42.27.65.69 1.2 1.22 1.62.24.19.5.35.77.49.07.03.14.07.21.1.05.02.09.04.14.06.1.04.2.08.3.12l.16.06c.09.04.18.07.27.11.7.31 1.5.17 2.09-.38.07-.06.13-.13.19-.2.03-.03.06-.06.08-.09.34-.41.53-.93.53-1.48 0-.12-.01-.25-.03-.37-.1-.95-.89-1.63-1.83-1.63-.53 0-1.02.24-1.34.64-.08.1-.17.2-.25.31-.02.02-.03.04-.05.06-.08.1-.17.19-.26.28l-.16.15c-.1.09-.18.19-.27.28-.19.19-.34.4-.41.64-.13.42.06.9.48 1.11.43.21.94.04 1.17-.37 0-.01.01-.01.01-.02.02-.03.04-.06.06-.1.06-.09.11-.19.15-.29.07-.17.11-.35.11-.53 0-.61-.31-1.18-.83-1.48-.54-.31-1.22-.29-1.74.08-.09.06-.18.13-.26.2-.02.02-.04.03-.06.05-.28.24-.55.5-.79.79-.52.62-.83 1.44-.83 2.28 0 .15.01.3.04.44.02.1.05.2.08.29.27.89 1.04 1.53 1.96 1.53.42 0 .84-.13 1.18-.38.08-.06.16-.12.24-.19l.11-.09c.09-.08.18-.16.27-.24.3-.28.58-.59.82-.93.03-.04.06-.08.08-.12.08-.12.15-.25.21-.39.29-.63.4-1.36.28-2.08-.13-.78-.58-1.48-1.22-1.95-.12-.09-.25-.17-.38-.24-1.22-.69-2.04-1.98-2.04-3.43 0-1.27.53-2.45 1.38-3.26zM14.99 1C12.42 1 9.98 2.72 9.07 5.15c-1.02.1-2.22.61-3.11 1.5-1.57 1.57-2.35 3.8-1.94 5.92.54 2.76 2.88 4.69 5.69 5.21.84.16 1.7.04 2.49-.33.74-.35 1.37-.92 1.8-1.61.05-.08.1-.16.15-.24.47-.83.8-1.85.87-2.88.08-1.16-.32-2.33-1.17-3.17-.06-.06-.12-.12-.18-.18-.65-.63-1.56-.9-2.43-.69.25-1.61 1.13-3.12 2.5-4.04.53-.35 1.11-.6 1.7-.72C15.06 4.01 15.1 4 15.15 4c.54 0 1.07.13 1.56.36.98.46 1.79 1.33 2.2 2.37.07.16.13.33.18.51.34 1.14.01 2.48-.84 3.33-.2.2-.42.38-.65.54-.3.21-.64.34-.99.34-.69 0-1.26-.55-1.26-1.23 0-.68.56-1.23 1.26-1.23.08 0 .15.01.23.02.6-.57.87-1.42.66-2.22-.32-1.21-1.53-2.03-2.82-1.87z" fillRule="evenodd"/>
  </svg>
);