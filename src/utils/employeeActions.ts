import type { EmployeeDto } from '../api/client';
import { normalizeCpf } from './personInput';

export type EmployeeProfilePatchSent = {
  name: string;
  email: string;
  cpf: string | null;
  mobilePhoneDigits: string;
};

/** Confirma que o PATCH cadastral foi aplicado (evita toast falso com API desatualizada). */
export function employeeProfileMatchesPatch(
  dto: EmployeeDto,
  sent: EmployeeProfilePatchSent,
): boolean {
  const cpfDigits = dto.cpf ? normalizeCpf(dto.cpf) : null;
  const phoneDigits = (dto.mobilePhone ?? '').replace(/\D/g, '');
  return (
    dto.name.trim() === sent.name &&
    dto.email.trim().toLowerCase() === sent.email &&
    cpfDigits === sent.cpf &&
    phoneDigits === sent.mobilePhoneDigits
  );
}

export function canSendInvite(emp: EmployeeDto): boolean {
  return emp.status === 'pending' || emp.status === 'invited';
}

export function canEditEmployeeDetails(emp: EmployeeDto): boolean {
  return emp.status === 'pending' || emp.status === 'invited';
}

export function canCancelInvite(emp: EmployeeDto): boolean {
  return emp.status === 'pending' || emp.status === 'invited';
}

export function cancelInviteLabel(emp: EmployeeDto): string {
  return emp.status === 'invited' ? 'Cancelar convite' : 'Remover';
}
