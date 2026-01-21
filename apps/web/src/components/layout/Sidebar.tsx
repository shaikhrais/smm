import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    LayoutDashboard,
    Building2,
    Briefcase,
    Share2,
    PenTool,
    MessageSquare,
    BarChart,
    Settings,
    LogOut,
    Sun,
    Moon,
    Monitor
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { useThemeStore } from "../../store/themeStore";

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { theme, setTheme } = useThemeStore();

    const menuItems = [
        { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
        { icon: Building2, label: t('businesses'), path: '/businesses' },
        { icon: Briefcase, label: t('brands'), path: '/brands' },
        { icon: Share2, label: 'Social Media', path: '/social-media' },
        { icon: PenTool, label: t('posts'), path: '/posts' },
        { icon: MessageSquare, label: 'Inbox', path: '/inbox' },
        { icon: BarChart, label: 'Analytics', path: '/analytics' },
        { icon: Settings, label: t('settings'), path: '/settings' },
    ];

    const handleThemeToggle = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const getThemeIcon = () => {
        if (theme === 'light') return <Sun className="h-4 w-4" />;
        if (theme === 'dark') return <Moon className="h-4 w-4" />;
        return <Monitor className="h-4 w-4" />;
    };

    return (
        <aside className={cn("hidden md:flex flex-col w-64 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900", className)}>
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
                    SocialMgr
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Button
                            key={item.path}
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start",
                                isActive && "bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400"
                            )}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                        </Button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleThemeToggle}
                >
                    {getThemeIcon()}
                    <span className="ml-3 capitalize">{theme === 'system' ? t('systemMode') : (theme === 'light' ? t('lightMode') : t('darkMode'))}</span>
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}
