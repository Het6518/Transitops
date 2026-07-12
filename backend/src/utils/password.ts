import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export interface PasswordStrength {
  valid: boolean;
  score: number; // 0-4
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else errors.push('At least 8 characters');

  if (/[A-Z]/.test(password)) score++;
  else errors.push('At least one uppercase letter');

  if (/[a-z]/.test(password)) score++;
  else errors.push('At least one lowercase letter');

  if (/[0-9]/.test(password)) score++;
  else errors.push('At least one number');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else errors.push('At least one special character');

  return { valid: errors.length === 0, score, errors };
}
