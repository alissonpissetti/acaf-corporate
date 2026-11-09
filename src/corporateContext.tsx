import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearCorporateSession,
  corporateLogin,
  corporateLoginWithOtp,
  corporateMe,
  corporateRequestOtp,
  corporateResetPasswordWithOtp,
  getCorporateToken,
  setCorporateSession,
  type CompanyDto,
  type CorporateSessionUser,
  type OtpPurpose,
} from './api/auth';
import { apiHealth } from './api/client';

type CorporateContextValue = {
  loggedIn: boolean;
  loading: boolean;
  apiOnline: boolean;
  error: string | null;
  user: CorporateSessionUser | null;
  company: CompanyDto | null;
  login: (login: string, password: string) => Promise<void>;
  loginWithOtp: (mobilePhone: string, code: string) => Promise<void>;
  requestOtp: (mobilePhone: string, purpose: OtpPurpose) => Promise<{ ok: boolean; message?: string }>;
  resetPasswordWithOtp: (
    mobilePhone: string,
    code: string,
    newPassword: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const CorporateContext = createContext<CorporateContextValue | null>(null);

export function CorporateProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<CorporateSessionUser | null>(null);
  const [company, setCompany] = useState<CompanyDto | null>(null);

  const refresh = useCallback(async () => {
    const online = await apiHealth();
    setApiOnline(online);

    if (!getCorporateToken()) {
      setLoggedIn(false);
      setUser(null);
      setCompany(null);
      return;
    }

    try {
      const me = await corporateMe();
      setCorporateSession(getCorporateToken()!, me.user, me.company);
      setUser(me.user);
      setCompany(me.company);
      setLoggedIn(true);
      setError(null);
    } catch (e) {
      clearCorporateSession();
      setLoggedIn(false);
      setUser(null);
      setCompany(null);
      throw e;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch {
        /* erro exibido no login */
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const login = useCallback(
    async (loginId: string, password: string) => {
      const result = await corporateLogin(loginId, password);
      setCorporateSession(result.accessToken, result.user, result.company);
      await refresh();
    },
    [refresh],
  );

  const loginWithOtp = useCallback(
    async (mobilePhone: string, code: string) => {
      const result = await corporateLoginWithOtp(mobilePhone, code);
      setCorporateSession(result.accessToken, result.user, result.company);
      await refresh();
    },
    [refresh],
  );

  const requestOtp = useCallback(
    (mobilePhone: string, purpose: OtpPurpose) => corporateRequestOtp(mobilePhone, purpose),
    [],
  );

  const resetPasswordWithOtp = useCallback(
    (mobilePhone: string, code: string, newPassword: string) =>
      corporateResetPasswordWithOtp(mobilePhone, code, newPassword),
    [],
  );

  const logout = useCallback(() => {
    clearCorporateSession();
    setLoggedIn(false);
    setUser(null);
    setCompany(null);
    setError(null);
  }, []);

  const value = useMemo(
    (): CorporateContextValue => ({
      loggedIn: Boolean(getCorporateToken()) && loggedIn,
      loading,
      apiOnline,
      error,
      user,
      company,
      login,
      loginWithOtp,
      requestOtp,
      resetPasswordWithOtp,
      logout,
      refresh,
    }),
    [
      loggedIn,
      loading,
      apiOnline,
      error,
      user,
      company,
      login,
      loginWithOtp,
      requestOtp,
      resetPasswordWithOtp,
      logout,
      refresh,
    ],
  );

  return <CorporateContext.Provider value={value}>{children}</CorporateContext.Provider>;
}

export function useCorporate() {
  const ctx = useContext(CorporateContext);
  if (!ctx) throw new Error('useCorporate must be used within CorporateProvider');
  return ctx;
}
