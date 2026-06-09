import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="otp-grid" role="group" aria-label="Código de verificación de 6 dígitos">
      @for (i of indices; track i) {
        <input
          #otpCell
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="otp-cell"
          [class.otp-cell--shake]="shaking"
          [attr.aria-label]="'Dígito ' + (i + 1)"
          autocomplete="one-time-code"
          (keydown)="onKeydown($event, i)"
          (input)="onInput($event, i)"
          (paste)="onPaste($event)"
        />
      }
    </div>
  `,
  styles: [`
    .otp-grid {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    .otp-cell {
      width: 48px;
      height: 56px;
      border: 2px solid var(--color-border, rgba(255,255,255,0.12));
      border-radius: 10px;
      background: var(--color-bg-elevated, rgba(255,255,255,0.04));
      color: var(--color-text-primary, #e6edf3);
      font-family: var(--font-mono, monospace);
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      outline: none;
      transition: border-color 0.2s;
      caret-color: transparent;
      &:focus {
        border-color: var(--color-brand-primary, #00bfa5);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-primary, #00bfa5) 20%, transparent);
      }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%  { transform: translateX(-6px); }
      40%  { transform: translateX(6px); }
      60%  { transform: translateX(-4px); }
      80%  { transform: translateX(4px); }
    }
    .otp-cell--shake { animation: shake 0.4s ease; }
  `],
})
export class OtpInputComponent {
  @Output() readonly otpComplete = new EventEmitter<string>();

  readonly indices = [0, 1, 2, 3, 4, 5];
  shaking = false;

  @ViewChildren('otpCell') private readonly cells!: QueryList<ElementRef<HTMLInputElement>>;
  private readonly cdr = inject(ChangeDetectorRef);

  private getValues(): string[] {
    return this.cells.toArray().map(el => el.nativeElement.value);
  }

  private focusCell(index: number): void {
    this.cells.toArray()[index]?.nativeElement.focus();
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const char = input.value.replace(/\D/g, '').slice(-1);
    input.value = char;
    if (char && index < 5) this.focusCell(index + 1);
    const values = this.getValues();
    if (values.every(v => v.length === 1)) {
      this.otpComplete.emit(values.join(''));
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace') {
      if (input.value === '' && index > 0) {
        this.focusCell(index - 1);
        const prev = this.cells.toArray()[index - 1];
        if (prev) prev.nativeElement.value = '';
      } else {
        input.value = '';
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6);
    const cellsArr = this.cells.toArray();
    digits.split('').forEach((d, i) => {
      if (cellsArr[i]) cellsArr[i].nativeElement.value = d;
    });
    const nextFocus = Math.min(digits.length, 5);
    this.focusCell(nextFocus);
    if (digits.length === 6) this.otpComplete.emit(digits);
  }

  shake(): void {
    this.shaking = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.shaking = false;
      this.cells.toArray().forEach(el => { el.nativeElement.value = ''; });
      this.focusCell(0);
      this.cdr.markForCheck();
    }, 450);
  }
}
