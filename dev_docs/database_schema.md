# ClaraVerse Database Schema Documentation

## Overview

ClaraVerse employs a **hybrid database architecture** combining two distinct database systems to support different aspects of the application:

- **Supabase (PostgreSQL)** - For community features and shared resources
- **IndexedDB** - For local client-side storage of chat sessions and user data

This architecture enables both collaborative community features and privacy-focused local data storage.

## Database Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │────│   Electron      │
│   (React)       │    │   Main Process  │
└─────────────────┘    └─────────────────┘
           │                       │
           │                       │
┌─────────────────┐    ┌─────────────────┐
│   IndexedDB     │    │   Supabase      │
│   Local Storage │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘
```

### Data Flow
- **Local Operations**: Chat sessions, messages, and file attachments → IndexedDB
- **Community Features**: User profiles, shared resources, comments → Supabase
- **Hybrid Operations**: Agent workflows, templates → Both systems

## Supabase Database Schema

### Database Overview
- **Database**: PostgreSQL (via Supabase)
- **Location**: Remote cloud hosting
- **Purpose**: Community features and shared resources
- **Access**: Public read, authenticated write operations
- **Extensions**: uuid-ossp, pgcrypto

### Core Tables

#### 1. community_users
Guest users with usernames for the community platform.

```sql
CREATE TABLE community_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    github_username VARCHAR(100),
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- UUID primary key with auto-generation
- Username constraints (3+ chars, alphanumeric + underscore/hyphen)
- Optional profile information
- Automatic timestamps

#### 2. community_resources
Shared resources including MCP servers, prompts, custom nodes, and workflows.

```sql
CREATE TABLE community_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    version VARCHAR(20) DEFAULT '1.0.0',

    -- Files and links
    github_url TEXT,
    download_url TEXT,
    thumbnail_url TEXT,
    demo_url TEXT,

    -- Content
    content TEXT,
    content_type VARCHAR(50),

    -- Ownership
    author_id UUID REFERENCES community_users(id) ON DELETE CASCADE,
    author_username VARCHAR(50) NOT NULL,

    -- Metrics
    downloads_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'published',
    featured BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Categories:**
- mcp-server
- prompt
- custom-node
- wallpaper
- workflow
- tutorial
- tool
- template

#### 3. resource_likes
Tracks user likes on resources.

```sql
CREATE TABLE resource_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES community_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES community_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);
```

#### 4. resource_comments
Discussion system for resources.

```sql
CREATE TABLE resource_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES community_resources(id) ON DELETE CASCADE,
    author_id UUID REFERENCES community_users(id) ON DELETE CASCADE,
    author_username VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES resource_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. resource_views
Analytics tracking for resource views.

```sql
CREATE TABLE resource_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES community_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES community_users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. resource_downloads
Download tracking for analytics.

```sql
CREATE TABLE resource_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES community_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES community_users(id) ON DELETE SET NULL,
    ip_address INET,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes and Performance

**Critical Indexes:**
- Category and author lookups
- Featured content queries
- Tag searches with GIN index
- User-specific queries
- Temporal queries (created_at, viewed_at)

```sql
-- Performance indexes
CREATE INDEX idx_community_resources_category ON community_resources(category);
CREATE INDEX idx_community_resources_author ON community_resources(author_id);
CREATE INDEX idx_community_resources_featured ON community_resources(featured);
CREATE INDEX idx_community_resources_tags ON community_resources USING GIN(tags);
```

### Triggers and Functions

**Automatic Timestamps:**
```sql
CREATE TRIGGER update_community_users_updated_at
    BEFORE UPDATE ON community_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Engagement Metrics:**
```sql
CREATE OR REPLACE FUNCTION increment_downloads(resource_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE community_resources
    SET downloads_count = downloads_count + 1
    WHERE id = resource_uuid;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS)

**Security Policies:**
- Public read access for published resources
- User ownership validation for updates
- Anonymous user creation capability
- Protected engagement tracking

```sql
-- Resources are publicly readable
CREATE POLICY "Resources are publicly readable" ON community_resources
    FOR SELECT USING (status = 'published');
```

## IndexedDB Schema

### Database Overview
- **Database**: IndexedDB (Browser-based NoSQL)
- **Location**: Local browser storage
- **Purpose**: Private user data and chat sessions
- **Access**: Client-side only
- **Version**: 9 (Current)

### Database Configuration
```typescript
const DB_NAME = 'clara_db';
const DB_VERSION = 9;
```

### Core Object Stores

#### 1. clara_sessions
Chat sessions with metadata.

**Schema:**
- Key: `id` (string UUID)
- Properties: title, createdAt, updatedAt, isStarred, isArchived, tags, config

#### 2. clara_messages
Individual chat messages.

