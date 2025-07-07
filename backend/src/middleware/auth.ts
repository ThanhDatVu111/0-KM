import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Initialize Supabase with anon key (same as utils/supabase.ts)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  supabase?: any;
}

// Function to decode JWT without verification (for Clerk tokens)
function decodeJwtWithoutVerification(token: string) {
  try {
    // Split the token and get the payload part
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, use service role if available, otherwise use anon key
      console.log('No authorization token provided - using service role if available');
      req.user = undefined;
      const serviceRoleSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        : supabase;
      req.supabase = serviceRoleSupabase;
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Decode the Clerk JWT token to extract user information
      const decodedToken = decodeJwtWithoutVerification(token);

      if (decodedToken && decodedToken.sub) {
        // Extract user information from the token
        req.user = {
          id: decodedToken.sub, // Clerk user ID
          email: decodedToken.email || '',
        };
        console.log('✅ User authenticated from token:', req.user.id);
      } else {
        console.log('No valid user info in token');
        req.user = undefined;
      }

      // Use service role if available, otherwise use anon key
      const serviceRoleSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        : supabase;
      req.supabase = serviceRoleSupabase;
      return next();
    } catch (jwtError) {
      console.log('JWT decoding failed:', jwtError);
      req.user = undefined;
      const serviceRoleSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        : supabase;
      req.supabase = serviceRoleSupabase;
      return next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.user = undefined;
    const serviceRoleSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : supabase;
    req.supabase = serviceRoleSupabase;
    next();
  }
}
