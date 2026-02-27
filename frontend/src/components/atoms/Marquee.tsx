const items = [
  'Cartao digital profissional',
  'QR Code para eventos',
  'Analytics em tempo real',
  'Agendamentos online',
  'Galeria de portfolio',
  'Branding para equipes',
  'Links personalizados',
  'Depoimentos integrados',
  'Export de leads CSV',
  'Dominio customizado',
];

export function Marquee() {
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#020617] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#020617] to-transparent z-10" />
      <div className="marquee-track flex gap-8 whitespace-nowrap">
        {doubled.map((text, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-sm text-slate-500 font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full gradient-bg shrink-0" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
