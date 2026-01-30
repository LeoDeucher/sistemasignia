import { Employee, Department, BlogPost, AcademyResource, ResourceType, Banner, WikiPage, MarketingAsset, AppLink, PatchNote } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
    {
        id: "1",
        name: "Alice Johnson",
        role: "CEO",
        department: Department.MANAGEMENT,
        email: "alice@signia.studio",
        avatar: "https://picsum.photos/id/64/200/200",
        bio: "Visionary leader with 15 years in digital creative industries.",
        joinedDate: "2015-01-10",
        birthday: "05-12",
        socials: { linkedin: "#" }
    },
    {
        id: "2",
        name: "Bob Smith",
        role: "CTO",
        department: Department.DEVELOPMENT,
        email: "bob@signia.studio",
        avatar: "https://picsum.photos/id/65/200/200",
        bio: "Tech enthusiast and architect of our core platforms.",
        joinedDate: "2015-03-22",
        birthday: "08-24",
        reportsTo: "1",
        socials: { github: "#", linkedin: "#" }
    },
    {
        id: "3",
        name: "Carol Williams",
        role: "Head of Design",
        department: Department.DESIGN,
        email: "carol@signia.studio",
        avatar: "https://picsum.photos/id/66/200/200",
        bio: "Award-winning designer passionate about UX.",
        joinedDate: "2016-06-01",
        birthday: "11-03",
        reportsTo: "1",
        socials: { behance: "#" }
    },
    {
        id: "4",
        name: "David Brown",
        role: "Senior Frontend Dev",
        department: Department.DEVELOPMENT,
        email: "david@signia.studio",
        avatar: "https://picsum.photos/id/91/200/200",
        bio: "React and TypeScript wizard.",
        joinedDate: "2018-09-15",
        birthday: "02-14",
        reportsTo: "2"
    },
    {
        id: "5",
        name: "Eva Davis",
        role: "UI Designer",
        department: Department.DESIGN,
        email: "eva@signia.studio",
        avatar: "https://picsum.photos/id/129/200/200",
        bio: "Creating beautiful interfaces one pixel at a time.",
        joinedDate: "2019-11-20",
        birthday: "10-30", // Matches "Today" for demo purposes potentially
        reportsTo: "3"
    },
    {
        id: "6",
        name: "Frank Miller",
        role: "Marketing Director",
        department: Department.MARKETING,
        email: "frank@signia.studio",
        avatar: "https://picsum.photos/id/177/200/200",
        bio: "Growth hacker and brand storyteller.",
        joinedDate: "2017-02-10",
        birthday: "12-05",
        reportsTo: "1"
    }
];

export const INITIAL_BANNERS: Banner[] = [
    {
        id: "b1",
        imageUrl: "https://picsum.photos/1920/480?grayscale",
        title: "Welcome to Signia Studios Intranet",
        active: true,
        order: 1
    },
    {
        id: "b2",
        imageUrl: "https://picsum.photos/1920/480?blur=2",
        title: "Q3 Townhall Meeting - Join us this Friday",
        active: true,
        order: 2
    }
];

export const INITIAL_POSTS: BlogPost[] = [
    {
        id: "p1",
        title: "Launching the New Brand Identity",
        excerpt: "We are thrilled to announce our new logo and color palette...",
        content: "<p>We are thrilled to announce our new logo and color palette. This change reflects our evolution as a company.</p><h3>Why the change?</h3><p>We wanted something more modern.</p>",
        coverImage: "https://picsum.photos/800/400?random=1",
        authorId: "6",
        date: "2023-10-25",
        tags: ["Company News", "Branding"]
    },
    {
        id: "p2",
        title: "Holiday Party Details",
        excerpt: "Get ready for the biggest event of the year!",
        content: "<p>The holiday party will be held at the Grand Hotel.</p>",
        coverImage: "https://picsum.photos/800/400?random=2",
        authorId: "1",
        date: "2023-10-20",
        tags: ["Events", "Fun"]
    },
    {
        id: "p3",
        title: "Tech Talk: The Future of AI",
        excerpt: "Join Bob for a deep dive into Gemini API.",
        content: "<p>Bob will be discussing how we can leverage Gemini 1.5 Pro.</p>",
        coverImage: "https://picsum.photos/800/400?random=3",
        authorId: "2",
        date: "2023-10-18",
        tags: ["Tech", "AI"]
    }
];

