

import { useEffect } from 'react';

export const MiniAppPrompt = () => {
  useEffect(() => {
    const triggerAddMiniApp = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // Check if user has already been prompted in this session
        const hasBeenPrompted = sessionStorage.getItem('miniapp-add-prompted');
        if (hasBeenPrompted) {
          return;
        }

        // Mark as prompted so we don't show again this session
        sessionStorage.setItem('miniapp-add-prompted', 'true');
        
        // Wait a bit for the app to fully load, then trigger native Farcaster add UI
        setTimeout(async () => {
          try {
            const result = await sdk.actions.addFrame();
            
            if (result?.notificationDetails) {
              console.log('Mini app added with notifications!', result.notificationDetails.token);
              
              // Send notification token to backend
              try {
                await fetch('https://ucqcrhfcflrepsdlcvpq.supabase.co/functions/v1/miniapp-webhook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'miniapp.added',
                    data: { notificationDetails: result.notificationDetails }
                  })
                });
              } catch (err) {
                console.error('Failed to send notification token:', err);
              }
            }
          } catch (addError) {
            console.log('User cancelled or already added:', addError);
          }
        }, 2000);
      } catch (error) {
        console.log('Farcaster SDK not available');
      }
    };

    triggerAddMiniApp();
  }, []);

  // No UI needed - Farcaster's native add UI will show
  return null;
};
