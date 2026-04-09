import express from 'express';
import { get } from '../db/database.ts';

const router = express.Router();

router.post('/api/verify', (req, res) => {
    const { licenseKey, extensionSlug } = req.body;

    if (!licenseKey || !extensionSlug) {
        return res.status(400).json({ valid: false, error: 'Missing parameters' });
    }

    const license = get(`
        SELECT l.*, p.name as plan_name, p.type as plan_type 
        FROM licenses l 
        JOIN extensions e ON l.extension_id = e.id 
        JOIN plans p ON l.plan_id = p.id
        WHERE l.license_key = ? AND e.slug = ? AND l.status = 'active'
    `, [licenseKey, extensionSlug]) as any;

    if (!license) {
        return res.json({ valid: false, error: 'Invalid or revoked license' });
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
        return res.json({ valid: false, error: 'License expired' });
    }

    res.json({
        valid: true,
        plan: license.plan_name,
        type: license.plan_type,
        expiresAt: license.expires_at,
        customerEmail: license.customer_email
    });
});

export default router;
