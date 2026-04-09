import express from 'express';
import { requireAuth } from '../middleware/auth.ts';
import db, { get } from '../db/database.ts';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('landing', { layout: false });
});

router.get('/dashboard', requireAuth, (req, res) => {
    const stats = {
        extensionsCount: (get('SELECT COUNT(*) as count FROM extensions') as any).count,
        totalRevenue: (get("SELECT SUM(amount) as total FROM payments WHERE status = 'successful'") as any).total || 0,
        activeLicenses: (get("SELECT COUNT(*) as count FROM licenses WHERE status = 'active'") as any).count,
        recentPayments: db.prepare('SELECT * FROM payments ORDER BY paid_at DESC LIMIT 5').all()
    };
    res.render('dashboard', { stats });
});

router.get('/extensions', requireAuth, (req, res) => {
    const extensions = db.prepare('SELECT * FROM extensions ORDER BY created_at DESC').all();
    const extensionsWithPlans = extensions.map((ext: any) => {
        return {
            ...ext,
            plans: db.prepare('SELECT * FROM plans WHERE extension_id = ?').all([ext.id])
        };
    });
    res.render('extensions', { extensions: extensionsWithPlans, appUrl: process.env.APP_URL || '' });
});

router.get('/extensions/:id', requireAuth, (req, res) => {
    const extension = get('SELECT * FROM extensions WHERE id = ?', [req.params.id]);
    if (!extension) return res.status(404).send('Extension not found');

    const plans = db.prepare('SELECT * FROM plans WHERE extension_id = ?').all([req.params.id]);
    const licenses = db.prepare('SELECT * FROM licenses WHERE extension_id = ? ORDER BY created_at DESC LIMIT 50').all([req.params.id]);

    res.render('extension-detail', { extension, plans, licenses });
});

router.get('/snippets', requireAuth, (req, res) => {
    const extensions = db.prepare('SELECT * FROM extensions').all();
    const extensionsWithPlans = extensions.map((ext: any) => {
        return {
            ...ext,
            plans: db.prepare('SELECT * FROM plans WHERE extension_id = ?').all([ext.id])
        };
    });
    res.render('snippets', { extensions: extensionsWithPlans, appUrl: process.env.APP_URL || '' });
});

router.get('/settings', requireAuth, (req, res) => {
    res.render('settings');
});

router.get('/docs', requireAuth, (req, res) => {
    res.render('docs');
});

export default router;
