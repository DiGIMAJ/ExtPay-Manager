import express from 'express';

const router = express.Router();

router.get('/login', (req, res) => {
    if ((req.session as any).isAdmin) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null, layout: false });
});

router.post('/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    console.log('Login attempt:', { 
        hasPassword: !!password, 
        matches: password === adminPassword,
        envSet: !!process.env.ADMIN_PASSWORD
    });

    if (password === adminPassword) {
        console.log('Login successful, setting session...');
        (req.session as any).isAdmin = true;
        res.redirect('/dashboard');
    } else {
        console.log('Login failed: Invalid password');
        res.render('login', { error: 'Invalid password', layout: false });
    }
});

router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

export default router;
