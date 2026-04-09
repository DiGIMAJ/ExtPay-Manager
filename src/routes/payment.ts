import express from 'express';
import { createPaymentLink, verifyTransaction, verifyWebhookSignature } from '../utils/flutterwave.ts';
import { generateLicenseKey } from '../utils/license.ts';
import db, { get, run } from '../db/database.ts';

const router = express.Router();

router.post('/pay/init', async (req, res) => {
    const { planId, email } = req.body;
    
    const plan = get('SELECT p.*, e.name as ext_name, e.slug as ext_slug FROM plans p JOIN extensions e ON p.extension_id = e.id WHERE p.id = ?', [planId]) as any;
    if (!plan) return res.status(404).json({ status: 'error', message: 'Plan not found' });

    const tx_ref = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
        const paymentData = {
            tx_ref,
            amount: plan.price,
            currency: plan.currency || 'USD',
            redirect_url: `${process.env.APP_URL}/pay/callback`,
            customer: {
                email: email,
                name: email.split('@')[0]
            },
            meta: {
                planId,
                extensionId: plan.extension_id,
                email
            },
            customizations: {
                title: `${plan.ext_name} - ${plan.name}`,
                description: `Payment for ${plan.ext_name} license`,
                logo: plan.icon_url || ''
            }
        };

        const result = await createPaymentLink(paymentData);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to initialize payment' });
    }
});

router.get('/pay/callback', async (req, res) => {
    const { transaction_id, status, tx_ref } = req.query;

    if (status === 'successful') {
        try {
            const verification = await verifyTransaction(transaction_id as string);
            if (verification.status === 'success' && verification.data.status === 'successful') {
                const { planId, extensionId, email } = verification.data.meta;
                
                // Check if payment already processed
                const existingPayment = get('SELECT id FROM payments WHERE flw_transaction_id = ?', [transaction_id]);
                if (!existingPayment) {
                    const licenseKey = generateLicenseKey();
                    
                    // Determine expiration
                    let expiresAt = null;
                    const plan = get('SELECT type FROM plans WHERE id = ?', [planId]) as any;
                    if (plan.type === 'monthly') {
                        expiresAt = new Date();
                        expiresAt.setMonth(expiresAt.getMonth() + 1);
                    } else if (plan.type === 'yearly') {
                        expiresAt = new Date();
                        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                    }

                    const licenseResult = run(
                        'INSERT INTO licenses (license_key, extension_id, plan_id, customer_email, expires_at) VALUES (?, ?, ?, ?, ?)',
                        [licenseKey, extensionId, planId, email, expiresAt ? expiresAt.toISOString() : null]
                    );

                    run(
                        'INSERT INTO payments (license_id, flw_transaction_id, amount, currency, status) VALUES (?, ?, ?, ?, ?)',
                        [licenseResult.lastInsertRowid, transaction_id, verification.data.amount, verification.data.currency, 'successful']
                    );

                    return res.render('payment-success', { licenseKey, email, layout: false });
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    res.render('payment-failed', { layout: false });
});

router.post('/webhooks/flutterwave', async (req, res) => {
    const signature = req.headers['verif-hash'] as string;
    if (!verifyWebhookSignature(signature, req.body)) {
        return res.status(401).send('Invalid signature');
    }

    const { status, id, amount, currency, customer, meta } = req.body.data || req.body;
    
    if (status === 'successful') {
        // Similar logic to callback for redundancy
        const existingPayment = get('SELECT id FROM payments WHERE flw_transaction_id = ?', [id]);
        if (!existingPayment) {
            const { planId, extensionId, email } = meta;
            const licenseKey = generateLicenseKey();
            
            let expiresAt = null;
            const plan = get('SELECT type FROM plans WHERE id = ?', [planId]) as any;
            if (plan.type === 'monthly') {
                expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + 1);
            } else if (plan.type === 'yearly') {
                expiresAt = new Date();
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            }

            const licenseResult = run(
                'INSERT INTO licenses (license_key, extension_id, plan_id, customer_email, expires_at) VALUES (?, ?, ?, ?, ?)',
                [licenseKey, extensionId, planId, email || customer.email, expiresAt ? expiresAt.toISOString() : null]
            );

            run(
                'INSERT INTO payments (license_id, flw_transaction_id, amount, currency, status) VALUES (?, ?, ?, ?, ?)',
                [licenseResult.lastInsertRowid, id, amount, currency, 'successful']
            );
        }
    }

    res.status(200).send('Webhook received');
});

export default router;
