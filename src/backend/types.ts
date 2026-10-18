export type Unsubscribe = () => void;

export interface TransactionResult<T> {
  committed: boolean;
  value: T | null;
}

/**
 * 平台用到的最小資料庫介面。Firebase 與本機示範模式各實作一份，
 * 其他程式碼只依賴這個介面，之後要換成別的服務也只需新增一個實作。
 */
export interface Backend {
  readonly kind: 'firebase' | 'local';
  get<T>(path: string): Promise<T | null>;
  set(path: string, value: unknown): Promise<void>;
  remove(path: string): Promise<void>;
  /**
   * 原子性地讀取、修改、寫入。fn 回傳 undefined 代表放棄這次寫入。
   * fn 可能被呼叫多次（資料被別人改掉時會重試），所以必須是純函式。
   */
  transaction<T>(
    path: string,
    fn: (current: T | null) => T | null | undefined,
  ): Promise<TransactionResult<T>>;
  subscribe<T>(path: string, cb: (value: T | null) => void): Unsubscribe;
  /** 斷線（關閉分頁、網路中斷）時由伺服器寫入 value。 */
  onDisconnectSet(path: string, value: unknown): Promise<void>;
  cancelOnDisconnect(path: string): Promise<void>;
  /** 監聽連線狀態，重新連上時可以重新登記自己在線上。 */
  onConnectionChange(cb: (connected: boolean) => void): Unsubscribe;
}
