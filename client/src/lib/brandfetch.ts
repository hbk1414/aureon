interface BrandfetchLogo {
  theme: string;
  formats: Array<{
    src: string;
    background: string;
    format: string;
    height: number;
    width: number;
    size: number;
  }>;
  type: string;
  tags: string[];
}

interface BrandfetchResponse {
  name: string;
  domain: string;
  logos: BrandfetchLogo[];
}

// Cache for storing fetched logos
const logoCache = new Map<string, string>();

export async function fetchMerchantLogo(merchantName: string): Promise<string | null> {
  // Check cache first
  const cacheKey = merchantName.toLowerCase();
  if (logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey) || null;
  }

  try {
    const response = await fetch(`/api/merchant-logo/${encodeURIComponent(merchantName)}`);

    if (!response.ok) {
      console.warn(`Logo fetch error for ${merchantName}: ${response.status}`);
      logoCache.set(cacheKey, '');
      return null;
    }

    const data = await response.json();
    
    if (data.logoUrl) {
      logoCache.set(cacheKey, data.logoUrl);
      return data.logoUrl;
    }

    logoCache.set(cacheKey, '');
    return null;
  } catch (error) {
    console.error(`Error fetching logo for ${merchantName}:`, error);
    logoCache.set(cacheKey, '');
    return null;
  }
}

function merchantNameToDomain(merchantName: string): string {
  // Convert merchant names to likely domains
  const domainMap: Record<string, string> = {
    'Costa Coffee': 'costa.co.uk',
    'Tesco': 'tesco.com',
    'Sainsbury\'s': 'sainsburys.co.uk',
    'ASDA': 'asda.com',
    'Morrisons': 'morrisons.com',
    'M&S': 'marksandspencer.com',
    'Waitrose': 'waitrose.com',
    'TfL': 'tfl.gov.uk',
    'McDonald\'s': 'mcdonalds.com',
    'Subway': 'subway.com',
    'Greggs': 'greggs.co.uk',
    'Starbucks': 'starbucks.com',
    'Pret A Manger': 'pret.com',
    'John Lewis': 'johnlewis.com',
    'Argos': 'argos.co.uk',
    'Currys': 'currys.co.uk',
    'Amazon': 'amazon.co.uk',
    'eBay': 'ebay.co.uk',
    'PayPal': 'paypal.com',
    'Netflix': 'netflix.com',
    'Spotify': 'spotify.com',
    'Apple': 'apple.com',
    'Google': 'google.com',
    'Microsoft': 'microsoft.com',
    'Shell': 'shell.com',
    'BP': 'bp.com',
    'Esso': 'esso.co.uk'
  };

  const domain = domainMap[merchantName];
  if (domain) {
    return domain;
  }

  // Fallback: convert name to likely domain
  return merchantName
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '')
    .concat('.com');
}

function findBestLogo(logos: BrandfetchLogo[]): string | null {
  if (!logos || logos.length === 0) return null;

  // Prefer icon type, then symbol, then mark
  const preferredTypes = ['icon', 'symbol', 'mark'];
  
  for (const type of preferredTypes) {
    const logoOfType = logos.find(logo => logo.type === type);
    if (logoOfType && logoOfType.formats.length > 0) {
      // Prefer PNG format, then SVG, then any format
      const preferredFormats = ['png', 'svg'];
      
      for (const format of preferredFormats) {
        const logoFormat = logoOfType.formats.find(f => f.format === format);
        if (logoFormat) {
          return logoFormat.src;
        }
      }
      
      // Return first available format
      return logoOfType.formats[0].src;
    }
  }

  // Fallback to any available logo
  if (logos[0] && logos[0].formats.length > 0) {
    return logos[0].formats[0].src;
  }

  return null;
}