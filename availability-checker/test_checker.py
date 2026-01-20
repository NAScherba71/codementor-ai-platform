"""
Unit tests for the availability checker microservice.
"""
import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from aiohttp import ClientError, ClientSession

from checker import ServiceChecker


@pytest.fixture
def sample_services():
    """Sample services configuration for testing."""
    return [
        {'name': 'Frontend', 'url': 'https://example.com/frontend'},
        {'name': 'Backend', 'url': 'https://example.com/backend'},
        {'name': 'AI Engine', 'url': 'https://example.com/ai'}
    ]


@pytest.fixture
def checker(sample_services):
    """Create a ServiceChecker instance for testing."""
    return ServiceChecker(services=sample_services, timeout=5)


class TestServiceChecker:
    """Test suite for ServiceChecker class."""

    @pytest.mark.asyncio
    async def test_check_service_success(self, checker, sample_services):
        """Test successful service check with 200 status."""
        service = sample_services[0]
        
        # Mock the response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.__aenter__ = AsyncMock(return_value=mock_response)
        mock_response.__aexit__ = AsyncMock(return_value=None)
        
        # Mock the session
        mock_session = MagicMock()
        mock_session.get = MagicMock(return_value=mock_response)
        
        result = await checker.check_service(mock_session, service)
        
        assert result['service'] == 'Frontend'
        assert result['url'] == service['url']
        assert result['status'] == 'up'
        assert result['status_code'] == 200
        assert result['response_time_ms'] is not None
        assert result['error'] is None
        assert 'timestamp' in result

    @pytest.mark.asyncio
    async def test_check_service_failure(self, checker, sample_services):
        """Test service check with non-200 status."""
        service = sample_services[1]
        
        # Mock the response with 500 status
        mock_response = MagicMock()
        mock_response.status = 500
        mock_response.__aenter__ = AsyncMock(return_value=mock_response)
        mock_response.__aexit__ = AsyncMock(return_value=None)
        
        # Mock the session
        mock_session = MagicMock()
        mock_session.get = MagicMock(return_value=mock_response)
        
        result = await checker.check_service(mock_session, service)
        
        assert result['service'] == 'Backend'
        assert result['status'] == 'down'
        assert result['status_code'] == 500
        assert result['response_time_ms'] is not None

    @pytest.mark.asyncio
    async def test_check_service_timeout(self, checker, sample_services):
        """Test service check with timeout."""
        service = sample_services[2]
        
        # Mock the session to raise TimeoutError
        mock_session = MagicMock()
        mock_session.get = MagicMock(side_effect=asyncio.TimeoutError())
        
        result = await checker.check_service(mock_session, service)
        
        assert result['service'] == 'AI Engine'
        assert result['status'] == 'down'
        assert result['status_code'] is None
        assert result['error'] == 'Request timeout'
        assert result['response_time_ms'] is not None

    @pytest.mark.asyncio
    async def test_check_service_client_error(self, checker, sample_services):
        """Test service check with client error."""
        service = sample_services[0]
        
        # Mock the session to raise ClientError
        mock_session = MagicMock()
        mock_session.get = MagicMock(side_effect=ClientError('Connection failed'))
        
        result = await checker.check_service(mock_session, service)
        
        assert result['service'] == 'Frontend'
        assert result['status'] == 'down'
        assert result['status_code'] is None
        assert 'Connection failed' in result['error']
        assert result['response_time_ms'] is not None

    @pytest.mark.asyncio
    async def test_check_all_services(self, checker):
        """Test checking all services concurrently."""
        # Mock aiohttp components
        with patch('checker.aiohttp.ClientSession') as mock_session_class:
            mock_session = MagicMock()
            mock_session_class.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session_class.return_value.__aexit__ = AsyncMock(return_value=None)
            
            # Mock responses for each service
            mock_responses = []
            for status in [200, 200, 500]:
                mock_resp = MagicMock()
                mock_resp.status = status
                mock_resp.__aenter__ = AsyncMock(return_value=mock_resp)
                mock_resp.__aexit__ = AsyncMock(return_value=None)
                mock_responses.append(mock_resp)
            
            mock_session.get = MagicMock(side_effect=mock_responses)
            
            results = await checker.check_all_services()
            
            assert len(results) == 3
            assert results[0]['status'] == 'up'
            assert results[1]['status'] == 'up'
            assert results[2]['status'] == 'down'
            assert checker.get_last_results() == results

    def test_get_last_results_empty(self, checker):
        """Test getting last results when no checks have been performed."""
        results = checker.get_last_results()
        assert results == []

    def test_get_summary_no_checks(self, checker):
        """Test getting summary when no checks have been performed."""
        summary = checker.get_summary()
        
        assert summary['total_services'] == 3
        assert summary['up'] == 0
        assert summary['down'] == 3
        assert summary['last_check'] is None

    def test_get_summary_with_results(self, checker):
        """Test getting summary with results."""
        # Simulate some results
        checker.last_check_results = [
            {'status': 'up', 'timestamp': '2026-01-20T10:00:00Z'},
            {'status': 'up', 'timestamp': '2026-01-20T10:00:00Z'},
            {'status': 'down', 'timestamp': '2026-01-20T10:00:00Z'}
        ]
        
        summary = checker.get_summary()
        
        assert summary['total_services'] == 3
        assert summary['up'] == 2
        assert summary['down'] == 1
        assert summary['last_check'] == '2026-01-20T10:00:00Z'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
