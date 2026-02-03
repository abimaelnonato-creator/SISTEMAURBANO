import { PrismaClient, Role, Priority } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('🏛️ Iniciando seed de PRODUÇÃO - SEMSUR Parnamirim...\n');

  // ============================================
  // 1. CRIAR SECRETARIA SEMSUR
  // ============================================
  console.log('📋 Criando Secretaria SEMSUR...');
  
  const semsur = await prisma.secretary.create({
    data: {
      name: 'Secretaria Municipal de Serviços Urbanos',
      acronym: 'SEMSUR',
      slug: 'semsur',
      description: 'Responsável pela manutenção e conservação da infraestrutura urbana, incluindo vias públicas, iluminação, limpeza urbana, poda de árvores e serviços gerais.',
      email: 'semsur@parnamirim.rn.gov.br',
      phone: '(84) 3644-8000',
      address: 'Rua Dr. José Borges, S/N - Centro, Parnamirim - RN',
      color: '#2563EB',
      icon: 'Building2',
      isActive: true,
    },
  });
  console.log(`   ✅ ${semsur.name} criada\n`);

  // ============================================
  // 2. CRIAR CATEGORIAS REAIS DE SERVIÇOS
  // ============================================
  console.log('📂 Criando categorias de serviços...');

  const categorias = [
    {
      name: 'Tapa-buraco',
      slug: 'tapa-buraco',
      description: 'Reparo de buracos e imperfeições em vias públicas',
      icon: '🕳️',
      color: '#EF4444',
      priority: Priority.HIGH,
      slaDays: 2,
      keywords: ['buraco', 'asfalto', 'pavimento', 'rua', 'avenida', 'cratera'],
    },
    {
      name: 'Iluminação Pública',
      slug: 'iluminacao-publica',
      description: 'Manutenção de postes, lâmpadas e rede de iluminação',
      icon: '💡',
      color: '#F59E0B',
      priority: Priority.HIGH,
      slaDays: 1,
      keywords: ['luz', 'poste', 'lampada', 'escuro', 'iluminacao', 'apagado'],
    },
    {
      name: 'Limpeza Urbana',
      slug: 'limpeza-urbana',
      description: 'Coleta de lixo, varrição de ruas e limpeza de terrenos',
      icon: '🧹',
      color: '#10B981',
      priority: Priority.MEDIUM,
      slaDays: 2,
      keywords: ['lixo', 'sujeira', 'limpeza', 'coleta', 'varricao', 'mato'],
    },
    {
      name: 'Poda de Árvores',
      slug: 'poda-de-arvores',
      description: 'Corte e poda de árvores em vias públicas e praças',
      icon: '🌳',
      color: '#22C55E',
      priority: Priority.MEDIUM,
      slaDays: 5,
      keywords: ['arvore', 'galho', 'poda', 'corte', 'vegetal', 'raiz'],
    },
    {
      name: 'Drenagem e Esgoto',
      slug: 'drenagem-e-esgoto',
      description: 'Desentupimento de bueiros, galerias e rede de drenagem',
      icon: '🚿',
      color: '#3B82F6',
      priority: Priority.HIGH,
      slaDays: 1,
      keywords: ['bueiro', 'esgoto', 'agua', 'alagamento', 'entupido', 'drenagem'],
    },
    {
      name: 'Calçadas e Passeios',
      slug: 'calcadas-e-passeios',
      description: 'Reparo e manutenção de calçadas e passeios públicos',
      icon: '🚶',
      color: '#8B5CF6',
      priority: Priority.LOW,
      slaDays: 7,
      keywords: ['calcada', 'passeio', 'piso', 'quebrado', 'acessibilidade'],
    },
    {
      name: 'Sinalização',
      slug: 'sinalizacao',
      description: 'Instalação e manutenção de placas e sinalização viária',
      icon: '🚧',
      color: '#F97316',
      priority: Priority.MEDIUM,
      slaDays: 3,
      keywords: ['placa', 'sinalizacao', 'transito', 'faixa', 'pintura'],
    },
    {
      name: 'Praças e Áreas Verdes',
      slug: 'pracas-e-areas-verdes',
      description: 'Manutenção de praças, jardins e áreas de lazer',
      icon: '🏞️',
      color: '#14B8A6',
      priority: Priority.LOW,
      slaDays: 5,
      keywords: ['praca', 'jardim', 'parque', 'banco', 'brinquedo', 'lazer'],
    },
    {
      name: 'Entulho e Descarte Irregular',
      slug: 'entulho-e-descarte-irregular',
      description: 'Remoção de entulho e lixo descartado irregularmente',
      icon: '🗑️',
      color: '#6B7280',
      priority: Priority.MEDIUM,
      slaDays: 3,
      keywords: ['entulho', 'descarte', 'irregular', 'obra', 'material'],
    },
    {
      name: 'Animais',
      slug: 'animais',
      description: 'Recolhimento de animais mortos e controle de pragas urbanas',
      icon: '🐾',
      color: '#A855F7',
      priority: Priority.HIGH,
      slaDays: 1,
      keywords: ['animal', 'cachorro', 'gato', 'morto', 'rato', 'inseto'],
    },
  ];

  for (const cat of categorias) {
    await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        priority: cat.priority,
        slaDays: cat.slaDays,
        keywords: cat.keywords,
        secretaryId: semsur.id,
        isActive: true,
      },
    });
    console.log(`   ✅ ${cat.icon} ${cat.name}`);
  }
  console.log('');

  // ============================================
  // 3. CRIAR USUÁRIOS DO SISTEMA
  // ============================================
  console.log('👥 Criando usuários...');

  const senhaHash = await bcryptjs.hash('Semsur@2026', 10);

  // Admin do Sistema
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador SEMSUR',
      email: 'admin@semsur.parnamirim.rn.gov.br',
      password: senhaHash,
      role: Role.ADMIN,
      phone: '(84) 99999-0001',
      isActive: true,
      secretaryId: semsur.id,
    },
  });
  console.log(`   ✅ Admin: ${admin.email}`);

  // Coordenador
  const coordenador = await prisma.user.create({
    data: {
      name: 'Coordenador de Serviços',
      email: 'coordenador@semsur.parnamirim.rn.gov.br',
      password: senhaHash,
      role: Role.COORDINATOR,
      phone: '(84) 99999-0002',
      isActive: true,
      secretaryId: semsur.id,
    },
  });
  console.log(`   ✅ Coordenador: ${coordenador.email}`);

  // Operadores de campo
  const operadores = [
    { name: 'Equipe Tapa-Buraco', email: 'tapaburacos@semsur.parnamirim.rn.gov.br' },
    { name: 'Equipe Iluminação', email: 'iluminacao@semsur.parnamirim.rn.gov.br' },
    { name: 'Equipe Limpeza', email: 'limpeza@semsur.parnamirim.rn.gov.br' },
  ];

  for (const op of operadores) {
    const user = await prisma.user.create({
      data: {
        name: op.name,
        email: op.email,
        password: senhaHash,
        role: Role.OPERATOR,
        isActive: true,
        secretaryId: semsur.id,
      },
    });
    console.log(`   ✅ Operador: ${user.email}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED DE PRODUÇÃO CONCLUÍDO COM SUCESSO!');
  console.log('='.repeat(50));
  console.log('\n📋 CREDENCIAIS DE ACESSO:');
  console.log('   Email: admin@semsur.parnamirim.rn.gov.br');
  console.log('   Senha: Semsur@2026');
  console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro acesso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
