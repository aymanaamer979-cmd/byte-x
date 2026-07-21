/**
 * API Client for Byte X Platform Express Server / Vercel Serverless Functions
 * Communicates with the MongoDB Atlas database on the backend.
 */

// We use relative paths so that it works seamlessly under the same origin (both on Vercel and locally)
const BASE_URL = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'API Request Failed');
  }
  return response.json();
}

export const api = {
  // --- AUTH & SYNC ---
  async syncUser({ uid, email, displayName, photoURL }) {
    const response = await fetch(`${BASE_URL}/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email, displayName, photoURL })
    });
    return handleResponse(response);
  },

  // --- USER PROFILE ---
  async getUserProfile(uid) {
    const response = await fetch(`${BASE_URL}/user/profile/${uid}`);
    return handleResponse(response);
  },

  async updatePhone(uid, phone) {
    const response = await fetch(`${BASE_URL}/user/update-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, phone })
    });
    return handleResponse(response);
  },

  async updateProfile(uid, { displayName, phone }) {
    const response = await fetch(`${BASE_URL}/user/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, displayName, phone })
    });
    return handleResponse(response);
  },

  async updatePresence(uid, isOnline) {
    const response = await fetch(`${BASE_URL}/user/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, isOnline })
    });
    return handleResponse(response);
  },

  // --- WALLET & TRANSACTIONS ---
  async submitDeposit(uid, amount, description) {
    const response = await fetch(`${BASE_URL}/user/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, amount, description })
    });
    return handleResponse(response);
  },

  async submitWithdraw(uid, amount, description) {
    const response = await fetch(`${BASE_URL}/user/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, amount, description })
    });
    return handleResponse(response);
  },

  async getUserTransactions(uid) {
    const response = await fetch(`${BASE_URL}/user/transactions/${uid}`);
    return handleResponse(response);
  },

  // --- CHAT SUPPORT ---
  async getChatMessages(uid) {
    const response = await fetch(`${BASE_URL}/chat/messages/${uid}`);
    return handleResponse(response);
  },

  async sendChatMessage({ userId, senderId, senderName, text, isAdmin }) {
    const response = await fetch(`${BASE_URL}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, senderId, senderName, text, isAdmin })
    });
    return handleResponse(response);
  },

  // --- ADMIN PANEL FUNCTIONS ---
  async adminGetUsers() {
    const response = await fetch(`${BASE_URL}/admin/users`);
    return handleResponse(response);
  },

  async adminGetUser(uid) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}`);
    return handleResponse(response);
  },

  async adminUpdateFinancials(uid, { balance, investments, profits, isVerified, depositBonus, depositBonusDate }) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/update-financials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance, investments, profits, isVerified, depositBonus, depositBonusDate })
    });
    return handleResponse(response);
  },

  async adminCreateOrEditTransaction(uid, { txId, amount, type, status, description, createdAt }) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, amount, type, status, description, createdAt })
    });
    return handleResponse(response);
  },

  async adminDeleteTransaction(uid, txId) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/transaction/${txId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  async adminUpdateStatus(uid, role) {
    const response = await fetch(`${BASE_URL}/admin/user/${uid}/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return handleResponse(response);
  }
};
