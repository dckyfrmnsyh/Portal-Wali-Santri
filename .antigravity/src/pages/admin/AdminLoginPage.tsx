import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToLanding: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message || 'Email atau Password salah.');
    } else {
      onLoginSuccess();
    }
  };

  return (
    <div id="admin-login-page" className="w-full max-w-[400px] mx-auto py-8 space-y-6 px-4 sm:px-0">
      <button
        onClick={onBackToLanding}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Landing
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header visual */}
        <div className="bg-brand-green-950 text-white p-6 text-center space-y-2 border-b border-brand-green-900">
          <div className="inline-flex p-2.5 bg-brand-gold-500/10 text-brand-gold-500 rounded-xl border border-brand-gold-500/20">
            <Shield className="h-6 w-6 text-brand-gold-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight font-serif">Akses Pengurus Pondok</h2>
          <p className="text-xs text-slate-300">Silakan login untuk mengelola keuangan SPP & Katering santri</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 mt-5">
                <User className="h-4 w-4" />
              </span>
              <Input
                id="email-input"
                label="Email Admin"
                type="email"
                placeholder="Masukkan email admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 mt-5">
                <Lock className="h-4 w-4" />
              </span>
              <Input
                id="password-input"
                label="Password"
                type="password"
                placeholder="Masukkan password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button disabled={isLoading} type="submit" variant="primary" className="w-full font-bold bg-brand-green-900 hover:bg-brand-green-800 text-white rounded-xl py-3">
              {isLoading ? 'Memproses...' : 'Masuk Dashboard'}
            </Button>
          </div>
        </form>

        {/* Footer info helper */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center space-y-2">
          <p className="text-[11px] text-slate-500 font-medium">
            Sistem sekarang terhubung ke <strong>Supabase Auth</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
