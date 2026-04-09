import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    console.log('Auth check:', {
        hasSession: !!req.session,
        isAdmin: req.session ? (req.session as any).isAdmin : false,
        path: req.path
    });
    if (req.session && (req.session as any).isAdmin) {
        return next();
    }
    console.log('Auth failed, redirecting to /login');
    res.redirect('/login');
}
