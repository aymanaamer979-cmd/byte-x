/**
 * API Client for Byte X Platform Express Server / Vercel Serverless Functions
 * Communicates with the MongoDB Atlas database on the backend.
 */

import { auth } from '../config/firebase';

// We use relative paths so that it works seamlessly under the same origin (both on Vercel and locally)
const BASE_URL = '/api';

/**
 * دالة مساعدة لجلب الـ ID Token من Firebase وإعداد الـ Headers
 */
async function getHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = 'API Request Failed';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch (e) {
      try {
        const text = await response.text();
        if (text && text.length < 150) {
          errorMsg = `Server Error: ${text}`;
        } else {
          errorMsg = `Server Error (${response.status})`;
        }
      } catch (textErr) {
        errorMsg = `Server Error (${response.status})`;
      }
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // --- AUTH & SYNC ---
  async syncUser({ uid, email, displayName, photoURL }) {
    const response = await fetch(`${BASE_URL}/auth/sync`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ uid, email, displayName, photoURL })
    });
    return handleResponse(response);
  },

  // --- USER PROFILE ---
  async getUserProfile(uid) {
    const response = await fetch(`${BASE_URL}/user/profile/${uid}`, {
      headers: await getHeaders()
    });
    return handleResponse(response);
  },

  async updatePhone(uid, phone) {
    const response = await fetch(`${BASE_URL}/user/update-phone`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ uid, phone })
    });
    return handleResponse(response);
  },

  async updateProfile(uid, { displayName, phone }) {
    const response = await fetch(`${BASE_URL}/user/update-profile`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ uid, displayName, phone })
    });
    return handleResponse(response);
  },

  async updatePresence(uid, isOnline) {
    const response = await fetch(`${BASE_URL}/user/presence`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ uid, isOnline })
    });
    return handleResponse(response);
  },

  // --- WALLET & TRANSACTIONS ---
  async submitDeposit(uid, amount, description) {
    const response = await fetch(`${BASE_URL}/user/deposit`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ uid, amount, description })
    });
    return handleResponse(response);
  },

  async submitWithdraw(uid, amount, description) {
    const response = await fetch(`${BASE_URL}/user/withdraw`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ uid, amount, description })
    });
    return handleResponse(response);
  },

  async getUserTransactions(uid) {
    const response = await fetch(`${BASE_URL}/user/transactions/${uid}`, {
      headers: await getHeaders()
    });
    return handleResponse(response);
  },

  // --- CHAT SUPPORT ---
  async getChatMessages(uid) {
    const response = await fetch(`${BASE_URL}/chat/messages/${uid}`, {
      headers: await getHeaders()
    });
    return handleResponse(response);
  },

  async sendChatMessage({ userId, senderId, senderName, text, isAdmin }) {
    const response = await fetch(`${BASE_URL}/chat/send`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId, senderId, senderName, text, isAdmin })
    });
    return handleResponse(response);
  },

  // --- ADMIN PANEL FUNCTIONS ---
  async adminGetUsers() {
    const response = await fetch(`${BASE_URL}/admin/users`, {
      headers: await getHeaders()
    });
    return handleResponse(response);
  },

  async adminGetUser(uid) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}`, {
      headers: await getHeaders()
    });
    return handleResponse(response);
  },

  async adminAdjustBalance(uid, { amount, type, description }) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/adjust-balance`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ amount, type, description })
    });
    return handleResponse(response);
  },

  async adminUpdateFinancials(uid, { balance, investments, profits, isVerified, depositBonus, depositBonusDate }) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/update-financials`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ balance, investments, profits, isVerified, depositBonus, depositBonusDate })
    });
    return handleResponse(response);
  },

  async adminCreateOrEditTransaction(uid, { txId, amount, type, status, description, createdAt }) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/transaction`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ txId, amount, type, status, description, createdAt })
    });
    return handleResponse(response);
  },

  async adminDeleteTransaction(uid, txId) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/transaction/${txId}`, {
      method: 'DELETE',
      headers: await getHeaders()
    });
    return handleResponse(response);
  },

  async adminUpdateStatus(uid, role) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/update-status`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ role })
    });
    return handleResponse(response);
  }
};
