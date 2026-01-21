import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUp, Users, Eye, MousePointerClick, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { api } from '../lib/api';
import { API_ENDPOINTS } from '@smm/shared';
import { useAppStore } from '../store/appStore';

interface AnalyticsData {
    id: string;
    brand_id: string;
    date: string;
    impressions: number;
    engagement: number;
    new_followers: number;
    likes: number;
}
// Transform for charts
const transformData = (data: AnalyticsData[]) => {
    return data.map(d => ({
        name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        impressions: d.impressions,
        engagement: d.engagement
    })).reverse(); // Assuming API sort DESC
};

export default function AnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);
    const { selectedBrandId } = useAppStore();

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!selectedBrandId) {
                setAnalytics([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await api.get<AnalyticsData[]>(`${API_ENDPOINTS.ANALYTICS}?brand_id=${selectedBrandId}`);
                if (res.data) {
                    setAnalytics(res.data);
                } else {
                    setAnalytics([]);
                }
            } catch (err) {
                console.error("Failed to fetch analytics", err);
                setAnalytics([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [selectedBrandId]);

    const chartData = analytics.length > 0 ? transformData(analytics) : [];

    // Aggregates
    const totalImpressions = analytics.reduce((acc: number, curr: AnalyticsData) => acc + curr.impressions, 0);
    const totalEngagement = analytics.reduce((acc: number, curr: AnalyticsData) => acc + curr.engagement, 0);
    const totalFollowers = analytics.reduce((acc: number, curr: AnalyticsData) => acc + curr.new_followers, 0); // Delta
    const totalLikes = analytics.reduce((acc: number, curr: AnalyticsData) => acc + curr.likes, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                    Analytics
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Track your performance across all channels.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Total Impressions', value: totalImpressions.toLocaleString(), change: '+12.5%', icon: Eye, trend: 'up' },
                    { title: 'Total Engagement', value: totalEngagement.toLocaleString(), change: '+5.2%', icon: MousePointerClick, trend: 'up' },
                    { title: 'New Followers', value: totalFollowers.toLocaleString(), change: '-2.1%', icon: Users, trend: 'up' },
                    { title: 'Likes', value: totalLikes.toLocaleString(), change: '+8.4%', icon: Heart, trend: 'up' },
                ].map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-slate-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-6 w-24 bg-slate-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className={`text-xs flex items-center mt-1 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                        {/* Mock trend for now as we don't have historical comparison logic yet */}
                                        <ArrowUp className="h-3 w-3 mr-1" />
                                        {stat.change} from last week
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Engagement Overview</CardTitle>
                        <CardDescription>Daily engagement metrics over the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="engagement" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEngagement)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Impressions vs Reach</CardTitle>
                        <CardDescription>Comparison metric for visibility.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="impressions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
