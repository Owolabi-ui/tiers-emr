// Fingerprint Bridge Client Library
export interface FingerprintDevice {
  detected: boolean;
  deviceName?: string;
  serialNumber?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface FingerprintCaptureResult {
  success: boolean;
  imageData: string; // base64
  template: string; // base64
  quality: number; // 0-100
  width: number;
  height: number;
}

export interface FingerprintVerificationResult {
  matched: boolean;
  score: number; // 0-1
  rawScore: number;
}

export class FingerprintBridge {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 3000;
  private isConnecting: boolean = false;

  constructor(url: string = 'ws://localhost:9876') {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[Fingerprint] Connected to bridge');
          this.isConnecting = false;
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('[Fingerprint] Connection error:', error);
          this.isConnecting = false;
          reject(new Error('Failed to connect to fingerprint bridge. Make sure the bridge server is running.'));
        };

        this.ws.onclose = () => {
          console.log('[Fingerprint] Disconnected from bridge');
          this.isConnecting = false;
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async sendCommand<T>(command: any): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, 30000); // 30 second timeout

      const handleMessage = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);

          // Ignore connection messages
          if (response.type === 'CONNECTED') {
            return;
          }

          clearTimeout(timeout);
          this.ws?.removeEventListener('message', handleMessage);

          if (response.error || response.type?.includes('ERROR')) {
            reject(new Error(response.error || 'Unknown error'));
          } else {
            resolve(response as T);
          }
        } catch (error) {
          clearTimeout(timeout);
          this.ws?.removeEventListener('message', handleMessage);
          reject(error);
        }
      };

      this.ws?.addEventListener('message', handleMessage);
      this.ws?.send(JSON.stringify(command));
    });
  }

  async detectDevice(): Promise<FingerprintDevice> {
    const response = await this.sendCommand<{ type: string } & FingerprintDevice>({
      action: 'DETECT_DEVICE'
    });
    return {
      detected: response.detected,
      deviceName: response.deviceName,
      serialNumber: response.serialNumber,
      imageWidth: response.imageWidth,
      imageHeight: response.imageHeight,
    };
  }

  async captureFingerprint(minQuality: number = 50): Promise<FingerprintCaptureResult> {
    const response = await this.sendCommand<{ type: string } & FingerprintCaptureResult>({
      action: 'CAPTURE_FINGERPRINT',
      quality: minQuality
    });
    return {
      success: response.success,
      imageData: response.imageData,
      template: response.template,
      quality: response.quality,
      width: response.width,
      height: response.height,
    };
  }

  async verifyFingerprint(template: string): Promise<FingerprintVerificationResult> {
    const response = await this.sendCommand<{ type: string } & FingerprintVerificationResult>({
      action: 'VERIFY_FINGERPRINT',
      template
    });
    return {
      matched: response.matched,
      score: response.score,
      rawScore: response.rawScore,
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let bridgeInstance: FingerprintBridge | null = null;

export function getFingerprintBridge(): FingerprintBridge {
  if (!bridgeInstance) {
    bridgeInstance = new FingerprintBridge();
  }
  return bridgeInstance;
}