export const INITIAL_RESOURCES: AcademyResource[] = [
    {
        id: "r1",
        title: "Onboarding Checklist 2024",
        description: "Everything you need to know for your first week.",
        type: ResourceType.PDF,
        url: "#",
        thumbnail: "https://picsum.photos/300/200?random=4",
        durationOrSize: "1.2 MB"
    },
    {
        id: "r2",
        title: "React Best Practices",
        description: "Internal coding standards video.",
        type: ResourceType.VIDEO,
        url: "#",
        thumbnail: "https://picsum.photos/300/200?random=5",
        durationOrSize: "45 min"
    },
    {
        id: "r3",
        title: "Design System Guidelines",
        description: "E-book covering our typography and color usage.",
        type: ResourceType.EBOOK,
        url: "#",
        thumbnail: "https://picsum.photos/300/200?random=6",
        durationOrSize: "15 Pages"
    }
];

export const INITIAL_WIKI: WikiPage[] = [
    {
        id: "w1",
        title: "Our Core Values",
        category: "Culture",
        content: "1. Innovation\n2. Integrity\n3. Collaboration"
    },
    {
        id: "w2",
        title: "Health Insurance",
        category: "Benefits",
        content: "We offer comprehensive health coverage..."
    },
    {
        id: "w3",
        title: "Expense Reimbursement",
        category: "Processes",
        content: "Submit your expenses via the finance portal by the 25th."
    }
];

export const INITIAL_APPS: AppLink[] = [
    {
        id: "a1",
        name: "Jira",
        icon: "Ticket",
        url: "#",
        description: "Project Tracking",
        category: "External"
    },
    {
        id: "a2",
        name: "Slack",
        icon: "MessageSquare",
        url: "#",
        description: "Communication",
        category: "External"
    },
    {
        id: "a3",
        name: "Google AI Studio",
        icon: "Cpu",
        url: "https://aistudio.google.com/",
        description: "Prototyping & Prompt Engineering",
        category: "AI Studio"
    },
    {
        id: "a4",
        name: "HR Portal",
        icon: "Users",
        url: "#",
        description: "Leave & Payroll",
        category: "Internal"
    }
];

export const INITIAL_MARKETING: MarketingAsset[] = [
    { id: "m1", title: "Official Logo Pack", type: "Logo", thumbnail: "https://picsum.photos/300/200?random=10", downloadUrl: "#" },
    { id: "m2", title: "Brand Intro Video", type: "Video", thumbnail: "https://picsum.photos/300/200?random=11", downloadUrl: "#" }
];

export const INITIAL_PATCH_NOTES: PatchNote[] = [
    {
        version: "1.1.5",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "Hotfix: Correção de erros de tipagem com a biblioteca D3.js no Organograma.",
            "Estabilidade: Garantia de renderização do organograma mesmo com definições de tipo ausentes."
        ]
    },
    {
        version: "1.1.4",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "Critical Hotfix: Resolvido erro de 'Tela Branca' removendo a dependência estrita de indexação no carregamento.",
            "Database: Ordenação de notas de atualização migrada para memória para garantir estabilidade.",
            "Database: Atualização para Schema v3 para corrigir índices em background."
        ]
    },
    {
        version: "1.1.3",
        date: "2023-10-31",
        changes: [
            "Hotfix: Atualização da estrutura do banco de dados (Indexação de Data).",
            "Correção: Erro de SchemaError 'KeyPath date on object store patchNotes is not indexed' resolvido."
        ]
    },
    {
        version: "1.1.2",
        date: "2023-10-30",
        changes: [
            "Hotfix: Correção crítica de dependências (React 18 + Dexie Hooks) resolvendo erro de carregamento.",
            "Estabilidade: Padronização das versões do React e React DOM."
        ]
    },
    {
        version: "1.1.1",
        date: "2023-10-29",
        changes: [
            "Correção de tipagem no módulo de banco de dados (Dexie).",
            "Melhoria na estabilidade da inicialização do banco de dados."
        ]
    },
    {
        version: "1.1.0",
        date: "2023-10-29",
        changes: [
            "Arquitetura de Dados: Implementação de banco de dados assíncrono (IndexedDB).",
            "Performance: Suporte para grande volume de dados locais via Dexie.js.",
            "Persistência: Dados do admin agora persistem após recarregar a página.",
            "Backend: Camada de serviço preparada para integração futura com API Vercel.",
            "UI: Adicionado indicadores de carregamento (Loading States)."
        ]
    },
    {
        version: "1.0.0",
        date: "2023-10-28",
        changes: [
            "Lançamento inicial da Intranet Signia Studios.",
            "Implementação do Feed de Notícias e Blog.",
            "Diretório de Profissionais com busca e filtros.",
            "Organograma dinâmico visualizando hierarquia.",
            "Signia Academy para recursos de aprendizado.",
            "Painel Administrativo para gestão de conteúdo."
        ]
    }
];