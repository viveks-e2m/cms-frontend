import React, { useState } from 'react';
import { PersonOutline as PersonOutlineIcon } from '@mui/icons-material';
import './ClientAvatar.css';

const ClientAvatar = ({ 
  client, 
  size = 'medium', 
  className = '',
  showFallback = true 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Get company logo URL from onboarding info or generate from website
  const getCompanyLogoUrl = () => {
    // First priority: explicit logo URL from onboarding info
    if (client?.onboarding_info?.company_logo_url) {
      return client.onboarding_info.company_logo_url;
    }
    
    // Second priority: generate from company website in onboarding info
    if (client?.onboarding_info?.output?.company?.website) {
      const website = client.onboarding_info.output.company.website;
      const domain = extractDomain(website);
      return domain ? `https://logo.clearbit.com/${domain}` : null;
    }
    
    // Third priority: generate from client website
    if (client?.website) {
      const domain = extractDomain(client.website);
      return domain ? `https://logo.clearbit.com/${domain}` : null;
    }
    
    return null;
  };
  
  // Helper function to extract domain from URL
  const extractDomain = (url) => {
    try {
      // Add protocol if missing
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(fullUrl);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      // If URL parsing fails, try simple regex extraction
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
      return match ? match[1] : null;
    }
  };
  
  const companyLogoUrl = getCompanyLogoUrl();
  
  // Determine if we should show the image
  const shouldShowImage = companyLogoUrl && !imageError && showFallback;
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className={`client-avatar ${size} ${className}`}>
      {shouldShowImage ? (
        <img
          src={companyLogoUrl}
          alt={`${client?.name || 'Client'} logo`}
          className="avatar-image"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : (
        <PersonOutlineIcon className="avatar-icon" />
      )}
    </div>
  );
};

export default ClientAvatar;