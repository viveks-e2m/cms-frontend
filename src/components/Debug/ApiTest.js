import React, { useState } from 'react';
import { authAPI } from '../../utils/api';
import { clientAPI } from '../../utils/apiServices';
import { useNotificationContext } from '../../contexts/NotificationContext';

const ApiTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotificationContext();

  const runTest = async (testName, testFunction) => {
    try {
      setLoading(true);
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
      showSuccess(`${testName} test passed!`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
      showError(`${testName} test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthMe = () => runTest('Auth Me', () => authAPI.getCurrentUser());
  
  const testGetClients = () => runTest('Get Clients', () => clientAPI.getAll());

  const testCreateClient = () => runTest('Create Client', () => 
    clientAPI.create({
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890',
      company: 'Test Company'
    })
  );

  return (
    <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', margin: '1rem' }}>
      <h3>API Integration Test</h3>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={testAuthMe} 
          disabled={loading}
          className="btn btn-primary"
        >
          Test Auth Me
        </button>
        <button 
          onClick={testGetClients} 
          disabled={loading}
          className="btn btn-primary"
        >
          Test Get Clients
        </button>
        <button 
          onClick={testCreateClient} 
          disabled={loading}
          className="btn btn-secondary"
        >
          Test Create Client
        </button>
      </div>
      
      <div>
        <h4>Test Results:</h4>
        {Object.entries(testResults).map(([testName, result]) => (
          <div key={testName} style={{ 
            padding: '1rem', 
            margin: '0.5rem 0', 
            border: `2px solid ${result.success ? '#10B981' : '#EF4444'}`,
            borderRadius: '4px'
          }}>
            <strong>{testName}:</strong> {result.success ? 'PASSED' : 'FAILED'}
            <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {JSON.stringify(result.success ? result.data : result.error, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiTest;