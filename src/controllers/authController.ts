import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
        code: 'EMAIL_ALREADY_EXISTS'
      });
      return;
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'CUSTOMER'
    });

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact customer care.',
        code: 'ACCOUNT_SUSPENDED'
      });
      return;
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          addresses: user.addresses
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const user = await User.findById(req.user.userId)
      .populate('wishlist', 'name slug price compareAtPrice images brand ratings reviewsCount inventory')
      .populate('recentlyViewed', 'name slug price compareAtPrice images brand');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const { firstName, lastName, phone, gender, dateOfBirth, preferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(preferences && { preferences })
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const manageAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const { action, address, addressId } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    if (action === 'add') {
      if (address.isDefault) {
        user.addresses.forEach(a => (a.isDefault = false));
      }
      user.addresses.push(address);
    } else if (action === 'edit' && addressId) {
      const idx = user.addresses.findIndex(a => a._id?.toString() === addressId);
      if (idx !== -1) {
        if (address.isDefault) {
          user.addresses.forEach(a => (a.isDefault = false));
        }
        user.addresses[idx] = { ...user.addresses[idx].toObject(), ...address };
      }
    } else if (action === 'delete' && addressId) {
      user.addresses = user.addresses.filter(a => a._id?.toString() !== addressId);
    } else if (action === 'setDefault' && addressId) {
      user.addresses.forEach(a => {
        a.isDefault = a._id?.toString() === addressId;
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Addresses updated successfully',
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token', code: 'TOKEN_INVALID' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status === 'SUSPENDED') {
      res.status(403).json({ success: false, message: 'Account invalid or suspended', code: 'FORBIDDEN' });
      return;
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};
