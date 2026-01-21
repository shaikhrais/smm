import { Card, CardContent, CardHeader } from '../ui/Card';
import { cn } from '../../lib/utils';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

interface PostPreviewProps {
    content: string;
    mediaUrls?: string[];
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
    username?: string;
    handle?: string;
}

export function PostPreview({ content, mediaUrls = [], platform, username = "User", handle = "@user" }: PostPreviewProps) {
    const getIcon = () => {
        switch (platform) {
            case 'facebook': return <Facebook className="w-5 h-5 text-blue-600" />;
            case 'instagram': return <Instagram className="w-5 h-5 text-pink-600" />;
            case 'twitter': return <Twitter className="w-5 h-5 text-sky-500" />;
            case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-700" />;
        }
    };

    return (
        <Card className="w-full max-w-sm mx-auto overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 flex flex-row gap-3 space-y-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{username}</span>
                        {platform === 'twitter' && <span className="text-slate-500 text-xs">{handle}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        {getIcon()}
                        <span>Just now</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
                <p className="text-sm whitespace-pre-wrap">{content || "Start typing to preview..."}</p>
                {mediaUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                        {mediaUrls.map((url, i) => (
                            <div key={i} className={cn("aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center", mediaUrls.length === 1 && "col-span-2 aspect-video")}>
                                <img src={url} alt="Post media" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
