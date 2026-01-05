import { useState, useEffect } from 'react';

const STORAGE_KEY = 'disclaimer_accepted';

export function useDisclaimer() {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setAccepted(stored === 'true');
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setAccepted(true);
  };

  return { accepted, accept };
}


