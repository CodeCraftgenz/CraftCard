export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  displayName: string;
  bio: string;
  cardTheme: string;
  buttonColor: string;
  suggestedLinks: Array<{ platform: string; label: string; url: string }>;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'developer',
    name: 'Desenvolvedor',
    description: 'Para devs e engenheiros de software',
    displayName: 'Seu Nome',
    bio: 'Desenvolvedor apaixonado por criar solucoes inovadoras. Especialista em tecnologia e sempre aprendendo.',
    cardTheme: 'neon',
    buttonColor: '#00E4F2',
    suggestedLinks: [
      { platform: 'github', label: 'GitHub', url: 'https://github.com/' },
      { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/' },
      { platform: 'custom', label: 'Portfolio', url: 'https://' },
      { platform: 'custom', label: 'Blog Tecnico', url: 'https://' },
    ],
  },
  {
    id: 'designer',
    name: 'Designer',
    description: 'Para designers e criativos',
    displayName: 'Seu Nome',
    bio: 'Designer criativo focado em experiencias visuais memoraveis. Transformando ideias em designs impactantes.',
    cardTheme: 'gradient',
    buttonColor: '#D12BF2',
    suggestedLinks: [
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/' },
      { platform: 'custom', label: 'Behance', url: 'https://behance.net/' },
      { platform: 'custom', label: 'Dribbble', url: 'https://dribbble.com/' },
      { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Para profissionais de marketing digital',
    displayName: 'Seu Nome',
    bio: 'Especialista em marketing digital e estrategias de crescimento. Ajudando marcas a alcancarem seu potencial maximo.',
    cardTheme: 'bold',
    buttonColor: '#F59E0B',
    suggestedLinks: [
      { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/' },
      { platform: 'custom', label: 'Cases de Sucesso', url: 'https://' },
      { platform: 'custom', label: 'Agendar Reuniao', url: 'https://' },
    ],
  },
  {
    id: 'lawyer',
    name: 'Advogado',
    description: 'Para advogados e escritorios',
    displayName: 'Seu Nome',
    bio: 'Advogado comprometido com a defesa dos seus direitos. Atendimento personalizado e estrategico.',
    cardTheme: 'elegant',
    buttonColor: '#C9A84C',
    suggestedLinks: [
      { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/' },
      { platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/55' },
      { platform: 'custom', label: 'Areas de Atuacao', url: 'https://' },
      { platform: 'custom', label: 'Agendar Consulta', url: 'https://' },
    ],
  },
  {
    id: 'freelancer',
    name: 'Freelancer',
    description: 'Para freelancers e autonomos',
    displayName: 'Seu Nome',
    bio: 'Freelancer dedicado a entregar projetos de alta qualidade. Disponivel para novos desafios e parcerias.',
    cardTheme: 'ocean',
    buttonColor: '#06B6D4',
    suggestedLinks: [
      { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/' },
      { platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/55' },
      { platform: 'custom', label: 'Portfolio', url: 'https://' },
      { platform: 'custom', label: 'Orcamento', url: 'https://' },
    ],
  },
];
