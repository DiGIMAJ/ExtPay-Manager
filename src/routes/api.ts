import express from 'express';
import { requireAuth } from '../middleware/auth.ts';
import db, { run } from '../db/database.ts';

const router = express.Router();

// Extensions CRUD
router.post('/extensions', requireAuth, (req, res) => {
    const { name, slug, description, icon_url } = req.body;
    try {
        run('INSERT INTO extensions (name, slug, description, icon_url) VALUES (?, ?, ?, ?)', [name, slug, description, icon_url]);
        res.redirect('/extensions');
    } catch (err) {
        res.status(400).send('Error creating extension: ' + (err as Error).message);
    }
});

router.post('/extensions/:id/delete', requireAuth, (req, res) => {
    run('DELETE FROM extensions WHERE id = ?', [req.params.id]);
    res.redirect('/extensions');
});

// Plans
router.post('/extensions/:id/plans', requireAuth, (req, res) => {
    const { name, type, price, currency } = req.body;
    run('INSERT INTO plans (extension_id, name, type, price, currency) VALUES (?, ?, ?, ?, ?)', 
        [req.params.id, name, type, price, currency]);
    res.redirect(`/extensions/${req.params.id}`);
});

router.post('/plans/:id/delete', requireAuth, (req, res) => {
    const plan = db.prepare('SELECT extension_id FROM plans WHERE id = ?').get([req.params.id]) as any;
    run('DELETE FROM plans WHERE id = ?', [req.params.id]);
    res.redirect(`/extensions/${plan.extension_id}`);
});

// Licenses
router.post('/licenses/:id/revoke', requireAuth, (req, res) => {
    run("UPDATE licenses SET status = 'revoked' WHERE id = ?", [req.params.id]);
    const license = db.prepare('SELECT extension_id FROM licenses WHERE id = ?').get([req.params.id]) as any;
    res.redirect(`/extensions/${license.extension_id}`);
});

export default router;
