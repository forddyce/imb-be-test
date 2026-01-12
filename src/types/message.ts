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

export function validateFcmMessage(data: any): data is FcmMessage {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.identifier === 'string' &&
        typeof data.type === 'string' &&
        typeof data.deviceId === 'string' &&
        typeof data.text === 'string'
    );
}
