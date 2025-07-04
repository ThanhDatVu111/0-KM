// Minimal Socket.IO Yjs provider for React Native/Expo
import * as Y from 'yjs';
import { io, Socket } from 'socket.io-client';

export class YSocketIOProvider {
  public doc: Y.Doc;
  public socket: Socket;
  public entryId: string;
  private _onUpdate: (update: Uint8Array) => void;

  constructor(serverUrl: string, entryId: string, doc: Y.Doc) {
    this.doc = doc;
    this.entryId = entryId;
    this.socket = io(serverUrl, { transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.socket.emit('join-entry', entryId);
      // Request initial state from server
      this.socket.emit('request-initial-state', entryId);
    });

    // Receive Yjs updates from server
    this.socket.on('yjs-update', (update: Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(update));
    });

    // Receive initial state from server
    this.socket.on('yjs-initial-state', (state: Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(state));
    });

    // Send local Yjs updates to server
    this._onUpdate = (update: Uint8Array) => {
      this.socket.emit('yjs-update', update);
    };
    this.doc.on('update', this._onUpdate);
  }

  destroy() {
    this.doc.off('update', this._onUpdate);
    this.socket.disconnect();
  }
}
