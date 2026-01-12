export interface FcmMessage {
    identifier: string;
    type: string;
    deviceId: string;
    text: string;
}

export interface NotificationResult {
    identifier: string;
    deliverAt: string;
}

export function validateFcmMessage(data: unknown): data is FcmMessage {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    const obj = data as Record<string, unknown>;
    return (
        typeof obj.identifier === 'string' &&
        typeof obj.type === 'string' &&
        typeof obj.deviceId === 'string' &&
        typeof obj.text === 'string'
    );
}
