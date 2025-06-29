export interface ClientToServerEvents {
  message: (message: string) => void;
}

export interface ServerToClientEvents {
  message: (message: string) => void;
}

export interface InterServerEvents {}

export interface SocketData {}