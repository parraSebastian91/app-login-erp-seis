import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

function formatRut(digits: string): string {
  if (digits.length === 0) return '';
  const dv = digits.slice(-1);
  const body = digits.slice(0, -1);
  if (body.length === 0) return dv;
  const bodySeparated = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${bodySeparated}-${dv}`;
}

function stripRut(raw: string): string {
  return raw.replace(/[^0-9kK]/g, '').toUpperCase();
}

function calcDv(body: string): string {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

type RutState = 'idle' | 'valid' | 'invalid';

@Component({
  selector: 'app-rut-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rut-field" [class.is-valid]="state === 'valid'" [class.is-invalid]="state === 'invalid'">
      <div class="rut-input-wrapper">
        <input
          type="text"
          inputmode="numeric"
          autocomplete="off"
          [id]="inputId"
          [name]="name"
          [placeholder]="placeholder"
          [required]="required"
          [value]="displayValue"
          [attr.aria-invalid]="state === 'invalid' ? 'true' : null"
          [attr.aria-describedby]="state === 'invalid' ? inputId + '-error' : null"
          (input)="onInput($event)"
          class="rut-input"
        />
        @if (state === 'valid') {
          <span class="material-icons rut-icon rut-icon--valid" aria-hidden="true">check_circle</span>
        }
        @if (state === 'invalid') {
          <span class="material-icons rut-icon rut-icon--invalid" aria-hidden="true">cancel</span>
        }
      </div>
      @if (state === 'invalid') {
        <span class="rut-error" [id]="inputId + '-error'" role="alert">RUT inválido</span>
      }
    </div>
  `,
  styles: [`
    .rut-field { display: flex; flex-direction: column; gap: 4px; }
    .rut-input-wrapper { position: relative; display: flex; align-items: center; }
    .rut-input {
      width: 100%;
      padding: 10px 36px 10px 12px;
      border: 1px solid var(--color-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      font-family: var(--font-mono, monospace);
      font-size: 0.95rem;
      color: var(--color-text-primary, #e6edf3);
      background: var(--color-bg-elevated, rgba(255,255,255,0.04));
      outline: none;
      transition: border-color 0.2s;
      &::placeholder { color: var(--color-text-disabled, #4d5566); }
      &:focus {
        border-color: var(--color-brand-primary, #00bfa5);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-primary, #00bfa5) 20%, transparent);
      }
    }
    .is-valid .rut-input { border-color: var(--color-success, #22c55e); }
    .is-invalid .rut-input { border-color: var(--color-error, #ef4444); }
    .rut-icon { position: absolute; right: 10px; font-size: 18px; pointer-events: none; }
    .rut-icon--valid { color: var(--color-success, #22c55e); }
    .rut-icon--invalid { color: var(--color-error, #ef4444); }
    .rut-error { font-size: 0.75rem; color: var(--color-error, #ef4444); }
  `],
})
export class RutInputComponent implements OnChanges {
  @Input() value = '';
  @Input() name = 'rut';
  @Input() placeholder = 'Ej: 12.345.678-9';
  @Input() required = false;
  @Input() inputId = 'rut-input';

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly validChange = new EventEmitter<boolean>();

  displayValue = '';
  state: RutState = 'idle';

  private readonly cdr = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.value !== this.displayValue) {
      const clean = stripRut(this.value);
      this.displayValue = clean.length > 0 ? formatRut(clean) : '';
      this.state = 'idle';
    }
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    const clean = stripRut(raw);

    if (clean.length === 0) {
      this.displayValue = '';
      this.state = 'idle';
      this.valueChange.emit('');
      this.validChange.emit(false);
      this.cdr.markForCheck();
      return;
    }

    const formatted = formatRut(clean);
    this.displayValue = formatted;

    const selectionEnd = input.selectionEnd ?? formatted.length;
    requestAnimationFrame(() => {
      input.value = formatted;
      const diff = formatted.length - raw.length;
      const newPos = Math.max(0, selectionEnd + diff);
      input.setSelectionRange(newPos, newPos);
    });

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const isComplete = body.length >= 7;

    if (isComplete) {
      const expectedDv = calcDv(body);
      this.state = expectedDv === dv ? 'valid' : 'invalid';
      this.validChange.emit(this.state === 'valid');
    } else {
      this.state = 'idle';
      this.validChange.emit(false);
    }

    this.valueChange.emit(formatted);
    this.cdr.markForCheck();
  }
}
