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
        
        // Version 1: Initial Schema
        (this as any).version(1).stores({
            employees: 'id, department, role',
            banners: 'id, active, order',
            posts: 'id, authorId, date, *tags',
            resources: 'id, type',
            wiki: 'id, category',
            apps: 'id, category',
            marketingAssets: 'id, type',
            patchNotes: 'version' 
        });

        // Version 2: Add date index to patchNotes 
        (this as any).version(2).stores({
            patchNotes: 'version, date'
        });
        
        // Version 3: Redundant ensure of schema
        (this as any).version(3).stores({
            employees: 'id, department, role',
            banners: 'id, active, order',
            posts: 'id, authorId, date, *tags',
            resources: 'id, type',
            wiki: 'id, category',
            apps: 'id, category',
            marketingAssets: 'id, type',
            patchNotes: 'version, date'
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

// Data Safety Features: Backup and Restore
export const backupDatabase = async () => {
    try {
        const data = {
            employees: await db.employees.toArray(),
            banners: await db.banners.toArray(),
            posts: await db.posts.toArray(),
            resources: await db.resources.toArray(),
            wiki: await db.wiki.toArray(),
            apps: await db.apps.toArray(),
            marketingAssets: await db.marketingAssets.toArray(),
            patchNotes: await db.patchNotes.toArray(),
            timestamp: new Date().toISOString(),
            schemaVersion: 3
        };
        return JSON.stringify(data, null, 2);
    } catch (err) {
        console.error("Backup failed:", err);
        throw new Error("Failed to generate backup.");
    }
};

export const restoreDatabase = async (jsonString: string) => {
    try {
        const data = JSON.parse(jsonString);
        if (!data.timestamp || !data.employees) throw new Error("Invalid backup file format.");

        await (db as any).transaction('rw', 
            [db.employees, db.banners, db.posts, db.resources, db.wiki, db.apps, db.marketingAssets, db.patchNotes], 
            async () => {
            // Clear existing data to prevent duplicates/conflicts
            await db.employees.clear(); 
            if(data.employees?.length) await db.employees.bulkAdd(data.employees);

            await db.banners.clear(); 
            if(data.banners?.length) await db.banners.bulkAdd(data.banners);

            await db.posts.clear(); 
            if(data.posts?.length) await db.posts.bulkAdd(data.posts);

            await db.resources.clear(); 
            if(data.resources?.length) await db.resources.bulkAdd(data.resources);

            await db.wiki.clear(); 
            if(data.wiki?.length) await db.wiki.bulkAdd(data.wiki);

            await db.apps.clear(); 
            if(data.apps?.length) await db.apps.bulkAdd(data.apps);

            await db.marketingAssets.clear(); 
            if(data.marketingAssets?.length) await db.marketingAssets.bulkAdd(data.marketingAssets);

            await db.patchNotes.clear(); 
            if(data.patchNotes?.length) await db.patchNotes.bulkAdd(data.patchNotes);
        });
        return true;
    } catch (err) {
        console.error("Restore failed:", err);
        throw err;
    }
};

// Service Layer wrapper
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
    // Generic handlers for dynamic admin usage
    generic: {
        add: (table: string, item: any) => (db as any)[table].add(item),
        update: (table: string, id: string, updates: any) => (db as any)[table].update(id, updates),
        delete: (table: string, id: string) => (db as any)[table].delete(id),
    }
};