"""
Voice Settings and Configuration Management

This module handles voice-related configuration, settings management,
and integration with the ClaraVerse settings system.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger("voice-settings")

class VoiceProvider(Enum):
    """Available TTS providers"""
    ELEVENLABS = "elevenlabs"
    CARTESIA = "cartesia"
    OPENAI = "openai"
    AZURE = "azure"
    LOCAL = "local"

class STTProvider(Enum):
    """Available STT providers"""
    DEEPGRAM = "deepgram"
    OPENAI = "openai"
    AZURE = "azure"
    LOCAL = "local"

@dataclass
class TTSSettings:
    """Text-to-Speech settings"""
    provider: VoiceProvider = VoiceProvider.ELEVENLABS
    api_key: str = ""
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Default ElevenLabs voice
    model: str = "eleven_monolingual_v1"
    speed: float = 1.0
    stability: float = 0.5
    similarity_boost: float = 0.8
    language: str = "en"

@dataclass
class STTSettings:
    """Speech-to-Text settings"""
    provider: STTProvider = STTProvider.DEEPGRAM
    api_key: str = ""
    model: str = "nova-2"
    language: str = "en"
    smart_format: bool = True
    keywords: List[str] = None

    def __post_init__(self):
        if self.keywords is None:
            self.keywords = []

@dataclass
class VoiceBehaviorSettings:
    """Voice interaction behavior settings"""
    enable_voice_activity_detection: bool = True
    voice_activity_threshold: float = 0.5
    enable_interruptions: bool = True
    max_speech_duration: float = 30.0
    silence_timeout: float = 2.0
    auto_punctuation: bool = True

@dataclass
class VoiceIntegrationSettings:
    """Integration settings for voice features"""
    enable_task_management: bool = True
    enable_memory_integration: bool = True
    enable_file_operations: bool = False
    enable_browser_automation: bool = False
    enable_application_management: bool = False
    enable_conversation_context: bool = True
    max_conversation_history: int = 50

@dataclass
class VoiceAdvancedSettings:
    """Advanced voice settings"""
    custom_instructions: str = ""
    enable_emotion_detection: bool = False
    enable_sentiment_analysis: bool = False
    enable_profanity_filter: bool = True
    log_voice_data: bool = False
    debug_mode: bool = False

@dataclass
class VoiceSettings:
    """Complete voice settings configuration"""
    # Core settings
    tts: TTSSettings = None
    stt: STTSettings = None
    behavior: VoiceBehaviorSettings = None
    integration: VoiceIntegrationSettings = None
    advanced: VoiceAdvancedSettings = None

    # Session settings
    session_timeout: int = 300  # 5 minutes
    max_concurrent_sessions: int = 5

    def __post_init__(self):
        if self.tts is None:
            self.tts = TTSSettings()
        if self.stt is None:
            self.stt = STTSettings()
        if self.behavior is None:
            self.behavior = VoiceBehaviorSettings()
        if self.integration is None:
            self.integration = VoiceIntegrationSettings()
        if self.advanced is None:
            self.advanced = VoiceAdvancedSettings()

class VoiceSettingsManager:
    """Manages voice settings persistence and validation"""

    def __init__(self, config_file: str = None):
        if config_file is None:
            # Default to user's home directory
            home_dir = Path.home()
            clara_dir = home_dir / ".clara"
            clara_dir.mkdir(exist_ok=True)
            config_file = clara_dir / "voice_settings.json"

        self.config_file = Path(config_file)
        self.settings: VoiceSettings = None
        self._load_settings()

    def _load_settings(self):
        """Load settings from file or create defaults"""
        try:
            if self.config_file.exists():
                try:
                    with open(self.config_file, 'r') as f:
                        content = f.read().strip()
                        if not content:
                            logger.warning("Settings file is empty, creating defaults")
                            self.settings = VoiceSettings()
                            self.save_settings()
                            return

                        data = json.loads(content)
                except (json.JSONDecodeError, IOError) as e:
                    logger.warning(f"Settings file corrupted or unreadable: {e}. Creating defaults.")
                    self.settings = VoiceSettings()
                    self.save_settings()
                    return

                # Convert dictionaries to dataclasses with enum handling
                def dict_to_enum(data_dict: dict, enum_class: type) -> dict:
                    """Convert enum values from strings back to enum objects"""
                    if not data_dict:
                        return {}
                    result = data_dict.copy()
                    for key, value in data_dict.items():
                        if key in ['provider']:  # Add other enum fields as needed
                            try:
                                if enum_class == VoiceProvider:
                                    result[key] = VoiceProvider(value)
                                elif enum_class == STTProvider:
                                    result[key] = STTProvider(value)
                            except ValueError:
                                logger.warning(f"Invalid enum value: {key}={value}")
                    return result

                self.settings = VoiceSettings(
                    tts=TTSSettings(**dict_to_enum(data.get('tts', {}), VoiceProvider)),
                    stt=STTSettings(**dict_to_enum(data.get('stt', {}), STTProvider)),
                    behavior=VoiceBehaviorSettings(**data.get('behavior', {})),
                    integration=VoiceIntegrationSettings(**data.get('integration', {})),
                    advanced=VoiceAdvancedSettings(**data.get('advanced', {})),
                    session_timeout=data.get('session_timeout', 300),
                    max_concurrent_sessions=data.get('max_concurrent_sessions', 5)
                )

                logger.info(f"Loaded voice settings from {self.config_file}")
            else:
                self.settings = VoiceSettings()
                self.save_settings()
                logger.info(f"Created default voice settings at {self.config_file}")

        except Exception as e:
            logger.error(f"Error loading voice settings: {e}")
            self.settings = VoiceSettings()

    def save_settings(self):
        """Save current settings to file"""
        try:
            # Convert dataclasses to dictionaries with enum serialization
            def enum_to_dict(obj):
                """Convert dataclass to dict, handling enums"""
                if not obj:
                    return {}
                result = {}
                for key, value in obj.__dict__.items():
                    if isinstance(value, Enum):
                        result[key] = value.value
                    else:
                        result[key] = value
                return result

            data = {
                'tts': enum_to_dict(self.settings.tts),
                'stt': enum_to_dict(self.settings.stt),
                'behavior': enum_to_dict(self.settings.behavior),
                'integration': enum_to_dict(self.settings.integration),
                'advanced': enum_to_dict(self.settings.advanced),
                'session_timeout': self.settings.session_timeout,
                'max_concurrent_sessions': self.settings.max_concurrent_sessions
            }

            # Ensure directory exists
            self.config_file.parent.mkdir(parents=True, exist_ok=True)

            with open(self.config_file, 'w') as f:
                json.dump(data, f, indent=2)

            logger.info(f"Saved voice settings to {self.config_file}")

        except Exception as e:
            logger.error(f"Error saving voice settings: {e}")
            raise

    def update_tts_settings(self, **kwargs):
        """Update TTS settings"""
        for key, value in kwargs.items():
            if hasattr(self.settings.tts, key):
                setattr(self.settings.tts, key, value)
        self.save_settings()

    def update_stt_settings(self, **kwargs):
        """Update STT settings"""
        for key, value in kwargs.items():
            if hasattr(self.settings.stt, key):
                setattr(self.settings.stt, key, value)
        self.save_settings()

    def update_behavior_settings(self, **kwargs):
        """Update behavior settings"""
        for key, value in kwargs.items():
            if hasattr(self.settings.behavior, key):
                setattr(self.settings.behavior, key, value)
        self.save_settings()

    def update_integration_settings(self, **kwargs):
        """Update integration settings"""
        for key, value in kwargs.items():
            if hasattr(self.settings.integration, key):
                setattr(self.settings.integration, key, value)
        self.save_settings()

    def get_settings_dict(self) -> Dict[str, Any]:
        """Get settings as dictionary for API responses"""
        return {
            'tts': asdict(self.settings.tts),
            'stt': asdict(self.settings.stt),
            'behavior': asdict(self.settings.behavior),
            'integration': asdict(self.settings.integration),
            'advanced': asdict(self.settings.advanced),
            'session_timeout': self.settings.session_timeout,
            'max_concurrent_sessions': self.settings.max_concurrent_sessions
        }

    def validate_api_keys(self) -> Dict[str, bool]:
        """Validate API keys for configured providers"""
        validation = {}

        # Validate TTS API key if not using local provider
        if self.settings.tts.provider != VoiceProvider.LOCAL:
            validation['tts_api_key'] = bool(self.settings.tts.api_key.strip())

        # Validate STT API key if not using local provider
        if self.settings.stt.provider != STTProvider.LOCAL:
            validation['stt_api_key'] = bool(self.settings.stt.api_key.strip())

        return validation

    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about available providers"""
        return {
            'tts_providers': {
                'elevenlabs': {
                    'name': 'ElevenLabs',
                    'description': 'High-quality neural TTS with voice cloning',
                    'requires_api_key': True,
                    'supported_languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'ja', 'zh', 'ko'],
                    'features': ['voice_cloning', 'emotion', 'multiple_languages', 'instant_voice_cloning']
                },
                'cartesia': {
                    'name': 'Cartesia (formerly Sonar)',
                    'description': 'Fast, high-quality TTS',
                    'requires_api_key': True,
                    'supported_languages': ['en'],
                    'features': ['low_latency', 'consistent_quality']
                },
                'openai': {
                    'name': 'OpenAI TTS',
                    'description': 'Reliable TTS with multiple voice options',
                    'requires_api_key': True,
                    'supported_languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
                    'features': ['reliable', 'multiple_voices', 'simple_api']
                },
                'azure': {
                    'name': 'Azure Cognitive Services',
                    'description': 'Enterprise-grade TTS with neural voices',
                    'requires_api_key': True,
                    'supported_languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'],
                    'features': ['neural_voices', 'multiple_languages', 'enterprise_ready']
                },
                'local': {
                    'name': 'Local TTS',
                    'description': 'Use local TTS engines (pyttsx3, etc.)',
                    'requires_api_key': False,
                    'supported_languages': ['en'],  # Depends on system
                    'features': ['offline', 'no_api_costs']
                }
            },
            'stt_providers': {
                'deepgram': {
                    'name': 'Deepgram',
                    'description': 'Highly accurate STT with advanced features',
                    'requires_api_key': True,
                    'supported_languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi'],
                    'features': ['real_time', 'high_accuracy', 'multiple_languages', 'smart_format']
                },
                'openai': {
                    'name': 'OpenAI Whisper',
                    'description': 'Reliable STT powered by Whisper',
                    'requires_api_key': True,
                    'supported_languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi'],
                    'features': ['reliable', 'multiple_languages']
                },
                'azure': {
                    'name': 'Azure Speech Services',
                    'description': 'Enterprise-grade STT',
                    'requires_api_key': True,
                    'supported_languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'],
                    'features': ['real_time', 'multiple_languages', 'enterprise_ready']
                },
                'local': {
                    'name': 'Local STT',
                    'description': 'Use local STT (faster-whisper, etc.)',
                    'requires_api_key': False,
                    'supported_languages': ['en'],  # Depends on model
                    'features': ['offline', 'no_api_costs', 'custom_models']
                }
            }
        }

