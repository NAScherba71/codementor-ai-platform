"""
Availability Checker Microservice

A Flask-based microservice for monitoring the availability of CodeMentor platform services.
"""
import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

import yaml
from flask import Flask, jsonify, request
from flask_cors import CORS

from checker import ServiceChecker


# Configure JSON logging
class JsonFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
            
        return json.dumps(log_data)


def setup_logging(config):
    """Configure logging based on config."""
    log_config = config.get('logging', {})
    log_level = getattr(logging, log_config.get('level', 'INFO'))
    log_format = log_config.get('format', 'json')
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    if log_format == 'json':
        console_handler.setFormatter(JsonFormatter())
    else:
        console_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
    
    logger.addHandler(console_handler)
    
    return logger


def load_config(config_path='config.yaml'):
    """Load configuration from YAML file."""
    config_file = Path(config_path)
    
    if not config_file.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    
    return config


# Load configuration
config = load_config()
logger = setup_logging(config)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize service checker
checker = ServiceChecker(
    services=config.get('services', []),
    timeout=config.get('timeout', 10)
)

# Background check task
background_task = None
should_run_background = True


async def periodic_check():
    """Run periodic availability checks in the background."""
    global should_run_background
    check_interval = config.get('check_interval', 60)
    
    logger.info(f"Starting periodic checks every {check_interval} seconds")
    
    while should_run_background:
        try:
            await checker.check_all_services()
            logger.info("Periodic check completed")
        except Exception as e:
            logger.error(f"Error during periodic check: {str(e)}")
        
        await asyncio.sleep(check_interval)


def start_background_checks():
    """Start background checks if not already running."""
    global background_task, should_run_background
    
    if background_task is None or background_task.done():
        should_run_background = True
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        background_task = loop.create_task(periodic_check())


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'service': 'availability-checker'
    }), 200


@app.route('/check', methods=['GET'])
def check_services():
    """
    Check the availability of all configured services.
    
    Returns:
        JSON response with status of all services
    """
    try:
        # Run async check in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(checker.check_all_services())
        loop.close()
        
        summary = checker.get_summary()
        
        response = {
            'summary': summary,
            'services': results,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        logger.info(f"Manual check completed - {summary['up']}/{summary['total_services']} services up")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error during manual check: {str(e)}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500


@app.route('/status', methods=['GET'])
def get_status():
    """
    Get the status from the last check without triggering a new check.
    
    Returns:
        JSON response with last known status
    """
    try:
        results = checker.get_last_results()
        summary = checker.get_summary()
        
        response = {
            'summary': summary,
            'services': results,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'note': 'Last known status - use /check to trigger a new check'
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error retrieving status: {str(e)}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500


@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API documentation."""
    return jsonify({
        'service': 'Availability Checker Microservice',
        'version': '1.0.0',
        'endpoints': {
            '/health': 'Health check endpoint',
            '/check': 'Trigger manual availability check for all services',
            '/status': 'Get last known status without triggering new check',
            '/': 'This documentation'
        },
        'monitored_services': [s['name'] for s in config.get('services', [])],
        'check_interval': config.get('check_interval', 60),
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 200


if __name__ == '__main__':
    # Get server configuration
    server_config = config.get('server', {})
    host = server_config.get('host', '0.0.0.0')
    port = int(os.environ.get('PORT', server_config.get('port', 8080)))
    
    logger.info(f"Starting Availability Checker Microservice on {host}:{port}")
    logger.info(f"Monitoring {len(config.get('services', []))} services")
    
    # Note: Background periodic checks are disabled in production
    # Use an external scheduler (cron, Cloud Scheduler) to call /check endpoint instead
    
    app.run(host=host, port=port, debug=False)
