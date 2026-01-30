import Dexie, { type Table } from 'dexie';
import { 
    Employee, BlogPost, AcademyResource, Banner, 
    WikiPage, AppLink, PatchNote, MarketingAsset 
} from '../types';
import { 
    INITIAL_EMPLOYEES, INITIAL_BANNERS, INITIAL_POSTS, 
    INITIAL_RESOURCES, INITIAL_WIKI, INITIAL_APPS, 
    INITIAL_PATCH_NOTES, INITIAL_MARKETING 
} from './mockData';

class SigniaDatabase extends Dexie {
    employees!: Table<Employee>;
    banners!: Table<Banner>;
    posts!: Table<BlogPost>;
    resources!: Table<AcademyResource>;
    wiki!: Table<WikiPage>;
    apps!: Table<AppLink>;
    marketingAssets!: Table<MarketingAsset>;
    patchNotes!: Table<PatchNote>;

    constructor() {
        super('SigniaIntranetDB');
        
        // Define tables and indexes
        // Cast to any to avoid type errors if Dexie type definitions are incomplete in the environment
        (this as any).version(1).stores({
            employees: 'id, department, role',
            banners: 'id, active, order',
            posts: 'id, authorId, date, *tags',
            resources: 'id, type',
            wiki: 'id, category',
            apps: 'id, category',
            marketingAssets: 'id, type',
            patchNotes: 'version' // Using version as primary key
        });
    }
}

export const db = new SigniaDatabase();

// Initialize and Seed Database if empty
export const initDB = async () => {
    try {
        await (db as any).open();
        
        const empCount = await db.employees.count();
        
        if (empCount === 0) {
            console.log("Seeding database with initial data...");
            await (db as any).transaction('rw', 
                [db.employees, db.banners, db.posts, db.resources, db.wiki, db.apps, db.marketingAssets, db.patchNotes], 
                async () => {
                await db.employees.bulkAdd(INITIAL_EMPLOYEES);
                await db.banners.bulkAdd(INITIAL_BANNERS);
                await db.posts.bulkAdd(INITIAL_POSTS);
                await db.resources.bulkAdd(INITIAL_RESOURCES);
                await db.wiki.bulkAdd(INITIAL_WIKI);
                await db.apps.bulkAdd(INITIAL_APPS);
                await db.marketingAssets.bulkAdd(INITIAL_MARKETING);
                // Ensure patch notes are unique by version before adding
                const uniqueNotes = INITIAL_PATCH_NOTES.filter((note, index, self) => 
                    index === self.findIndex((t) => (t.version === note.version))
                );
                await db.patchNotes.bulkAdd(uniqueNotes);
            });
            console.log("Database seeded successfully.");
        }
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
};

// Service Layer wrapper (mimics what a Vercel API client would look like)
export const api = {
    employees: {
        list: () => db.employees.toArray(),
        add: (emp: Employee) => db.employees.add(emp),
        delete: (id: string) => db.employees.delete(id),
    },
    banners: {
        list: () => db.banners.toArray(),
        add: (b: Banner) => db.banners.add(b),
        update: (id: string, updates: Partial<Banner>) => db.banners.update(id, updates),
    },
    // We can expand this pattern for all entities
};