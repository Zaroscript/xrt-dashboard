/**
 * Debug utility to check auth state in localStorage
 */
export const checkAuthStorage = () => {
  const authStorage = localStorage.getItem("auth-storage");
  // console.log('=== Auth Storage Debug ===');
  // console.log('Raw localStorage value:', authStorage);

  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      // console.log('Parsed auth storage:', parsed);

      const state = parsed.state;
      if (state) {
        // console.log('Auth state:', { ... });

        // Check token expiration
        if (state.tokens?.accessToken) {
          try {
            // Use dynamic import for better compatibility
            import("jwt-decode")
              .then(({ jwtDecode }) => {
                const decoded = jwtDecode(state.tokens.accessToken);
                const isExpired = decoded.exp
                  ? decoded.exp * 1000 < Date.now()
                  : false;
                const expiresAt = decoded.exp
                  ? new Date(decoded.exp * 1000).toISOString()
                  : null;

                /* console.log('Token details:', {
                isExpired,
                expiresAt,
                currentTime: new Date().toISOString(),
                timeUntilExpiry: decoded.exp ? decoded.exp * 1000 - Date.now() : null
              }); */
              })
              .catch((e) => {
                console.error("Failed to load jwt-decode:", e);
              });
          } catch (e) {
            console.error("Failed to decode token:", e);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse auth storage:", e);
    }
  } else {
    // console.log('No auth storage found in localStorage');
  }

  // console.log('=== End Debug ===');
};

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).checkAuthStorage = checkAuthStorage;
}

export default checkAuthStorage;
