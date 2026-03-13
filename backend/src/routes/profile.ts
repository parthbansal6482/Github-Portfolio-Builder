import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { RESERVED_SUBDOMAINS } from '../constants.js';

const router = Router();

// POST /api/profile/create — called by NextAuth signIn callback
// Creates or upserts a profile row for the user
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { userId, githubUsername } = req.body as {
      userId: string;
      githubUsername: string;
    };

    if (!userId || !githubUsername) {
      res.status(400).json({
        error: {
          message: 'userId and githubUsername are required',
          code: 'MISSING_FIELDS',
          status: 400,
        },
      });
      return;
    }

    // Check if the GitHub username is a reserved subdomain
    const usernameLower = githubUsername.toLowerCase();
    if (RESERVED_SUBDOMAINS.includes(usernameLower as typeof RESERVED_SUBDOMAINS[number])) {
      res.status(409).json({
        error: {
          message: `"${githubUsername}" is a reserved subdomain. Please choose a custom username.`,
          code: 'RESERVED_SUBDOMAIN',
          status: 409,
        },
        reserved: true,
      });
      return;
    }

    // Upsert the profile row
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          username: usernameLower,
          github_username: githubUsername,
        },
        {
          onConflict: 'id',
        }
      )
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation on username
      if (error.code === '23505' && error.message.includes('username')) {
        res.status(409).json({
          error: {
            message: `Username "${githubUsername}" is already taken.`,
            code: 'USERNAME_TAKEN',
            status: 409,
          },
        });
        return;
      }

      console.error('Profile upsert error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create profile',
          code: 'DB_ERROR',
          status: 500,
        },
      });
      return;
    }

    res.status(200).json({ profile: data });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        status: 500,
      },
    });
  }
});

// POST /api/profile/update-username — called from the custom username picker
// Updates the username for an existing profile
router.post('/update-username', async (req: Request, res: Response) => {
  try {
    const { userId, username, githubUsername } = req.body as {
      userId: string;
      username: string;
      githubUsername?: string;
    };

    if (!userId || !username) {
      res.status(400).json({
        error: {
          message: 'userId and username are required',
          code: 'MISSING_FIELDS',
          status: 400,
        },
      });
      return;
    }

    const usernameLower = username.toLowerCase().trim();

    // Validate format
    if (usernameLower.length < 3 || usernameLower.length > 39) {
      res.status(400).json({
        error: {
          message: 'Username must be between 3 and 39 characters',
          code: 'INVALID_USERNAME',
          status: 400,
        },
      });
      return;
    }

    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(usernameLower)) {
      res.status(400).json({
        error: {
          message: 'Only lowercase letters, numbers, and hyphens allowed',
          code: 'INVALID_USERNAME',
          status: 400,
        },
      });
      return;
    }

    // Check reserved
    if (RESERVED_SUBDOMAINS.includes(usernameLower as typeof RESERVED_SUBDOMAINS[number])) {
      res.status(409).json({
        error: {
          message: `"${username}" is a reserved subdomain.`,
          code: 'RESERVED_SUBDOMAIN',
          status: 409,
        },
      });
      return;
    }

    // Upsert the profile — handles the case where profile/create was skipped
    // (e.g. GitHub username was a reserved subdomain, so no row was ever inserted)
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          username: usernameLower,
          github_username: githubUsername || usernameLower,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({
          error: {
            message: `Username "${username}" is already taken.`,
            code: 'USERNAME_TAKEN',
            status: 409,
          },
        });
        return;
      }

      console.error('Username update error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update username',
          code: 'DB_ERROR',
          status: 500,
        },
      });
      return;
    }

    res.status(200).json({ profile: data });
  } catch (error) {
    console.error('Username update error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        status: 500,
      },
    });
  }
});

export default router;
