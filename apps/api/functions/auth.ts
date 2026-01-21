import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// JWT Secret - in production, use environment variable
const JWT_SECRET = new TextEncoder().encode('smm-secret-key-change-in-production');

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: string; email: string }): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { userId: string; email: string };
    } catch {
        return null;
    }
}

export function getAuthToken(request: Request): string | null {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return null;
    }
    return auth.slice(7);
}
