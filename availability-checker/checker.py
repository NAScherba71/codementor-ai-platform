"""
Availability checker module for monitoring service endpoints.
"""
import asyncio
import time
from datetime import datetime
from typing import Dict, List
import logging

import aiohttp


logger = logging.getLogger(__name__)


class ServiceChecker:
    """Checks the availability of multiple service endpoints."""

    def __init__(self, services: List[Dict], timeout: int = 10):
        """
        Initialize the ServiceChecker.

        Args:
            services: List of service dictionaries with 'name' and 'url' keys
            timeout: Request timeout in seconds
        """
        self.services = services
        self.timeout = timeout
        self.last_check_results = []

    async def check_service(self, session: aiohttp.ClientSession, service: Dict) -> Dict:
        """
        Check availability of a single service.

        Args:
            session: aiohttp ClientSession for making requests
            service: Dictionary containing 'name' and 'url' of the service

        Returns:
            Dictionary with check results including status, response time, and timestamp
        """
        name = service['name']
        url = service['url']
        start_time = time.time()
        
        result = {
            'service': name,
            'url': url,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'status': 'down',
            'status_code': None,
            'response_time_ms': None,
            'error': None
        }

        try:
            async with session.get(url, timeout=self.timeout) as response:
                response_time = (time.time() - start_time) * 1000  # Convert to ms
                result['status_code'] = response.status
                result['response_time_ms'] = round(response_time, 2)
                
                if response.status == 200:
                    result['status'] = 'up'
                    logger.info(f"✓ {name} is UP - Status: {response.status}, Response time: {result['response_time_ms']}ms")
                else:
                    logger.warning(f"✗ {name} is DOWN - Status: {response.status}, Response time: {result['response_time_ms']}ms")
                    
        except asyncio.TimeoutError:
            response_time = (time.time() - start_time) * 1000
            result['response_time_ms'] = round(response_time, 2)
            result['error'] = 'Request timeout'
            logger.error(f"✗ {name} TIMEOUT - {url}")
        except aiohttp.ClientError as e:
            response_time = (time.time() - start_time) * 1000
            result['response_time_ms'] = round(response_time, 2)
            result['error'] = str(e)
            logger.error(f"✗ {name} ERROR - {str(e)}")
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            result['response_time_ms'] = round(response_time, 2)
            result['error'] = str(e)
            logger.error(f"✗ {name} UNEXPECTED ERROR - {str(e)}")

        return result

    async def check_all_services(self) -> List[Dict]:
        """
        Check availability of all configured services concurrently.

        Returns:
            List of dictionaries containing check results for each service
        """
        timeout = aiohttp.ClientTimeout(total=self.timeout)
        connector = aiohttp.TCPConnector(limit=10)
        
        async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
            tasks = [self.check_service(session, service) for service in self.services]
            results = await asyncio.gather(*tasks)
            
        self.last_check_results = list(results)
        return self.last_check_results

    def get_last_results(self) -> List[Dict]:
        """
        Get the results from the last check.

        Returns:
            List of dictionaries containing the last check results
        """
        return self.last_check_results

    def get_summary(self) -> Dict:
        """
        Get a summary of service statuses.

        Returns:
            Dictionary with overall status summary
        """
        if not self.last_check_results:
            return {
                'total_services': len(self.services),
                'up': 0,
                'down': len(self.services),
                'last_check': None
            }

        up_count = sum(1 for r in self.last_check_results if r['status'] == 'up')
        down_count = len(self.last_check_results) - up_count
        
        return {
            'total_services': len(self.services),
            'up': up_count,
            'down': down_count,
            'last_check': self.last_check_results[0]['timestamp'] if self.last_check_results else None
        }
