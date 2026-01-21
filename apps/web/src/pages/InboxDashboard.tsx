import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Phone, Video, Mic, Paperclip, Send, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { API_ENDPOINTS, UI_ROUTES } from '@smm/shared';
import { useBusinessStore } from '../store/businessStore';
import { useBrandStore } from '../store/brandStore';
import { useAppStore } from '../store/appStore';

interface Conversation {
    id: string;
    brand_id: string;
    platform: string;
    sender_name: string;
    sender_avatar: string;
    last_message: string;
    unread_count: number;
    updated_at: string;
}

interface Message {
    id: string;
    conversation_id: string;
    sender: 'me' | 'them';
    content: string;
    created_at: string;
}

export default function InboxDashboard() {
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Global persisted selection
    const { selectedBusinessId, selectedBrandId, setSelectedBusinessId, setSelectedBrandId } = useAppStore();
    const { businesses, fetchBusinesses } = useBusinessStore();
    const { brands, fetchBrands } = useBrandStore();

    // Local state
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
    }, [businesses, selectedBusinessId, setSelectedBusinessId]);

    // Filter brands by selected business
    const filteredBrands = brands.filter(b => b.businessId === selectedBusinessId);

    // Set default brand when business changes
    useEffect(() => {
        if (filteredBrands.length > 0 && (!selectedBrandId || !filteredBrands.find(b => b.id === selectedBrandId))) {
            setSelectedBrandId(filteredBrands[0].id);
        }
    }, [selectedBusinessId, filteredBrands, selectedBrandId, setSelectedBrandId]);

    // Fetch conversations when brand changes
    useEffect(() => {
        if (!selectedBrandId) return;

        const fetchConversations = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get<Conversation[]>(API_ENDPOINTS.CONVERSATIONS + `?brand_id=${selectedBrandId}`);
                if (res.data) {
                    setConversations(res.data);
                    if (res.data.length > 0 && !selectedConvId) {
                        setSelectedConvId(res.data[0].id);
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch conversations", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, [selectedBrandId]);

    // Fetch messages when conversation changes
    useEffect(() => {
        if (!selectedConvId) return;

        const fetchMessages = async () => {
            try {
                const res = await api.get<Message[]>(API_ENDPOINTS.MESSAGES_BY_CONVERSATION(selectedConvId));
                if (res.data) {
                    setMessages(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch messages");
            }
        };
        fetchMessages();
    }, [selectedConvId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!messageInput.trim() || !selectedConvId) return;

        const tempId = Date.now().toString();
        const optimisticMsg: Message = {
            id: tempId,
            conversation_id: selectedConvId,
            sender: 'me',
            content: messageInput,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setMessageInput('');

        try {
            await api.post(API_ENDPOINTS.MESSAGES, {
                conversation_id: selectedConvId,
                content: optimisticMsg.content,
                sender: 'me'
            });
        } catch (err) {
            console.error("Failed to send message");
        }
    };

    const selectedConversation = conversations.find(c => c.id === selectedConvId);

    return (
        <div className="space-y-6">
            {/* Header with selectors */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                        Inbox
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage conversations across your social accounts.
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

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <span className="ml-2 text-slate-500">Loading conversations...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Main Content */}
            {selectedBrandId && !loading && (
                <div className="h-[calc(100vh-16rem)] flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    {/* Sidebar List */}
                    <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="font-semibold text-lg mb-4">Messages</h2>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input placeholder="Search messages..." className="pl-9" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageSquare className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400">No conversations yet</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConvId(conv.id)}
                                        className={cn(
                                            "flex items-start gap-3 p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                                            selectedConvId === conv.id && "bg-slate-50 dark:bg-slate-800 border-l-4 border-l-primary-500"
                                        )}
                                    >
                                        <div className="relative">
                                            <img src={conv.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.sender_name}`} alt={conv.sender_name} className="w-10 h-10 rounded-full bg-slate-200" />
                                            <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                                                conv.platform === 'instagram' ? "bg-pink-500" :
                                                    conv.platform === 'facebook' ? "bg-blue-600" : "bg-gray-500"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-medium truncate">{conv.sender_name}</h3>
                                                <span className="text-xs text-slate-500">{new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className={cn("text-sm truncate", conv.unread_count > 0 ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500")}>
                                                {conv.last_message}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {selectedConversation ? (
                            <>
                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur">
                                    <div className="flex items-center gap-3">
                                        <img src={selectedConversation.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.sender_name}`} alt={selectedConversation.sender_name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <h3 className="font-semibold">{selectedConversation.sender_name}</h3>
                                            <p className="text-xs text-slate-500 capitalize">{selectedConversation.platform}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={cn("flex", msg.sender === 'me' ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                                                msg.sender === 'me'
                                                    ? "bg-primary-600 text-white rounded-tr-sm"
                                                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-tl-sm"
                                            )}>
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={cn("text-[10px] mt-1 opacity-70", msg.sender === 'me' ? "text-primary-100" : "text-slate-500")}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex gap-2 items-center">
                                        <Button variant="ghost" size="icon" className="shrink-0"><Paperclip className="h-4 w-4" /></Button>
                                        <Input
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-slate-50 dark:bg-slate-800"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        />
                                        <Button variant="ghost" size="icon" className="shrink-0"><Mic className="h-4 w-4" /></Button>
                                        <Button onClick={handleSend} size="icon" className="shrink-0">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400">
                                Select a conversation to start messaging
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
