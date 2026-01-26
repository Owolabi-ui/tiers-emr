// Fingerprint Service Client Library
// Communicates with the local TIERS Fingerprint Service via HTTP

const FINGERPRINT_SERVICE_URL = 'http://localhost:3456';

export interface FingerprintDevice {
  detected: boolean;
  deviceName?: string;
  serialNumber?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface FingerprintCaptureResult {
  success: boolean;
  imageData?: string; // base64 (optional, only if include_image is true)
  template: string; // base64
  quality: number; // 0-100
  width: number;
  height: number;
}

export interface FingerprintVerificationResult {
  matched: boolean;
  score: number; // 0-100
}

export interface ScannerStatus {
  connected: boolean;
  device_name: string;
  serial_number: string;
  image_width: number;
  image_height: number;
  image_dpi: number;
}

export class FingerprintService {
  private baseUrl: string;

  constructor(baseUrl: string = FINGERPRINT_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the fingerprint service is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get scanner status and device info
   */
  async getStatus(): Promise<ScannerStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get scanner status');
      }

      const data = await response.json();
      return data.scanner;
    } catch (error) {
      console.error('[Fingerprint] Status check failed:', error);
      return null;
    }
  }

  /**
   * Detect if a fingerprint device is connected
   */
  async detectDevice(): Promise<FingerprintDevice> {
    try {
      const status = await this.getStatus();

      if (!status) {
        return { detected: false };
      }

      return {
        detected: status.connected,
        deviceName: status.device_name,
        serialNumber: status.serial_number,
        imageWidth: status.image_width,
        imageHeight: status.image_height,
      };
    } catch {
      return { detected: false };
    }
  }

  /**
   * Capture a fingerprint from the scanner
   * @param timeoutMs Capture timeout in milliseconds (default: 10000)
   * @param includeImage Whether to include the fingerprint image in response
   */
  async captureFingerprint(
    timeoutMs: number = 10000,
    includeImage: boolean = false
  ): Promise<FingerprintCaptureResult> {
    const response = await fetch(`${this.baseUrl}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeout_ms: timeoutMs,
        include_image: includeImage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to capture fingerprint');
    }

    const data = await response.json();
    return {
      success: data.success,
      imageData: data.data.image,
      template: data.data.template,
      quality: data.data.quality,
      width: data.data.width,
      height: data.data.height,
    };
  }

  /**
   * Verify a captured fingerprint against a stored template
   * @param capturedTemplate Base64-encoded captured template
   * @param storedTemplate Base64-encoded stored template to verify against
   */
  async verifyFingerprint(
    capturedTemplate: string,
    storedTemplate: string
  ): Promise<FingerprintVerificationResult> {
    const response = await fetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        captured_template: capturedTemplate,
        stored_template: storedTemplate,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify fingerprint');
    }

    const data = await response.json();
    return {
      matched: data.result.matched,
      score: data.result.score,
    };
  }

  /**
   * Match two fingerprint templates
   * @param template1 Base64-encoded first template
   * @param template2 Base64-encoded second template
   */
  async matchTemplates(
    template1: string,
    template2: string
  ): Promise<FingerprintVerificationResult> {
    const response = await fetch(`${this.baseUrl}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template1,
        template2,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to match fingerprints');
    }

    const data = await response.json();
    return {
      matched: data.result.matched,
      score: data.result.score,
    };
  }

  /**
   * Check if service is available and scanner is connected
   */
  async isReady(): Promise<boolean> {
    const device = await this.detectDevice();
    return device.detected;
  }
}

// Singleton instance
let serviceInstance: FingerprintService | null = null;

export function getFingerprintService(): FingerprintService {
  if (!serviceInstance) {
    serviceInstance = new FingerprintService();
  }
  return serviceInstance;
}

// Legacy export for backward compatibility
export const FingerprintBridge = FingerprintService;
export const getFingerprintBridge = getFingerprintService;
