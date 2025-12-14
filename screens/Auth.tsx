
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, loginAsGuest } = useAuth();

  const resetForm = () => {
      setEmail('');
      setDisplayName('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccessMsg('');
  };

  const toggleMode = () => {
      setIsLogin(!isLogin);
      resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    
    try {
      if (isLogin) {
        if (!email || !password) throw new Error("Please enter email and password");
        await login(email, password);
      } else {
        // Registration Validation
        if (!displayName) throw new Error("Username is required");
        if (!email) throw new Error("Email is required");
        if (!password) throw new Error("Password is required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        
        await register(email, displayName, password);
        
        // On success: Switch to login, clear inputs, show success message
        setIsLogin(true);
        resetForm(); // Clears inputs so user must type again
        setSuccessMsg("Account created successfully! Please log in.");
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
        await loginAsGuest();
    } catch (err: any) {
        setError('Failed to continue as guest');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6 animate-fade-in safe-area-top">
      <div className="flex items-center mb-8 h-10">
        {!isLogin && (
            <button onClick={toggleMode} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={24}/>
            </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full pb-10">
        <h2 className="font-heading text-4xl font-bold mb-3 tracking-tight text-white">{isLogin ? 'Welcome back' : 'Create account'}</h2>
        <p className="text-textSecondary mb-8 text-[17px]">
          {isLogin ? 'Enter your credentials to sign in.' : 'Start your productivity journey.'}
        </p>

        {successMsg && (
             <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-[#30D158] text-[15px] font-medium mb-6 flex items-center gap-3 animate-fade-in">
                <CheckCircle2 size={20} />
                {successMsg}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <Input 
                    label="Username"
                    placeholder="Coach K calls you..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                    autoComplete="off"
                />
            )}
            
            <Input 
                label="Email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
            />

            <Input 
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            {!isLogin && (
                <Input 
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLogin}
                />
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-[15px] font-medium mt-2">
                    {error}
                </div>
            )}

            <div className="pt-6">
                <Button type="submit" fullWidth disabled={loading} className="shadow-xl shadow-blue-900/20">
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
            </div>
        </form>

        <div className="mt-8 text-center space-y-6">
            <button 
                onClick={toggleMode}
                type="button"
                className="text-primary text-[15px] font-semibold hover:opacity-80 transition-opacity"
            >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-textSecondary text-[13px]">Or</span>
                </div>
            </div>

            <Button 
                variant="secondary" 
                onClick={handleGuestLogin} 
                fullWidth 
                disabled={loading}
                className="bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white/90"
            >
                Continue as Guest
            </Button>
        </div>
      </div>
    </div>
  );
};
