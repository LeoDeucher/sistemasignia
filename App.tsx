import React, { useState, useMemo, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import * as d3 from 'd3';
import { 
    Employee, Department, BlogPost, AcademyResource, Banner, 
    WikiPage, AppLink, PatchNote, ResourceType, MarketingAsset 
} from './types';
import { db, initDB, api } from './services/db';
import { useLiveQuery } from 'dexie-react-hooks';

// --- Global State Controller (Async + DB) ---
// Using Dexie's useLiveQuery hook which automatically updates React state when DB changes.
const useAppController = () => {
    const [isLoading, setIsLoading] = useState(true);

    // Initialize DB on mount
    useEffect(() => {
        const boot = async () => {
            await initDB();
            setIsLoading(false);
        };
        boot();
    }, []);

    // Live Queries (Reactive bindings to IndexedDB)
    const employees = useLiveQuery(() => db.employees.toArray()) || [];
    const banners = useLiveQuery(() => db.banners.toArray()) || [];
    const posts = useLiveQuery(() => db.posts.toArray()) || [];
    const resources = useLiveQuery(() => db.resources.toArray()) || [];
    const wiki = useLiveQuery(() => db.wiki.toArray()) || [];
    const apps = useLiveQuery(() => db.apps.toArray()) || [];
    
    // SAFE QUERY: Perform sorting in memory to prevent SchemaError if 'date' index is missing in older DB versions
    const patchNotes = useLiveQuery(async () => {
        const notes = await db.patchNotes.toArray();
        return notes.sort((a, b) => b.date.localeCompare(a.date));
    }) || [];
    
    const marketingAssets = useLiveQuery(() => db.marketingAssets.toArray()) || [];

    // Admin Actions (Now Async & Persistent)
    const addEmployee = async (emp: Employee) => {
        await api.employees.add(emp);
    };
    
    const deleteEmployee = async (id: string) => {
        await api.employees.delete(id);
    };
    
    const addBanner = async (b: Banner) => {
        await api.banners.add(b);
    };
    
    const toggleBanner = async (id: string) => {
        const banner = banners.find(b => b.id === id);
        if (banner) {
            await api.banners.update(id, { active: !banner.active });
        }
    };
    
    return {
        isLoading,
        employees, addEmployee, deleteEmployee,
        banners, addBanner, toggleBanner,
        posts,
        resources,
        wiki,
        apps,
        marketingAssets,
        patchNotes
    };
};

// --- Reusable Components ---

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
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
                            <Card key={post.id} className="flex flex-col md:flex-row p-4 gap-4 hover:shadow-md transition cursor-pointer" >
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

// --- Module: Directory & Org Chart ---

const Organogram = ({ employees }: { employees: Employee[] }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || employees.length === 0) return;

        // Cast d3 to any to bypass type definition issues
        const d3Any = d3 as any;

        // Clear previous SVG
        d3Any.select(containerRef.current).selectAll("*").remove();

        const data = d3Any.stratify()
            .id((d: any) => d.id)
            .parentId((d: any) => d.reportsTo)(employees);

        const treeLayout = d3Any.tree().size([800, 400]);
        const root = d3Any.hierarchy(data);
        treeLayout(root);

        const svg = d3Any.select(containerRef.current)
            .append("svg")
            .attr("width", "100%")
            .attr("height", 500)
            .append("g")
            .attr("transform", "translate(50,50)");

        // Links
        svg.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#cbd5e1")
            .attr("stroke-width", 2)
            .attr("d", d3Any.linkHorizontal()
                .x((d: any) => d.y)
                .y((d: any) => d.x)
            );

        // Nodes
        const node = svg.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", (d: any) => "node" + (d.children ? " node--internal" : " node--leaf"))
            .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("r", 20)
            .style("fill", "#0284c7")
            .style("stroke", "#fff")
            .style("stroke-width", 2);

        node.append("text")
            .attr("dy", 35)
            .attr("x", (d: any) => d.children ? -8 : 8)
            .style("text-anchor", "middle")
            .text((d: any) => d.data.data.name)
            .style("font-size", "12px")
            .style("fill", "#334155")
            .style("font-weight", "600");

        node.append("text")
            .attr("dy", 48)
            .attr("x", (d: any) => d.children ? -8 : 8)
            .style("text-anchor", "middle")
            .text((d: any) => d.data.data.role)
            .style("font-size", "10px")
            .style("fill", "#64748b");

    }, [employees]);

    return (
        <div className="overflow-auto border border-gray-200 rounded-xl bg-white p-4">
             <div ref={containerRef} className="min-w-[800px] min-h-[500px]"></div>
        </div>
    );
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
                        <input 
                            type="text" 
                            placeholder="Search by name or role..." 
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-signia-500 w-64"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select 
                        className="border rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-signia-500"
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
                    >
                        <option value="All">All Departments</option>
                        {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setView('list')} 
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' ? 'bg-white shadow text-signia-600' : 'text-gray-500'}`}
                    >
                        List View
                    </button>
                    <button 
                        onClick={() => setView('org')} 
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'org' ? 'bg-white shadow text-signia-600' : 'text-gray-500'}`}
                    >
                        Organogram
                    </button>
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
                            
                            <p className="text-gray-500 text-sm mt-4 line-clamp-2 px-2">{emp.bio}</p>
                            
                            <div className="mt-6 flex justify-center gap-3 w-full border-t pt-4">
                                <a href={`mailto:${emp.email}`} className="text-gray-400 hover:text-signia-600"><Lucide.Mail className="w-5 h-5"/></a>
                                {emp.socials?.linkedin && <a href={emp.socials.linkedin} className="text-gray-400 hover:text-blue-700"><Lucide.Linkedin className="w-5 h-5"/></a>}
                                {emp.socials?.github && <a href={emp.socials.github} className="text-gray-400 hover:text-gray-900"><Lucide.Github className="w-5 h-5"/></a>}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Organogram employees={store.employees} />
            )}
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
                    <button 
                        key={type} 
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === type ? 'bg-signia-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredResources.map(res => (
                    <Card key={res.id} className="group hover:shadow-lg transition cursor-pointer">
                        <div className="relative h-40 overflow-hidden bg-gray-200">
                            <img src={res.thumbnail} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                                {res.type === ResourceType.VIDEO ? <Lucide.PlayCircle size={12}/> : <Lucide.FileText size={12}/>}
                                {res.type}
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
    const [activeTab, setActiveTab] = useState<'users' | 'banners' | 'content'>('users');
    const [newEmpName, setNewEmpName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddEmp = async () => {
        if (!newEmpName) return;
        setIsSubmitting(true);
        const newEmp: Employee = {
            id: Date.now().toString(),
            name: newEmpName,
            role: "New Hire",
            department: Department.OPERATIONS,
            email: "new@signia.studio",
            avatar: "https://picsum.photos/200",
            bio: "Welcome to the team!",
            joinedDate: new Date().toISOString().split('T')[0],
            birthday: "01-01"
        };
        await store.addEmployee(newEmp);
        setNewEmpName("");
        setIsSubmitting(false);
    };

    const downloadCSV = () => {
        const headers = ["ID", "Name", "Role", "Email", "Department"].join(",");
        const rows = store.employees.map(e => [e.id, e.name, e.role, e.email, e.department].join(",")).join("\n");
        const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "employees_backup.csv";
        a.click();
    };

    return (
        <div className="space-y-6">
            <SectionTitle title="Admin Console" subtitle="Manage content, users and settings." />
            
            <div className="border-b flex space-x-6 mb-6">
                <button onClick={() => setActiveTab('users')} className={`pb-2 font-medium text-sm border-b-2 transition ${activeTab === 'users' ? 'border-signia-600 text-signia-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Users</button>
                <button onClick={() => setActiveTab('banners')} className={`pb-2 font-medium text-sm border-b-2 transition ${activeTab === 'banners' ? 'border-signia-600 text-signia-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Banners</button>
                <button onClick={() => setActiveTab('content')} className={`pb-2 font-medium text-sm border-b-2 transition ${activeTab === 'content' ? 'border-signia-600 text-signia-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Content</button>
            </div>

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex gap-4 mb-4">
                        <input 
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            placeholder="New Employee Name"
                            className="border p-2 rounded flex-1"
                            disabled={isSubmitting}
                        />
                        <button 
                            onClick={handleAddEmp} 
                            disabled={isSubmitting}
                            className="bg-signia-600 text-white px-4 py-2 rounded hover:bg-signia-700 disabled:opacity-50"
                        >
                            {isSubmitting ? "Adding..." : "Add User"}
                        </button>
                        <button onClick={downloadCSV} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 flex items-center gap-2">
                            <Lucide.Download size={16}/> CSV
                        </button>
                    </div>
                    <div className="bg-white rounded shadow overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {store.employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{emp.name}</td>
                                        <td className="px-4 py-3 text-gray-500">{emp.role}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => store.deleteEmployee(emp.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'banners' && (
                <div className="grid gap-4">
                    <div className="bg-blue-50 p-4 rounded text-blue-800 text-sm">
                        Recommended Size: <strong>1920x480px</strong>. Supported formats: JPG, PNG.
                    </div>
                    {store.banners.map(b => (
                        <div key={b.id} className="flex items-center gap-4 bg-white p-4 rounded shadow">
                            <img src={b.imageUrl} className="w-32 h-16 object-cover rounded" alt="Banner" />
                            <div className="flex-1">
                                <h4 className="font-bold">{b.title}</h4>
                                <p className="text-xs text-gray-500">Order: {b.order}</p>
                            </div>
                            <button 
                                onClick={() => store.toggleBanner(b.id)}
                                className={`px-3 py-1 rounded text-xs font-bold ${b.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                                {b.active ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'content' && (
                <div className="text-center py-12 text-gray-400 bg-white rounded shadow-sm border border-dashed">
                    <Lucide.Settings className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900">Content Management</h3>
                    <p>Select a sub-module (Blog, Academy, Marketing) to manage content items.</p>
                </div>
            )}
        </div>
    );
};

// --- Main App Shell ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${active ? 'bg-signia-50 text-signia-600 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </button>
);

export default function App() {
    const store = useAppController();
    const [currentPage, setCurrentPage] = useState('home');
    const [isAdmin, setIsAdmin] = useState(false);

    // Patch Notes Component
    const PatchNotesModule = () => (
        <div className="space-y-6">
            <SectionTitle title="System Updates" subtitle="Changelog and Patch Notes" />
            <div className="space-y-4">
                {store.patchNotes.map((note, idx) => (
                    <Card key={idx} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Version {note.version}</h3>
                                <p className="text-sm text-gray-500">{new Date(note.date).toLocaleDateString()}</p>
                            </div>
                            <Badge color="bg-green-100 text-green-800">Stable</Badge>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {note.changes.map((change, cIdx) => (
                                <li key={cIdx}>{change}</li>
                            ))}
                        </ul>
                    </Card>
                ))}
            </div>
        </div>
    );

    // Simple router renderer
    const renderPage = () => {
        if (store.isLoading) return <LoadingScreen />;

        switch (currentPage) {
            case 'home': return <HomeModule store={store} navigate={setCurrentPage} />;
            case 'directory': return <DirectoryModule store={store} />;
            case 'academy': return <AcademyModule store={store} />;
            case 'admin': return <AdminModule store={store} />;
            case 'patch-notes': return <PatchNotesModule />;
            case 'wiki': return <div className="text-center py-20 text-gray-500">Wiki Module Placeholder</div>;
            case 'apps': return <div className="text-center py-20 text-gray-500">Apps Launcher Placeholder</div>;
            case 'blog': return <div className="text-center py-20 text-gray-500">Blog Feed Placeholder</div>;
            default: return <HomeModule store={store} navigate={setCurrentPage} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-20 hidden lg:flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-signia-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Signia<span className="text-signia-600">Studios</span></span>
                </div>
                
                <nav className="flex-1 p-4 overflow-y-auto">
                    <SidebarItem icon={Lucide.Home} label="Home" active={currentPage === 'home'} onClick={() => setCurrentPage('home')} />
                    <SidebarItem icon={Lucide.Newspaper} label="Blog Signia" active={currentPage === 'blog'} onClick={() => setCurrentPage('blog')} />
                    <SidebarItem icon={Lucide.Users} label="Directory" active={currentPage === 'directory'} onClick={() => setCurrentPage('directory')} />
                    <SidebarItem icon={Lucide.GraduationCap} label="Academy" active={currentPage === 'academy'} onClick={() => setCurrentPage('academy')} />
                    <SidebarItem icon={Lucide.BookOpen} label="Onboarding" active={currentPage === 'wiki'} onClick={() => setCurrentPage('wiki')} />
                    <SidebarItem icon={Lucide.LayoutGrid} label="Apps" active={currentPage === 'apps'} onClick={() => setCurrentPage('apps')} />
                    <div className="my-4 border-t border-gray-100"></div>
                    <SidebarItem icon={Lucide.FileText} label="Patch Notes" active={currentPage === 'patch-notes'} onClick={() => setCurrentPage('patch-notes')} />
                    
                    {isAdmin && (
                         <div className="mt-4 bg-gray-50 rounded-xl p-2 border border-dashed border-gray-300">
                            <p className="px-2 text-xs font-semibold text-gray-400 mb-2 uppercase">Admin</p>
                            <SidebarItem icon={Lucide.Settings} label="Console" active={currentPage === 'admin'} onClick={() => setCurrentPage('admin')} />
                         </div>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="https://picsum.photos/id/64/200/200" alt="User" className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">Alice Johnson</p>
                            <button 
                                onClick={() => setIsAdmin(!isAdmin)} 
                                className="text-xs text-signia-600 hover:underline"
                            >
                                {isAdmin ? "Switch to User" : "Switch to Admin"}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 w-full bg-white border-b z-20 px-4 py-3 flex justify-between items-center">
                <span className="font-bold text-lg">Signia Studios</span>
                <button className="p-2 bg-gray-100 rounded">
                    <Lucide.Menu size={20}/>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 transition-all">
                {renderPage()}
            </main>
        </div>
    );
}