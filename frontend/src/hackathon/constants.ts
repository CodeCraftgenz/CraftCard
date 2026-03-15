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
  { id: 'comunicacao', label: 'Comunicacao clara', emoji: '💬', description: 'Saber explicar ideias, instrucoes e opinioes de forma simples e facil de entender.' },
  { id: 'escuta', label: 'Escuta ativa', emoji: '👂', description: 'Prestar atencao de verdade no que as pessoas dizem antes de responder ou tomar decisoes.' },
  { id: 'empatia', label: 'Empatia', emoji: '🤝', description: 'Conseguir se colocar no lugar do outro e entender como ele se sente.' },
  { id: 'equipe', label: 'Trabalho em equipe', emoji: '👥', description: 'Colaborar com outras pessoas para alcancar um objetivo em comum.' },
  { id: 'responsabilidade', label: 'Responsabilidade', emoji: '✅', description: 'Cumprir tarefas, horarios e compromissos com seriedade.' },
  { id: 'organizacao', label: 'Organizacao', emoji: '📋', description: 'Planejar e manter suas atividades, materiais e tempo bem organizados.' },
  { id: 'adaptabilidade', label: 'Adaptabilidade', emoji: '🔄', description: 'Conseguir se ajustar a mudancas, novas situacoes ou desafios.' },
  { id: 'pensamento_critico', label: 'Pensamento critico', emoji: '🧠', description: 'Analisar situacoes com cuidado antes de tirar conclusoes ou tomar decisoes.' },
  { id: 'resolucao', label: 'Resolucao de problemas', emoji: '🔧', description: 'Encontrar solucoes quando algo nao sai como o esperado.' },
  { id: 'criatividade', label: 'Criatividade', emoji: '💡', description: 'Pensar em ideias novas ou diferentes para resolver situacoes ou criar algo.' },
  { id: 'inteligencia_emocional', label: 'Inteligencia emocional', emoji: '🧘', description: 'Saber lidar com emocoes, pressao e conflitos sem perder o equilibrio.' },
  { id: 'proatividade', label: 'Proatividade', emoji: '🚀', description: 'Tomar iniciativa e agir sem precisar que alguem mande.' },
  { id: 'etica', label: 'Postura etica', emoji: '⚖️', description: 'Agir com honestidade, respeito e responsabilidade com as pessoas e regras.' },
  { id: 'foco_cliente', label: 'Foco no cliente', emoji: '🎯', description: 'Pensar em como seu trabalho pode ajudar ou melhorar a experiencia de quem usa o servico.' },
  { id: 'aprendizado', label: 'Aprendizado continuo', emoji: '📚', description: 'Ter interesse em aprender coisas novas e melhorar sempre suas habilidades.' },
];

// ── Areas de Formacao ────────────────────────────────────

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
  { id: 'beleza', name: 'Beleza e Estetica', phrase: 'pratica, empreendedora e responsavel', fullPhrase: 'Eu Sou pratica, empreendedora e responsavel', coverImage: '/assets/hackathon/cursos-de-beleza-e-estetica-senac-sp_reduzido.webp', color: '#E91E63' },
  { id: 'bem-estar', name: 'Bem-estar', phrase: 'integrativa, pratica e essencial', fullPhrase: 'Eu Sou integrativa, pratica e essencial', coverImage: '/assets/hackathon/cursos-de-bem-estar-senac-sp.jpg', color: '#4CAF50' },
  { id: 'comunicacao', name: 'Comunicacao e Marketing', phrase: 'criativa, conectada e estrategica', fullPhrase: 'Eu Sou criativa, conectada e estrategica', coverImage: '/assets/hackathon/cursos-de-comunicacao-e-marketing-senac-sp.jpg', color: '#FF9800' },
  { id: 'social', name: 'Desenvolvimento Social', phrase: 'mais portas abertas, diversidade e inclusao', fullPhrase: 'Eu Sou mais portas abertas, diversidade e inclusao', coverImage: '/assets/hackathon/cursos-de-desenvolvimento-social-senac-sp.jpg', color: '#9C27B0' },
  { id: 'design', name: 'Design, Artes e Arquitetura', phrase: 'criativa, dinamica e interativa', fullPhrase: 'Eu Sou criativa, dinamica e interativa', coverImage: '/assets/hackathon/cursos-de-design-artes-e-arquitetura-senac-sp.jpg', color: '#FF5722' },
  { id: 'educacao', name: 'Educacao', phrase: 'metodologias ativas, visao critica e flexibilidade', fullPhrase: 'Eu Sou metodologias ativas, visao critica e flexibilidade', coverImage: '/assets/hackathon/cursos-de-educacao-senac-sp.jpg', color: '#2196F3' },
  { id: 'gastronomia', name: 'Gastronomia e Alimentacao', phrase: 'pratica, multipla e transformadora', fullPhrase: 'Eu Sou pratica, multipla e transformadora', coverImage: '/assets/hackathon/cursos-de-gastronomia-e-alimentacao-senac-sp.jpg', color: '#F44336' },
  { id: 'gestao', name: 'Gestao e Negocios', phrase: 'visao estrategica, empreendedora e transformadora', fullPhrase: 'Eu Sou visao estrategica, empreendedora e transformadora', coverImage: '/assets/hackathon/cursos-de-gestao-e-negocios-senac-sp.jpg', color: '#607D8B' },
  { id: 'idiomas', name: 'Idiomas', phrase: 'mais interacao, pratica e para a vida toda', fullPhrase: 'Eu Sou mais interacao, pratica e para a vida toda', coverImage: '/assets/hackathon/cursos-de-idiomas-senac-sp.jpg', color: '#00BCD4' },
  { id: 'meio-ambiente', name: 'Meio Ambiente, Seguranca e Saude', phrase: 'sustentavel, preventiva e responsavel', fullPhrase: 'Eu Sou sustentavel, preventiva e responsavel', coverImage: '/assets/hackathon/cursos-de-meio-ambiente-seguranca-e-saude-no-trabalho-senac-sp.jpg', color: '#8BC34A' },
  { id: 'moda', name: 'Moda', phrase: 'inovadora, sustentavel e plural', fullPhrase: 'Eu Sou inovadora, sustentavel e plural', coverImage: '/assets/hackathon/cursos-de-moda-senac-sp.jpg', color: '#E040FB' },
  { id: 'saude', name: 'Saude', phrase: 'multiprofissional, humanizada e tecnologica', fullPhrase: 'Eu Sou multiprofissional, humanizada e tecnologica', coverImage: '/assets/hackathon/cursos-de-saude-senac-sp.jpg', color: '#00897B' },
  { id: 'ti', name: 'Tecnologia da Informacao', phrase: 'pratica, conectada e para todo mundo', fullPhrase: 'Eu Sou pratica, conectada e para todo mundo', coverImage: '/assets/hackathon/cursos-de-ti-senac-sp.jpg', color: '#3F51B5' },
  { id: 'turismo', name: 'Turismo e Hospitalidade', phrase: 'mais experiencia, acolhimento e cultura', fullPhrase: 'Eu Sou mais experiencia, acolhimento e cultura', coverImage: '/assets/hackathon/cursos-de-turismo-e-hospitalidade-senac-sp.jpg', color: '#FF7043' },
];

// ── Configuracao do Evento ───────────────────────────────

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
