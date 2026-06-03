export type ThemeId = 'light' | 'dark' | string; // admite futuros temas dinámicos

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  // Opcional: para temas cargados desde backend
  cssVars?: Record<string, string>;
  isDark?: boolean;
}