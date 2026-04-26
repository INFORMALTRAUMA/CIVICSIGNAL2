import { NextRequest } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import middleware from './middleware';

// Mock the Clerk client
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
  auth: jest.fn(),
  clerkMiddleware: jest.fn((handler) => handler),
  createRouteMatcher: jest.fn((paths) => (req: Request) => 
    paths.some((path: string) => new URL(req.url).pathname.startsWith(path.replace('(.*)', '')))
  ),
}));

describe('Middleware', () => {
  const mockAuth = {
    sessionClaims: {
      publicMetadata: {
        role: 'citizen',
      },
    },
    userId: 'test-user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access to public routes without authentication', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/citizen-auth/login'), {
      headers: new Headers(),
    });
    const res = await middleware(
      { auth: () => Promise.resolve(mockAuth) },
      { request: req, params: {} }
    );
    
    expect(res).toBeUndefined(); // No response means the request continues
  });

  it('should redirect unauthenticated users to sign-in', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/citizen/dashboard'), {
      headers: new Headers(),
    });
    const res = await middleware(
      { auth: () => Promise.resolve({ ...mockAuth, userId: null }) },
      { request: req, params: {} }
    );
    
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/sign-in');
  });

  it('should allow access to citizen routes for citizen users', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/citizen/dashboard'), {
      headers: new Headers(),
    });
    const res = await middleware(
      { auth: () => Promise.resolve(mockAuth) },
      { request: req, params: {} }
    );
    
    expect(res).toBeUndefined(); // No response means the request continues
  });

  it('should redirect non-citizen users from citizen routes', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/citizen/dashboard'), {
      headers: new Headers(),
    });
    const res = await middleware(
      {
        auth: () => Promise.resolve({
          ...mockAuth,
          sessionClaims: {
            publicMetadata: {
              role: 'government',
            },
          },
        })
      },
      { request: req, params: {} }
    );
    
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/gov/dashboard');
  });
});
