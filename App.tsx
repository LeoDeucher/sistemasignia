import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import * as d3 from 'd3';
import { 
    Employee, Department, BlogPost, AcademyResource, Banner, 
    WikiPage, AppLink, PatchNote, ResourceType, MarketingAsset 
} from './types';
import { db, initDB, api, backupDatabase, restoreDatabase } from './services/db';
import { useLiveQuery } from 'dexie-react-hooks';

// --- Toast Notification System ---
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

const ToastContext = React.createContext<{ addToast: (msg: string, type: ToastType) => void } | null>(null);

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
            <div key={t.id} className={`pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-lg text-white flex justify-between items-center animate-bounce-in ${
                t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`}>
                <span>{t.message}</span>
                <button onClick={() => removeToast(t.id)} className="ml-4 hover:text-gray-200"><Lucide.X size={16}/></button>
            </div>
        ))}
    </div>
);

// --- Modal Component ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><Lucide.X size={20}/></button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Global State Controller (Async + DB) ---
const useAppController = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    // Initialize DB on mount
    useEffect(() => {
        const boot = async () => {
            await initDB();
            setIsLoading(false);
        };
        boot();
    }, []);

    // Live Queries
    const employees = useLiveQuery(() => db.employees.toArray()) || [];
    const banners = useLiveQuery(() => db.banners.toArray()) || [];
    const posts = useLiveQuery(() => db.posts.toArray()) || [];
    const resources = useLiveQuery(() => db.resources.toArray()) || [];
    const wiki = useLiveQuery(() => db.wiki.toArray()) || [];
    const apps = useLiveQuery(() => db.apps.toArray()) || [];
    
    // Use memory sort for safety
    const patchNotes = useLiveQuery(async () => {
        const notes = await db.patchNotes.toArray();
        return notes.sort((a, b) => b.date.localeCompare(a.date));
    }) || [];
    
    const marketingAssets = useLiveQuery(() => db.marketingAssets.toArray()) || [];

    // Generic Action Wrapper
    const performAction = async (action: () => Promise<void>, successMsg: string) => {
        try {
            await action();
            addToast(successMsg, 'success');
        } catch (error) {
            console.error(error);
            addToast("Operation failed. See console.", 'error');
        }
    };

    return {
        isLoading,
        toasts, removeToast, addToast,
        employees, 
        banners, 
        posts,
        resources,
        wiki,
        apps,
        marketingAssets,
        patchNotes,
        performAction
    };
};

// --- Reusable Components ---

const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => (
    <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
        {children}
    </div>
);

const SectionTitle: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
    </div>
);

