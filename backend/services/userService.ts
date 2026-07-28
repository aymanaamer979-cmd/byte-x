// @ts-nocheck
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { currencySetter } from '../config/db';

export const userService = {
  async getUserByUid(uid: string) {
    return await User.findOne({ uid });
  },

  async getAllUsers() {
    return await User.find({}).sort({ createdAt: -1 });
  },

  async updateProfile(uid: string, data: { displayName?: string, phone?: string }) {
    const updateData: any = { ...data, updatedAt: new Date() };
    return await User.findOneAndUpdate({ uid }, { $set: updateData }, { new: true });
  },

  async updatePresence(uid: string, isOnline: boolean) {
    return await User.findOneAndUpdate(
      { uid },
      { $set: { isOnline, lastSeen: new Date(), updatedAt: new Date() } },
      { new: true }
    );
  },

  /**
   * تحديث مالي موحد (رصيد، استثمارات، أرباح) مع إنشاء سجل معاملة آلياً
   */
  async updateFinancials(uid: string, params: {
    amount: number,
    type: 'deposit' | 'withdraw' | 'reward' | 'investment' | 'profit',
    status?: 'pending' | 'completed' | 'failed',
    description: string,
    isManualAdminUpdate?: boolean
  }) {
    const { amount, type, status = 'completed', description, isManualAdminUpdate = false } = params;
    const cleanAmount = currencySetter(amount);

    // 1. إنشاء المعاملة
    const tx = new Transaction({
      userId: uid,
      amount: cleanAmount,
      type,
      status,
      description,
      createdAt: new Date()
    });
    await tx.save();

    // 2. تحديث رصيد المستخدم إذا كانت المعاملة مكتملة فوراً (مثل الأرباح أو الاستثمار)
    // أو إذا كان تعديلاً يدوياً من الأدمن
    if (status === 'completed' || isManualAdminUpdate) {
      const updateQuery: any = { $set: { updatedAt: new Date() } };

      if (type === 'deposit' || type === 'reward' || type === 'profit') {
        updateQuery.$inc = { balance: cleanAmount };
        if (type === 'profit') updateQuery.$inc.profits = cleanAmount;
      } else if (type === 'withdraw') {
        updateQuery.$inc = { balance: -cleanAmount };
      } else if (type === 'investment') {
        updateQuery.$inc = { balance: -cleanAmount, investments: cleanAmount };
      }

      const updatedUser = await User.findOneAndUpdate({ uid }, updateQuery, { new: true });
      return { user: updatedUser, transaction: tx };
    }

    return { transaction: tx };
  },

  async syncUser(data: { uid: string, email: string, displayName?: string, photoURL?: string, isAdminClaim?: boolean }) {
    const { uid, email, displayName, photoURL, isAdminClaim = false } = data;
    const adminEmails = ['elalyzead@gmail.com', 'aymanaamer979@gmail.com'];
    const assignedRole = (adminEmails.includes(email.toLowerCase()) || isAdminClaim) ? 'admin' : 'user';

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

      // سجل مكافأة التسجيل
      await this.updateFinancials(uid, {
        amount: 35,
        type: 'reward',
        description: 'هدية ترحيبية عند التسجيل',
        status: 'completed'
      });
    } else {
      // تحديث الرتبة إذا تغيرت في فيرباس أو إذا كان في قائمة الإيميلات
      if (user.role !== assignedRole) {
        user.role = assignedRole;
        await user.save();
      }
    }
    return user;
  }
};
