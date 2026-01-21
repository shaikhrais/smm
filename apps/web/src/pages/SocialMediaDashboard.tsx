import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Instagram,
    Facebook,
    Linkedin,
    Twitter,
    Plus,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Trash2,
    RefreshCw,
    Share2
} from 'lucide-react';
import { useSocialStore, type Platform } from '../store/socialStore';
import { useBrandStore } from '../store/brandStore';
import { useBusinessStore } from '../store/businessStore';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { UI_ROUTES } from '@smm/shared';

export default function SocialMediaDashboard() {
    const navigate = useNavigate();
    const { accounts, isLoading, error, fetchAccountsByBrand, disconnectAccount } = useSocialStore();
    const { brands, fetchBrands } = useBrandStore();
    const { businesses, fetchBusinesses } = useBusinessStore();
    const { selectedBusinessId, selectedBrandId, setSelectedBusinessId, setSelectedBrandId } = useAppStore();

    const [isConnecting, setIsConnecting] = useState<Platform | null>(null);

    const [showSuccess, setShowSuccess] = useState(false);

    // Fetch businesses and brands on mount
    useEffect(() => {
        fetchBusinesses();
        fetchBrands();

        // Check for success param
        const url = new URL(window.location.href);
        if (url.searchParams.get('success') === 'true') {
            setShowSuccess(true);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [fetchBusinesses, fetchBrands]);

    // Filter brands by selected business
    const filteredBrands = brands.filter(b => b.businessId === selectedBusinessId);

    // Set default brand when business changes
    useEffect(() => {
        if (filteredBrands.length > 0 && !selectedBrandId) {
            setSelectedBrandId(filteredBrands[0].id);
        }
    }, [selectedBusinessId, brands, filteredBrands, selectedBrandId, setSelectedBrandId]);

    // Fetch social accounts when brand changes
    useEffect(() => {
        if (selectedBrandId) {
            fetchAccountsByBrand(selectedBrandId);
        }
    }, [selectedBrandId, fetchAccountsByBrand, showSuccess]);

    const platforms: { id: Platform; name: string; icon: any; color: string }[] = [
        { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
        { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
        { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-slate-900 dark:text-slate-100' },
        { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    ];

    const handleConnect = async (platform: Platform) => {
        if (!selectedBrandId) return;
        setIsConnecting(platform);

        // Redirect to real OAuth authorize endpoint on the backend
        const baseUrl = 'https://social-media-manager-api.pages.dev';
        window.location.href = `${baseUrl}/api/oauth/${platform}/authorize?brand_id=${selectedBrandId}`;
    };

    const filteredAccounts = accounts.filter(a => a.brandId === selectedBrandId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                        Social Media
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Connect and manage your social profiles.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Business Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium whitespace-nowrap">Business:</span>
                        <select
                            className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                        >
                            {businesses.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Brand Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium whitespace-nowrap">Brand:</span>
                        <select
                            className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={selectedBrandId}
                            onChange={(e) => setSelectedBrandId(e.target.value)}
                            disabled={filteredBrands.length === 0}
                        >
                            {filteredBrands.length === 0 ? (
                                <option value="">No brands</option>
                            ) : (
                                filteredBrands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Social account connected successfully!</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowSuccess(false)}>Dismiss</Button>
                </div>
            )}

            {/* No businesses/brands warning */}
            {businesses.length === 0 && (
                <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    You need to create a business first.
                    <Button variant="link" className="ml-2" onClick={() => navigate(UI_ROUTES.BUSINESSES)}>
                        Go to Businesses →
                    </Button>
                </div>
            )}

            {businesses.length > 0 && filteredBrands.length === 0 && (
                <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    Create a brand for this business to connect social accounts.
                    <Button variant="link" className="ml-2" onClick={() => navigate(UI_ROUTES.BRANDS)}>
                        Go to Brands →
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <span className="ml-2 text-slate-500">Loading social accounts...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Platform Cards */}
            {selectedBrandId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {platforms.map((platform) => {
                        const isConnected = filteredAccounts.some(a => a.platform === platform.id);
                        return (
                            <Card key={platform.id} className={cn("border-l-4", isConnected ? "border-l-green-500" : "border-l-slate-200 dark:border-l-slate-800")}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <platform.icon className={cn("h-5 w-5", platform.color)} />
                                        {platform.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pb-2">
                                    <p className="text-sm text-slate-500">
                                        {isConnected
                                            ? "Connected and syncing."
                                            : "Connect to start posting."}
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-2">
                                    {isConnected ? (
                                        <Button variant="outline" size="sm" className="w-full" disabled>
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                            Connected
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleConnect(platform.id)}
                                            disabled={isConnecting === platform.id || !selectedBrandId}
                                        >
                                            {isConnecting === platform.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Plus className="mr-2 h-4 w-4" />
                                            )}
                                            Connect
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Active Connections */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Active Connections</h2>

                {/* Empty State */}
                {!isLoading && selectedBrandId && filteredAccounts.length === 0 && (
                    <Card className="p-12 text-center">
                        <Share2 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No social accounts connected</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            Connect your first social media account to start posting.
                        </p>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAccounts.map(account => {
                        const PlatformIcon = platforms.find(p => p.id === account.platform)?.icon || AlertCircle;
                        return (
                            <Card key={account.id} className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary-500">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                                            onClick={() => disconnectAccount(account.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardHeader className="flex flex-row gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-500">
                                        {account.username.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-base">{account.username}</CardTitle>
                                        <CardDescription>{account.handle}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <PlatformIcon className="h-3 w-3" />
                                        <span className="capitalize">{account.platform}</span>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="text-green-600 dark:text-green-400 font-medium capitalize">{account.status}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
