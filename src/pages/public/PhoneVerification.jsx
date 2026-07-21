import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PhoneVerification.css';
import { useAuth } from '../../context/AuthContext';

const PhoneVerification = () => {
  const { updatePhone } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber) {
      setError('يرجى إدخال رقم الهاتف أولاً.');
      return;
    }

    setLoading(true);
    const fullNumber = `${countryCode}${phoneNumber}`;

    try {
      await updatePhone(fullNumber);
      navigate('/account', { replace: true });
    } catch (err) {
      console.error('خطأ أثناء حفظ رقم الهاتف:', err.message);
      setError(`خطأ أثناء تفعيل الحساب: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-verify-container">
      <div className="phone-verify-card">

        <div className="shield-icon-wrapper">
          <div className="pulse-ring"></div>
          <i className="fa-solid fa-shield-lock"></i>
        </div>

        <div className="verify-header">
          <h2>الخطوة الأخيرة والأهم!</h2>
          <p>يرجى تأكيد رقم هاتفك لتأمين المحفظة وتفعيل مكافأة الـ <span className="gift-text">35 دولار</span> في حسابك.</p>
        </div>

        <form onSubmit={handleSubmit} className="verify-form">
          <div className="phone-input-group">
            <label>رقم الهاتف المحمول</label>

            <div className="phone-input-wrapper">
              <input
                type="tel"
                placeholder="1000000000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                required
                disabled={loading}
              />

              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="country-select"
                disabled={loading}
              >
                <option value="+20">🇪🇬 +20</option>
                <option value="+966">🇸🇦 +966</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+965">🇰🇼 +965</option>
                <option value="+974">🇶🇦 +974</option>
                <option value="+962">🇯🇴 +962</option>
              </select>

              <i className="fa-solid fa-phone phone-icon"></i>
            </div>
          </div>

          {error && (
            <p className="error-message-text" style={{ color: '#ff4a4a', fontSize: '14px', margin: '10px 0', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-verify-submit" disabled={loading}>
            <span>{loading ? 'جاري التأمين والرفع...' : 'تأمين الحساب واستلام المكافأة'}</span>
            <i className="fa-solid fa-circle-check"></i>
          </button>
        </form>

        <div className="verify-footer">
          <i className="fa-solid fa-user-shield"></i>
          <span>بياناتك مشفرة ومحمية بالكامل وفقاً لمعايير الأمان العالمية.</span>
        </div>

      </div>
    </div>
  );
};

export default PhoneVerification;
