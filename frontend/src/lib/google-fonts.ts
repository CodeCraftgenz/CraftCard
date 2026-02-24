export const AVAILABLE_FONTS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Raleway',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'Source Sans 3',
  'Ubuntu',
  'Rubik',
  'Work Sans',
  'DM Sans',
] as const;

export type FontName = (typeof AVAILABLE_FONTS)[number];

/** Load a Google Font dynamically via <link> tag */
export function loadGoogleFont(fontFamily: string) {
  if (!fontFamily || fontFamily === 'Inter') return; // Inter is already loaded locally
  const id = `gfont-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}
