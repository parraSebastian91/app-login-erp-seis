import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type PasswordStrength = 'very-weak' | 'weak' | 'medium' | 'strong';

interface StrengthLevel {
  level: PasswordStrength;
  label: string;
  score: number;
}

function evaluatePassword(password: string): StrengthLevel {
  if (!password || password.length === 0) {
    return { level: 'very-weak', label: 'Muy débil', score: 1 };
  }
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const hasLetter = hasLower || hasUpper;
  const isLong = password.length >= 12;
  const isAtLeast8 = password.length >= 8;
  const typeCount = [hasLetter, hasDigit, hasSymbol].filter(Boolean).length;

  if (!isAtLeast8 || typeCount === 1) return { level: 'very-weak', label: 'Muy débil', score: 1 };
  if (isAtLeast8 && typeCount === 1) return { level: 'weak', label: 'Débil', score: 2 };
  if (isAtLeast8 && typeCount === 2) return { level: 'medium', label: 'Media', score: 3 };
  if (isLong && typeCount === 3)     return { level: 'strong', label: 'Fuerte', score: 4 };
  if (typeCount === 3)               return { level: 'medium', label: 'Media', score: 3 };
  return { level: 'weak', label: 'Débil', score: 2 };
}

@Component({
  selector: 'app-password-strength-meter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (password && password.length > 0) {
      <div class="psm" [attr.aria-label]="'Fortaleza de contraseña: ' + strength.label">
        <div class="psm-bar">
          @for (seg of segments; track seg) {
            <div class="psm-segment" [class.filled]="seg <= strength.score" [attr.data-level]="strength.level"></div>
          }
        </div>
        <span class="psm-label" [attr.data-level]="strength.level">{{ strength.label }}</span>
      </div>
    }
  `,
  styles: [`
    .psm { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
    .psm-bar { display: flex; gap: 4px; flex: 1; }
    .psm-segment {
      flex: 1; height: 4px; border-radius: 2px;
      background: var(--color-border, rgba(255,255,255,0.12));
      transition: background-color 0.3s;
      &.filled[data-level="very-weak"] { background: var(--color-error, #ef4444); }
      &.filled[data-level="weak"]      { background: #f97316; }
      &.filled[data-level="medium"]    { background: var(--color-warning, #eab308); }
      &.filled[data-level="strong"]    { background: var(--color-success, #22c55e); }
    }
    .psm-label {
      font-size: 0.75rem; min-width: 56px; text-align: right; font-weight: 500;
      &[data-level="very-weak"] { color: var(--color-error, #ef4444); }
      &[data-level="weak"]      { color: #f97316; }
      &[data-level="medium"]    { color: var(--color-warning, #eab308); }
      &[data-level="strong"]    { color: var(--color-success, #22c55e); }
    }
  `],
})
export class PasswordStrengthMeterComponent implements OnChanges {
  @Input() password = '';
  readonly segments = [1, 2, 3, 4];
  strength: StrengthLevel = { level: 'very-weak', label: 'Muy débil', score: 1 };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.strength = evaluatePassword(this.password);
    }
  }
}
