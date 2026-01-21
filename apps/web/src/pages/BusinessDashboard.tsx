import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, Globe, Calendar, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useBusinessStore } from '../store/businessStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { UI_ROUTES } from '@smm/shared';

export default function BusinessDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { businesses, isLoading, error, fetchBusinesses, addBusiness, deleteBusiness } = useBusinessStore();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', industry: '', website: '' });

    useEffect(() => {
        fetchBusinesses();
    }, [fetchBusinesses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        await addBusiness(formData);
        setFormData({ name: '', industry: '', website: '' });
        setIsCreating(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                        {t('businesses')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage your client organizations and their profiles.
                    </p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Business
                </Button>
            </div>

            {isCreating && (
                <Card className="animate-slide-up border-primary-100 dark:border-primary-900 shadow-lg shadow-primary-500/5">
                    <CardHeader>
                        <CardTitle>Create New Business</CardTitle>
                        <CardDescription>Add a new organization to manage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Business Name"
                                    placeholder="e.g. Acme Corp"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Industry"
                                    placeholder="e.g. Technology"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                />
                                <Input
                                    label="Website"
                                    placeholder="https://..."
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="md:col-span-2"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Create Business
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
                    <span className="ml-2 text-slate-500">Loading businesses...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && businesses.length === 0 && (
                <Card className="p-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No businesses yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                        Get started by adding your first business organization.
                    </p>
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Business
                    </Button>
                </Card>
            )}

            {/* Business Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                    <Card key={business.id} className="group hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary-500" />
                                    {business.name}
                                </CardTitle>
                                <CardDescription>{business.industry}</CardDescription>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary-600">
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:text-red-600"
                                    onClick={() => deleteBusiness(business.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
                                {business.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        <a href={business.website} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary-500">
                                            {business.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Added {new Date(business.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary" className="w-full" onClick={() => navigate(UI_ROUTES.BRANDS)}>
                                Manage Brands
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
