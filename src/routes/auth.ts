import express from 'express';

const router = express.Router();

router.get('/login', (req, res) => {
    res.redirect('/dashboard');
});

router.post('/login', (req, res) => {
    res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
    res.redirect('/');
});

export default router;
