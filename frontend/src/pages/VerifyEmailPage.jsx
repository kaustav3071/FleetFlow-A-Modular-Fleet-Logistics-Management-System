import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../api/auth.js';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('[VERIFY EMAIL PAGE] token:', token);
    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        setMessage(res.data?.message || 'Email verified successfully!');
        setStatus('success');
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
      } catch (err) {
        setMessage(
          err.response?.data?.message || 'Verification failed. The link may be invalid or expired.'
        );
        setStatus('error');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="glass-card p-10 max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-amber-500 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-slate-100">Verifying your email…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-100">{message}</h2>
            <p className="text-slate-400 text-sm">Redirecting to login in 3 seconds…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-100">{message}</h2>
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
