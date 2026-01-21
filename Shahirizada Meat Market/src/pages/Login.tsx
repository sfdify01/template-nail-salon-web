import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Loader2, LogIn } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { startAuth } from '../lib/auth/client';

interface LoginProps {
  onNavigate: (path: string) => void;
  brandColor?: string;
}

export const Login = ({ onNavigate, brandColor = '#B64D2E' }: LoginProps) => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await startAuth({
        email: method === 'email' ? email : undefined,
        phone: method === 'phone' ? phone : undefined,
      });

      // Navigate to verify page with flowId
      onNavigate(`/verify?flowId=${response.flowId}&method=${response.method}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"
            style={{ backgroundColor: brandColor }}
          >
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="mb-2">Welcome back</h1>
          <p className="text-gray-600">
            Sign in to see your orders and rewards
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-6">
          <Tabs
            value={method}
            onValueChange={(value) => setMethod(value as 'email' | 'phone')}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="w-4 h-4 mr-2" />
                Phone
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="email" className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  We'll email you a 6-digit code to sign in
                </p>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  We'll text you a 6-digit code to sign in
                </p>
              </TabsContent>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-6 text-white"
                style={{ backgroundColor: brandColor }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  'Send code'
                )}
              </Button>
            </form>
          </Tabs>
        </Card>

        {/* Help Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('/contact')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Having trouble? Contact us
          </button>
        </div>
      </motion.div>
    </div>
  );
};