const Badge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = "bg-signia-100 text-signia-900" }) => (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${color}`}>
        {children}
    </span>
);

const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <Lucide.Loader2 className="w-10 h-10 text-signia-600 animate-spin" />
        <p className="text-gray-500 font-medium">Connecting to Database...</p>
    </div>
);

// --- Module: Home ---

const HomeModule = ({ 
    store, navigate 
}: { 
    store: ReturnType<typeof useAppController>, 
    navigate: (page: string) => void 
}) => {
    const activeBanners = store.banners.filter(b => b.active).sort((a, b) => a.order - b.order);
    const [currentBanner, setCurrentBanner] = useState(0);

    // Banner Rotation
    useEffect(() => {
        if (activeBanners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % activeBanners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [activeBanners.length]);

    // Birthdays
    const currentMonth = new Date().getMonth() + 1;
    const birthdays = store.employees.filter(e => {
        const [m] = e.birthday.split('-').map(Number);
        return m === currentMonth;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Banner */}
            {activeBanners.length > 0 && (
                <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg group">
                    <img 
                        src={activeBanners[currentBanner].imageUrl} 
                        alt={activeBanners[currentBanner].title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{activeBanners[currentBanner].title}</h1>
                        {activeBanners[currentBanner].link && (
                            <button className="bg-white text-signia-600 px-6 py-2 rounded-full font-semibold w-max hover:bg-gray-100 transition">
                                Learn More
                            </button>
                        )}
                    </div>
                    {/* Indicators */}
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                        {activeBanners.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentBanner ? 'bg-white w-6' : 'bg-white/50'}`} 
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* News Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Lucide.Newspaper className="w-5 h-5 text-signia-600"/> Latest News
                        </h2>
                        <button onClick={() => navigate('blog')} className="text-signia-600 text-sm font-medium hover:underline">View All</button>
                    </div>
                    <div className="grid gap-4">
                        {store.posts.slice(0, 3).map(post => (
                            <Card key={post.id} className="flex flex-col md:flex-row p-4 gap-4 hover:shadow-md transition cursor-pointer" onClick={() => navigate('blog')} >
                                <img src={post.coverImage} className="w-full md:w-32 h-32 object-cover rounded-lg bg-gray-200" alt={post.title}/>
                                <div className="flex-1">
                                    <div className="flex gap-2 mb-2">
                                        {post.tags.map(t => <Badge key={t}>{t}</Badge>)}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
                                    <div className="mt-2 text-xs text-gray-400">
                                        {new Date(post.date).toLocaleDateString()} • By {store.employees.find(e => e.id === post.authorId)?.name || 'Unknown'}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    {/* Birthdays */}
                    <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                        <div className="flex items-center gap-2 mb-4">
                            <Lucide.Cake className="w-6 h-6" />
                            <h3 className="font-bold text-lg">Birthdays this Month</h3>
                        </div>
                        {birthdays.length === 0 ? (
                            <p className="text-white/80 italic">No birthdays this month.</p>
                        ) : (
                            <ul className="space-y-3">
                                {birthdays.map(emp => (
                                    <li key={emp.id} className="flex items-center gap-3">
                                        <img src={emp.avatar} className="w-8 h-8 rounded-full border-2 border-white/30" alt={emp.name} />
                                        <div>
                                            <p className="font-medium text-sm">{emp.name}</p>
                                            <p className="text-xs text-white/70">{emp.birthday.split('-')[1]}th</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    {/* Quick Links */}
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Lucide.Zap className="w-5 h-5 text-yellow-500" /> Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => navigate('apps')} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 flex flex-col items-center gap-2 transition">
                                <Lucide.LayoutGrid className="w-5 h-5 text-signia-600" /> All Apps
                            </button>
                            <button onClick={() => navigate('directory')} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 flex flex-col items-center gap-2 transition">
                                <Lucide.Users className="w-5 h-5 text-signia-600" /> Directory
                            </button>
                            <button onClick={() => navigate('wiki')} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 flex flex-col items-center gap-2 transition">
                                <Lucide.BookOpen className="w-5 h-5 text-signia-600" /> Onboarding
                            </button>
                            <button onClick={() => navigate('academy')} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 flex flex-col items-center gap-2 transition">
                                <Lucide.GraduationCap className="w-5 h-5 text-signia-600" /> Academy
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// --- Module: Wiki ---
const WikiModule = ({ store }: { store: ReturnType<typeof useAppController> }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);

    const categories = ["All", "Culture", "Benefits", "Processes"];
    const filteredWiki = store.wiki.filter(p => selectedCategory === "All" || p.category === selectedCategory);

    return (
        <div className="space-y-6">
            <SectionTitle title="Wiki & Knowledge Base" subtitle="Policies, guides, and culture." />
            
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setSelectedPage(null); }}
                            className={`text-left px-4 py-3 rounded-lg font-medium transition ${selectedCategory === cat ? 'bg-signia-100 text-signia-700' : 'hover:bg-gray-100 text-gray-600'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1">
                    {selectedPage ? (
                        <Card className="p-8 animate-fade-in">
                            <button onClick={() => setSelectedPage(null)} className="mb-4 text-sm text-signia-600 flex items-center gap-1 hover:underline">
                                <Lucide.ArrowLeft size={16}/> Back to list
                            </button>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedPage.title}</h2>
                            <Badge>{selectedPage.category}</Badge>
                            <div className="mt-6 prose prose-blue max-w-none text-gray-700 whitespace-pre-line">
                                {selectedPage.content}
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filteredWiki.map(page => (
                                <Card key={page.id} className="p-6 hover:shadow-md transition cursor-pointer flex justify-between items-center" onClick={() => setSelectedPage(page)}>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{page.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">{page.content.substring(0, 100)}...</p>
                                    </div>
                                    <Lucide.ChevronRight className="text-gray-300" />
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Module: Apps ---
const AppsModule = ({ store }: { store: ReturnType<typeof useAppController> }) => {
    const categories = ["Internal", "External", "AI Studio"];

    const getIcon = (name: string) => {
        // Dynamic icon lookup logic could go here, for now simpler fallback
        const Map: any = {
            "Ticket": Lucide.Ticket,
            "MessageSquare": Lucide.MessageSquare,
            "Cpu": Lucide.Cpu,
            "Users": Lucide.Users,
            "PenTool": Lucide.PenTool,
            "Github": Lucide.Github
        };
        const Icon = Map[name] || Lucide.Box;
        return <Icon className="w-8 h-8 mb-3 text-signia-600" />;
    };

    return (
        <div className="space-y-8">
            <SectionTitle title="App Launcher" subtitle="Tools and platforms for your daily work." />
            
            {categories.map(cat => {
                const apps = store.apps.filter(a => a.category === cat);
                if (apps.length === 0) return null;
                
                return (
                    <div key={cat}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2 border-l-4 border-signia-500">{cat}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {apps.map(app => (
                                <a key={app.id} href={app.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <Card className="p-6 flex flex-col items-center text-center h-full hover:shadow-lg hover:-translate-y-1 transition duration-300 group">
                                        <div className="group-hover:scale-110 transition-transform duration-300">
                                            {getIcon(app.icon)}
                                        </div>
                                        <h4 className="font-bold text-gray-900">{app.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{app.description}</p>
                                    </Card>
                                </a>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- Module: Blog ---
const BlogModule = ({ store }: { store: ReturnType<typeof useAppController> }) => {
    return (
        <div className="space-y-6">
            <SectionTitle title="Company Blog" subtitle="News, updates, and stories." />
            <div className="grid gap-8 max-w-4xl mx-auto">
                {store.posts.map(post => (
                    <Card key={post.id} className="overflow-hidden">
                        <img src={post.coverImage} className="w-full h-64 object-cover" alt={post.title} />
                        <div className="p-8">
                            <div className="flex gap-2 mb-3">
                                {post.tags.map(t => <Badge key={t}>{t}</Badge>)}
                                <span className="text-sm text-gray-500 ml-auto">{new Date(post.date).toLocaleDateString()}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h2>
                            <div className="prose max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: post.content }}></div>
                            <div className="mt-6 pt-6 border-t flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                     <img src={store.employees.find(e => e.id === post.authorId)?.avatar || "https://picsum.photos/200"} alt="author" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    Written by {store.employees.find(e => e.id === post.authorId)?.name || 'Editor'}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- Module: Directory (Kept mostly same, just ensured integration) ---
// (Refactored slightly for cleaner code in App.tsx)
const Organogram = ({ employees }: { employees: Employee[] }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!containerRef.current || employees.length === 0) return;
        const d3Any = d3 as any;
        d3Any.select(containerRef.current).selectAll("*").remove();
        const data = d3Any.stratify().id((d: any) => d.id).parentId((d: any) => d.reportsTo)(employees);
        const treeLayout = d3Any.tree().size([800, 400]);
        const root = d3Any.hierarchy(data);
        treeLayout(root);
        const svg = d3Any.select(containerRef.current).append("svg").attr("width", "100%").attr("height", 500).append("g").attr("transform", "translate(50,50)");
        svg.selectAll(".link").data(root.links()).enter().append("path").attr("class", "link").attr("fill", "none").attr("stroke", "#cbd5e1").attr("stroke-width", 2).attr("d", d3Any.linkHorizontal().x((d: any) => d.y).y((d: any) => d.x));
        const node = svg.selectAll(".node").data(root.descendants()).enter().append("g").attr("transform", (d: any) => `translate(${d.y},${d.x})`);
        node.append("circle").attr("r", 20).style("fill", "#0284c7").style("stroke", "#fff").style("stroke-width", 2);
        node.append("text").attr("dy", 35).attr("x", (d: any) => d.children ? -8 : 8).style("text-anchor", "middle").text((d: any) => d.data.data.name).style("font-size", "12px").style("fill", "#334155").style("font-weight", "600");
        node.append("text").attr("dy", 48).attr("x", (d: any) => d.children ? -8 : 8).style("text-anchor", "middle").text((d: any) => d.data.data.role).style("font-size", "10px").style("fill", "#64748b");
    }, [employees]);
    return <div className="overflow-auto border border-gray-200 rounded-xl bg-white p-4"><div ref={containerRef} className="min-w-[800px] min-h-[500px]"></div></div>;
};

const DirectoryModule = ({ store }: { store: ReturnType<typeof useAppController> }) => {
    const [view, setView] = useState<'list' | 'org'>('list');
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("All");

    const filteredEmployees = store.employees.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
        const matchesDept = deptFilter === "All" || e.department === deptFilter;
        return matchesSearch && matchesDept;
    });

    return (
        <div className="space-y-6">
            <SectionTitle title="People Directory" subtitle="Find your colleagues and understand the structure." />
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                <div className="flex gap-2">
                    <div className="relative">
                        <Lucide.Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-signia-500 w-64" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="border rounded-lg px-3 py-2 text-gray-600 focus:outline-none" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                        <option value="All">All Departments</option>
                        {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' ? 'bg-white shadow text-signia-600' : 'text-gray-500'}`}>List</button>
                    <button onClick={() => setView('org')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'org' ? 'bg-white shadow text-signia-600' : 'text-gray-500'}`}>Org Chart</button>
                </div>
            </div>
            {view === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map(emp => (
                        <Card key={emp.id} className="p-6 flex flex-col items-center text-center hover:shadow-md transition">
                            <img src={emp.avatar} alt={emp.name} className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-gray-50" />
                            <h3 className="text-lg font-bold text-gray-900">{emp.name}</h3>
                            <p className="text-signia-600 font-medium text-sm mb-2">{emp.role}</p>
                            <Badge>{emp.department}</Badge>
                            <div className="mt-6 flex justify-center gap-3 w-full border-t pt-4">
                                <a href={`mailto:${emp.email}`} className="text-gray-400 hover:text-signia-600"><Lucide.Mail className="w-5 h-5"/></a>
                                {emp.socials?.linkedin && <a href={emp.socials.linkedin} className="text-gray-400 hover:text-blue-700"><Lucide.Linkedin className="w-5 h-5"/></a>}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (<Organogram employees={store.employees} />)}
        </div>
    );
};

// --- Module: Academy ---
const AcademyModule = ({ store }: { store: ReturnType<typeof useAppController> }) => {
    const [filter, setFilter] = useState("All");
    const filteredResources = store.resources.filter(r => filter === "All" || r.type === filter);
    return (
        <div className="space-y-6">
            <SectionTitle title="Signia Academy" subtitle="Internal knowledge base and learning resources." />
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {["All", ...Object.values(ResourceType)].map(type => (
                    <button key={type} onClick={() => setFilter(type)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === type ? 'bg-signia-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{type}</button>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredResources.map(res => (
                    <Card key={res.id} className="group hover:shadow-lg transition cursor-pointer">
                        <div className="relative h-40 overflow-hidden bg-gray-200">
                            <img src={res.thumbnail} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                                {res.type === ResourceType.VIDEO ? <Lucide.PlayCircle size={12}/> : <Lucide.FileText size={12}/>} {res.type}
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{res.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{res.description}</p>
                            <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3">
                                <span>{res.durationOrSize}</span>
                                <span className="text-signia-600 font-medium group-hover:underline">Access</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- Module: Admin ---
const AdminModule = ({ store }: { store: ReturnType<typeof useAppController> }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'banners' | 'content' | 'system'>('users');
    const [contentType, setContentType] = useState<'posts'|'apps'|'wiki'>('posts');
    const [backupFile, setBackupFile] = useState<File | null>(null);

    // User Management
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        name: "",
        role: "",
        department: Department.OPERATIONS,
        birthday: ""
    });

    const handleAddEmp = () => store.performAction(async () => {
        if (!newUserForm.name || !newUserForm.role) throw new Error("Name and Role are required");
        
        // Generate pseudo-email based on name
        const emailSlug = newUserForm.name.toLowerCase().replace(/\s+/g, '.');
        const email = `${emailSlug}@signia.studio`;

        await api.employees.add({
            id: Date.now().toString(),
            name: newUserForm.name, 
            role: newUserForm.role, 
            department: newUserForm.department,
            email: email, 
            avatar: `https://ui-avatars.com/api/?name=${newUserForm.name}&background=random`, 
            bio: "Welcome to the team!",
            joinedDate: new Date().toISOString().split('T')[0], 
            birthday: newUserForm.birthday || "01-01" // Default if missing
        });
        
        setNewUserForm({ name: "", role: "", department: Department.OPERATIONS, birthday: "" });
        setIsUserModalOpen(false);
    }, "Employee added successfully");

    // Backup Management
    const handleBackup = async () => {
        const json = await backupDatabase();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signia_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        store.addToast("Backup generated successfully", "success");
    };

    const handleRestore = async () => {
        if (!backupFile) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                await restoreDatabase(text);
                store.addToast("Database restored successfully. Please refresh.", "success");
                setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
                store.addToast("Restore failed. Invalid file.", "error");
            }
        };
        reader.readAsText(backupFile);
    };

    // Generic Delete
    const handleDelete = (table: string, id: string) => 
        store.performAction(async () => { await api.generic.delete(table, id); }, "Item deleted");

    return (
        <div className="space-y-6">
            <SectionTitle title="Admin Console" subtitle="Manage content, users and settings." />
            
            <div className="border-b flex space-x-6 mb-6 overflow-x-auto">
                {['users', 'banners', 'content', 'system'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-2 font-medium text-sm border-b-2 capitalize transition ${activeTab === tab ? 'border-signia-600 text-signia-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab}</button>
                ))}
            </div>

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Team Members</h3>
                        <button onClick={() => setIsUserModalOpen(true)} className="bg-signia-600 text-white px-4 py-2 rounded-lg hover:bg-signia-700 flex items-center gap-2 shadow-sm transition">
                            <Lucide.Plus size={18}/> Add User
                        </button>
                    </div>

                    <div className="bg-white rounded shadow overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Dept</th><th className="px-4 py-3">Actions</th></tr></thead>
                            <tbody className="divide-y">{store.employees.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{emp.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{emp.role}</td>
                                    <td className="px-4 py-3 text-gray-500"><Badge>{emp.department}</Badge></td>
                                    <td className="px-4 py-3"><button onClick={() => handleDelete('employees', emp.id)} className="text-red-500 hover:text-red-700"><Lucide.Trash2 size={16}/></button></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>

                    <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Add New Team Member">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-signia-500 outline-none" 
                                    placeholder="e.g. Jane Doe"
                                    value={newUserForm.name}
                                    onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role / Job Title</label>
                                <input 
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-signia-500 outline-none" 
                                    placeholder="e.g. Product Manager"
                                    value={newUserForm.role}
                                    onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select 
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-signia-500 outline-none"
                                        value={newUserForm.department}
                                        onChange={e => setNewUserForm({...newUserForm, department: e.target.value as Department})}
                                    >
                                        {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                                    <input 
                                        type="date"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-signia-500 outline-none"
                                        value={newUserForm.birthday} // In real app, might need format conversion MM-DD
                                        onChange={e => setNewUserForm({...newUserForm, birthday: e.target.value})}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Used for celebrations widget</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleAddEmp} 
                                className="w-full bg-signia-600 text-white font-bold py-2 rounded-lg mt-4 hover:bg-signia-700 transition shadow"
                            >
                                Create Account
                            </button>
                        </div>
                    </Modal>
                </div>
            )}

            {activeTab === 'banners' && (
                <div className="grid gap-4">
                    <div className="bg-blue-50 p-4 rounded text-blue-800 text-sm">Recommended Size: 1920x480px.</div>
                    {store.banners.map(b => (
                        <div key={b.id} className="flex items-center gap-4 bg-white p-4 rounded shadow">
                            <img src={b.imageUrl} className="w-32 h-16 object-cover rounded" alt="Banner" />
                            <div className="flex-1"><h4 className="font-bold">{b.title}</h4></div>
                            <button onClick={() => store.performAction(async () => { await api.banners.update(b.id, { active: !b.active }); }, "Banner updated")} className={`px-3 py-1 rounded text-xs font-bold ${b.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.active ? 'Active' : 'Inactive'}</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'content' && (
                <div className="space-y-6">
                    <div className="flex gap-2 mb-4">
                         {['posts', 'wiki', 'apps'].map(type => (
                             <button key={type} onClick={() => setContentType(type as any)} className={`px-3 py-1 rounded text-sm uppercase font-bold ${contentType === type ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}>{type}</button>
                         ))}
                    </div>
                    
                    {/* Simplified List View for Content Types */}
                    <div className="bg-white rounded shadow overflow-hidden">
                         {contentType === 'posts' && store.posts.map(item => (
                             <div key={item.id} className="p-4 border-b flex justify-between items-center hover:bg-gray-50">
                                 <span className="font-medium">{item.title}</span>
                                 <button onClick={() => handleDelete('posts', item.id)} className="text-red-500 text-sm">Delete</button>
                             </div>
                         ))}
                         {contentType === 'wiki' && store.wiki.map(item => (
                             <div key={item.id} className="p-4 border-b flex justify-between items-center hover:bg-gray-50">
                                 <div><span className="font-medium">{item.title}</span> <Badge>{item.category}</Badge></div>
                                 <button onClick={() => handleDelete('wiki', item.id)} className="text-red-500 text-sm">Delete</button>
                             </div>
                         ))}
                         {contentType === 'apps' && store.apps.map(item => (
                             <div key={item.id} className="p-4 border-b flex justify-between items-center hover:bg-gray-50">
                                 <div><span className="font-medium">{item.name}</span> <span className="text-gray-500 text-xs">({item.category})</span></div>
                                 <button onClick={() => handleDelete('apps', item.id)} className="text-red-500 text-sm">Delete</button>
                             </div>
                         ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">* Use the "Add" forms (not implemented in this simplified view) or edit directly in DB for advanced changes.</p>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <h3 className="font-bold text-lg mb-2">Backup Database</h3>
                        <p className="text-sm text-gray-500 mb-4">Download a copy of all system data to your local machine.</p>
                        <button onClick={handleBackup} className="bg-signia-600 text-white px-4 py-2 rounded hover:bg-signia-700 flex items-center gap-2"><Lucide.Download size={18}/> Export JSON</button>
                    </Card>
                    <Card className="p-6">
                        <h3 className="font-bold text-lg mb-2">Restore Database</h3>
                        <p className="text-sm text-gray-500 mb-4">Upload a JSON backup file. <span className="text-red-500">Warning: This will replace all current data.</span></p>
                        <div className="flex gap-2">
                            <input type="file" accept=".json" onChange={e => setBackupFile(e.target.files?.[0] || null)} className="text-sm border rounded p-1" />
                            <button onClick={handleRestore} disabled={!backupFile} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50">Restore</button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

// --- Main App Shell ---
const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${active ? 'bg-signia-50 text-signia-600 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
        <Icon size={20} /><span>{label}</span>
    </button>
);

export default function App() {
    const store = useAppController();
    const [currentPage, setCurrentPage] = useState('home');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Patch Notes
    const PatchNotesModule = () => (
        <div className="space-y-6">
            <SectionTitle title="System Updates" subtitle="Changelog and Patch Notes" />
            <div className="space-y-4">
                {store.patchNotes.map((note, idx) => (
                    <Card key={idx} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div><h3 className="text-xl font-bold text-gray-900">Version {note.version}</h3><p className="text-sm text-gray-500">{new Date(note.date).toLocaleDateString()}</p></div>
                            <Badge color="bg-green-100 text-green-800">Stable</Badge>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">{note.changes.map((change, cIdx) => (<li key={cIdx}>{change}</li>))}</ul>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderPage = () => {
        if (store.isLoading) return <LoadingScreen />;
        switch (currentPage) {
            case 'home': return <HomeModule store={store} navigate={setCurrentPage} />;
            case 'directory': return <DirectoryModule store={store} />;
            case 'academy': return <AcademyModule store={store} />;
            case 'admin': return <AdminModule store={store} />;
            case 'patch-notes': return <PatchNotesModule />;
            case 'wiki': return <WikiModule store={store} />;
            case 'apps': return <AppsModule store={store} />;
            case 'blog': return <BlogModule store={store} />;
            default: return <HomeModule store={store} navigate={setCurrentPage} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <ToastContainer toasts={store.toasts} removeToast={store.removeToast} />
            
            {/* Sidebar */}
            <aside className={`w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-20 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-signia-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Signia<span className="text-signia-600">Studios</span></span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden ml-auto text-gray-500"><Lucide.X size={20}/></button>
                </div>
                
                <nav className="flex-1 p-4 overflow-y-auto">
                    <SidebarItem icon={Lucide.Home} label="Home" active={currentPage === 'home'} onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }} />
                    <SidebarItem icon={Lucide.Newspaper} label="Blog Signia" active={currentPage === 'blog'} onClick={() => { setCurrentPage('blog'); setIsMobileMenuOpen(false); }} />
                    <SidebarItem icon={Lucide.Users} label="Directory" active={currentPage === 'directory'} onClick={() => { setCurrentPage('directory'); setIsMobileMenuOpen(false); }} />
                    <SidebarItem icon={Lucide.GraduationCap} label="Academy" active={currentPage === 'academy'} onClick={() => { setCurrentPage('academy'); setIsMobileMenuOpen(false); }} />
                    <SidebarItem icon={Lucide.BookOpen} label="Onboarding" active={currentPage === 'wiki'} onClick={() => { setCurrentPage('wiki'); setIsMobileMenuOpen(false); }} />
                    <SidebarItem icon={Lucide.LayoutGrid} label="Apps" active={currentPage === 'apps'} onClick={() => { setCurrentPage('apps'); setIsMobileMenuOpen(false); }} />
                    <div className="my-4 border-t border-gray-100"></div>
                    <SidebarItem icon={Lucide.FileText} label="Patch Notes" active={currentPage === 'patch-notes'} onClick={() => { setCurrentPage('patch-notes'); setIsMobileMenuOpen(false); }} />
                    
                    {isAdmin && (
                         <div className="mt-4 bg-gray-50 rounded-xl p-2 border border-dashed border-gray-300 animate-fade-in">
                            <p className="px-2 text-xs font-semibold text-gray-400 mb-2 uppercase">Admin</p>
                            <SidebarItem icon={Lucide.Settings} label="Console" active={currentPage === 'admin'} onClick={() => { setCurrentPage('admin'); setIsMobileMenuOpen(false); }} />
                         </div>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="https://picsum.photos/id/64/200/200" alt="User" className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">Alice Johnson</p>
                            <button onClick={() => setIsAdmin(!isAdmin)} className="text-xs text-signia-600 hover:underline">{isAdmin ? "Switch to User" : "Switch to Admin"}</button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 w-full bg-white border-b z-20 px-4 py-3 flex justify-between items-center shadow-sm">
                <span className="font-bold text-lg">Signia Studios</span>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><Lucide.Menu size={20}/></button>
            </header>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 transition-all">
                {renderPage()}
            </main>
        </div>
    );
}