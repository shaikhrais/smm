import { jsonResponse, errorResponse, Env } from '../../utils';
import { verifyPassword, signToken } from '../../auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as { email: string; password: string };
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        // Find user
        const user = await env.DB.prepare(
            'SELECT id, email, password_hash, name FROM users WHERE email = ?'
        ).bind(email).first<{ id: string; email: string; password_hash: string; name: string }>();

        if (!user) {
            return errorResponse('Invalid credentials', 401);
        }

        // Verify password
        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return errorResponse('Invalid credentials', 401);
        }

        // Generate token
        const token = await signToken({ userId: user.id, email: user.email });

        return jsonResponse({
            user: { id: user.id, email: user.email, name: user.name },
            token
        });
    } catch (e: any) {
        return errorResponse('Login failed: ' + e.message, 500);
    }
};
