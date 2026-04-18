/**
 * Google OAuth Integration using Google Identity Services
 * https://developers.google.com/identity/gsi/web/guides/overview
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void;
          disableAutoSelect: () => void;
          revoke: (email: string, callback: () => void) => void;
        };
      };
    };
  }
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  ux_mode?: 'popup' | 'redirect';
  login_uri?: string;
  native_callback?: (response: { id: string; password: string }) => void;
  itp_support?: boolean;
}

interface CredentialResponse {
  credential: string;
  select_by: string;
  clientId?: string;
}

interface PromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
  getMomentType: () => string;
}

interface GsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

let isGoogleScriptLoaded = false;
let isGoogleInitialized = false;

/**
 * Load Google Identity Services script
 */
function loadGoogleScript(): Promise<void> {
  if (isGoogleScriptLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      isGoogleScriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isGoogleScriptLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Initialize Google OAuth
 * @param clientId - Google OAuth Client ID
 * @param callback - Function to call when user signs in
 * @returns Cleanup function to call on component unmount
 */
export function initializeGoogleAuth(
  clientId: string,
  callback: (response: CredentialResponse) => void | Promise<void>
): () => void {
  if (!clientId) {
    console.error('Google OAuth: Client ID is required');
    return () => {};
  }

  // Load script and initialize
  loadGoogleScript()
    .then(() => {
      // Wait for google object to be available
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          
          if (!isGoogleInitialized) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: async (response) => {
                try {
                  await callback(response);
                } catch (error) {
                  console.error('Google OAuth callback error:', error);
                }
              },
              auto_select: false,
              cancel_on_tap_outside: true,
              context: 'signin',
              ux_mode: 'popup',
            });
            
            isGoogleInitialized = true;
          }
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google?.accounts?.id) {
          console.error('Google OAuth: Failed to initialize - google.accounts.id not available');
        }
      }, 5000);
    })
    .catch((error) => {
      console.error('Google OAuth initialization error:', error);
    });

  // Cleanup function
  return () => {
    // Note: Google Identity Services doesn't provide a cleanup method
    // The initialization persists across component remounts
  };
}

/**
 * Render Google Sign-In button
 * @param element - HTML element to render button into
 * @param options - Button configuration options
 */
export function renderGoogleButton(
  element: HTMLElement,
  options: GsiButtonConfiguration = {}
): void {
  if (!window.google?.accounts?.id) {
    console.error('Google OAuth: Not initialized. Call initializeGoogleAuth first.');
    return;
  }

  const defaultOptions: GsiButtonConfiguration = {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: '100%',
  };

  window.google.accounts.id.renderButton(element, {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Trigger Google One Tap prompt
 */
export function promptGoogleOneTap(): void {
  if (!window.google?.accounts?.id) {
    console.error('Google OAuth: Not initialized. Call initializeGoogleAuth first.');
    return;
  }

  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed()) {
      console.log('Google One Tap not displayed:', notification.getNotDisplayedReason());
    } else if (notification.isSkippedMoment()) {
      console.log('Google One Tap skipped:', notification.getSkippedReason());
    } else if (notification.isDismissedMoment()) {
      console.log('Google One Tap dismissed:', notification.getDismissedReason());
    }
  });
}

/**
 * Disable auto-select for Google Sign-In
 */
export function disableGoogleAutoSelect(): void {
  if (!window.google?.accounts?.id) {
    console.error('Google OAuth: Not initialized.');
    return;
  }

  window.google.accounts.id.disableAutoSelect();
}

/**
 * Revoke Google OAuth access
 * @param email - User's email address
 */
export function revokeGoogleAccess(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google OAuth: Not initialized.'));
      return;
    }

    window.google.accounts.id.revoke(email, () => {
      resolve();
    });
  });
}

/**
 * Check if Google OAuth is ready
 */
export function isGoogleAuthReady(): boolean {
  return isGoogleScriptLoaded && isGoogleInitialized && !!window.google?.accounts?.id;
}