**Schema:**
- Key: `id` (string UUID)
- Properties: sessionId, role, content, timestamp, attachments, artifacts, metadata

#### 3. clara_files
File attachments for messages.

**Schema:**
- Key: `id` (string UUID)
- Properties: sessionId, messageId, name, type, size, mimeType, content, thumbnail, processed

#### 4. chats & messages (Legacy)
Legacy chat storage (maintained for compatibility).

#### 5. storage & usage
Application storage and usage tracking.

### Advanced Stores

#### Agent Workflow Stores
- `agent_workflows` - Visual agent definitions
- `workflow_templates` - Reusable workflow templates
- `workflow_versions` - Version history
- `workflow_metadata` - Additional workflow data

#### LumaUI Project Stores
- `lumaui_projects` - Project definitions
- `lumaui_project_files` - Project file contents

#### Design System Stores
- `designs` - UI designs
- `design_versions` - Design history
- `agent_ui_designs` - Agent-specific UI designs

### Indexes

**Performance Indexes:**
```typescript
// Session indexes
sessionStore.createIndex('created_at_index', 'createdAt', { unique: false });
sessionStore.createIndex('updated_at_index', 'updatedAt', { unique: false });
sessionStore.createIndex('starred_index', 'isStarred', { unique: false });

// Message indexes
messageStore.createIndex('session_id_index', 'sessionId', { unique: false });
messageStore.createIndex('timestamp_index', 'timestamp', { unique: false });
messageStore.createIndex('role_index', 'role', { unique: false });
```

## Data Models

### ClaraChatSession
```typescript
interface ClaraChatSession {
  id: string;
  title: string;
  messages: ClaraMessage[];
  createdAt: Date;
  updatedAt: Date;
  isStarred?: boolean;
  isArchived?: boolean;
  tags?: string[];
  config?: ClaraSessionConfig;
  messageCount?: number; // For light loading
}
```

### ClaraMessage
```typescript
interface ClaraMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: ClaraFileAttachment[];
  artifacts?: ClaraArtifact[];
  isStreaming?: boolean;
  mcpToolCalls?: ClaraMCPToolCall[];
  mcpToolResults?: ClaraMCPToolResult[];
  metadata?: ClaraMessageMetadata;
}
```

### Community Resource
```typescript
interface CommunityResource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  tags: string[];
  author_id: string;
  author_username: string;
  downloads_count: number;
  likes_count: number;
  views_count: number;
  status: 'published' | 'draft' | 'removed';
  featured: boolean;
}
```

## Key Operations

### CRUD Operations

#### Supabase Operations
- **Create**: INSERT with RLS policies
- **Read**: SELECT with category/tag filters
- **Update**: UPDATE with ownership validation
- **Delete**: DELETE with cascade relationships

#### IndexedDB Operations
- **Create**: `indexedDBService.put(storeName, value)`
- **Read**: `indexedDBService.get(storeName, key)`
- **Update**: `indexedDBService.put(storeName, value)` (upsert)
- **Delete**: `indexedDBService.delete(storeName, key)`

### Specialized Operations

#### Session Management
```typescript
// Get recent sessions (light loading)
getRecentSessionsLight(limit: number, offset: number)

// Search sessions by content
searchSessions(query: string)

// Get storage statistics
getStorageStats()
```

#### Resource Discovery
```typescript
// Get featured resources
SELECT * FROM community_resources WHERE featured = true

// Get resources by category
SELECT * FROM community_resources WHERE category = 'mcp-server'

// Search by tags
SELECT * FROM community_resources WHERE tags && ARRAY['pdf', 'analysis']
```

### Migration Information

#### Schema Evolution

**Supabase Migrations:**
- `001_community_tables.sql` - Initial community schema
- `002_remove_example_data.sql` - Cleanup migration

**IndexedDB Versioning:**
- Version 9: Added LumaUI project stores
- Version 8: Added workflow template stores
- Version 7: Added agent UI design stores

#### Migration Strategy

**Supabase:**
- PostgreSQL migrations via Supabase CLI
- Backward compatible schema changes
- Data preservation during migrations

**IndexedDB:**
- Version-based schema upgrades
- Automatic migration on database open
- Graceful fallback for missing stores

### Performance Features

#### Indexing Strategy

**Supabase:**
- GIN indexes for tag arrays
- Composite indexes for common queries
- Partial indexes for status filtering
- Covering indexes for analytics

**IndexedDB:**
- Single-field indexes for lookups
- Multi-entry indexes for arrays
- Compound indexes for complex queries
- Automatic index maintenance

#### Query Optimization

**Caching:**
- Session metadata caching
- Resource popularity caching
- User preference caching

**Lazy Loading:**
- Message content on demand
- File attachments when needed
- Session history pagination

## Viewing Database Contents

### Development Tools

