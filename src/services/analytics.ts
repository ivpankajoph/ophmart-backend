export type AnalyticsEventType =
  | 'product_view'
  | 'product_search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'checkout_started'
  | 'purchase';

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  userId?: string;
  anonymousId?: string;
  timestamp: Date;
  payload: Record<string, any>;
}

export class AnalyticsService {
  private static eventsLog: AnalyticsEvent[] = [];

  static track(eventType: AnalyticsEventType, payload: Record<string, any>, userId?: string): void {
    const event: AnalyticsEvent = {
      eventType,
      userId,
      timestamp: new Date(),
      payload
    };

    // Store in-memory buffer / send to Segment/GA4/Mixpanel in production
    this.eventsLog.push(event);
    if (this.eventsLog.length > 500) {
      this.eventsLog.shift(); // keep sliding window
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Tracked: ${eventType}`, payload);
    }
  }

  static getRecentEvents(limit = 50): AnalyticsEvent[] {
    return this.eventsLog.slice(-limit);
  }
}
