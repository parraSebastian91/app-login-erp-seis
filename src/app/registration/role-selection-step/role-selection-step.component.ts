import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RegistrationRole } from '../registration.types';
import { RegistrationService } from '../registration.service';

@Component({
  selector: 'app-role-selection-step',
  standalone: false,
  templateUrl: './role-selection-step.component.html',
  styleUrl: './role-selection-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSelectionStepComponent {
  private readonly svc = inject(RegistrationService);
  readonly selected = signal<RegistrationRole | null>(null);

  onSelect(role: RegistrationRole): void {
    this.selected.set(role);
  }

  onContinue(): void {
    const role = this.selected();
    if (!role) return;
    this.svc.patch({ role });
    this.svc.goNext();
  }
}
