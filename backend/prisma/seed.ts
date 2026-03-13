import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Users ---
  const passwordHash = await bcrypt.hash('Seed@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@craftcard.dev' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'admin@craftcard.dev',
      name: 'Admin Dev',
      passwordHash,
      role: 'ADMIN',
      plan: 'BUSINESS',
    },
  });

  const userPro = await prisma.user.upsert({
    where: { email: 'pro@craftcard.dev' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'pro@craftcard.dev',
      name: 'Usuario Pro',
      passwordHash,
      role: 'USER',
      plan: 'PRO',
    },
  });

  const userFree = await prisma.user.upsert({
    where: { email: 'free@craftcard.dev' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'free@craftcard.dev',
      name: 'Usuario Free',
      passwordHash,
      role: 'USER',
      plan: 'FREE',
    },
  });

  const orgOwner = await prisma.user.upsert({
    where: { email: 'owner@empresa.dev' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'owner@empresa.dev',
      name: 'Dono da Empresa',
      passwordHash,
      role: 'USER',
      plan: 'BUSINESS',
    },
  });

  const orgMember = await prisma.user.upsert({
    where: { email: 'membro@empresa.dev' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'membro@empresa.dev',
      name: 'Membro da Equipe',
      passwordHash,
      role: 'USER',
      plan: 'FREE',
    },
  });

  console.log('  ✓ 5 users created');

  // --- Profiles ---
  const adminProfile = await prisma.profile.upsert({
    where: { slug: 'admin-dev' },
    update: {},
    create: {
      userId: admin.id,
      displayName: 'Admin Dev',
      slug: 'admin-dev',
      bio: 'Administrador da plataforma CraftCard. Conta de desenvolvimento.',
      isPrimary: true,
      isPublished: true,
      buttonColor: '#00E4F2',
      cardTheme: 'neon',
      location: 'Sao Paulo, BR',
      tagline: 'Construindo o futuro dos cartoes digitais',
      leadCaptureEnabled: true,
      bookingEnabled: true,
    },
  });

  const proProfile = await prisma.profile.upsert({
    where: { slug: 'usuario-pro' },
    update: {},
    create: {
      userId: userPro.id,
      displayName: 'Designer Pro',
      slug: 'usuario-pro',
      bio: 'Designer grafico freelancer especializado em branding e identidade visual.',
      isPrimary: true,
      isPublished: true,
      buttonColor: '#D12BF2',
      cardTheme: 'glassmorphism',
      location: 'Rio de Janeiro, BR',
      tagline: 'Design que transforma marcas',
      leadCaptureEnabled: true,
      bookingEnabled: true,
      galleryEnabled: true,
      servicesEnabled: true,
      faqEnabled: true,
    },
  });

  const freeProfile = await prisma.profile.upsert({
    where: { slug: 'usuario-free' },
    update: {},
    create: {
      userId: userFree.id,
      displayName: 'Dev Junior',
      slug: 'usuario-free',
      bio: 'Desenvolvedor iniciante aprendendo React e Node.js.',
      isPrimary: true,
      isPublished: true,
      buttonColor: '#22C55E',
      cardTheme: 'default',
    },
  });

  const ownerProfile = await prisma.profile.upsert({
    where: { slug: 'dono-empresa' },
    update: {},
    create: {
      userId: orgOwner.id,
      displayName: 'CEO Empresa Dev',
      slug: 'dono-empresa',
      bio: 'CEO e fundador da Empresa Dev. Tecnologia para negocios.',
      isPrimary: true,
      isPublished: true,
      buttonColor: '#3B82F6',
      cardTheme: 'corporate',
    },
  });

  // Second card for pro user
  await prisma.profile.upsert({
    where: { slug: 'designer-portfolio' },
    update: {},
    create: {
      userId: userPro.id,
      displayName: 'Portfolio Design',
      label: 'Portfolio',
      slug: 'designer-portfolio',
      bio: 'Meu portfolio de design grafico e branding.',
      isPrimary: false,
      isPublished: true,
      buttonColor: '#F59E0B',
      cardTheme: 'minimal',
    },
  });

  console.log('  ✓ 5 profiles created');

  // --- Social Links ---
  const socialLinksData = [
    { profileId: adminProfile.id, platform: 'github', label: 'GitHub', url: 'https://github.com/craftcard', order: 0 },
    { profileId: adminProfile.id, platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/admin-dev', order: 1 },
    { profileId: adminProfile.id, platform: 'email', label: 'Email', url: 'mailto:admin@craftcard.dev', order: 2 },
    { profileId: proProfile.id, platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/designerpro', order: 0 },
    { profileId: proProfile.id, platform: 'behance', label: 'Behance', url: 'https://behance.net/designerpro', order: 1 },
    { profileId: proProfile.id, platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/5511999999999', order: 2 },
    { profileId: proProfile.id, platform: 'website', label: 'Meu Site', url: 'https://designerpro.com.br', order: 3 },
    { profileId: freeProfile.id, platform: 'github', label: 'GitHub', url: 'https://github.com/devjunior', order: 0 },
    { profileId: freeProfile.id, platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/devjunior', order: 1 },
  ];

  for (const link of socialLinksData) {
    await prisma.socialLink.create({ data: link });
  }
  console.log('  ✓ 9 social links created');

  // --- Services (Pro profile) ---
  const servicesData = [
    { profileId: proProfile.id, title: 'Logo Design', description: 'Criacao de logotipos profissionais com manual de marca.', price: 'R$ 1.500', order: 0 },
    { profileId: proProfile.id, title: 'Identidade Visual', description: 'Pacote completo: logo + paleta + tipografia + papelaria.', price: 'R$ 3.500', order: 1 },
    { profileId: proProfile.id, title: 'Design de Cartao Digital', description: 'Criacao e configuracao do seu cartao CraftCard personalizado.', price: 'R$ 500', order: 2 },
  ];

  for (const service of servicesData) {
    await prisma.service.create({ data: service });
  }
  console.log('  ✓ 3 services created');

  // --- FAQ Items (Pro profile) ---
  const faqData = [
    { profileId: proProfile.id, question: 'Qual o prazo de entrega?', answer: 'O prazo varia de 5 a 15 dias uteis, dependendo da complexidade do projeto.', order: 0 },
    { profileId: proProfile.id, question: 'Quantas revisoes estao incluidas?', answer: 'Todos os pacotes incluem 3 rodadas de revisao. Revisoes adicionais tem custo extra.', order: 1 },
    { profileId: proProfile.id, question: 'Aceita parcelamento?', answer: 'Sim, parcelo em ate 3x sem juros no cartao ou via Pix com desconto de 10%.', order: 2 },
  ];

  for (const faq of faqData) {
    await prisma.faqItem.create({ data: faq });
  }
  console.log('  ✓ 3 FAQ items created');

  // --- Testimonials (Pro profile) ---
  const testimonialsData = [
    { profileId: proProfile.id, authorName: 'Maria Silva', authorRole: 'CEO, Startup XYZ', text: 'Trabalho incrivel! O logo ficou perfeito e a identidade visual transformou nossa marca.', isApproved: true },
    { profileId: proProfile.id, authorName: 'Joao Santos', authorRole: 'Marketing Manager', text: 'Profissional e criativo. Recomendo fortemente para qualquer projeto de design.', isApproved: true },
    { profileId: proProfile.id, authorName: 'Ana Costa', authorRole: 'Empreendedora', text: 'Superou minhas expectativas! Entregou no prazo e com qualidade excepcional.', isApproved: false },
  ];

  for (const testimonial of testimonialsData) {
    await prisma.testimonial.create({ data: testimonial });
  }
  console.log('  ✓ 3 testimonials created');

  // --- Contact Messages ---
  const messagesData = [
    { profileId: proProfile.id, senderName: 'Carlos Oliveira', senderEmail: 'carlos@email.com', message: 'Ola! Vi seu portfolio e gostaria de um orcamento para criacao de logo.', isRead: false },
    { profileId: proProfile.id, senderName: 'Fernanda Lima', senderEmail: 'fernanda@empresa.com', message: 'Preciso de uma identidade visual completa para minha startup. Podemos conversar?', isRead: true },
    { profileId: adminProfile.id, senderName: 'Teste Bot', senderEmail: 'bot@test.com', message: 'Mensagem de teste para validacao do sistema de contato.', isRead: false },
  ];

  for (const msg of messagesData) {
    await prisma.contactMessage.create({ data: msg });
  }
  console.log('  ✓ 3 contact messages created');

  // --- Organization ---
  const org = await prisma.organization.upsert({
    where: { slug: 'empresa-dev' },
    update: {},
    create: {
      name: 'Empresa Dev',
      slug: 'empresa-dev',
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      maxMembers: 10,
      brandingActive: true,
      cardTheme: 'corporate',
    },
  });

  // Owner membership
  await prisma.organizationMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: orgOwner.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: orgOwner.id,
      role: 'OWNER',
    },
  });

  // Member membership
  await prisma.organizationMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: orgMember.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: orgMember.id,
      role: 'MEMBER',
    },
  });

  // Pending invite
  await prisma.organizationInvite.create({
    data: {
      orgId: org.id,
      email: 'novo@empresa.dev',
      role: 'MEMBER',
      token: randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log('  ✓ 1 organization + 2 members + 1 invite created');

  // --- Payments (Pro user) ---
  await prisma.payment.create({
    data: {
      userId: userPro.id,
      amount: 29.90,
      currency: 'BRL',
      status: 'approved',
      plan: 'PRO',
      payerEmail: 'pro@craftcard.dev',
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  await prisma.payment.create({
    data: {
      userId: orgOwner.id,
      amount: 99.90,
      currency: 'BRL',
      status: 'approved',
      plan: 'BUSINESS',
      payerEmail: 'owner@empresa.dev',
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('  ✓ 2 payments created');

  // --- Webhooks (Pro user) ---
  const webhook = await prisma.webhook.create({
    data: {
      userId: userPro.id,
      url: 'https://webhook.site/test-craftcard',
      events: JSON.stringify(['new_message', 'new_booking', 'lead_status_changed']),
      secret: randomBytes(32).toString('hex'),
      isActive: true,
    },
  });

  // Sample webhook logs
  await prisma.webhookLog.createMany({
    data: [
      { webhookId: webhook.id, event: 'new_message', statusCode: 200, success: true, error: null },
      { webhookId: webhook.id, event: 'new_message', statusCode: 500, success: false, error: 'HTTP 500' },
      { webhookId: webhook.id, event: 'lead_status_changed', statusCode: 200, success: true, error: null },
    ],
  });

  console.log('  ✓ 1 webhook + 3 logs created');

  // --- Profile Views (analytics) ---
  const today = new Date();
  const viewsData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateOnly = new Date(date.toISOString().split('T')[0]);

    viewsData.push(
      { profileId: proProfile.id, date: dateOnly, count: Math.floor(Math.random() * 50) + 5 },
      { profileId: adminProfile.id, date: dateOnly, count: Math.floor(Math.random() * 20) + 1 },
    );
  }

  for (const view of viewsData) {
    await prisma.profileView.upsert({
      where: { profileId_date: { profileId: view.profileId, date: view.date } },
      update: { count: view.count },
      create: view,
    });
  }

  console.log('  ✓ 60 profile view records created (30 days x 2 profiles)');

  // --- Booking Slots + Bookings (Pro profile) ---
  await prisma.availableSlot.upsert({
    where: { profileId_dayOfWeek: { profileId: proProfile.id, dayOfWeek: 1 } },
    update: {},
    create: { profileId: proProfile.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', duration: 60 },
  });

  await prisma.availableSlot.upsert({
    where: { profileId_dayOfWeek: { profileId: proProfile.id, dayOfWeek: 3 } },
    update: {},
    create: { profileId: proProfile.id, dayOfWeek: 3, startTime: '10:00', endTime: '16:00', duration: 60 },
  });

  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));

  await prisma.booking.create({
    data: {
      profileId: proProfile.id,
      name: 'Roberto Almeida',
      email: 'roberto@email.com',
      date: nextMonday,
      time: '10:00',
      status: 'confirmed',
      notes: 'Reuniao para discutir projeto de branding.',
    },
  });

  console.log('  ✓ 2 available slots + 1 booking created');

  // --- Achievements ---
  await prisma.achievement.upsert({
    where: { userId_type: { userId: userPro.id, type: 'first_publish' } },
    update: {},
    create: { userId: userPro.id, type: 'first_publish' },
  });

  await prisma.achievement.upsert({
    where: { userId_type: { userId: userPro.id, type: 'first_message' } },
    update: {},
    create: { userId: userPro.id, type: 'first_message' },
  });

  await prisma.achievement.upsert({
    where: { userId_type: { userId: admin.id, type: 'first_publish' } },
    update: {},
    create: { userId: admin.id, type: 'first_publish' },
  });

  console.log('  ✓ 3 achievements created');

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Test accounts:');
  console.log('  admin@craftcard.dev  / Seed@123  (ADMIN, BUSINESS)');
  console.log('  pro@craftcard.dev    / Seed@123  (USER, PRO)');
  console.log('  free@craftcard.dev   / Seed@123  (USER, FREE)');
  console.log('  owner@empresa.dev    / Seed@123  (OWNER org "Empresa Dev")');
  console.log('  membro@empresa.dev   / Seed@123  (MEMBER org "Empresa Dev")');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
