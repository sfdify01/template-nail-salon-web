import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize storage buckets on startup
const BLOG_IMAGES_BUCKET = 'make-a05c3297-blog-images';
const PRODUCT_IMAGES_BUCKET = 'make-a05c3297-product-images';

async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Initialize blog images bucket
    const blogBucketExists = buckets?.some(bucket => bucket.name === BLOG_IMAGES_BUCKET);
    if (!blogBucketExists) {
      console.log(`Creating bucket: ${BLOG_IMAGES_BUCKET}`);
      await supabase.storage.createBucket(BLOG_IMAGES_BUCKET, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
    }
    console.log(`Storage initialized: ${BLOG_IMAGES_BUCKET}`);
    
    // Initialize product images bucket
    const productBucketExists = buckets?.some(bucket => bucket.name === PRODUCT_IMAGES_BUCKET);
    if (!productBucketExists) {
      console.log(`Creating bucket: ${PRODUCT_IMAGES_BUCKET}`);
      await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
    }
    console.log(`Storage initialized: ${PRODUCT_IMAGES_BUCKET}`);
  } catch (error) {
    console.error('Storage initialization error:', error);
  }
}

// Initialize storage
initializeStorage();

// Helper function to safely load blog posts as array
async function loadBlogPosts(): Promise<any[]> {
  const rawData = await kv.get('blog_posts');
  
  // Handle different data formats
  if (Array.isArray(rawData)) {
    return rawData;
  } else if (rawData && typeof rawData === 'object') {
    // Object format - extract values
    return Object.values(rawData);
  } else {
    // No data or unexpected format
    return [];
  }
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: (origin) => origin || "*", // Allow any origin
    credentials: true, // Allow credentials
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a05c3297/health", (c) => {
  return c.json({ status: "ok" });
});

// Upload blog image
app.post("/make-server-a05c3297/blog/upload-image", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileExt = filename.split('.').pop();
    const timestamp = Date.now();
    const storagePath = `${timestamp}-${filename}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BLOG_IMAGES_BUCKET)
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(BLOG_IMAGES_BUCKET)
      .createSignedUrl(storagePath, 31536000); // 1 year

    if (!signedUrlData?.signedUrl) {
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }

    return c.json({
      success: true,
      url: signedUrlData.signedUrl,
      path: storagePath,
    });

  } catch (error) {
    console.error('Blog image upload error:', error);
    return c.json({ error: `Server error: ${error.message}` }, 500);
  }
});

// Get signed URL for existing blog image
app.get("/make-server-a05c3297/blog/image/:path", async (c) => {
  try {
    const path = c.req.param('path');

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData, error } = await supabase.storage
      .from(BLOG_IMAGES_BUCKET)
      .createSignedUrl(path, 31536000);

    if (error || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', error);
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }

    return c.json({
      success: true,
      url: signedUrlData.signedUrl,
    });

  } catch (error) {
    console.error('Get blog image error:', error);
    return c.json({ error: `Server error: ${error.message}` }, 500);
  }
});

// ========================================
// PRODUCT IMAGE STORAGE
// ========================================

// Upload product image (admin only)
app.post("/make-server-a05c3297/admin/product/upload-image", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;
    const itemId = formData.get('itemId') as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!itemId) {
      return c.json({ error: 'Item ID is required' }, 400);
    }

    const fileExt = filename.split('.').pop();
    const timestamp = Date.now();
    const storagePath = `${itemId}-${timestamp}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .createSignedUrl(storagePath, 31536000); // 1 year

    if (!signedUrlData?.signedUrl) {
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }

    return c.json({
      success: true,
      url: signedUrlData.signedUrl,
      path: storagePath,
    });

  } catch (error) {
    console.error('Product image upload error:', error);
    return c.json({ error: `Server error: ${error.message}` }, 500);
  }
});

// Get signed URL for existing product image
app.get("/make-server-a05c3297/product/image/:path", async (c) => {
  try {
    const path = c.req.param('path');

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .createSignedUrl(path, 31536000);

    if (error || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', error);
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }

    return c.json({
      success: true,
      url: signedUrlData.signedUrl,
    });

  } catch (error) {
    console.error('Get product image error:', error);
    return c.json({ error: `Server error: ${error.message}` }, 500);
  }
});

// ========================================
// PUBLIC BLOG API (No auth required)
// ========================================

