import { useState, useEffect } from 'react';
import { AdminLogin } from './admin/Login';
import { AdminDashboard } from './admin/Dashboard';
import { Editor } from './admin/Editor';

type View = 'login' | 'dashboard' | 'editor';

export const Admin = () => {
  const [view, setView] = useState<View>('login');
  const [editPostId, setEditPostId] = useState<string | undefined>();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('Admin component mounted');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('Checking auth...');
    try {
      const { adminApi } = await import('../lib/admin/api-client');
      console.log('API client loaded');
      const isAuth = await adminApi.checkAuth();
      console.log('Auth check result:', isAuth);
      
      if (isAuth) {
        setView('dashboard');
      } else {
        setView('login');
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      setError(error.message || 'Failed to connect to server');
      setView('login');
    } finally {
      console.log('Auth check complete, setting checking to false');
      setChecking(false);
    }
  };

  const handleLoginSuccess = () => {
    setView('dashboard');
  };

  const handleLogout = () => {
    setView('login');
  };

  const handleNewPost = () => {
    setEditPostId(undefined);
    setView('editor');
  };

  const handleEditPost = (id: string) => {
    setEditPostId(id);
    setView('editor');
  };

  const handleBack = () => {
    setEditPostId(undefined);
    setView('dashboard');
  };

  const handleSave = () => {
    setEditPostId(undefined);
    setView('dashboard');
  };

  // Error boundary fallback
  if (renderError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Error</h1>
          <p className="text-gray-700 mb-4">The admin page encountered an error:</p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto mb-4">
            {renderError.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  console.log('Admin render - checking:', checking, 'view:', view);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"
          />
          <div className="text-gray-500">Checking authentication...</div>
          <div className="text-xs text-gray-400 mt-2">Check console for details</div>
        </div>
      </div>
    );
  }

  try {
    if (view === 'login') {
      console.log('Rendering AdminLogin');
      return <AdminLogin onLoginSuccess={handleLoginSuccess} error={error} />;
    }

    if (view === 'editor') {
      console.log('Rendering Editor');
      return (
        <Editor
          postId={editPostId}
          onBack={handleBack}
          onSave={handleSave}
        />
      );
    }

    console.log('Rendering AdminDashboard');
    return (
      <AdminDashboard
        onLogout={handleLogout}
        onNewPost={handleNewPost}
        onEditPost={handleEditPost}
      />
    );
  } catch (err: any) {
    console.error('Render error:', err);
    setRenderError(err);
    return null;
  }
};
