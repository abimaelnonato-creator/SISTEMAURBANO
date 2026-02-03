import { PrismaClient, Role, Priority, DemandStatus, DemandSource } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SEMSUR database seed...');

  // =============================================
  // SEMSUR - Secretaria Municipal de Serviços Urbanos
  // Parnamirim/RN
  // =============================================

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@semsur.parnamirim.rn.gov.br' },
    update: {},
    create: {
      email: 'admin@semsur.parnamirim.rn.gov.br',
      name: 'Administrador SEMSUR',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Criar SEMSUR como única secretaria
  const semsur = await prisma.secretary.upsert({
    where: { slug: 'semsur' },
    update: {},
    create: {
      name: 'Secretaria Municipal de Serviços Urbanos',
      acronym: 'SEMSUR',
      slug: 'semsur',
      description: 'Iluminação pública, limpeza urbana, praças, mercados e infraestrutura',
      color: '#0EA5E9',
      icon: 'building',
      phone: '0800-281-6400',
      email: 'semsur@parnamirim.rn.gov.br',
    },
  });
  console.log('✅ SEMSUR created:', semsur.acronym);

  // Criar categorias exclusivas da SEMSUR
  const categories = [
    // 💡 Iluminação Pública
    { name: 'Poste Apagado', slug: 'poste-apagado', slaDays: 3, color: '#F59E0B', keywords: ['poste', 'apagado', 'luz', 'escuro'] },
    { name: 'Lâmpada LED Queimada', slug: 'lampada-led', slaDays: 3, color: '#FBBF24', keywords: ['lampada', 'led', 'queimada', 'queimado'] },
    { name: 'Fiação Exposta', slug: 'fiacao-exposta', slaDays: 1, color: '#DC2626', keywords: ['fiacao', 'fio', 'exposto', 'perigo'] },
    { name: 'Poste Danificado', slug: 'poste-danificado', slaDays: 2, color: '#EF4444', keywords: ['poste', 'caido', 'tombado', 'danificado'] },
    
    // 🧹 Limpeza Urbana
    { name: 'Coleta de Lixo', slug: 'coleta-lixo', slaDays: 2, color: '#10B981', keywords: ['lixo', 'coleta', 'lixeira'] },
    { name: 'Lixo/Entulho Acumulado', slug: 'lixo-entulho', slaDays: 5, color: '#34D399', keywords: ['entulho', 'acumulado', 'descarte'] },
    { name: 'Varrição de Ruas', slug: 'varricao', slaDays: 5, color: '#6EE7B7', keywords: ['varrer', 'varricao', 'sujo'] },
    { name: 'Descarte Irregular', slug: 'descarte-irregular', slaDays: 5, color: '#A7F3D0', keywords: ['descarte', 'irregular', 'jogando'] },
    
    // 🌳 Praças e Jardins
    { name: 'Manutenção de Praça', slug: 'manutencao-praca', slaDays: 15, color: '#8B5CF6', keywords: ['praca', 'jardim', 'parque'] },
    { name: 'Poda de Árvores', slug: 'poda-arvores', slaDays: 20, color: '#A78BFA', keywords: ['poda', 'arvore', 'galho'] },
    { name: 'Capinação/Roçagem', slug: 'capinacao', slaDays: 10, color: '#C4B5FD', keywords: ['mato', 'capina', 'rocagem', 'capinar'] },
    { name: 'Mobiliário Danificado', slug: 'mobiliario-danificado', slaDays: 15, color: '#DDD6FE', keywords: ['banco', 'lixeira', 'brinquedo'] },
    
    // 🏪 Mercados e Cemitérios
    { name: 'Manutenção de Mercado', slug: 'manutencao-mercado', slaDays: 7, color: '#EC4899', keywords: ['mercado', 'feira', 'box'] },
    { name: 'Manutenção de Cemitério', slug: 'manutencao-cemiterio', slaDays: 7, color: '#F472B6', keywords: ['cemiterio', 'tumulo', 'jazigo'] },
    
    // 🌊 Drenagem
    { name: 'Bueiro Entupido', slug: 'bueiro-entupido', slaDays: 3, color: '#0EA5E9', keywords: ['bueiro', 'entupido', 'boca de lobo'] },
    { name: 'Alagamento', slug: 'alagamento', slaDays: 1, color: '#06B6D4', keywords: ['alagamento', 'enchente', 'inundacao'] },
    { name: 'Galeria Obstruída', slug: 'galeria-obstruida', slaDays: 5, color: '#22D3EE', keywords: ['galeria', 'canal', 'obstruido'] },
    
    // 🛠️ Infraestrutura
    { name: 'Calçada Danificada', slug: 'calcada-danificada', slaDays: 15, color: '#6366F1', keywords: ['calcada', 'quebrada', 'danificada'] },
    { name: 'Buraco em Via', slug: 'buraco-via', slaDays: 10, color: '#818CF8', keywords: ['buraco', 'asfalto', 'pavimento'] },
    { name: 'Outros Serviços', slug: 'outros', slaDays: 20, color: '#6B7280', keywords: ['outro', 'demais', 'geral'] },
  ];

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { 
        secretaryId_slug: {
          secretaryId: semsur.id,
          slug: categoryData.slug,
        }
      },
      update: {},
      create: {
        ...categoryData,
        secretaryId: semsur.id,
      },
    });
    console.log('✅ Category created:', category.name);
  }

  // Criar operadores SEMSUR
  const operatorPassword = await bcrypt.hash('semsur123', 10);
  
  const operators = [
    { email: 'iluminacao@semsur.parnamirim.rn.gov.br', name: 'Coordenador Iluminação', phone: '(84) 3644-8243' },
    { email: 'limpeza@semsur.parnamirim.rn.gov.br', name: 'Supervisor Limpeza', phone: '(84) 3644-8421' },
    { email: 'pracas@semsur.parnamirim.rn.gov.br', name: 'Coordenador Praças', phone: '(84) 3644-8420' },
    { email: 'drenagem@semsur.parnamirim.rn.gov.br', name: 'Técnico Drenagem', phone: '(84) 3644-8421' },
    { email: 'mercados@semsur.parnamirim.rn.gov.br', name: 'Fiscal Mercados', phone: '(84) 3644-8420' },
  ];

  for (const operatorData of operators) {
    const operator = await prisma.user.upsert({
      where: { email: operatorData.email },
      update: {},
      create: {
        ...operatorData,
        password: operatorPassword,
        role: Role.OPERATOR,
        secretaryId: semsur.id,
        isActive: true,
      },
    });
    console.log('✅ Operator created:', operator.email);
  }

  // Criar coordenador SEMSUR
  const coordinatorPassword = await bcrypt.hash('coord123', 10);
  const coordinator = await prisma.user.upsert({
    where: { email: 'coordenador@semsur.parnamirim.rn.gov.br' },
    update: {},
    create: {
      email: 'coordenador@semsur.parnamirim.rn.gov.br',
      name: 'Coordenador Geral SEMSUR',
      password: coordinatorPassword,
      role: Role.COORDINATOR,
      secretaryId: semsur.id,
      isActive: true,
    },
  });
  console.log('✅ Coordinator created:', coordinator.email);

  // Buscar categorias para criar demandas de exemplo
  const catPosteApagado = await prisma.category.findFirst({ where: { slug: 'poste-apagado' } });
  const catLixoEntulho = await prisma.category.findFirst({ where: { slug: 'lixo-entulho' } });
  const catBueiroEntupido = await prisma.category.findFirst({ where: { slug: 'bueiro-entupido' } });
  const catPoda = await prisma.category.findFirst({ where: { slug: 'poda-arvores' } });

  // Criar demandas de exemplo
  const sampleDemands = [
    {
      protocol: '2026-SEMSUR-0001',
      title: 'Poste apagado na Rua Principal',
      description: 'O poste em frente ao número 150 está apagado há 3 dias. A rua fica muito escura à noite.',
      status: DemandStatus.OPEN,
      priority: Priority.HIGH,
      source: DemandSource.WHATSAPP,
      address: 'Rua Principal, 150',
      neighborhood: 'Centro',
      latitude: -5.9157,
      longitude: -35.2631,
      categoryId: catPosteApagado!.id,
      secretaryId: semsur.id,
      requesterPhone: '(84) 99999-0001',
    },
    {
      protocol: '2026-SEMSUR-0002',
      title: 'Entulho acumulado em terreno',
      description: 'Moradores estão descartando entulho em terreno baldio. Risco de dengue.',
      status: DemandStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      source: DemandSource.WHATSAPP,
      address: 'Av. Brigadeiro Everaldo Breves, 500',
      neighborhood: 'Nova Parnamirim',
      latitude: -5.8920,
      longitude: -35.2680,
      categoryId: catLixoEntulho!.id,
      secretaryId: semsur.id,
      requesterPhone: '(84) 99999-0002',
    },
    {
      protocol: '2026-SEMSUR-0003',
      title: 'Bueiro entupido causando alagamento',
      description: 'O bueiro da esquina está entupido. Quando chove, alaga toda a rua.',
      status: DemandStatus.OPEN,
      priority: Priority.CRITICAL,
      source: DemandSource.PHONE,
      address: 'Rua dos Girassóis, 42',
      neighborhood: 'Emaús',
      latitude: -5.9100,
      longitude: -35.2750,
      categoryId: catBueiroEntupido!.id,
      secretaryId: semsur.id,
      requesterPhone: '(84) 99999-0003',
    },
    {
      protocol: '2026-SEMSUR-0004',
      title: 'Árvore com galhos sobre fiação',
      description: 'Árvore com galhos grandes sobre a fiação elétrica, oferecendo risco.',
      status: DemandStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      source: DemandSource.WHATSAPP,
      address: 'Rua das Acácias, 200',
      neighborhood: 'Rosa dos Ventos',
      latitude: -5.9380,
      longitude: -35.2550,
      categoryId: catPoda!.id,
      secretaryId: semsur.id,
      requesterPhone: '(84) 99999-0004',
    },
  ];

  for (const demandData of sampleDemands) {
    const demand = await prisma.demand.upsert({
      where: { protocol: demandData.protocol },
      update: {},
      create: demandData,
    });
    console.log('✅ Sample demand created:', demand.protocol);
  }

  console.log('');
  console.log('🎉 SEMSUR seed completed successfully!');
  console.log('');
  console.log('📋 Credenciais de acesso:');
  console.log('   Admin: admin@semsur.parnamirim.rn.gov.br / admin123');
  console.log('   Operadores: semsur123');
  console.log('   Coordenador: coord123');
  console.log('');
  console.log('📞 Contatos SEMSUR:');
  console.log('   Call Center: 0800-281-6400');
  console.log('   Iluminação: (84) 3644-8243');
  console.log('   Protocolo: (84) 3644-8421');

  // Create neighborhoods of Parnamirim
  console.log('🗺️ Creating neighborhoods...');
  
  const neighborhoods = [
    { name: 'Centro', code: 'centro' },
    { name: 'Nova Parnamirim', code: 'nova_parnamirim' },
    { name: 'Emaús', code: 'emaus' },
    { name: 'Parque Industrial', code: 'parque_industrial' },
    { name: 'Cohabinal', code: 'cohabinal' },
    { name: 'Passagem de Areia', code: 'passagem_de_areia' },
    { name: 'Liberdade', code: 'liberdade' },
    { name: 'Rosa dos Ventos', code: 'rosa_dos_ventos' },
    { name: 'Boa Esperança', code: 'boa_esperanca' },
    { name: 'Monte Castelo', code: 'monte_castelo' },
    { name: 'Vida Nova', code: 'vida_nova' },
    { name: 'Santos Reis', code: 'santos_reis' },
    { name: 'Cajupiranga', code: 'cajupiranga' },
    { name: 'Pirangi do Norte', code: 'pirangi_do_norte' },
    { name: 'Pium', code: 'pium' },
    { name: 'Cotovelo', code: 'cotovelo' },
    { name: 'Bela Parnamirim', code: 'bela_parnamirim' },
    { name: 'Parque das Árvores', code: 'parque_das_arvores' },
    { name: 'Parque de Exposições', code: 'parque_de_exposicoes' },
    { name: 'Cidade Verde', code: 'cidade_verde' },
    { name: 'Parque das Nações', code: 'parque_das_nacoes' },
    { name: 'Jardim Planalto', code: 'jardim_planalto' },
  ];

  for (const neighborhoodData of neighborhoods) {
    await prisma.neighborhood.upsert({
      where: { code: neighborhoodData.code },
      update: {},
      create: neighborhoodData,
    });
  }
  console.log(`✅ ${neighborhoods.length} neighborhoods created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
