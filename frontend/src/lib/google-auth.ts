/**
 * Google OAuth Helper for Kramic.sh
 * Handles Google Sign-In integration
 */

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

/**
 * Initialize Google Sign-In
 * Call this in your component's useEffect
 */
export const initializeGoogleAuth = (clientId: string, callback: (response: GoogleAuthResponse) => void) => {
  // Load Google Sign-In script
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);

  script.onload = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: callback,
      });
    }
  };

  return () => {
    document.body.removeChild(script);
  };
};

/**
 * Render Google Sign-In button
 */
export const renderGoogleButton = (elementId: string, options?: {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
}) => {
  if (window.google) {
    window.google.accounts.id.renderButton(
      document.getElementById(elementId)!,
      {
        theme: options?.theme || 'outline',
        size: options?.size || 'large',
        text: options?.text || 'continue_with',
        shape: options?.shape || 'rectangular',
        width: options?.width || 400,
      }
    );
  }
};

/**
 * Decode JWT token to get user info
 */
export const decodeJWT = (token: string): GoogleUser | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}