# Global settings manager instance
_settings_manager: Optional[VoiceSettingsManager] = None

def get_voice_settings_manager() -> VoiceSettingsManager:
    """Get or create the global voice settings manager"""
    global _settings_manager
    if _settings_manager is None:
        _settings_manager = VoiceSettingsManager()
    return _settings_manager

def get_voice_settings() -> VoiceSettings:
    """Get current voice settings"""
    return get_voice_settings_manager().settings

def update_voice_settings(category: str, **kwargs):
    """Update voice settings by category"""
    manager = get_voice_settings_manager()

    if category == 'tts':
        manager.update_tts_settings(**kwargs)
    elif category == 'stt':
        manager.update_stt_settings(**kwargs)
    elif category == 'behavior':
        manager.update_behavior_settings(**kwargs)
    elif category == 'integration':
        manager.update_integration_settings(**kwargs)
    else:
        raise ValueError(f"Unknown settings category: {category}")

# Environment variable helpers
def load_voice_config_from_env() -> VoiceSettings:
    """Load voice configuration from environment variables"""
    settings = VoiceSettings()

    # Load TTS settings from environment
    if os.getenv("TTS_PROVIDER"):
        try:
            settings.tts.provider = VoiceProvider(os.getenv("TTS_PROVIDER"))
        except ValueError:
            logger.warning(f"Invalid TTS provider: {os.getenv('TTS_PROVIDER')}")

    if os.getenv("TTS_API_KEY"):
        settings.tts.api_key = os.getenv("TTS_API_KEY")

    if os.getenv("TTS_VOICE_ID"):
        settings.tts.voice_id = os.getenv("TTS_VOICE_ID")

    if os.getenv("TTS_SPEED"):
        settings.tts.speed = float(os.getenv("TTS_SPEED"))

    # Load STT settings from environment
    if os.getenv("STT_PROVIDER"):
        try:
            settings.stt.provider = STTProvider(os.getenv("STT_PROVIDER"))
        except ValueError:
            logger.warning(f"Invalid STT provider: {os.getenv('STT_PROVIDER')}")

    if os.getenv("STT_API_KEY"):
        settings.stt.api_key = os.getenv("STT_API_KEY")

    if os.getenv("STT_MODEL"):
        settings.stt.model = os.getenv("STT_MODEL")

    # Load behavior settings
    if os.getenv("ENABLE_VAD"):
        settings.behavior.enable_voice_activity_detection = os.getenv("ENABLE_VAD").lower() == "true"

    if os.getenv("VAD_THRESHOLD"):
        settings.behavior.voice_activity_threshold = float(os.getenv("VAD_THRESHOLD"))

    if os.getenv("ENABLE_INTERRUPTIONS"):
        settings.behavior.enable_interruptions = os.getenv("ENABLE_INTERRUPTIONS").lower() == "true"

    return settings

