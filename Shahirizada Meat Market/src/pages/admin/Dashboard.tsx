import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Search, Plus, Edit, Trash2, LogOut, Star, Calendar,
  FileText, Filter, ChevronDown, Copy, AlertCircle, CheckCircle2, UtensilsCrossed
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { MenuManager } from './MenuManager';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  date: string;
  featured: boolean;
  updatedAt?: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
  onNewPost: () => void;
  onEditPost: (id: string) => void;
}

export const AdminDashboard = ({ onLogout, onNewPost, onEditPost }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('blog');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dedupeResults, setDedupeResults] = useState<any>(null);
  const [dedupeLoading, setDedupeLoading] = useState(false);
  const [showDedupeDialog, setShowDedupeDialog] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { adminApi } = await import('../../lib/admin/api-client');
      const data = await adminApi.getPosts();
      console.log('Posts loaded:', data);
      console.log('Type of data.posts:', typeof data.posts);
      console.log('Is array?:', Array.isArray(data.posts));
      
      // Handle different response formats
      let postsArray = [];
      if (Array.isArray(data.posts)) {
        postsArray = data.posts;
      } else if (Array.isArray(data)) {
        postsArray = data;
      } else if (data.posts && typeof data.posts === 'object') {
        // If posts is an object, convert it to an array
        console.warn('Posts is an object, converting to array:', data.posts);
        postsArray = Object.values(data.posts);
      } else {
        console.warn('Unexpected posts format:', data);
        postsArray = [];
      }
      
      console.log('Final posts array:', postsArray);
      setPosts(postsArray);
    } catch (error: any) {
      console.error('Failed to load posts:', error);
      toast.error(`Failed to load posts: ${error.message || 'Unknown error'}`);
      setPosts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const { adminApi } = await import('../../lib/admin/api-client');
      await adminApi.deletePost(id);
      toast.success('Post deleted');
      loadPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
    setDeleteConfirm(null);
  };

  const handleLogout = async () => {
    try {
      const { adminApi } = await import('../../lib/admin/api-client');
      await adminApi.logout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout();
    }
  };

  const handleDedupeDryRun = async () => {
    setDedupeLoading(true);
    try {
      const { adminApi } = await import('../../lib/admin/api-client');
      const result = await adminApi.deduplicateBlogs(true);
      setDedupeResults(result);
      setShowDedupeDialog(true);
      
      if (result.removed === 0) {
        toast.success('No duplicates found! 🎉');
      } else {
        toast.info(`Found ${result.removed} duplicate post(s)`);
      }
    } catch (error) {
      toast.error('Deduplication check failed');
      console.error('Dedupe error:', error);
    } finally {
      setDedupeLoading(false);
    }
  };

  const handleDedupeExecute = async () => {
    setDedupeLoading(true);
    try {
      const { adminApi } = await import('../../lib/admin/api-client');
      const result = await adminApi.deduplicateBlogs(false);
      
      toast.success(`Removed ${result.removed} duplicate post(s)`);
      setDedupeResults(result);
      setShowDedupeDialog(false);
      
      // Reload posts to show updated list
      await loadPosts();
    } catch (error) {
      toast.error('Deduplication failed');
      console.error('Dedupe execute error:', error);
    } finally {
      setDedupeLoading(false);
    }
  };

  // Ensure posts is always an array before filtering
  const safePost = Array.isArray(posts) ? posts : [];
  
  const filteredPosts = safePost.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
                         post.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || post.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(safePost.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO: Prevent indexing */}
      <meta name="robots" content="noindex,nofollow" />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your content and menu
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="blog" className="gap-2">
              <FileText className="w-4 h-4" />
              Blog Posts
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blog" className="space-y-6">
        {/* Info Banner - Show if no posts */}
        {posts.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">No blog posts yet</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Get started by migrating your existing blog posts or creating a new one.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = '/migrate-blog'}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Migrate Existing Posts
                  </Button>
                  <Button
                    size="sm"
                    onClick={onNewPost}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categories.map(cat => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleDedupeDryRun}
                variant="outline"
                className="gap-2"
                disabled={dedupeLoading || posts.length === 0}
              >
                <Copy className="w-4 h-4" />
                {dedupeLoading ? 'Scanning...' : 'Remove Duplicates'}
              </Button>
              <Button
                onClick={onNewPost}
                className="bg-[#8B0000] hover:bg-[#6B0000] gap-2"
              >
                <Plus className="w-4 h-4" />
                New Post
              </Button>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">No posts found</h3>
            <p className="text-gray-600 mb-6">
              {search || categoryFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Get started by creating your first blog post'}
            </p>
            {!search && categoryFilter === 'all' && (
              <Button
                onClick={onNewPost}
                className="bg-[#8B0000] hover:bg-[#6B0000]"
              >
                Create First Post
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg truncate">{post.title}</h3>
                        {post.featured && (
                          <Badge variant="default" className="bg-yellow-500 gap-1">
                            <Star className="w-3 h-3" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <Badge variant="outline">{post.category}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                        <span>by {post.author}</span>
                        {post.updatedAt && (
                          <span className="text-xs">
                            Updated: {new Date(post.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditPost(post.id)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className={
                          deleteConfirm === post.id
                            ? 'gap-2 border-red-500 text-red-600 hover:bg-red-50'
                            : 'gap-2'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteConfirm === post.id ? 'Confirm?' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-sm text-gray-600">Total Posts</div>
                <div className="text-2xl mt-1">{posts.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-600">Featured</div>
                <div className="text-2xl mt-1">{posts.filter(p => p.featured).length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-600">Categories</div>
                <div className="text-2xl mt-1">{categories.length - 1}</div>
              </Card>
            </div>

          </TabsContent>

          <TabsContent value="menu">
            <MenuManager />
          </TabsContent>
        </Tabs>

        {/* Deduplication Results Dialog */}
        {showDedupeDialog && dedupeResults && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  {dedupeResults.removed > 0 ? (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                  <div>
                    <h2 className="text-xl">Deduplication Results</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {dedupeResults.dryRun ? 'Preview - No changes made yet' : 'Completed'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {dedupeResults.removed === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg mb-2">No duplicates found!</h3>
                    <p className="text-gray-600">All blog posts are unique.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm">
                            <strong>Found {dedupeResults.removed} duplicate post(s)</strong> across{' '}
                            {dedupeResults.details?.length || 0} group(s).
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            The most recent version of each duplicate will be kept.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {dedupeResults.details?.map((detail: any, idx: number) => (
                        <Card key={idx} className="p-4 bg-gray-50">
                          <div className="mb-3">
                            <h4 className="font-medium text-sm mb-1">{detail.keepTitle}</h4>
                            <p className="text-xs text-gray-600">
                              {detail.removedCount} duplicate(s) found
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-xs">
                              <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-green-700">Keep:</span>{' '}
                                <code className="bg-green-100 px-1.5 py-0.5 rounded text-xs">
                                  {detail.keepId?.substring(0, 8)}...
                                </code>
                                {detail.keepUpdated && (
                                  <span className="text-gray-600 ml-2">
                                    ({new Date(detail.keepUpdated).toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                            </div>
                            {detail.removedIds?.map((id: string) => (
                              <div key={id} className="flex items-start gap-2 text-xs">
                                <Trash2 className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-red-700">Remove:</span>{' '}
                                  <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs">
                                    {id.substring(0, 8)}...
                                  </code>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDedupeDialog(false)}
                >
                  Cancel
                </Button>
                {dedupeResults.removed > 0 && dedupeResults.dryRun && (
                  <Button
                    onClick={handleDedupeExecute}
                    disabled={dedupeLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {dedupeLoading ? 'Removing...' : `Remove ${dedupeResults.removed} Duplicate(s)`}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
