import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export const TestAdminConnection = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a05c3297`;
    const healthUrl = `${baseUrl}/health`;
    const loginUrl = `${baseUrl}/admin/login`;

    const tests = {
      projectId,
      publicAnonKey: publicAnonKey.substring(0, 20) + '...',
      baseUrl,
      healthUrl,
      loginUrl,
      healthCheck: null as any,
      loginTest: null as any,
      loginTestNoCreds: null as any,
    };

    // Test 1: Health check
    try {
      const response = await fetch(healthUrl, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      tests.healthCheck = {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => null),
      };
    } catch (error: any) {
      tests.healthCheck = {
        error: error.message,
        type: error.name,
      };
    }

    // Test 2: Login endpoint (with wrong password)
    try {
      console.log('Testing login endpoint:', loginUrl);
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        credentials: 'include',
        body: JSON.stringify({ password: 'test' }),
      });
      
      console.log('Login test response:', response);
      
      tests.loginTest = {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        data: await response.json().catch(() => null),
      };
    } catch (error: any) {
      console.error('Login test error:', error);
      tests.loginTest = {
        error: error.message,
        type: error.name,
        stack: error.stack,
      };
    }
    
    // Test 3: Try without credentials
    try {
      console.log('Testing login without credentials...');
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        // NO credentials: 'include'
        body: JSON.stringify({ password: 'test' }),
      });
      
      tests.loginTestNoCreds = {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => null),
      };
    } catch (error: any) {
      tests.loginTestNoCreds = {
        error: error.message,
        type: error.name,
      };
    }

    setResult(tests);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl mb-2">Admin Connection Test</h1>
          <p className="text-gray-600 mb-6">
            Test if the Supabase Edge Function server is running
          </p>

          <Button
            onClick={testConnection}
            disabled={testing}
            className="mb-6"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Connection Test'
            )}
          </Button>

          {result && (
            <div className="space-y-4">
              {/* Configuration */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">Configuration</h3>
                <div className="text-sm space-y-1 font-mono">
                  <div><strong>Project ID:</strong> {result.projectId}</div>
                  <div><strong>Anon Key:</strong> {result.publicAnonKey}</div>
                  <div><strong>Base URL:</strong> {result.baseUrl}</div>
                </div>
              </div>

              {/* Health Check */}
              <div className={`border rounded-lg p-4 ${
                result.healthCheck?.ok 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.healthCheck?.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="font-medium">Health Check</h3>
                </div>
                
                <div className="text-sm space-y-2">
                  <div><strong>URL:</strong> <code className="text-xs">{result.healthUrl}</code></div>
                  
                  {result.healthCheck?.error ? (
                    <div className="bg-red-100 p-3 rounded">
                      <div><strong>Error:</strong> {result.healthCheck.error}</div>
                      <div className="mt-2 text-xs">
                        <strong>Diagnosis:</strong> The Edge Function is not deployed or not accessible.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div><strong>Status:</strong> {result.healthCheck?.status}</div>
                      <div>
                        <strong>Response:</strong> 
                        <pre className="mt-1 bg-white p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(result.healthCheck?.data, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Login Test */}
              <div className={`border rounded-lg p-4 ${
                result.loginTest?.status === 401
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.loginTest?.status === 401 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : result.loginTest?.error ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  <h3 className="font-medium">Login Endpoint</h3>
                </div>
                
                <div className="text-sm space-y-2">
                  <div><strong>URL:</strong> <code className="text-xs">{result.loginUrl}</code></div>
                  
                  {result.loginTest?.error ? (
                    <div className="bg-red-100 p-3 rounded">
                      <div><strong>Error:</strong> {result.loginTest.error}</div>
                    </div>
                  ) : (
                    <>
                      <div><strong>Status:</strong> {result.loginTest?.status}</div>
                      {result.loginTest?.status === 401 && (
                        <div className="bg-green-100 p-2 rounded text-xs">
                          ✅ Login endpoint is working! (401 = wrong password, which is expected)
                        </div>
                      )}
                      <div>
                        <strong>Response:</strong> 
                        <pre className="mt-1 bg-white p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(result.loginTest?.data, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Login Test No Creds */}
              {result.loginTestNoCreds && (
                <div className={`border rounded-lg p-4 ${
                  result.loginTestNoCreds?.status === 401
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.loginTestNoCreds?.status === 401 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : result.loginTestNoCreds?.error ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <h3 className="font-medium">Login (Without Credentials)</h3>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    {result.loginTestNoCreds?.error ? (
                      <div className="bg-red-100 p-3 rounded">
                        <div><strong>Error:</strong> {result.loginTestNoCreds.error}</div>
                      </div>
                    ) : (
                      <>
                        <div><strong>Status:</strong> {result.loginTestNoCreds?.status}</div>
                        {result.loginTestNoCreds?.status === 401 && (
                          <div className="bg-green-100 p-2 rounded text-xs">
                            ✅ Works without credentials! The CORS issue is with credentials mode.
                          </div>
                        )}
                        <div>
                          <strong>Response:</strong> 
                          <pre className="mt-1 bg-white p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(result.loginTestNoCreds?.data, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <h3 className="font-medium mb-2">Diagnosis</h3>
                <div className="text-sm space-y-2">
                  {result.healthCheck?.ok && (result.loginTest?.status === 401 || result.loginTestNoCreds?.status === 401) ? (
                    <div className="text-green-700">
                      ✅ <strong>Server is working!</strong> {result.loginTest?.status === 401 ? 'You can use the admin login with password: ' : 'Login endpoint works but '}
                      {result.loginTest?.status === 401 ? <code>changeme</code> : 'there may be a CORS issue with credentials.'}
                      {result.loginTest?.error && result.loginTestNoCreds?.status === 401 && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
                          ⚠️ <strong>CORS Issue Detected:</strong> The login works without credentials but fails with credentials. 
                          This is likely a CORS configuration issue. Try updating the CORS settings in the Edge Function.
                        </div>
                      )}
                    </div>
                  ) : result.healthCheck?.error || (result.loginTest?.error && result.loginTestNoCreds?.error) ? (
                    <div className="text-red-700">
                      ❌ <strong>Server is not accessible.</strong> The Supabase Edge Function needs to be deployed.
                      <div className="mt-2 text-xs">
                        See <code>TEST_ADMIN_CONNECTION.md</code> for deployment instructions.
                      </div>
                    </div>
                  ) : (
                    <div className="text-yellow-700">
                      ⚠️ <strong>Unexpected response.</strong> Check the error details above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
