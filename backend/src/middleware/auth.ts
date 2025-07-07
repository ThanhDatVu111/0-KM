import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with anon key (we'll use user token in requests)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  supabase?: any;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, but we'll still create a Supabase client with service role
      console.log('No authorization token provided - using service role');
      req.user = undefined;
      // Use service role key for operations that don't require user context
      const serviceSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      req.supabase = serviceSupabase;
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Invalid token:', error);
      req.user = undefined;
      req.supabase = supabase;
      return next();
    }

    // Create a new Supabase client with the user's token
    const userSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Attach user info and Supabase client to request
    req.user = {
      id: user.id,
      email: user.email || '',
    };
    req.supabase = userSupabase;

    console.log('✅ User authenticated:', req.user.id);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.user = undefined;
    req.supabase = supabase;
    next();
  }
}
