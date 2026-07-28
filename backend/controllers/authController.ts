// @ts-nocheck
import { Request, Response } from 'express';
import { userService } from '../services/userService';

export interface AuthRequest extends Request {
  user?: any;
}

export const syncUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: "Missing required parameters: uid and email" });
    }

    const isAdminClaim = req.user?.admin === true;
    const user = await userService.syncUser({ uid, email, displayName, photoURL, isAdminClaim });
    res.json(user);
  } catch (error: any) {
    console.error("Error in auth sync:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
