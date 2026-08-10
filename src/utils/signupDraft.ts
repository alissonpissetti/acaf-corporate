const SIGNUP_DRAFT_KEY = 'acaf_corporate_signup_draft';

export type SignupDraft = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  companyEmail: string;
  phone: string;
  managerName: string;
  managerEmail: string;
  managerCpf: string;
  managerPhone: string;
  password: string;
};

export const emptySignupDraft = (): SignupDraft => ({
  legalName: '',
  tradeName: '',
  cnpj: '',
  companyEmail: '',
  phone: '',
  managerName: '',
  managerEmail: '',
  managerCpf: '',
  managerPhone: '',
  password: '',
});

export function loadSignupDraft(): SignupDraft {
  const raw = localStorage.getItem(SIGNUP_DRAFT_KEY);
  if (!raw) return emptySignupDraft();
  try {
    const parsed = JSON.parse(raw) as Partial<SignupDraft>;
    return { ...emptySignupDraft(), ...parsed };
  } catch {
    return emptySignupDraft();
  }
}

export function saveSignupDraft(draft: SignupDraft): void {
  localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
}

export function clearSignupDraft(): void {
  localStorage.removeItem(SIGNUP_DRAFT_KEY);
}
