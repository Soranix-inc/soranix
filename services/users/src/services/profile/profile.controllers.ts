import { Request, Response } from 'express';

import { asyncHandler } from '@packages/errors';
import { systemLogger } from '@packages/logging';

class ProfileControllers {
  /**
   * Get authenticated user's own profile
   */
  getMyProfile = asyncHandler(async (req: Request, res: Response) => {
    // User context is provided by gateway via headers (X-User-Id, etc.)
    const authenticatedUser = req.user!;

    systemLogger.info('Fetching own profile', {
      userId: authenticatedUser.userId,
    });

    // TODO: Fetch profile from database
    // const profile = await db.profiles.findById(authenticatedUser.userId);

    res.status(200).json({
      success: true,
      data: {
        userId: authenticatedUser.userId,
        email: authenticatedUser.email,
        // TODO: Add more profile fields from database
        message: 'Profile retrieved successfully',
      },
    });
  });

  /**
   * Get profile by user ID
   * Can only view own profile unless admin
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const authenticatedUser = req.user!;

    // Check if user is trying to access their own profile or is admin
    if (userId !== authenticatedUser.userId && !authenticatedUser.roles?.includes('admin')) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized to view this profile',
      });
      return;
    }

    systemLogger.info('Fetching profile', {
      requestedUserId: userId,
      authenticatedUserId: authenticatedUser.userId,
    });

    // TODO: Fetch profile from database
    // const profile = await db.profiles.findById(userId);

    res.status(200).json({
      success: true,
      data: {
        userId,
        message: 'Profile retrieved successfully',
      },
    });
  });

  /**
   * Update authenticated user's own profile
   */
  updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
    const authenticatedUser = req.user!;
    const updates = req.body;

    systemLogger.info('Updating own profile', {
      userId: authenticatedUser.userId,
      updates: Object.keys(updates),
    });

    // TODO: Update profile in database
    // const updatedProfile = await db.profiles.update(authenticatedUser.userId, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId: authenticatedUser.userId,
        // TODO: Return updated profile from database
      },
    });
  });

  /**
   * Update profile by user ID (admin only)
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const authenticatedUser = req.user!;
    const updates = req.body;

    // Check if user is trying to update their own profile or is admin
    if (userId !== authenticatedUser.userId && !authenticatedUser.roles?.includes('admin')) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized to update this profile',
      });
      return;
    }

    systemLogger.info('Updating profile', {
      requestedUserId: userId,
      authenticatedUserId: authenticatedUser.userId,
      updates: Object.keys(updates),
    });

    // TODO: Update profile in database
    // const updatedProfile = await db.profiles.update(userId, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId,
        // TODO: Return updated profile from database
      },
    });
  });

  /**
   * Delete profile (admin only)
   */
  deleteProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const authenticatedUser = req.user!;

    // Only admins can delete profiles
    if (!authenticatedUser.roles?.includes('admin')) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized. Admin access required.',
      });
      return;
    }

    systemLogger.warn('Deleting profile', {
      requestedUserId: userId,
      authenticatedUserId: authenticatedUser.userId,
    });

    // TODO: Delete profile from database
    // await db.profiles.delete(userId);

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully',
    });
  });
}

export default ProfileControllers;
