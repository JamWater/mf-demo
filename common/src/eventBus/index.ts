import type { AppEventMap, IEventBus } from '@mf-demo/shared';

type Handler<K extends keyof AppEventMap> = (payload: AppEventMap[K]) => void;

class EventBus implements IEventBus {
  private handlers: { [K in keyof AppEventMap]?: Set<Handler<K>> } = {};

  on<K extends keyof AppEventMap>(event: K, handler: Handler<K>): () => void {
    (this.handlers[event] ??= new Set()).add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof AppEventMap>(event: K, handler: Handler<K>): void {
    this.handlers[event]?.delete(handler);
  }

  emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void {
    this.handlers[event]?.forEach((h) => h(payload));
  }
}

export const eventBus = new EventBus();
export default eventBus;
