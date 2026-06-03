import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ThemeDefinition, ThemeId } from './theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private readonly storageKey = 'erp-theme';
  private currentTheme$ = new BehaviorSubject<ThemeId>('light');
  themeChanges$ = this.currentTheme$.asObservable();

  private registry = new Map<ThemeId, ThemeDefinition>([
    ['light', { id: 'light', label: 'Claro', isDark: false }],
    ['dark', { id: 'dark', label: 'Oscuro', isDark: true }]
  ]);

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    const saved = (localStorage.getItem(this.storageKey) as ThemeId) || 'light';
    this.apply(saved);
  }

  register(def: ThemeDefinition) {
    this.registry.set(def.id, def);
  }

  list(): ThemeDefinition[] {
    return Array.from(this.registry.values());
  }

  get current(): ThemeId {
    return this.currentTheme$.value;
  }

  toggle() {
    this.apply(this.current === 'light' ? 'dark' : 'light');
  }

  apply(id: ThemeId) {
    const def = this.registry.get(id);
    if (!def) return;
    const body = this.doc.body;

    // Quitar clases previas de tema
    Array.from(body.classList)
      .filter(c => c.startsWith('theme-'))
      .forEach(c => this.renderer.removeClass(body, c));

    this.renderer.addClass(body, `theme-${id}`);

    // Aplicar variables runtime si vienen de backend
    if (def.cssVars) {
      Object.entries(def.cssVars).forEach(([key, val]) => {
        this.renderer.setStyle(body, `--${key}`, val);
      });
    }

    localStorage.setItem(this.storageKey, id);
    this.currentTheme$.next(id);
  }
}