import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a05c3297`;

export const AdminDebug = () => {
  const [results, setResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults: any = {};

    // Test 1: Login
    try {
      const loginResponse = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        credentials: 'include',
        body: JSON.stringify({ password: 'changeme' }),
      });

      const loginData = await loginResponse.json();
      const setCookieHeader = loginResponse.headers.get('Set-Cookie');

      testResults.login = {
        status: loginResponse.ok ? 'success' : 'failed',
        statusCode: loginResponse.status,
        data: loginData,
        setCookie: setCookieHeader,
        ok: loginResponse.ok
      };
    } catch (error: any) {
      testResults.login = {
        status: 'error',
        error: error.message
      };
    }

    // Test 2: Check Auth
    try {
      const authResponse = await fetch(`${BASE_URL}/admin/check`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        credentials: 'include',
      });

      const authData = await authResponse.json();

      testResults.authCheck = {
        status: authResponse.ok ? 'success' : 'failed',
        statusCode: authResponse.status,
        data: authData,
        ok: authResponse.ok
      };
    } catch (error: any) {
      testResults.authCheck = {
        status: 'error',
        error: error.message
      };
    }

    // Test 3: Get Posts
    try {
      const postsResponse = await fetch(`${BASE_URL}/admin/posts`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        credentials: 'include',
      });

      const postsData = await postsResponse.json();

      testResults.getPosts = {
        status: postsResponse.ok ? 'success' : 'failed',
        statusCode: postsResponse.status,
        data: postsData,
        ok: postsResponse.ok,
        postCount: postsData.posts?.length || 0
      };
    } catch (error: any) {
      testResults.getPosts = {
        status: 'error',
        error: error.message
      };
    }

    // Test 4: Public Blog API (should always work)
    try {
      const publicResponse = await fetch(`${BASE_URL}/blog/posts`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const publicData = await publicResponse.json();

      testResults.publicBlog = {
        status: publicResponse.ok ? 'success' : 'failed',
        statusCode: publicResponse.status,
        data: publicData,
        ok: publicResponse.ok,
        postCount: publicData.posts?.length || 0
      };
    } catch (error: any) {
      testResults.publicBlog = {
        status: 'error',
        error: error.message
      };
    }

    setResults(testResults);
    setTesting(false);
  };

  const StatusBadge = ({ ok }: { ok: boolean }) => (
    <Badge variant={ok ? 'default' : 'destructive'} className="gap-1">
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {ok ? 'Success' : 'Failed'}
    </Badge>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl mb-2">Admin Connection Debug</h1>
          <p className="text-gray-600 mb-6">
            Test the admin system to diagnose connection issues
          </p>

          <Button
            onClick={runTests}
            disabled={testing}
            className="mb-8"
          >
            {testing ? 'Running Tests...' : 'Run Connection Tests'}
          </Button>

          {results && (
            <div className="space-y-4">
              {/* Test 1: Login */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">1. Admin Login</h3>
                  <StatusBadge ok={results.login?.ok} />
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div>Status Code: {results.login?.statusCode}</div>
                  {results.login?.setCookie && (
                    <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                      Cookie: {results.login.setCookie}
                    </div>
                  )}
                  {results.login?.error && (
                    <div className="text-red-600">Error: {results.login.error}</div>
                  )}
                </div>
              </div>

              {/* Test 2: Auth Check */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">2. Auth Check</h3>
                  <StatusBadge ok={results.authCheck?.ok} />
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div>Status Code: {results.authCheck?.statusCode}</div>
                  <div>Authenticated: {results.authCheck?.data?.authenticated ? 'Yes' : 'No'}</div>
                  {results.authCheck?.data?.debug && (
                    <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                      <div>Has Cookie: {results.authCheck.data.debug.hasCookie ? 'Yes' : 'No'}</div>
                      <div>Has Session: {results.authCheck.data.debug.hasSession ? 'Yes' : 'No'}</div>
                      {results.authCheck.data.debug.sessionId && (
                        <div>Session ID: {results.authCheck.data.debug.sessionId}</div>
                      )}
                    </div>
                  )}
                  {results.authCheck?.error && (
                    <div className="text-red-600">Error: {results.authCheck.error}</div>
                  )}
                </div>
              </div>

              {/* Test 3: Get Posts (Admin) */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">3. Get Posts (Admin API)</h3>
                  <StatusBadge ok={results.getPosts?.ok} />
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div>Status Code: {results.getPosts?.statusCode}</div>
                  <div>Posts Found: {results.getPosts?.postCount || 0}</div>
                  {results.getPosts?.data?.error && (
                    <div className="text-red-600">Error: {results.getPosts.data.error}</div>
                  )}
                  {results.getPosts?.error && (
                    <div className="text-red-600">Error: {results.getPosts.error}</div>
                  )}
                </div>
              </div>

              {/* Test 4: Public Blog API */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">4. Public Blog API</h3>
                  <StatusBadge ok={results.publicBlog?.ok} />
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div>Status Code: {results.publicBlog?.statusCode}</div>
                  <div>Posts Found: {results.publicBlog?.postCount || 0}</div>
                  {results.publicBlog?.error && (
                    <div className="text-red-600">Error: {results.publicBlog.error}</div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">Diagnosis</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      {results.login?.ok && results.authCheck?.ok && results.getPosts?.ok ? (
                        <div className="font-medium text-green-700">
                          ✅ All tests passed! Admin system is working correctly.
                        </div>
                      ) : results.login?.ok && !results.authCheck?.ok ? (
                        <div>
                          ⚠️ Login works, but auth check fails. This is a cookie issue.
                          <br />
                          <strong>Solution:</strong> The browser might be blocking third-party cookies.
                          <br />
                          Try logging in at: <code className="bg-white px-1">/admin</code>
                        </div>
                      ) : !results.login?.ok ? (
                        <div>
                          ❌ Login failed. Please check:
                          <br />
                          1. Server is deployed: <code className="bg-white px-1">supabase functions deploy server</code>
                          <br />
                          2. Password is correct: <code className="bg-white px-1">changeme</code>
                        </div>
                      ) : (
                        <div>
                          ❌ Some tests failed. Please redeploy the server and try again.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
