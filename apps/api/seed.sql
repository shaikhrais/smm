-- Seed Data

-- Business
INSERT INTO businesses (id, name, industry, website) VALUES
('bus_1', 'Acme Corp', 'Technology', 'https://acme.com'),
('bus_2', 'Glow Beauty', 'Retail', 'https://glowbeauty.com');

-- Brands
INSERT INTO brands (id, business_id, name, description, color) VALUES
('brand_1', 'bus_1', 'AcmeTech', 'Innovative gadgets', '#3b82f6'),
('brand_2', 'bus_2', 'GlowSkin', 'Natural skincare', '#ec4899');

-- Social Accounts
INSERT INTO social_accounts (id, brand_id, platform, username, handle, status) VALUES
('soc_1', 'brand_1', 'twitter', 'AcmeTechHQ', '@acmetech', 'connected'),
('soc_2', 'brand_1', 'linkedin', 'acme-tech', 'acme-tech', 'connected'),
('soc_3', 'brand_2', 'instagram', 'glowskin_official', '@glowskin', 'connected');

-- Posts
INSERT INTO posts (id, brand_id, content, scheduled_date, status, platforms) VALUES
('post_1', 'brand_1', 'Launching our new drone today! #tech #drone', datetime('now', '+1 day'), 'scheduled', '["twitter", "linkedin"]'),
('post_2', 'brand_2', 'Summer sale is live! 50% off.', datetime('now', '-2 days'), 'published', '["instagram"]');

-- Analytics
INSERT INTO analytics_stats (id, brand_id, date, impressions, engagement, new_followers, likes) VALUES
('stat_1', 'brand_1', datetime('now', '-1 day'), 1500, 300, 10, 250),
('stat_2', 'brand_1', datetime('now', '-2 days'), 1200, 250, 5, 200),
('stat_3', 'brand_2', datetime('now', '-1 day'), 3000, 800, 50, 600);

-- Conversations
INSERT INTO conversations (id, brand_id, platform, sender_name, sender_avatar, last_message, unread_count, updated_at) VALUES
('conv_1', 'brand_1', 'twitter', 'John Doe', '', 'Is this available?', 1, datetime('now')),
('conv_2', 'brand_2', 'instagram', 'Jane Smith', '', 'Love this product!', 0, datetime('now', '-1 hour'));

-- Messages
INSERT INTO messages (id, conversation_id, sender, content, created_at) VALUES
('msg_1', 'conv_1', 'them', 'Is this available?', datetime('now', '-5 minutes')),
('msg_2', 'conv_2', 'them', 'Love this product!', datetime('now', '-1 hour')),
('msg_3', 'conv_2', 'me', 'Thanks Jane!', datetime('now', '-55 minutes'));
