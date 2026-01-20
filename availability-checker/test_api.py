"""
Unit tests for the Flask API endpoints.
"""
import json
from unittest.mock import patch, MagicMock

import pytest

# Import app after mocking config loading
@pytest.fixture
def mock_config():
    """Mock configuration for testing."""
    return {
        'services': [
            {'name': 'Frontend', 'url': 'https://example.com/frontend'},
            {'name': 'Backend', 'url': 'https://example.com/backend'},
            {'name': 'AI Engine', 'url': 'https://example.com/ai'}
        ],
        'check_interval': 60,
        'timeout': 10,
        'logging': {
            'level': 'INFO',
            'format': 'json'
        },
        'server': {
            'host': '0.0.0.0',
            'port': 8080
        }
    }


@pytest.fixture
def app(mock_config):
    """Create a test Flask app."""
    with patch('main.load_config', return_value=mock_config):
        with patch('main.setup_logging'):
            import main as app_module
            app_module.app.config['TESTING'] = True
            yield app_module.app


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


class TestAPIEndpoints:
    """Test suite for API endpoints."""

    def test_health_endpoint(self, client):
        """Test the /health endpoint."""
        response = client.get('/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert data['service'] == 'availability-checker'
        assert 'timestamp' in data

    def test_index_endpoint(self, client):
        """Test the root / endpoint."""
        response = client.get('/')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['service'] == 'Availability Checker Microservice'
        assert data['version'] == '1.0.0'
        assert 'endpoints' in data
        assert 'monitored_services' in data
        assert len(data['monitored_services']) == 3
        assert data['check_interval'] == 60

    def test_status_endpoint_no_checks(self, client):
        """Test /status endpoint when no checks have been performed."""
        response = client.get('/status')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'summary' in data
        assert data['summary']['total_services'] == 3
        assert data['summary']['up'] == 0
        assert data['summary']['down'] == 3
        assert 'timestamp' in data

    @patch('main.checker.check_all_services')
    def test_check_endpoint_success(self, mock_check, client):
        """Test /check endpoint with successful checks."""
        # Mock successful check results
        mock_results = [
            {
                'service': 'Frontend',
                'url': 'https://example.com/frontend',
                'status': 'up',
                'status_code': 200,
                'response_time_ms': 150.5,
                'timestamp': '2026-01-20T10:00:00Z',
                'error': None
            },
            {
                'service': 'Backend',
                'url': 'https://example.com/backend',
                'status': 'up',
                'status_code': 200,
                'response_time_ms': 120.3,
                'timestamp': '2026-01-20T10:00:00Z',
                'error': None
            },
            {
                'service': 'AI Engine',
                'url': 'https://example.com/ai',
                'status': 'down',
                'status_code': 500,
                'response_time_ms': 200.1,
                'timestamp': '2026-01-20T10:00:00Z',
                'error': None
            }
        ]
        
        # Patch the method to return the coroutine
        with patch('main.asyncio.new_event_loop') as mock_loop_class, \
             patch('main.asyncio.set_event_loop'), \
             patch('main.checker.last_check_results', mock_results):
            mock_loop = MagicMock()
            mock_loop_class.return_value = mock_loop
            mock_loop.run_until_complete.return_value = mock_results
            mock_loop.close.return_value = None
            
            response = client.get('/check')
            
            assert response.status_code == 200
            
            data = json.loads(response.data)
            assert 'summary' in data
            assert 'services' in data
            assert len(data['services']) == 3
            assert data['summary']['total_services'] == 3
            assert 'timestamp' in data

    @patch('main.checker.check_all_services')
    def test_check_endpoint_error(self, mock_check, client):
        """Test /check endpoint with error during check."""
        # Mock an exception during check
        with patch('main.asyncio.new_event_loop') as mock_loop_class, \
             patch('main.asyncio.set_event_loop'):
            mock_loop = MagicMock()
            mock_loop_class.return_value = mock_loop
            mock_loop.run_until_complete.side_effect = Exception("Network error")
            
            response = client.get('/check')
            assert response.status_code == 500
            
            data = json.loads(response.data)
            assert 'error' in data
            assert 'timestamp' in data

    @patch('main.checker.get_last_results')
    @patch('main.checker.get_summary')
    def test_status_endpoint_with_results(self, mock_summary, mock_results, client):
        """Test /status endpoint with previous check results."""
        mock_results.return_value = [
            {'service': 'Frontend', 'status': 'up'},
            {'service': 'Backend', 'status': 'up'},
            {'service': 'AI Engine', 'status': 'down'}
        ]
        
        mock_summary.return_value = {
            'total_services': 3,
            'up': 2,
            'down': 1,
            'last_check': '2026-01-20T10:00:00Z'
        }
        
        response = client.get('/status')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['summary']['up'] == 2
        assert data['summary']['down'] == 1
        assert len(data['services']) == 3
        assert 'note' in data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