// Get all published blog posts (public)
app.get("/make-server-a05c3297/blog/posts", async (c) => {
  try {
    const posts = await loadBlogPosts();
    
    return c.json({ 
      posts,
      categories: [
        { id: "recipe", name: "Recipe", icon: "🍝" },
        { id: "guide", name: "Guide", icon: "📖" },
        { id: "news", name: "News", icon: "📰" },
        { id: "event", name: "Event", icon: "🎉" }
      ]
    });
  } catch (error) {
    console.error('Get public posts error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Get single blog post by slug (public)
app.get("/make-server-a05c3297/blog/posts/:slug", async (c) => {
  try {
    const slug = c.req.param('slug');
    const posts = await loadBlogPosts();
    
    const post = posts.find((p: any) => p.slug === slug || p.id === slug);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    return c.json(post);
  } catch (error) {
    console.error('Get public post error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// ========================================
// ADMIN ROUTES
// ========================================

const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || 'changeme';
const SESSION_SECRET = Deno.env.get('SESSION_SECRET') || 'change-this-secret';

// Simple session management using KV store
async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiry = Date.now() + (12 * 60 * 60 * 1000); // 12 hours
  
  // kv.set stores objects directly (JSONB column)
  await kv.set(`admin_session:${sessionId}`, {
    userId,
    expiry,
    createdAt: Date.now(),
  });
  
  return sessionId;
}

async function validateSession(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  
  // kv.get returns the object directly (already parsed from JSONB)
  const data = await kv.get(`admin_session:${sessionId}`);
  if (!data) return false;
  
  // Check if session is expired
  if (data.expiry < Date.now()) {
    await kv.del(`admin_session:${sessionId}`);
    return false;
  }
  
  return true;
}

async function checkAuth(c: any): Promise<boolean> {
  const sessionCookie = c.req.header('Cookie');
  if (!sessionCookie) return false;
  
  const match = sessionCookie.match(/admin_session=([^;]+)/);
  if (!match) return false;
  
  return await validateSession(match[1]);
}

// Admin login
app.post("/make-server-a05c3297/admin/login", async (c) => {
  try {
    const { password } = await c.req.json();
    
    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: 'Invalid password' }, 401);
    }
    
    const sessionId = await createSession('admin');
    
    // More permissive cookie settings for cross-origin requests
    return c.json(
      { success: true },
      200,
      {
        'Set-Cookie': `admin_session=${sessionId}; HttpOnly; SameSite=None; Secure; Max-Age=43200; Path=/`,
      }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Admin logout
app.post("/make-server-a05c3297/admin/logout", async (c) => {
  const sessionCookie = c.req.header('Cookie');
  const match = sessionCookie?.match(/admin_session=([^;]+)/);
  
  if (match) {
    await kv.del(`admin_session:${match[1]}`);
  }
  
  return c.json(
    { success: true },
    200,
    {
      'Set-Cookie': 'admin_session=; HttpOnly; SameSite=None; Secure; Max-Age=0; Path=/',
    }
  );
});

// Check auth
app.get("/make-server-a05c3297/admin/check", async (c) => {
  const isAuth = await checkAuth(c);
  const sessionCookie = c.req.header('Cookie');
  const match = sessionCookie?.match(/admin_session=([^;]+)/);
  
  // Add debug info
  console.log('Auth check - Cookie:', sessionCookie);
  console.log('Auth check - Session ID:', match ? match[1] : 'none');
  console.log('Auth check - Authenticated:', isAuth);
  
  return c.json({ 
    authenticated: isAuth,
    debug: {
      hasCookie: !!sessionCookie,
      hasSession: !!match,
      sessionId: match ? match[1].substring(0, 10) + '...' : null
    }
  }, isAuth ? 200 : 401);
});

// Get all posts
app.get("/make-server-a05c3297/admin/posts", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const posts = await loadBlogPosts();
    
    return c.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Get single post
app.get("/make-server-a05c3297/admin/posts/:id", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const id = c.req.param('id');
    const posts = await loadBlogPosts();
    
    const post = posts.find((p: any) => p.id === id);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    return c.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Create post
app.post("/make-server-a05c3297/admin/posts", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const newPost = await c.req.json();
    
    // Validate required fields
    if (!newPost.title || !newPost.slug || !newPost.excerpt || !newPost.content) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const posts = await loadBlogPosts();
    
    // Check slug uniqueness
    if (posts.some((p: any) => p.slug === newPost.slug)) {
      return c.json({ error: 'Slug already exists' }, 400);
    }
    
    // Create post with ID and timestamps
    const post = {
      ...newPost,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    posts.push(post);
    await kv.set('blog_posts', posts);
    
    return c.json({ id: post.id, success: true });
  } catch (error) {
    console.error('Create post error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Update post
app.put("/make-server-a05c3297/admin/posts/:id", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const posts = await loadBlogPosts();
    
    const index = posts.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    // Check slug uniqueness if slug is being updated
    if (updates.slug && updates.slug !== posts[index].slug) {
      if (posts.some((p: any, i: number) => i !== index && p.slug === updates.slug)) {
        return c.json({ error: 'Slug already exists' }, 400);
      }
    }
    
    // Update post
    posts[index] = {
      ...posts[index],
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set('blog_posts', posts);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update post error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Delete post
app.delete("/make-server-a05c3297/admin/posts/:id", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const id = c.req.param('id');
    
    const posts = await loadBlogPosts();
    
    const filtered = posts.filter((p: any) => p.id !== id);
    
    if (filtered.length === posts.length) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    await kv.set('blog_posts', filtered);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Upload image for admin
app.post("/make-server-a05c3297/admin/upload", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    const slug = formData.get('slug') as string;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const storagePath = `${slug}-${timestamp}.${fileExt}`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BLOG_IMAGES_BUCKET)
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
    
    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(BLOG_IMAGES_BUCKET)
      .createSignedUrl(storagePath, 31536000);
    
    if (!signedUrlData?.signedUrl) {
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }
    
    return c.json({
      url: signedUrlData.signedUrl,
      path: storagePath,
    });
    
  } catch (error) {
    console.error('Admin upload error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// ========================================
// DEDUPLICATION ROUTE
// ========================================

// Helper: Normalize string (trim, lowercase, collapse spaces)
function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Helper: SHA-256 hash
async function sha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Deduplicate blog posts
app.post("/make-server-a05c3297/admin/dedupe-blogs", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { dryRun = false } = await c.req.json().catch(() => ({ dryRun: false }));
    
    // Load all posts
    const posts = await loadBlogPosts();
    
    if (posts.length === 0) {
      return c.json({ 
        ok: true, 
        removed: 0, 
        details: [], 
        message: 'No posts to deduplicate' 
      });
    }
    
    // Build groups by duplicate key
    const groups = new Map<string, any[]>();
    
    for (const post of posts) {
      const titleNorm = normalize(post.title || '');
      const content = typeof post.content === 'string' 
        ? post.content 
        : Array.isArray(post.content) 
          ? post.content.join('\n') 
          : '';
      const hash = await sha256(content);
      const slug = post.slug || '';
      const image = post.image || '';
      
      // Key combines: normalized title | content hash | slug | image
      const key = `${titleNorm}|${hash}|${slug}|${image}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(post);
    }
    
    // Find duplicates and determine what to keep/remove
    const removals: any[] = [];
    const postsToKeep = new Set<string>();
    const postsToRemove = new Set<string>();
    
    for (const [key, groupPosts] of groups) {
      if (groupPosts.length <= 1) {
        // Not a duplicate, keep it
        postsToKeep.add(groupPosts[0].id);
        continue;
      }
      
      // Sort: most recent updatedAt first, then smallest id
      groupPosts.sort((a, b) => {
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        
        if (bUpdated !== aUpdated) {
          return bUpdated - aUpdated; // Most recent first
        }
        
        // Tie-break by id (smallest first)
        return (a.id || '').localeCompare(b.id || '');
      });
      
      const keep = groupPosts[0];
      const drop = groupPosts.slice(1);
      
      postsToKeep.add(keep.id);
      drop.forEach(p => postsToRemove.add(p.id));
      
      removals.push({
        keepId: keep.id,
        keepTitle: keep.title,
        keepUpdated: keep.updatedAt || keep.date,
        removedIds: drop.map(d => d.id),
        removedCount: drop.length,
        duplicateKey: key.split('|')[0], // Just show title for readability
      });
    }
    
    // Create audit log
    const auditLog = {
      timestamp: new Date().toISOString(),
      dryRun,
      totalPosts: posts.length,
      duplicateGroups: removals.length,
      postsToRemove: postsToRemove.size,
      postsToKeep: postsToKeep.size,
      details: removals,
    };
    
    // Save audit log
    const auditKey = `blog_dedupe_log:${Date.now()}`;
    await kv.set(auditKey, auditLog);
    
    // If not dry run, actually remove duplicates
    if (!dryRun && postsToRemove.size > 0) {
      const filteredPosts = posts.filter((p: any) => !postsToRemove.has(p.id));
      await kv.set('blog_posts', filteredPosts);
      
      console.log(`Deduplication complete: removed ${postsToRemove.size} duplicate posts`);
    }
    
    return c.json({
      ok: true,
      dryRun,
      removed: postsToRemove.size,
      kept: postsToKeep.size,
      details: removals,
      auditLogKey: auditKey,
      message: dryRun 
        ? `DRY RUN: Would remove ${postsToRemove.size} duplicate posts` 
        : `Removed ${postsToRemove.size} duplicate posts`,
    });
    
  } catch (error) {
    console.error('Deduplication error:', error);
    return c.json({ 
      error: `Deduplication failed: ${error.message}`,
      stack: error.stack,
    }, 500);
  }
});

// Get deduplication audit logs
app.get("/make-server-a05c3297/admin/dedupe-logs", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const logs = await kv.getByPrefix('blog_dedupe_log:');
    const sortedLogs = logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return c.json({ logs: sortedLogs });
  } catch (error) {
    console.error('Get dedupe logs error:', error);
    return c.json({ error: 'Failed to load logs' }, 500);
  }
});

// ========================================
// PUBLIC MIGRATION ENDPOINT (No Auth Required)
// ========================================

app.post("/make-server-a05c3297/migrate-blog-posts", async (c) => {
  try {
    const { posts } = await c.req.json();
    
    if (!Array.isArray(posts) || posts.length === 0) {
      return c.json({ error: 'No posts provided' }, 400);
    }
    
    console.log(`Migration request: ${posts.length} posts to migrate`);
    
    // Get existing posts using helper function
    const existingPosts = await loadBlogPosts();
    console.log('[MIGRATION] Loaded existing posts, count:', existingPosts.length);
    
    const existingSlugs = new Set(existingPosts.map((p: any) => p.slug));
    
    const results = [];
    let added = 0;
    let skipped = 0;
    
    for (const post of posts) {
      // Skip if slug already exists
      if (existingSlugs.has(post.slug)) {
        results.push({
          slug: post.slug,
          status: 'skipped',
          reason: 'Slug already exists'
        });
        skipped++;
        continue;
      }
      
      // Add post with ID and timestamps
      const newPost = {
        ...post,
        id: post.id || crypto.randomUUID(),
        createdAt: post.createdAt || new Date().toISOString(),
        updatedAt: post.updatedAt || new Date().toISOString(),
      };
      
      existingPosts.push(newPost);
      existingSlugs.add(newPost.slug);
      
      results.push({
        slug: newPost.slug,
        status: 'success',
        id: newPost.id
      });
      added++;
    }
    
    // Save all posts
    await kv.set('blog_posts', existingPosts);
    
    console.log(`Migration complete: ${added} added, ${skipped} skipped`);
    
    return c.json({
      success: true,
      added,
      skipped,
      total: posts.length,
      results
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return c.json({ 
      error: `Migration failed: ${error.message}`,
      stack: error.stack 
    }, 500);
  }
});

// ========================================
// MENU ENDPOINTS
// ========================================

// Helper function to safely load menu data as object
async function loadMenuData(): Promise<any> {
  const rawData = await kv.get('menu_data');
  
  if (rawData && typeof rawData === 'object') {
    return rawData;
  } else {
    // Return default structure if no data
    return {
      categories: [],
      dietaryFilters: [
        { id: 'halal', label: 'Halal', icon: '🥩' },
        { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
        { id: 'vegan', label: 'Vegan', icon: '🌱' }
      ]
    };
  }
}

// Get menu data (public)
app.get("/make-server-a05c3297/menu", async (c) => {
  try {
    const menuData = await loadMenuData();
    return c.json(menuData);
  } catch (error) {
    console.error('Get menu error:', error);
    return c.json({ error: 'Failed to load menu' }, 500);
  }
});

// Update menu data (admin only)
app.put("/make-server-a05c3297/admin/menu", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const menuData = await c.req.json();
    
    // Validate structure
    if (!menuData.categories || !Array.isArray(menuData.categories)) {
      return c.json({ error: 'Invalid menu structure' }, 400);
    }
    
    await kv.set('menu_data', menuData);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update menu error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Add menu category (admin only)
app.post("/make-server-a05c3297/admin/menu/category", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const category = await c.req.json();
    
    if (!category.id || !category.name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const menuData = await loadMenuData();
    
    // Check if category already exists
    if (menuData.categories.some((c: any) => c.id === category.id)) {
      return c.json({ error: 'Category already exists' }, 400);
    }
    
    menuData.categories.push({
      ...category,
      items: category.items || []
    });
    
    await kv.set('menu_data', menuData);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Add category error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Update menu category (admin only)
app.put("/make-server-a05c3297/admin/menu/category/:id", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const categoryId = c.req.param('id');
    const updates = await c.req.json();
    
    const menuData = await loadMenuData();
    const categoryIndex = menuData.categories.findIndex((cat: any) => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return c.json({ error: 'Category not found' }, 404);
    }
    
    menuData.categories[categoryIndex] = {
      ...menuData.categories[categoryIndex],
      ...updates,
      id: categoryId // Preserve ID
    };
    
    await kv.set('menu_data', menuData);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update category error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Delete menu category (admin only)
app.delete("/make-server-a05c3297/admin/menu/category/:id", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const categoryId = c.req.param('id');
    
    const menuData = await loadMenuData();
    const filtered = menuData.categories.filter((cat: any) => cat.id !== categoryId);
    
    if (filtered.length === menuData.categories.length) {
      return c.json({ error: 'Category not found' }, 404);
    }
    
    menuData.categories = filtered;
    await kv.set('menu_data', menuData);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Add menu item to category (admin only)
app.post("/make-server-a05c3297/admin/menu/category/:categoryId/item", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const categoryId = c.req.param('categoryId');
    const item = await c.req.json();
    
    if (!item.id || !item.name || item.price === undefined) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const menuData = await loadMenuData();
    const category = menuData.categories.find((cat: any) => cat.id === categoryId);
    
    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }
    
    // Check if item already exists in category
    if (category.items.some((i: any) => i.id === item.id)) {
      return c.json({ error: 'Item already exists' }, 400);
    }
    
    category.items.push(item);
    await kv.set('menu_data', menuData);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Add item error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Update menu item (admin only)
app.put("/make-server-a05c3297/admin/menu/category/:categoryId/item/:itemId", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const categoryId = c.req.param('categoryId');
    const itemId = c.req.param('itemId');
    const updates = await c.req.json();
    
    const menuData = await loadMenuData();
    const category = menuData.categories.find((cat: any) => cat.id === categoryId);
    
    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }
    
    const itemIndex = category.items.findIndex((item: any) => item.id === itemId);
    
    if (itemIndex === -1) {
      return c.json({ error: 'Item not found' }, 404);
    }
    
    category.items[itemIndex] = {
      ...category.items[itemIndex],
      ...updates,
      id: itemId // Preserve ID
    };
    
    await kv.set('menu_data', menuData);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update item error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Delete menu item (admin only)
app.delete("/make-server-a05c3297/admin/menu/category/:categoryId/item/:itemId", async (c) => {
  if (!await checkAuth(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const categoryId = c.req.param('categoryId');
    const itemId = c.req.param('itemId');
    
    const menuData = await loadMenuData();
    const category = menuData.categories.find((cat: any) => cat.id === categoryId);
    
    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }
    
    const filtered = category.items.filter((item: any) => item.id !== itemId);
    
    if (filtered.length === category.items.length) {
      return c.json({ error: 'Item not found' }, 404);
    }
    
    category.items = filtered;
    await kv.set('menu_data', menuData);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Migrate menu data (public endpoint for easy migration)
app.post("/make-server-a05c3297/migrate-menu", async (c) => {
  try {
    const menuData = await c.req.json();
    
    if (!menuData.categories || !Array.isArray(menuData.categories)) {
      return c.json({ error: 'Invalid menu structure' }, 400);
    }
    
    console.log(`Menu migration: ${menuData.categories.length} categories`);
    
    // Get existing menu
    const existingMenu = await loadMenuData();
    
    // Merge or replace based on preference (here we replace)
    await kv.set('menu_data', menuData);
    
    const totalItems = menuData.categories.reduce((sum: number, cat: any) => sum + (cat.items?.length || 0), 0);
    
    console.log(`Menu migration complete: ${menuData.categories.length} categories, ${totalItems} items`);
    
    return c.json({
      success: true,
      categories: menuData.categories.length,
      items: totalItems
    });
    
  } catch (error) {
    console.error('Menu migration error:', error);
    return c.json({ 
      error: `Migration failed: ${error.message}`,
      stack: error.stack 
    }, 500);
  }
});

Deno.serve(app.fetch);