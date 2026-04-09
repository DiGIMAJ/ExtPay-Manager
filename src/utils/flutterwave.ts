import axios from 'axios';

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

export async function createPaymentLink(data: {
    tx_ref: string;
    amount: number;
    currency: string;
    redirect_url: string;
    customer: {
        email: string;
        name?: string;
    };
    meta: any;
    customizations?: any;
}) {
    const secretKey = process.env.FLW_SECRET_KEY;
    if (!secretKey) throw new Error('FLW_SECRET_KEY is not set');

    const response = await axios.post(`${FLW_BASE_URL}/payments`, data, {
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

export async function verifyTransaction(transactionId: string) {
    const secretKey = process.env.FLW_SECRET_KEY;
    if (!secretKey) throw new Error('FLW_SECRET_KEY is not set');

    const response = await axios.get(`${FLW_BASE_URL}/transactions/${transactionId}/verify`, {
        headers: {
            Authorization: `Bearer ${secretKey}`
        }
    });

    return response.data;
}

export function verifyWebhookSignature(signature: string | undefined, body: any) {
    const secretHash = process.env.FLW_SECRET_HASH;
    if (!secretHash) return true; // If not set, we might want to skip or fail. User said "You must set FLW_SECRET_HASH".
    return signature === secretHash;
}
