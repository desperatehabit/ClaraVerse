#!/bin/bash

# ClaraVerse Voice Environment Setup Script
# This script sets up the Python virtual environment and installs LiveKit Agents dependencies

echo "🚀 Setting up ClaraVerse Python Voice Environment..."
echo "================================================="

# Check if virtual environment exists
if [ ! -d "voice_env" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv voice_env
    echo "✅ Virtual environment created"
else
    echo "📦 Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source voice_env/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo "✅ Pip upgraded"

# Install LiveKit Agents and plugins
echo "📦 Installing LiveKit Agents dependencies..."
echo "   This may take several minutes..."

# Core LiveKit Agents
pip install livekit-agents>=0.8.0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ livekit-agents installed"
else
    echo "   ❌ Failed to install livekit-agents"
    exit 1
fi

# Voice activity detection
pip install livekit-plugins-silero>=0.1.0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ livekit-plugins-silero installed"
else
    echo "   ❌ Failed to install livekit-plugins-silero"
fi

# TTS Providers
pip install livekit-plugins-elevenlabs>=0.1.0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ livekit-plugins-elevenlabs installed"
else
    echo "   ❌ Failed to install livekit-plugins-elevenlabs"
fi

pip install livekit-plugins-cartesia>=0.1.0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ livekit-plugins-cartesia installed"
else
    echo "   ❌ Failed to install livekit-plugins-cartesia"
fi

pip install livekit-plugins-openai>=0.1.0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ livekit-plugins-openai installed"
else
    echo "   ❌ Failed to install livekit-plugins-openai"
fi

pip install livekit-plugins-azure>=0.1.0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ livekit-plugins-azure installed"
else
    echo "   ❌ Failed to install livekit-plugins-azure"
fi

# STT Providers
pip install livekit-plugins-deepgram>=0.1.0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ livekit-plugins-deepgram installed"
else
    echo "   ❌ Failed to install livekit-plugins-deepgram"
fi

# Install existing requirements
echo "📦 Installing existing requirements..."
pip install -r requirements.txt > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Existing requirements installed"
else
    echo "⚠️  Some requirements may have failed to install"
fi

# Verify installation
echo "🔍 Verifying installation..."
source voice_env/bin/activate

# Check if LiveKit packages are installed
echo "📋 Installed LiveKit packages:"
pip list | grep livekit || echo "   No LiveKit packages found"

# Test voice modules can be imported (without LiveKit dependencies)
echo "🧪 Testing voice module imports..."
python3 -c "
try:
    from voice_settings import VoiceSettings, VoiceSettingsManager
    print('✅ Voice settings module imported successfully')
except Exception as e:
    print(f'❌ Voice settings import failed: {e}')

try:
    from clara_task_processor import ClaraTaskProcessor, VoiceCommandParser
    print('✅ Task processor module imported successfully')
except Exception as e:
    print(f'❌ Task processor import failed: {e}')

try:
    from clara_voice_agent import VoiceConfig, VoiceProvider, STTProvider
    print('✅ Voice agent module imported successfully')
except Exception as e:
    print(f'❌ Voice agent import failed: {e}')
"

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Configure API keys:"
echo "   export TTS_API_KEY='your_elevenlabs_key'"
echo "   export STT_API_KEY='your_deepgram_key'"
echo ""
echo "2. Test voice endpoints:"
echo "   curl http://localhost:5000/voice/status"
echo "   curl -X POST http://localhost:5000/voice/process-command \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"command\": \"create a task to test voice features\"}'"
echo ""
echo "3. Set up LiveKit server for testing:"
echo "   curl -sSL https://get.livekit.io | bash"
echo "   livekit-server --dev"
echo ""
echo "4. Update React frontend to use Python backend endpoints"
echo ""
echo "📚 See dev_docs/voice_feature.md for complete documentation"