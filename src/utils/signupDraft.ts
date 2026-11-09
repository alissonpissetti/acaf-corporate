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
  try {
    const raw = localStorage.getItem(SIGNUP_DRAFT_KEY);
    if (!raw) return emptySignupDraft();
    const parsed = JSON.parse(raw) as Partial<SignupDraft>;
    // A senha nunca é restaurada do rascunho.
    return { ...emptySignupDraft(), ...parsed, password: '' };
  } catch {
    return emptySignupDraft();
  }
}

/** Salva o rascunho sem a senha (nunca guardar credenciais no navegador). */
export function saveSignupDraft(draft: SignupDraft): void {
  try {
    const { password: _omit, ...rest } = draft;
    localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(rest));
  } catch {
    /* armazenamento indisponível: segue sem rascunho */
  }
}

export function clearSignupDraft(): void {
  try {
    localStorage.removeItem(SIGNUP_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
