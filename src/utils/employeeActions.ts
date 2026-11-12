import type { EmployeeDto } from '../api/client';

export function canSendInvite(emp: EmployeeDto): boolean {
  return emp.status === 'pending' || emp.status === 'invited';
}

export function canCancelInvite(emp: EmployeeDto): boolean {
  return emp.status === 'pending' || emp.status === 'invited';
}

export function cancelInviteLabel(emp: EmployeeDto): string {
  return emp.status === 'invited' ? 'Cancelar convite' : 'Remover';
}
