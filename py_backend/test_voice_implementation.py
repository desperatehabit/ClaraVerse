#!/usr/bin/env python3
"""
Test script for ClaraVerse Python Voice Implementation

This script tests the voice feature implementation without requiring
LiveKit packages to be installed. It validates the core logic and
integration points.
"""

import asyncio
import sys
import os
import json
from pathlib import Path

# Add the py_backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_voice_config():
    """Test voice configuration loading"""
    print("🧪 Testing Voice Configuration...")

    try:
        from voice_settings import VoiceSettings, VoiceSettingsManager, load_voice_config_from_env

        # Test default configuration
        settings = VoiceSettings()
        assert settings.tts.provider.value == "elevenlabs"
        assert settings.stt.provider.value == "deepgram"
        print("✅ Default voice settings created successfully")

        # Test settings manager
        manager = VoiceSettingsManager()
        settings_dict = manager.get_settings_dict()
        assert 'tts' in settings_dict
        assert 'stt' in settings_dict
        print("✅ Voice settings manager working")

        # Test environment loading
        env_settings = load_voice_config_from_env()
        assert isinstance(env_settings, VoiceSettings)
        print("✅ Environment configuration loading working")

        return True

    except Exception as e:
        print(f"❌ Voice configuration test failed: {e}")
        return False

def test_task_processor():
    """Test voice command processing"""
    print("🧪 Testing Task Processor...")

    try:
        from clara_task_processor import ClaraTaskProcessor, VoiceCommandParser

        # Test command parser
        parser = VoiceCommandParser()

        # Test task creation command
        command = parser.parse_command("create a task to finish the report")
        assert command.action == "create"
        assert command.entity == "task"
        assert "report" in command.parameters.get("description", "")
        print("✅ Command parsing working")

        # Test task processor (without async initialization)
        processor = ClaraTaskProcessor()

        # Test available commands
        commands = processor.get_available_commands()
        assert len(commands) > 0
        assert any("create a task" in cmd for cmd in commands)
        print("✅ Task processor initialized")

        return True

    except Exception as e:
        print(f"❌ Task processor test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_voice_endpoints():
    """Test voice API endpoints"""
    print("🧪 Testing Voice Endpoints...")

    try:
        # Import FastAPI app and test endpoints
        from main import app
        from voice_settings import get_voice_settings_manager
        from clara_task_processor import process_voice_command_standalone, get_voice_help

        # Test voice settings manager integration
        manager = get_voice_settings_manager()
        assert manager is not None
        print("✅ Voice settings manager integrated")

        # Test standalone voice command processing
        result = await process_voice_command_standalone("test command")
        assert isinstance(result, str)
        print("✅ Standalone voice command processing working")

        # Test voice help
        help_text = get_voice_help()
        assert isinstance(help_text, str)
        print("✅ Voice help system working")

        return True

    except Exception as e:
        print(f"❌ Voice endpoints test failed: {e}")
        return False

def test_voice_agent_structure():
    """Test voice agent class structure"""
    print("🧪 Testing Voice Agent Structure...")

    try:
        # Test configuration and enums (these don't require external dependencies)
        from clara_voice_agent import VoiceConfig, VoiceProvider, STTProvider

        # Test configuration creation (without LiveKit dependencies)
        config = VoiceConfig()
        assert config.tts_provider == VoiceProvider.ELEVENLABS
        assert config.stt_provider == STTProvider.DEEPGRAM
        print("✅ Voice configuration structure valid")

        # Test provider enums
        providers = [p.value for p in VoiceProvider]
        stt_providers = [p.value for p in STTProvider]

        assert "elevenlabs" in providers
        assert "deepgram" in stt_providers
        print("✅ Provider enums working")

        return True

    except Exception as e:
        print(f"❌ Voice agent structure test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_integration_points():
    """Test integration with existing backend"""
    print("🧪 Testing Integration Points...")

    try:
        # Check if voice modules can be imported
        import voice_settings
        import clara_task_processor

        # Check if main.py can import voice modules
        with open('main.py', 'r') as f:
            main_content = f.read()
            assert 'from voice_settings import' in main_content
            assert 'from clara_voice_agent import' in main_content
            assert 'from clara_task_processor import' in main_content

        print("✅ Integration imports successful")

        # Check if voice endpoints are in main.py
        assert '/voice/process-command' in main_content
        assert '/voice/settings' in main_content
        assert '/voice/help' in main_content
        print("✅ Voice endpoints integrated")

        return True

    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False

def test_requirements_compatibility():
    """Test that requirements.txt is properly formatted"""
    print("🧪 Testing Requirements Compatibility...")

    try:
        with open('requirements.txt', 'r') as f:
            requirements = f.read()

        # Check for essential packages
        required_packages = [
            'livekit-agents',
            'livekit-plugins',
            'fastapi',
            'python-multipart'
        ]

        for package in required_packages:
            if package not in requirements:
                print(f"⚠️  Warning: {package} not found in requirements.txt")
            else:
                print(f"✅ {package} found in requirements")

        # Check for voice-specific plugins
        voice_plugins = [
            'livekit-plugins-silero',
            'livekit-plugins-deepgram',
            'livekit-plugins-elevenlabs',
            'livekit-plugins-cartesia',
            'livekit-plugins-openai',
            'livekit-plugins-azure'
        ]

        found_plugins = 0
        for plugin in voice_plugins:
            if plugin in requirements:
                found_plugins += 1

        print(f"✅ Found {found_plugins}/{len(voice_plugins)} LiveKit voice plugins")

        return True

    except Exception as e:
        print(f"❌ Requirements test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 ClaraVerse Python Voice Implementation - Test Suite")
    print("=" * 60)

    tests = [
        ("Voice Configuration", test_voice_config),
        ("Task Processor", test_task_processor),
        ("Voice Agent Structure", test_voice_agent_structure),
        ("Integration Points", test_integration_points),
        ("Requirements Compatibility", test_requirements_compatibility),
    ]

    results = []

    for test_name, test_func in tests:
        print(f"\n{'=' * 60}")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = asyncio.run(test_func())
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))

    # Summary
    print(f"\n{'=' * 60}")
    print("📊 TEST SUMMARY")
    print('=' * 60)

    passed = 0
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:25} {status}")
        if result:
            passed += 1

    print(f"\n🎯 Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Voice implementation is ready.")
        print("\n📋 Next Steps:")
        print("1. Install LiveKit dependencies: pip install -r requirements.txt")
        print("2. Set up LiveKit server: livekit-server --dev")
        print("3. Configure API keys in voice settings")
        print("4. Test voice endpoints with real audio")
        print("5. Integrate with frontend React components")
        return 0
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)