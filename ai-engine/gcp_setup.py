"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  🚀 CodeMentor AI Engine - GCP Model Caching Setup                       ║
║  Handles model download and caching to Google Cloud Storage              ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import logging
from pathlib import Path
from typing import Optional
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GCPModelCacheManager:
    """
    Manages model caching for GCP Cloud Run deployment
    
    Strategies:
    1. Download models to local cache on startup
    2. Upload models to GCS bucket for sharing across instances
    3. Download from GCS on subsequent startups (faster than HuggingFace)
    """
    
    def __init__(self):
        self.local_cache_dir = Path(os.getenv('MODEL_CACHE_DIR', '/app/models'))
        self.gcs_bucket = os.getenv('GCS_BUCKET_NAME', 'codementor-models')
        self.gcs_model_path = os.getenv('GCS_MODEL_PATH', 'models/cache')
        self.device = os.getenv('DEVICE', 'cpu')
        
        # Model configurations
        self.chat_model_name = os.getenv('CHAT_MODEL', 'TinyLlama/TinyLlama-1.1B-Chat-v1.0')
        self.code_model_name = os.getenv('CODE_MODEL', 'Salesforce/codet5-small')
        
        # Create cache directory
        self.local_cache_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"GCP Model Cache Manager initialized")
        logger.info(f"  Local cache: {self.local_cache_dir}")
        logger.info(f"  GCS bucket: {self.gcs_bucket}")
        logger.info(f"  Device: {self.device}")
    
    def download_models_from_huggingface(self) -> bool:
        """
        Download models from HuggingFace Hub to local cache
        This is the initial download - can be slow
        """
        logger.info("Downloading models from HuggingFace Hub...")
        
        try:
            # Download Chat Model (TinyLlama)
            logger.info(f"Downloading chat model: {self.chat_model_name}")
            chat_tokenizer = AutoTokenizer.from_pretrained(
                self.chat_model_name,
                cache_dir=str(self.local_cache_dir),
                trust_remote_code=True
            )
            chat_model = AutoModelForCausalLM.from_pretrained(
                self.chat_model_name,
                cache_dir=str(self.local_cache_dir),
                dtype=torch.float16 if self.device == "cuda" else torch.float32,
                low_cpu_mem_usage=True,
                trust_remote_code=True
            )
            logger.info("✅ Chat model downloaded successfully")
            
            # Download Code Analysis Model (CodeT5)
            logger.info(f"Downloading code model: {self.code_model_name}")
            code_tokenizer = AutoTokenizer.from_pretrained(
                self.code_model_name,
                cache_dir=str(self.local_cache_dir),
                trust_remote_code=True
            )
            code_model = AutoModelForSeq2SeqLM.from_pretrained(
                self.code_model_name,
                cache_dir=str(self.local_cache_dir),
                dtype=torch.float16 if self.device == "cuda" else torch.float32,
                low_cpu_mem_usage=True,
                trust_remote_code=True
            )
            logger.info("✅ Code model downloaded successfully")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to download models from HuggingFace: {e}")
            return False
    
    def upload_models_to_gcs(self) -> bool:
        """
        Upload cached models to Google Cloud Storage
        Requires google-cloud-storage library
        """
        try:
            from google.cloud import storage
            
            logger.info(f"Uploading models to GCS bucket: {self.gcs_bucket}")
            
            client = storage.Client()
            bucket = client.bucket(self.gcs_bucket)
            
            # Upload all files in cache directory
            uploaded_count = 0
            for file_path in self.local_cache_dir.rglob('*'):
                if file_path.is_file():
                    # Create relative path for GCS
                    relative_path = file_path.relative_to(self.local_cache_dir)
                    blob_name = f"{self.gcs_model_path}/{relative_path}"
                    
                    blob = bucket.blob(blob_name)
                    blob.upload_from_filename(str(file_path))
                    uploaded_count += 1
                    
                    if uploaded_count % 10 == 0:
                        logger.info(f"  Uploaded {uploaded_count} files...")
            
            logger.info(f"✅ Uploaded {uploaded_count} files to GCS")
            return True
            
        except ImportError:
            logger.warning("google-cloud-storage not installed. Skipping GCS upload.")
            return False
        except Exception as e:
            logger.error(f"Failed to upload models to GCS: {e}")
            return False
    
    def download_models_from_gcs(self) -> bool:
        """
        Download cached models from Google Cloud Storage
        This is faster than downloading from HuggingFace
        """
        try:
            from google.cloud import storage
            
            logger.info(f"Downloading models from GCS bucket: {self.gcs_bucket}")
            
            client = storage.Client()
            bucket = client.bucket(self.gcs_bucket)
            
            # List all blobs with prefix
            blobs = bucket.list_blobs(prefix=self.gcs_model_path)
            
            downloaded_count = 0
            for blob in blobs:
                # Create local file path
                relative_path = blob.name.replace(f"{self.gcs_model_path}/", "")
                local_file = self.local_cache_dir / relative_path
                
                # Create parent directories
                local_file.parent.mkdir(parents=True, exist_ok=True)
                
                # Download file
                blob.download_to_filename(str(local_file))
                downloaded_count += 1
                
                if downloaded_count % 10 == 0:
                    logger.info(f"  Downloaded {downloaded_count} files...")
            
            logger.info(f"✅ Downloaded {downloaded_count} files from GCS")
            return downloaded_count > 0
            
        except ImportError:
            logger.warning("google-cloud-storage not installed. Cannot download from GCS.")
            return False
        except Exception as e:
            logger.error(f"Failed to download models from GCS: {e}")
            return False
    
    def check_models_cached(self) -> bool:
        """
        Check if models are already cached locally
        """
        # Simple check: look for model files in cache directory
        model_files = list(self.local_cache_dir.rglob('*.bin')) + \
                     list(self.local_cache_dir.rglob('*.safetensors')) + \
                     list(self.local_cache_dir.rglob('pytorch_model.bin'))
        
        cached = len(model_files) > 0
        logger.info(f"Models cached locally: {cached} ({len(model_files)} model files found)")
        return cached
    
    def setup_models(self, force_download: bool = False) -> bool:
        """
        Main setup method: Download models with fallback strategy
        
        Strategy:
        1. Check if models are already cached locally
        2. If not, try downloading from GCS (fast)
        3. If GCS fails, download from HuggingFace (slow)
        4. Optionally upload to GCS for next time
        
        Args:
            force_download: Force download even if cached
        
        Returns:
            True if models are ready, False otherwise
        """
        logger.info("═" * 70)
        logger.info("🚀 Setting up models for CodeMentor AI Engine")
        logger.info("═" * 70)
        
        # Check if already cached
        if not force_download and self.check_models_cached():
            logger.info("✅ Models already cached locally. Ready to use!")
            return True
        
        # Try downloading from GCS first (faster)
        logger.info("Attempting to download models from GCS...")
        if self.download_models_from_gcs():
            logger.info("✅ Models downloaded from GCS successfully!")
            return True
        
        # Fallback: Download from HuggingFace
        logger.info("GCS download failed. Downloading from HuggingFace Hub...")
        if self.download_models_from_huggingface():
            logger.info("✅ Models downloaded from HuggingFace successfully!")
            
            # Upload to GCS for next time
            logger.info("Uploading models to GCS for faster future startups...")
            self.upload_models_to_gcs()
            
            return True
        
        logger.error("❌ Failed to download models from any source!")
        return False


def main():
    """
    Main entry point for model setup script
    Can be run standalone or imported
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Setup models for GCP deployment')
    parser.add_argument('--force', action='store_true', help='Force re-download models')
    parser.add_argument('--upload-only', action='store_true', help='Only upload to GCS')
    parser.add_argument('--download-only', action='store_true', help='Only download from HF')
    
    args = parser.parse_args()
    
    manager = GCPModelCacheManager()
    
    if args.upload_only:
        logger.info("Upload-only mode")
        success = manager.upload_models_to_gcs()
    elif args.download_only:
        logger.info("Download-only mode")
        success = manager.download_models_from_huggingface()
    else:
        success = manager.setup_models(force_download=args.force)
    
    if success:
        logger.info("═" * 70)
        logger.info("✅ Model setup completed successfully!")
        logger.info("═" * 70)
        sys.exit(0)
    else:
        logger.error("═" * 70)
        logger.error("❌ Model setup failed!")
        logger.error("═" * 70)
        sys.exit(1)


if __name__ == '__main__':
    main()
