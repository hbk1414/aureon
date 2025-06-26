import { useState, useEffect } from 'react';
import { fetchMerchantLogo } from '@/lib/brandfetch';

interface MerchantLogo {
  merchant: string;
  logoUrl: string | null;
  loading: boolean;
}

export function useMerchantLogos(merchants: string[]) {
  const [logos, setLogos] = useState<Record<string, MerchantLogo>>({});

  useEffect(() => {
    const fetchLogos = async () => {
      // Initialize loading state for all merchants
      const initialLogos: Record<string, MerchantLogo> = {};
      merchants.forEach(merchant => {
        initialLogos[merchant] = {
          merchant,
          logoUrl: null,
          loading: true
        };
      });
      setLogos(initialLogos);

      // Fetch logos for each merchant
      const logoPromises = merchants.map(async (merchant) => {
        try {
          const logoUrl = await fetchMerchantLogo(merchant);
          return { merchant, logoUrl, loading: false };
        } catch (error) {
          console.error(`Failed to fetch logo for ${merchant}:`, error);
          return { merchant, logoUrl: null, loading: false };
        }
      });

      const results = await Promise.all(logoPromises);
      
      // Update state with results
      const updatedLogos: Record<string, MerchantLogo> = {};
      results.forEach(result => {
        updatedLogos[result.merchant] = result;
      });
      
      setLogos(updatedLogos);
    };

    if (merchants.length > 0) {
      fetchLogos();
    }
  }, [merchants.join(',')]); // Re-run when merchants list changes

  return logos;
}

export function useMerchantLogo(merchant: string) {
  const [logo, setLogo] = useState<MerchantLogo>({
    merchant,
    logoUrl: null,
    loading: true
  });

  useEffect(() => {
    const fetchLogo = async () => {
      setLogo(prev => ({ ...prev, loading: true }));
      
      try {
        const logoUrl = await fetchMerchantLogo(merchant);
        setLogo({
          merchant,
          logoUrl,
          loading: false
        });
      } catch (error) {
        console.error(`Failed to fetch logo for ${merchant}:`, error);
        setLogo({
          merchant,
          logoUrl: null,
          loading: false
        });
      }
    };

    if (merchant) {
      fetchLogo();
    }
  }, [merchant]);

  return logo;
}