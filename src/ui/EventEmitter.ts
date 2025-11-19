/**
 * EventEmitter for slot engine events
 * Simple pub/sub system for game events
 */

export type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all listeners for an event or all events
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get count of listeners for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
}
