import { SensorMessage, SensorMessageSchema } from "../(types)/sensor";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface WSClientOptions {
  url: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  onMessage?: (message: SensorMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

export class WSClient {
  private ws: WebSocket | null = null;
  private options: Required<WSClientOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private status: ConnectionStatus = "disconnected";
  private isManuallyDisconnected = false;

  constructor(options: WSClientOptions) {
    this.options = {
      maxReconnectAttempts: 5,
      reconnectDelay: 2000,
      onMessage: () => {},
      onStatusChange: () => {},
      onError: () => {},
      ...options,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManuallyDisconnected = false;
    this.setStatus("connecting");

    try {
      this.ws = new WebSocket(this.options.url);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(new Error(`Failed to create WebSocket: ${error}`));
    }
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus("disconnected");
  }

  send(data: object): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        this.handleError(new Error(`Failed to send message: ${error}`));
        return false;
      }
    }
    return false;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setStatus("connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      this.ws = null;

      if (!this.isManuallyDisconnected) {
        this.setStatus("error");
        this.attemptReconnect();
      } else {
        this.setStatus("disconnected");
      }
    };

    this.ws.onerror = () => {
      this.setStatus("error");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const message = SensorMessageSchema.parse(data);
        this.options.onMessage(message);
      } catch (error) {
        this.handleError(new Error(`Invalid message format: ${error}`));
      }
    };
  }

  private attemptReconnect(): void {
    if (
      this.isManuallyDisconnected ||
      this.reconnectAttempts >= this.options.maxReconnectAttempts
    ) {
      this.setStatus("disconnected");
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      if (!this.isManuallyDisconnected) {
        this.connect();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.options.onStatusChange(status);
    }
  }

  private handleError(error: Error): void {
    this.options.onError(error);
  }
}

/**
 * Create a WebSocket client with default configuration
 */
export function createWSClient(
  onMessage: (message: SensorMessage) => void,
  onStatusChange?: (status: ConnectionStatus) => void,
  onError?: (error: Error) => void
): WSClient {
  const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787/ws";

  return new WSClient({
    url,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    onMessage,
    onStatusChange: onStatusChange || (() => {}),
    onError: onError || ((error) => console.error("WebSocket error:", error)),
  });
}
