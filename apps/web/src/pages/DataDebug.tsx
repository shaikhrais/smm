import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { API_ENDPOINTS } from '@smm/shared';

export default function DataDebug() {
    const [data, setData] = useState<any>({
        businesses: [],
        brands: [],
        socialAccounts: [],
        posts: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                // Fetch businesses using centralized endpoint
                const businesses = await api.get(API_ENDPOINTS.BUSINESSES);

                // Fetch brands for each business
                let brands: any[] = [];
                if (Array.isArray(businesses)) {
                    for (const bus of businesses) {
                        const busBrands = await api.get(API_ENDPOINTS.BRANDS_BY_BUSINESS(bus.id));
                        if (Array.isArray(busBrands)) {
                            brands = [...brands, ...busBrands];
                        }
                    }
                }

                // Fetch Social Accounts and Posts for found brands
                let socialAccounts: any[] = [];
                let posts: any[] = [];

                for (const brand of brands) {
                    const accounts = await api.get(API_ENDPOINTS.SOCIAL_BY_BRAND(brand.id));
                    if (Array.isArray(accounts)) socialAccounts = [...socialAccounts, ...accounts];

                    const brandPosts = await api.get(API_ENDPOINTS.POSTS_BY_BRAND(brand.id));
                    if (Array.isArray(brandPosts)) posts = [...posts, ...brandPosts];
                }

                setData({
                    businesses,
                    brands,
                    socialAccounts,
                    posts
                });
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) return <div className="p-8">Loading debug data...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Data Debug Overview</h1>

            <section>
                <h2 className="text-xl font-semibold mb-4">Businesses ({data.businesses.length})</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {data.businesses.map((b: any) => (
                        <Card key={b.id} className="p-4">
                            <pre className="text-xs overflow-auto">{JSON.stringify(b, null, 2)}</pre>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Brands ({data.brands.length})</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {data.brands.map((b: any) => (
                        <Card key={b.id} className="p-4">
                            <div className="font-bold mb-2">{b.name}</div>
                            <pre className="text-xs overflow-auto">{JSON.stringify(b, null, 2)}</pre>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Social Accounts ({data.socialAccounts.length})</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {data.socialAccounts.map((a: any) => (
                        <Card key={a.id} className="p-4">
                            <div className="font-bold mb-2">{a.platform} - {a.handle}</div>
                            <pre className="text-xs overflow-auto">{JSON.stringify(a, null, 2)}</pre>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Posts ({data.posts.length})</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {data.posts.map((p: any) => (
                        <Card key={p.id} className="p-4">
                            <div className="font-bold mb-2">{p.status}</div>
                            <pre className="text-xs overflow-auto">{JSON.stringify(p, null, 2)}</pre>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
