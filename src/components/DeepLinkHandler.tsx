import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const DeepLinkHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Check for various deep link parameters
    const courseId = params.get('course');
    const nftId = params.get('nft');
    const marketplaceId = params.get('marketplace');
    const certificateId = params.get('certificate');
    
    if (courseId || nftId || marketplaceId || certificateId) {
      // Navigate to home, the individual sections will handle the params
      navigate('/', { replace: true });
      
      // Store the param in sessionStorage so sections can pick it up
      if (courseId) {
        sessionStorage.setItem('deeplink_course', courseId);
      } else if (nftId) {
        sessionStorage.setItem('deeplink_nft', nftId);
      } else if (marketplaceId) {
        sessionStorage.setItem('deeplink_marketplace', marketplaceId);
      } else if (certificateId) {
        sessionStorage.setItem('deeplink_certificate', certificateId);
      }
    }
  }, [location, navigate]);

  return null;
};
