import { useEffect } from 'react';

/**
 * usePageTitle — sets the browser tab title whenever a page mounts
 * @param {string} title
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | MyTripAgency`;
  }, [title]);
}