# Integration with main FastAPI app
def setup_voice_settings_endpoints():
    """Set up voice settings endpoints in the FastAPI app"""
    from main import app

    @app.get("/voice/settings")
    async def get_voice_settings_endpoint():
        """Get current voice settings"""
        manager = get_voice_settings_manager()
        return {
            "settings": manager.get_settings_dict(),
            "validation": manager.validate_api_keys(),
            "providers": manager.get_provider_info()
        }

    @app.post("/voice/settings")
    async def update_voice_settings_endpoint(settings_update: Dict[str, Any]):
        """Update voice settings"""
        try:
            category = settings_update.get('category')
            updates = settings_update.get('updates', {})

            if not category or not updates:
                raise HTTPException(status_code=400, detail="Category and updates are required")

            update_voice_settings(category, **updates)

            return {"status": "success", "message": "Voice settings updated"}

        except Exception as e:
            logger.error(f"Error updating voice settings: {e}")
            raise HTTPException(status_code=500, detail=f"Error updating settings: {str(e)}")

    @app.post("/voice/settings/reset")
    async def reset_voice_settings_endpoint():
        """Reset voice settings to defaults"""
        try:
            manager = get_voice_settings_manager()
            manager.settings = VoiceSettings()
            manager.save_settings()

            return {"status": "success", "message": "Voice settings reset to defaults"}

        except Exception as e:
            logger.error(f"Error resetting voice settings: {e}")
            raise HTTPException(status_code=500, detail=f"Error resetting settings: {str(e)}")

    @app.get("/voice/providers")
    async def get_voice_providers_endpoint():
        """Get available voice providers and their capabilities"""
        manager = get_voice_settings_manager()
        return manager.get_provider_info()

    @app.post("/voice/test-connection")
    async def test_voice_providers_endpoint(provider_type: str, provider_name: str):
        """Test connection to a voice provider"""
        try:
            # This would implement actual connection testing
            # For now, return a placeholder response
            return {
                "status": "success",
                "provider": provider_name,
                "type": provider_type,
                "message": "Connection test not implemented yet"
            }

        except Exception as e:
            logger.error(f"Error testing voice provider: {e}")
            raise HTTPException(status_code=500, detail=f"Error testing provider: {str(e)}")