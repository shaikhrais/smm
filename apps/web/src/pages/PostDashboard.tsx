import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send,
    Calendar as CalendarIcon,
    Image as ImageIcon,
    Bot,
    Loader2,
    Trash2,
    FileText
} from 'lucide-react';
import { usePostStore } from '../store/postStore';
import { useBrandStore } from '../store/brandStore';
import { useBusinessStore } from '../store/businessStore';
import { useSocialStore } from '../store/socialStore';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { PostPreview } from '../components/posts/PostPreview';
import { cn } from '../lib/utils';
import { UI_ROUTES } from '@smm/shared';

export default function PostDashboard() {
    const navigate = useNavigate();
    const { posts, isLoading, error, fetchPostsByBrand, addPost, deletePost } = usePostStore();
    const { brands, fetchBrands } = useBrandStore();
    const { businesses, fetchBusinesses } = useBusinessStore();
    const { accounts, fetchAccountsByBrand } = useSocialStore();
    const { selectedBusinessId, selectedBrandId, setSelectedBusinessId, setSelectedBrandId } = useAppStore();

    const [content, setContent] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Fetch businesses and brands on mount
    useEffect(() => {
        fetchBusinesses();
        fetchBrands();
    }, [fetchBusinesses, fetchBrands]);

    // Set default business when loaded
    useEffect(() => {
        if (businesses.length > 0 && !selectedBusinessId) {
            setSelectedBusinessId(businesses[0].id);
        }
    }, [businesses]);

    // Filter brands by selected business
    const filteredBrands = brands.filter(b => b.businessId === selectedBusinessId);

    // Set default brand when business changes
    useEffect(() => {
        if (filteredBrands.length > 0) {
            setSelectedBrandId(filteredBrands[0].id);
        } else {
            setSelectedBrandId('');
        }
    }, [selectedBusinessId, brands]);

    // Fetch posts and accounts when brand changes
    useEffect(() => {
        if (selectedBrandId) {
            fetchPostsByBrand(selectedBrandId);
            fetchAccountsByBrand(selectedBrandId);
        }
    }, [selectedBrandId, fetchPostsByBrand, fetchAccountsByBrand]);

    const brandAccounts = accounts.filter(a => a.brandId === selectedBrandId);
    const brandPosts = posts.filter(p => p.brandId === selectedBrandId);

    const togglePlatform = (platformId: string) => {
        if (selectedPlatforms.includes(platformId)) {
            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platformId]);
        }
    };

    const handleAI = () => {
        setIsGeneratingAI(true);
        setTimeout(() => {
            setContent(prev => prev + "\n\nExciting news regarding our latest product launch! We are thrilled to share this with our community. #launch #new #update 🚀");
            setIsGeneratingAI(false);
        }, 1500);
    };

    const handleCreatePost = async () => {
        if (!content || selectedPlatforms.length === 0) return;

        await addPost({
            brandId: selectedBrandId,
            content,
            mediaUrls: [],
            status: 'scheduled',
            platforms: selectedPlatforms,
            scheduledDate: new Date().toISOString()
        });

        setContent('');
        setSelectedPlatforms([]);
    };

    return (
        <div className="space-y-6">
            {/* Header with selectors */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                        Post Composer
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Create and schedule posts for your social accounts.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Business Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium whitespace-nowrap">Business:</span>
                        <select
                            className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
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
                            className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
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

            {/* Warnings */}
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
                    Create a brand for this business first.
                    <Button variant="link" className="ml-2" onClick={() => navigate(UI_ROUTES.BRANDS)}>
                        Go to Brands →
                    </Button>
                </div>
            )}

            {selectedBrandId && brandAccounts.length === 0 && (
                <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    Connect social accounts to start posting.
                    <Button variant="link" className="ml-2" onClick={() => navigate(UI_ROUTES.SOCIAL_MEDIA)}>
                        Connect Accounts →
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <span className="ml-2 text-slate-500">Loading posts...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Main Content */}
            {selectedBrandId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Editor Column */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                        <Card className="flex-1 flex flex-col">
                            <CardContent className="p-6 flex-1 flex flex-col gap-4">
                                <div className="flex flex-wrap gap-2">
                                    {brandAccounts.length === 0 && (
                                        <span className="text-sm text-yellow-600 dark:text-yellow-400">No accounts connected.</span>
                                    )}
                                    {brandAccounts.map(account => (
                                        <Button
                                            key={account.id}
                                            type="button"
                                            variant={selectedPlatforms.includes(account.platform) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => togglePlatform(account.platform)}
                                            className="capitalize"
                                        >
                                            {account.platform}
                                        </Button>
                                    ))}
                                </div>

                                <textarea
                                    className="flex-1 w-full min-h-[200px] resize-none rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="What do you want to share today?"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />

                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" title="Add Media">
                                            <ImageIcon className="h-5 w-5 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Schedule">
                                            <CalendarIcon className="h-5 w-5 text-slate-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("text-purple-600", isGeneratingAI && "animate-pulse")}
                                            onClick={handleAI}
                                            disabled={isGeneratingAI}
                                            title="Generate with AI"
                                        >
                                            {isGeneratingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bot className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <Button onClick={handleCreatePost} disabled={!content || selectedPlatforms.length === 0}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Schedule
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Posts List */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
                            {brandPosts.length === 0 && !isLoading && (
                                <Card className="p-12 text-center">
                                    <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Create your first post above to get started.
                                    </p>
                                </Card>
                            )}
                            <div className="space-y-3">
                                {brandPosts.map(post => (
                                    <Card key={post.id} className="flex items-center p-3 gap-4">
                                        <div className={cn("w-2 h-2 rounded-full",
                                            post.status === 'published' ? 'bg-green-500' :
                                                post.status === 'scheduled' ? 'bg-blue-500' : 'bg-slate-300'
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium">{post.content}</p>
                                            <p className="text-xs text-slate-500 capitalize">
                                                {Array.isArray(post.platforms) ? post.platforms.join(', ') : post.platforms} • {post.status}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => deletePost(post.id)}>
                                            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview Column */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Preview</h2>
                        {selectedPlatforms.length > 0 ? (
                            <div className="space-y-6">
                                {selectedPlatforms.map(platform => (
                                    <div key={platform}>
                                        <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide text-center">{platform}</p>
                                        <PostPreview
                                            content={content}
                                            platform={platform as any}
                                            username={brands.find(b => b.id === selectedBrandId)?.name}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                                Select a platform to preview
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
