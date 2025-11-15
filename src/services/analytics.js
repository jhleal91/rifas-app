/**
 * Analytics Service
 * Centralized tracking for user events and page views
 */

class AnalyticsService {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.eventQueue = [];
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  // Track page views
  trackPageView(pageName, pageData = {}) {
    const event = {
      type: 'page_view',
      page: pageName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...pageData
    };

    this.logEvent(event);
    this.sendToAnalytics(event);
  }

  // Track user events
  trackEvent(eventName, eventData = {}) {
    const event = {
      type: 'event',
      name: eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...eventData
    };

    this.logEvent(event);
    this.sendToAnalytics(event);
  }

  // Track conversions
  trackConversion(conversionType, value = null, currency = 'MXN') {
    const event = {
      type: 'conversion',
      conversionType,
      value,
      currency,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.logEvent(event);
    this.sendToAnalytics(event);
  }

  // Track errors
  trackError(error, errorInfo = {}) {
    const event = {
      type: 'error',
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...errorInfo
    };

    this.logEvent(event);
    this.sendToAnalytics(event);
  }

  // Log event locally (for debugging)
  logEvent(event) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }
  }

  // Send to analytics service
  sendToAnalytics(event) {
    if (!this.isEnabled) {
      return;
    }

    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      if (event.type === 'page_view') {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          page_path: event.page,
          page_title: event.page
        });
      } else if (event.type === 'event') {
        window.gtag('event', event.name, {
          ...event
        });
      } else if (event.type === 'conversion') {
        window.gtag('event', 'conversion', {
          send_to: `AW-CONVERSION_ID/${event.conversionType}`,
          value: event.value,
          currency: event.currency
        });
      }
    }

    // Custom analytics endpoint (optional)
    // You can send events to your own backend
    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      }).catch(err => {
        console.error('Analytics tracking error:', err);
      });
    } catch (error) {
      // Silently fail if analytics endpoint doesn't exist
    }
  }

  // Common event tracking helpers
  trackRifaCreated(rifaId, rifaName) {
    this.trackEvent('rifa_created', { rifaId, rifaName });
    this.trackConversion('rifa_created', null);
  }

  trackRifaParticipated(rifaId, rifaName, numberOfTickets) {
    this.trackEvent('rifa_participated', { 
      rifaId, 
      rifaName, 
      numberOfTickets 
    });
  }

  trackRifaViewed(rifaId, rifaName) {
    this.trackEvent('rifa_viewed', { rifaId, rifaName });
  }

  trackAdClick(adId, adName, placement) {
    this.trackEvent('ad_clicked', { adId, adName, placement });
  }

  trackAdImpression(adId, adName, placement) {
    this.trackEvent('ad_impression', { adId, adName, placement });
  }

  trackUserRegistered(userId) {
    this.trackEvent('user_registered', { userId });
    this.trackConversion('user_registered', null);
  }

  trackUserLoggedIn(userId) {
    this.trackEvent('user_logged_in', { userId });
  }

  trackSearch(searchTerm, resultsCount) {
    this.trackEvent('search_performed', { searchTerm, resultsCount });
  }

  trackFilterApplied(filterType, filterValue) {
    this.trackEvent('filter_applied', { filterType, filterValue });
  }
}

// Export singleton instance
const analytics = new AnalyticsService();
export default analytics;

