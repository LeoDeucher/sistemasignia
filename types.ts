export enum Department {
    MANAGEMENT = "Management",
    DESIGN = "Design",
    DEVELOPMENT = "Development",
    MARKETING = "Marketing",
    HR = "Human Resources",
    OPERATIONS = "Operations"
}

export enum ResourceType {
    VIDEO = "Video",
    PDF = "PDF",
    EBOOK = "E-Book",
    TEMPLATE = "Template"
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    department: Department;
    email: string;
    phone?: string;
    avatar: string;
    bio: string;
    joinedDate: string;
    birthday: string; // MM-DD
    reportsTo?: string; // ID of the manager
    socials?: {
        linkedin?: string;
        github?: string;
        behance?: string;
    };
}

export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string; // HTML or Markdown
    coverImage: string;
    authorId: string;
    date: string;
    tags: string[];
}

export interface AcademyResource {
    id: string;
    title: string;
    description: string;
    type: ResourceType;
    url: string;
    thumbnail: string;
    durationOrSize?: string; // "10 min" or "2.5 MB"
}

export interface Banner {
    id: string;
    imageUrl: string;
    title: string;
    link?: string;
    active: boolean;
    order: number;
}

export interface WikiPage {
    id: string;
    title: string;
    category: "Culture" | "Benefits" | "Processes";
    content: string;
}

export interface MarketingAsset {
    id: string;
    title: string;
    type: "Logo" | "Video" | "Post" | "Presentation";
    thumbnail: string;
    downloadUrl: string;
}

export interface AppLink {
    id: string;
    name: string;
    icon: string; // Lucide icon name or URL
    url: string;
    description: string;
    category: "Internal" | "AI Studio" | "External";
}

export interface PatchNote {
    version: string;
    date: string;
    changes: string[];
}