#### Supabase Dashboard
```bash
# Access Supabase Studio
supabase start
# Visit http://localhost:54323
```

**Useful Queries:**
```sql
-- Check table sizes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats WHERE schemaname = 'public';

-- View recent activity
SELECT * FROM community_users ORDER BY created_at DESC LIMIT 10;

-- Resource analytics
SELECT category, COUNT(*), AVG(likes_count), AVG(views_count)
FROM community_resources
GROUP BY category;
```

#### IndexedDB Inspection

**Browser DevTools:**
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Navigate to Storage > IndexedDB
4. Select "clara_db" database
5. Browse object stores and records

**Programmatic Inspection:**
```typescript
// Debug data integrity
await claraDatabaseService.debugDataIntegrity();

// View storage statistics
await claraDatabaseService.getStorageStats();
```

### Common Inspection Commands

#### Clara Sessions
```typescript
// Get all sessions
const sessions = await claraDatabaseService.getAllSessions();

// Get recent sessions
const recent = await claraDatabaseService.getRecentSessionsLight(20);

// Search sessions
const searchResults = await claraDatabaseService.searchSessions("query");
```

#### Community Resources
```sql
-- Most popular resources
SELECT title, downloads_count, likes_count, views_count
FROM community_resources
ORDER BY (downloads_count + likes_count + views_count) DESC
LIMIT 10;

-- Active contributors
SELECT author_username, COUNT(*) as resource_count
FROM community_resources
GROUP BY author_username
ORDER BY resource_count DESC;
```

## Performance Optimization

### Database Optimization

#### Supabase Performance
- **Connection Pooling**: Default pool size of 20 connections
- **Query Optimization**: EXPLAIN ANALYZE for slow queries
- **Index Usage**: Regular monitoring of index utilization
- **Vacuum Operations**: Automatic maintenance windows

#### IndexedDB Performance
- **Batch Operations**: Minimize transaction count
- **Index Strategy**: Optimal indexes for query patterns
- **Memory Management**: Efficient object reuse
- **Connection Reuse**: Persistent database connections

### Best Practices

#### Query Performance
```typescript
// Use indexes efficiently
const messages = await indexedDBService.getAll('clara_messages');

// Filter in application when possible
const sessionMessages = messages.filter(m => m.sessionId === sessionId);

// Use getAll with filtering for better performance
const allSessions = await indexedDBService.getAll('clara_sessions');
const recentSessions = allSessions
  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  .slice(0, limit);
```

#### Memory Management
- **Large Files**: Store references, not full content
- **Streaming**: Process data in chunks
- **Cleanup**: Regular orphaned data removal
- **Compression**: Consider data compression for storage

## Security Considerations

### Data Protection

**Supabase Security:**
- Row Level Security (RLS) policies
- API key protection
- Rate limiting on endpoints
- Input validation and sanitization

**IndexedDB Security:**
- Client-side only access
- No server-side exposure
- Sandboxed by browser security model
- Encrypted storage in some browsers

### Privacy Features

**Local-First Design:**
- Chat sessions stored locally only
- No telemetry or data collection
- User-controlled data retention
- Optional cloud synchronization

**Community Privacy:**
- Anonymous user creation
- Optional profile information
- Public resource sharing only
- No personal data requirements

## Troubleshooting

### Common Issues

#### Database Connection Issues
```typescript
// Check IndexedDB availability
if (!window.indexedDB) {
  console.error('IndexedDB not supported');
}

// Verify database version
console.log('Database version:', DB_VERSION);
```

#### Data Integrity Problems
```typescript
// Run integrity check
const integrity = await claraDatabaseService.debugDataIntegrity();

// Clean up orphaned data
await claraDatabaseService.cleanupOrphanedData();
```

#### Performance Issues
```typescript
// Check storage usage
const stats = await claraDatabaseService.getStorageStats();

// Clear old sessions if needed
const oldSessions = await claraDatabaseService.getAllSessions();
const toDelete = oldSessions.filter(s =>
  s.updatedAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
);
```

### Debug Information

#### Environment Details
```typescript
console.log('Database Info:', {
  name: DB_NAME,
  version: DB_VERSION,
  userAgent: navigator.userAgent,
  indexedDB: !!window.indexedDB
});
```

#### Storage Quotas
```typescript
// Check storage quota
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const estimate = await navigator.storage.estimate();
  console.log('Storage usage:', estimate);
}
```

## Conclusion

ClaraVerse's hybrid database architecture effectively supports both collaborative community features and privacy-focused local operations. The Supabase schema handles public resource sharing and user interactions, while IndexedDB manages private chat sessions and application data. This design enables the application's unique combination of social features and local-first privacy.

For development, the database provides comprehensive APIs for all operations, with robust error handling, performance optimization, and debugging capabilities built-in.