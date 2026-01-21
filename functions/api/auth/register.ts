import { jsonResponse, errorResponse, Env } from '../../utils';
import { hashPassword, signToken } from '../../auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as { email: string; password: string; name?: string };
        const { email, password, name } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        // Check if user already exists
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
            return errorResponse('User already exists', 409);
        }

        // Hash password and create user
        const id = crypto.randomUUID();
        const password_hash = await hashPassword(password);

        await env.DB.prepare(
            'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
        ).bind(id, email, password_hash, name || null).run();

        // Generate token
        const token = await signToken({ userId: id, email });

        return jsonResponse({
            user: { id, email, name },
            token
        }, 201);
    } catch (e: any) {
        return errorResponse('Registration failed: ' + e.message, 500);
    }
};
