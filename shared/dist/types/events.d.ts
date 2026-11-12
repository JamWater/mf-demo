/** 全局事件表：事件名 → 负载类型。加新事件 = 加一行 */
export interface AppEventMap {
    "order:changed": {
        orderId: string;
        action: "created" | "shipped";
    };
}
/** EventBus 的形状（实现在 common，类型在这里） */
export interface IEventBus {
    on<K extends keyof AppEventMap>(event: K, handler: (payload: AppEventMap[K]) => void): () => void;
    off<K extends keyof AppEventMap>(event: K, handler: (payload: AppEventMap[K]) => void): void;
    emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void;
}
