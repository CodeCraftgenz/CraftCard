// ─────────────────────────────────────────────────────────
// Hackathon Senac — Dados estaticos (Dicionarios)
// Isolado do sistema principal do CraftCard
// ─────────────────────────────────────────────────────────

// ── Soft Skills ──────────────────────────────────────────

export interface SoftSkill {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const MAX_SKILLS = 5;

export const SOFT_SKILLS: SoftSkill[] = [
  { id: 'comunicação', label: 'Comunicação clara', emoji: '💬', description: 'Saber explicar ideias, instruções e opiniões de forma simples e fácil de entender.' },
  { id: 'escuta', label: 'Escuta ativa', emoji: '👂', description: 'Prestar atenção de verdade no que as pessoas dizem antes de responder ou tomar decisões.' },
  { id: 'empatia', label: 'Empatia', emoji: '🤝', description: 'Conseguir se colocar no lugar do outro e entender como ele se sente.' },
  { id: 'equipe', label: 'Trabalho em equipe', emoji: '👥', description: 'Colaborar com outras pessoas para alcancar um objetivo em comum.' },
  { id: 'responsabilidade', label: 'Responsabilidade', emoji: '✅', description: 'Cumprir tarefas, horários e compromissos com seriedade.' },
  { id: 'organização', label: 'Organização', emoji: '📋', description: 'Planejar e manter suas atividades, materiais e tempo bem organizados.' },
  { id: 'adaptabilidade', label: 'Adaptabilidade', emoji: '🔄', description: 'Conseguir se ajustar a mudanças, novas situações ou desafios.' },
  { id: 'pensamento_crítico', label: 'Pensamento crítico', emoji: '🧠', description: 'Analisar situações com cuidado antes de tirar conclusões ou tomar decisões.' },
  { id: 'resolucao', label: 'Resolução de problemas', emoji: '🔧', description: 'Encontrar soluções quando algonão sai como o esperado.' },
  { id: 'criatividade', label: 'Criatividade', emoji: '💡', description: 'Pensar em ideias novas ou diferentes para resolver situações ou criar algo.' },
  { id: 'inteligencia_emocional', label: 'Inteligência emocional', emoji: '🧘', description: 'Saber lidar com emoções, pressao e conflitos sem perder o equilíbrio.' },
  { id: 'proatividade', label: 'Proatividade', emoji: '🚀', description: 'Tomar iniciativa e agir sem precisar que alguem mande.' },
  { id: 'etica', label: 'Postura etica', emoji: '⚖️', description: 'Agir com honestidade, respeito e responsabilidade com as pessoas e regras.' },
  { id: 'foco_cliente', label: 'Foco no cliente', emoji: '🎯', description: 'Pensar em como seu trabalho pode ajudar ou melhorar a experiencia de quem usa o servico.' },
  { id: 'aprendizado', label: 'Aprendizado continuo', emoji: '📚', description: 'Ter interesse em aprender coisas novas e melhorar sempre suas habilidades.' },
];

// ── Areas de Formação ────────────────────────────────────

export interface FormationArea {
  id: string;
  name: string;
  phrase: string;
  fullPhrase: string;
  coverImage: string;
  color: string;
}

export const HACKATHON_LOGO = '/assets/hackathon/Logosenac.jpg';

export const FORMATION_AREAS: FormationArea[] = [
  { id: 'beleza', name: 'Beleza e Estetica', phrase: 'prática, empreendedora e responsável', fullPhrase: 'Eu Sou prática, empreendedora e responsável', coverImage: '/assets/hackathon/cursos-de-beleza-e-estetica-senac-sp_reduzido.webp', color: '#E91E63' },
  { id: 'bem-estar', name: 'Bem-estar', phrase: 'integrativa, prática e essencial', fullPhrase: 'Eu Sou integrativa, prática e essencial', coverImage: '/assets/hackathon/cursos-de-bem-estar-senac-sp.jpg', color: '#4CAF50' },
  { id: 'comunicação', name: 'Comunicação e Marketing', phrase: 'criativa, conectada e estratégica', fullPhrase: 'Eu Sou criativa, conectada e estratégica', coverImage: '/assets/hackathon/cursos-de-comunicação-e-marketing-senac-sp.jpg', color: '#FF9800' },
  { id: 'social', name: 'Desenvolvimento Social', phrase: 'mais portas abertas, diversidade e inclusão', fullPhrase: 'Eu Sou mais portas abertas, diversidade e inclusão', coverImage: '/assets/hackathon/cursos-de-desenvolvimento-social-senac-sp.jpg', color: '#9C27B0' },
  { id: 'design', name: 'Design, Artes e Arquitetura', phrase: 'criativa, dinamica e interativa', fullPhrase: 'Eu Sou criativa, dinamica e interativa', coverImage: '/assets/hackathon/cursos-de-design-artes-e-arquitetura-senac-sp.jpg', color: '#FF5722' },
  { id: 'educacao', name: 'Educacao', phrase: 'metodologias ativas, visao critica e flexibilidade', fullPhrase: 'Eu Sou metodologias ativas, visao critica e flexibilidade', coverImage: '/assets/hackathon/cursos-de-educacao-senac-sp.jpg', color: '#2196F3' },
  { id: 'gastronomia', name: 'Gastronomia e Alimentacao', phrase: 'prática, multipla e transformadora', fullPhrase: 'Eu Sou prática, multipla e transformadora', coverImage: '/assets/hackathon/cursos-de-gastronomia-e-alimentacao-senac-sp.jpg', color: '#F44336' },
  { id: 'gestao', name: 'Gestao e Negocios', phrase: 'visao estratégica, empreendedora e transformadora', fullPhrase: 'Eu Sou visao estratégica, empreendedora e transformadora', coverImage: '/assets/hackathon/cursos-de-gestao-e-negocios-senac-sp.jpg', color: '#607D8B' },
  { id: 'idiomas', name: 'Idiomas', phrase: 'mais interacao, prática e para a vida toda', fullPhrase: 'Eu Sou mais interacao, prática e para a vida toda', coverImage: '/assets/hackathon/cursos-de-idiomas-senac-sp.jpg', color: '#00BCD4' },
  { id: 'meio-ambiente', name: 'Meio Ambiente, Seguranca e Saude', phrase: 'sustentável, preventiva e responsável', fullPhrase: 'Eu Sou sustentável, preventiva e responsável', coverImage: '/assets/hackathon/cursos-de-meio-ambiente-seguranca-e-saude-no-trabalho-senac-sp.jpg', color: '#8BC34A' },
  { id: 'moda', name: 'Moda', phrase: 'inovadora, sustentável e plural', fullPhrase: 'Eu Sou inovadora, sustentável e plural', coverImage: '/assets/hackathon/cursos-de-moda-senac-sp.jpg', color: '#E040FB' },
  { id: 'saude', name: 'Saude', phrase: 'multiprofissional, humanizada e tecnologica', fullPhrase: 'Eu Sou multiprofissional, humanizada e tecnologica', coverImage: '/assets/hackathon/cursos-de-saude-senac-sp.jpg', color: '#00897B' },
  { id: 'ti', name: 'Tecnologia da Informação', phrase: 'prática, conectada e para todo mundo', fullPhrase: 'Eu Sou prática, conectada e para todo mundo', coverImage: '/assets/hackathon/cursos-de-ti-senac-sp.jpg', color: '#3F51B5' },
  { id: 'turismo', name: 'Turismo e Hospitalidade', phrase: 'mais experiencia, acolhimento e cultura', fullPhrase: 'Eu Sou mais experiencia, acolhimento e cultura', coverImage: '/assets/hackathon/cursos-de-turismo-e-hospitalidade-senac-sp.jpg', color: '#FF7043' },
];

// ── Configuração do Evento ───────────────────────────────

export const HACKATHON_CONFIG = {
  name: 'Hackathon Senac',
  maxTeamSize: 5,
  eventDate: '2026-04-05',
  eventEndDate: '2026-04-06',
  senacBlue: '#004B87',
  senacOrange: '#F37021',
  senacWhite: '#FFFFFF',
} as const;

// ── Helpers ──────────────────────────────────────────────

export function getAreaById(id: string): FormationArea | undefined {
  return FORMATION_AREAS.find(a => a.id === id);
}

export function getSkillById(id: string): SoftSkill | undefined {
  return SOFT_SKILLS.find(s => s.id === id);
}

/** Parse hackathon metadata stored in profile.metadata JSON */
export function parseHackathonMeta(metadata: string | null | undefined): {
  hackathonArea?: string;
  hackathonSkills?: string[];
} {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata);
    return {
      hackathonArea: parsed.hackathonArea,
      hackathonSkills: parsed.hackathonSkills,
    };
  } catch {
    return {};
  }
}
