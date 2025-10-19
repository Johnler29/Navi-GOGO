import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';

const ConfigurationSetup = () => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setValidationResult({ success: false, message: 'Please enter both URL and API key' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Test the connection
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(supabaseUrl, supabaseKey);
      
      // Try to make a simple query to test the connection
      const { data, error } = await testClient.from('drivers').select('count').limit(1);
      
      if (error) {
        setValidationResult({ 
          success: false, 
          message: `Connection failed: ${error.message}` 
        });
      } else {
        setValidationResult({ 
          success: true, 
          message: 'Connection successful! You can now use these credentials.' 
        });
      }
    } catch (error) {
      setValidationResult({ 
        success: false, 
        message: `Invalid configuration: ${error.message}` 
      });
    } finally {
      setIsValidating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const generateEnvFile = () => {
    const envContent = `REACT_APP_SUPABASE_URL=${supabaseUrl}
REACT_APP_SUPABASE_ANON_KEY=${supabaseKey}`;
    
    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.local';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Supabase Configuration Required</h1>
          <p className="text-gray-600">
            The admin website needs to be connected to your Supabase database to function properly.
          </p>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Get your Supabase URL and API key from your Supabase dashboard</li>
              <li>Enter them in the form below and click "Validate Connection"</li>
              <li>Download the generated .env.local file</li>
              <li>Place it in the admin-website directory</li>
              <li>Restart the development server</li>
            </ol>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => copyToClipboard(supabaseUrl)}
                  className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Anon Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="Your Supabase anon key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => copyToClipboard(supabaseKey)}
                  className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-4 rounded-lg flex items-center space-x-3 ${
              validationResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {validationResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className={`text-sm ${
                validationResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.message}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleValidate}
              disabled={isValidating || !supabaseUrl || !supabaseKey}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? 'Validating...' : 'Validate Connection'}
            </button>
            
            {validationResult?.success && (
              <button
                onClick={generateEnvFile}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Download .env.local
              </button>
            )}
          </div>

          {/* Help Links */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
            <div className="space-y-2 text-sm">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Supabase Dashboard</span>
              </a>
              <a
                href="https://supabase.com/docs/guides/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Supabase Getting Started Guide</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationSetup;
