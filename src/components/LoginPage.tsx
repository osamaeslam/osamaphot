import {
  AlertCircle,
  Building,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Lock,
  LogIn,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User as UserIcon,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, register, users, branches } = useApp();

  // Mode: 'login' or 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // --- Login State ---
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Registration / Activation State (Matching Screenshot) ---
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('sales_rep');
  const [regBranch, setRegBranch] = useState('فرع القاهرة');
  const [regSupervisorId, setRegSupervisorId] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Standard Company Branches list
  const companyBranchOptions = useMemo(() => {
    const list = [
      'فرع القاهرة',
      'فرع البحيرة',
      'فرع الفيوم',
      'فرع المنيا',
      'فرع ديمشلت',
      'فرع منوف',
      'فرع منيا القمح',
      'الفرع الرئيسي (المخزن المركزي - 6 أكتوبر)',
    ];
    // Include any custom branches registered
    branches.forEach((b) => {
      if (!list.includes(b.name)) {
        list.push(b.name);
      }
    });
    return list;
  }, [branches]);

  // Supervisors available for assignment (filtered by branch or general)
  const branchSupervisors = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === 'supervisor' ||
        u.role === 'branch_manager' ||
        u.role === 'admin'
    );
  }, [users]);

  // Handle Full Name change directly
  const handleFullNameChange = (nameVal: string) => {
    setFullName(nameVal);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    if (!loginIdentifier.trim()) {
      setLoginError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني أو رقم الهاتف');
      setIsLoggingIn(false);
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('يرجى إدخال كلمة المرور');
      setIsLoggingIn(false);
      return;
    }

    try {
      const result = await login(loginIdentifier, loginPassword);
      setIsLoggingIn(false);

      if (!result.success) {
        setLoginError(result.message);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setIsLoggingIn(false);
      setLoginError(err?.message || 'حدث خطأ أثناء التحقق من بيانات الدخول');
    }
  };

  // Submit Account Activation / Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setIsRegistering(true);

    if (!fullName.trim()) {
      setRegError('يرجى كتابة أو اختيار الاسم بالكامل');
      setIsRegistering(false);
      return;
    }

    if (!regEmail.trim()) {
      setRegError('يرجى إدخال البريد الإلكتروني');
      setIsRegistering(false);
      return;
    }

    if (!regPassword.trim() || regPassword.length < 3) {
      setRegError('كلمة المرور يجب أن تكون 3 أحرف/أرقام على الأقل');
      setIsRegistering(false);
      return;
    }

    try {
      const username = regEmail.includes('@')
        ? regEmail.split('@')[0].toLowerCase().trim()
        : fullName.replace(/\s+/g, '_').toLowerCase().trim();

      const regResult = register({
        name: fullName.trim(),
        username: username || `user_${Date.now().toString().slice(-4)}`,
        email: regEmail.trim().toLowerCase(),
        password: regPassword.trim(),
        phone: regPhone.trim() || '01000000000',
        branchName: regBranch,
        role: regRole,
        supervisorId: regSupervisorId || undefined,
      });

      if (!regResult.success) {
        setRegError(regResult.message);
        setIsRegistering(false);
        return;
      }

      setRegSuccess('تم تفعيل وتسجيل الحساب بنجاح! جاري تسجيل الدخول التلقائي...');

      // Auto login immediately
      setTimeout(async () => {
        const loginRes = await login(regEmail.trim(), regPassword.trim());
        setIsRegistering(false);
        if (loginRes.success && onSuccess) {
          onSuccess();
        }
      }, 700);
    } catch (err: any) {
      setIsRegistering(false);
      setRegError(err?.message || 'تعذر إتمام تسجيل الحساب.');
    }
  };

  // Quick Demo Fast Login Buttons
  const handleQuickDemoLogin = (role: UserRole) => {
    if (role === 'developer' || role === 'admin') {
      setLoginIdentifier('osama');
      setLoginPassword('');
    } else if (role === 'branch_manager') {
      setLoginIdentifier('amr_cairo');
      setLoginPassword('');
    } else if (role === 'supervisor') {
      setLoginIdentifier('supervisor_cairo');
      setLoginPassword('');
    } else {
      setLoginIdentifier('rep_cairo');
      setLoginPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Background glow visual accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg z-10 my-4">
        {/* Header Branding */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/20 mb-3 border border-amber-300/40">
            <span className="text-3xl font-black font-serif">D</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>شركة دريم للتجارة والتوزيع</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            منظومة إدارة المبيعات والمخازن والربط السحابي بالفواتير الإلكترونية
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Tabs Selector: Login vs Register/Activate */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>تفعيل حساب جديد</span>
            </button>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-black text-sm sm:text-base text-white">تسجيل الدخول للنظام</h2>
                    <p className="text-[11px] text-slate-400">للمطورين، المديرين، المشرفين، والمناديب</p>
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  قاعدة بيانات سحابية
                </span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>{loginError}</div>
                  </div>
                )}

                {/* Identifier */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم المستخدم أو البريد الإلكتروني أو الهاتف
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="مثال: osama أو Osama@dream.com أو 01000000001"
                      required
                      autoComplete="username"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition pr-10"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور المسجلة بقاعدة البيانات"
                      required
                      autoComplete="current-password"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition pr-10 pl-10"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-200 absolute left-3.5 top-3.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري التحقق من قاعدة البيانات...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>دخول إلى منظومة دريم</span>
                    </>
                  )}
                </button>

                {/* Switch to Register link */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-xs text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer"
                  >
                    موظف جديد أو ترغب بتفعيل حسابك؟ اضغط هنا لإنشاء وتفعيل الحساب
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER / ACTIVATE ACCOUNT (MATCHING EXACT SCREENSHOT) */}
          {activeTab === 'register' && (
            <div className="animate-in fade-in duration-200">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {regError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>{regError}</div>
                  </div>
                )}

                {regSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>{regSuccess}</div>
                  </div>
                )}

                {/* 1. الاسم بالكامل */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                    الاسم بالكامل
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      placeholder="اكتب الاسم بالكامل..."
                      required
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition pr-4"
                    />
                  </div>
                </div>

                {/* 2. البريد الإلكتروني */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      dir="ltr"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* 3. كلمة المرور */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="أدخل كلمة مرور قوية للحساب"
                      required
                      dir="ltr"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="text-slate-400 hover:text-slate-200 absolute left-3.5 top-3.5"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 4. Row: الصلاحية والفرع (Matching the screenshot layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* الصلاحية */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                      الصلاحية
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none transition appearance-none cursor-pointer text-center font-bold"
                    >
                      <option value="sales_rep">مندوب</option>
                      <option value="supervisor">مشرف مناديب</option>
                      <option value="branch_manager">مدير الفرع</option>
                      <option value="admin">الآدمن (الإدارة العامة)</option>
                      <option value="developer">المطور (الدعم التقني)</option>
                    </select>
                  </div>

                  {/* الفرع */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                      الفرع
                    </label>
                    <select
                      value={regBranch}
                      onChange={(e) => setRegBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none transition appearance-none cursor-pointer text-center font-bold"
                    >
                      {companyBranchOptions.map((br, idx) => (
                        <option key={idx} value={br}>
                          {br.replace('فرع ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. Direct Supervisor Assignment (When role is Sales Rep) */}
                {regRole === 'sales_rep' && branchSupervisors.length > 0 && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <label className="block text-xs font-bold text-amber-300 mb-1 text-right flex items-center justify-between">
                      <span>مشرف المناديب المسئول (اختياري)</span>
                      <span className="text-[10px] text-slate-400">للربط الإشرافي والمراجعة</span>
                    </label>
                    <select
                      value={regSupervisorId}
                      onChange={(e) => setRegSupervisorId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">-- تعيين تلقائي حسب الفرع --</option>
                      {branchSupervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.branchName || 'الفرع الرئيسي'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 6. رقم الهاتف (اختياري) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                    رقم الهاتف / الواتساب (اختياري)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition text-right"
                  />
                </div>

                {/* 7. Action Button: تفعيل الحساب (Matching the blue button with User+ in screenshot) */}
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {isRegistering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري تفعيل الحساب ومزامنته بالسحابة...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>تفعيل الحساب</span>
                    </>
                  )}
                </button>

                {/* Back to Login */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-slate-400 hover:text-slate-200 underline font-semibold cursor-pointer"
                  >
                    لديك حساب بالفعل؟ اضغط هنا لتسجيل الدخول
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer Security Badge */}
          <div className="pt-4 mt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>مزامنة سحابية فورية ومحمية ومشفرة عبر Supabase</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

