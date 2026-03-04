/**
 * GA4 event tracking for PerfectASIN Chrome Extension.
 * Uses the Measurement Protocol to send events from the extension context
 * where gtag.js cannot run directly.
 */

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

let measurementId = '';
let clientId = '';

async function getOrCreateClientId(): Promise<string> {
  if (clientId) return clientId;
  try {
    const result = await chrome.storage.local.get(['ga4_client_id']);
    if (result.ga4_client_id) {
      clientId = result.ga4_client_id;
    } else {
      clientId = crypto.randomUUID();
      await chrome.storage.local.set({ ga4_client_id: clientId });
    }
  } catch {
    clientId = crypto.randomUUID();
  }
  return clientId;
}

export function initAnalytics(id: string): void {
  measurementId = id;
}

export async function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  if (!measurementId) return;

  try {
    const cid = await getOrCreateClientId();

    const body = {
      client_id: cid,
      events: [
        {
          name,
          params: {
            engagement_time_msec: '100',
            ...params,
          },
        },
      ],
    };

    // Fire-and-forget — don't block UI on analytics
    fetch(`${GA4_ENDPOINT}?measurement_id=${measurementId}&api_secret=dLEjzLXPR6esv1Sb5O5gvg`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).catch(() => {
      // Silently ignore analytics failures
    });
  } catch {
    // Never let analytics break the app
  }
}
