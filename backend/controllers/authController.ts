import { Request, Response } from 'express';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: "Missing required parameters: uid and email" });
    }

    const adminEmails = ['elalyzead@gmail.com', 'aymanaamer979@gmail.com'];
    const assignedRole = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || '',
        role: assignedRole,
        balance: 35,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await user.save();

      const initialReward = new Transaction({
        userId: uid,
        amount: 35,
        type: 'reward',
        status: 'completed',
        description: 'هدية ترحيبية عند التسجيل في المنصة',
        createdAt: new Date()
      });
      await initialReward.save();
    } else {
      if (adminEmails.includes(email.toLowerCase()) && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
