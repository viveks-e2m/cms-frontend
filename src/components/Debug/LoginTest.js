import React, { useState } from 'react';
import axios from 'axios';

const LoginTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);

    const credentials = {
      email: "vivek.soni@e2m.solutions",
      password: "13December200@"
    };

    console.log('Testing login with:', credentials);

    try {
      // Test direct axios call
      const response = await axios.post('http://172.16.0.213:8000/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Direct axios response:', response.data);
      setResult({ success: true, data: response.data });
    } catch (error) {
      console.error('Direct axios error:', error);
      console.error('Error response:', error.response?.data);
      setResult({ 
        success: false, 
        error: error.response?.data || error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Import and use the authAPI
      const { authAPI } = await import('../../utils/api');
      
      const credentials = {
        email: "vivek.soni@e2m.solutions",
        password: "13December200@"
      };

      console.log('Testing with authAPI:', credentials);
      const response = await authAPI.login(credentials);
      
      console.log('AuthAPI response:', response);
      setResult({ success: true, data: response });
    } catch (error) {
      console.error('AuthAPI error:', error);
      setResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Login API Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px' }}
        >
          Test Direct Axios Call
        </button>
        
        <button 
          onClick={testWithAPI} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px' }}
        >
          Test with AuthAPI
        </button>
      </div>

      {loading && <div>Testing...</div>}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Result:</h3>
          <pre style={{ 
            background: result.success ? '#d4edda' : '#f8d7da',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default LoginTest;