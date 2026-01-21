import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Tag, Loader2 } from 'lucide-react';
import { useBrandStore } from '../store/brandStore';
import { useBusinessStore } from '../store/businessStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { UI_ROUTES } from '@smm/shared';

export default function BrandDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { brands, isLoading, error, fetchBrands, addBrand, deleteBrand } = useBrandStore();
    const { businesses, fetchBusinesses } = useBusinessStore();

    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', businessId: '' });

    useEffect(() => {
        fetchBusinesses();
        fetchBrands();
    }, [fetchBusinesses, fetchBrands]);

    useEffect(() => {
        if (businesses.length > 0 && !formData.businessId) {
            setFormData(prev => ({ ...prev, businessId: businesses[0].id }));
        }
    }, [businesses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.businessId) return;
        await addBrand(formData);
        setFormData({ name: '', description: '', businessId: businesses[0]?.id || '' });
        setIsCreating(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                        {t('brands')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage brands within your businesses.
                    </p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)} className="w-full md:w-auto" disabled={businesses.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Brand
                </Button>
            </div>

            {/* No businesses warning */}
            {businesses.length === 0 && !isLoading && (
                <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    You need to create a business first before adding brands.
                    <Button variant="link" className="ml-2" onClick={() => navigate(UI_ROUTES.BUSINESSES)}>
                        Go to Businesses →
                    </Button>
                </div>
            )}

            {isCreating && businesses.length > 0 && (
                <Card className="animate-slide-up border-primary-100 dark:border-primary-900 shadow-lg shadow-primary-500/5">
                    <CardHeader>
                        <CardTitle>Create New Brand</CardTitle>
                        <CardDescription>Add a new brand identity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Business</label>
                                <select
                                    className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.businessId}
                                    onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                                >
                                    {businesses.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Brand Name"
                                placeholder="e.g. Acme Rockets"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Description"
                                placeholder="Short description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Create Brand
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <span className="ml-2 text-slate-500">Loading brands...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && brands.length === 0 && businesses.length > 0 && (
                <Card className="p-12 text-center">
                    <Tag className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No brands yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                        Create your first brand to start managing social media.
                    </p>
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Brand
                    </Button>
                </Card>
            )}

            {/* Brand Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map((brand) => {
                    const parentBusiness = businesses.find(b => b.id === brand.businessId);
                    return (
                        <Card key={brand.id} className="group hover:shadow-md transition-shadow duration-300">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brand.color || '#3b82f6' }} />
                                        {brand.name}
                                    </CardTitle>
                                    <CardDescription>{parentBusiness?.name || 'Unknown Business'}</CardDescription>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary-600">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-500 hover:text-red-600"
                                        onClick={() => deleteBrand(brand.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {brand.description || 'No description provided.'}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="secondary" className="w-full" onClick={() => navigate(UI_ROUTES.SOCIAL_MEDIA)}>
                                    Connect Accounts
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
