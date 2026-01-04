# ============================================
# AI CHATBOT - FREE Local LLM with Ollama
# Actually has real conversations!
# ============================================

"""
EASIEST SETUP - Use Ollama (100% Free, runs locally):

1. Install Ollama: https://ollama.ai/download
2. Run: ollama pull llama3.2:1b
3. Run this script: python3 chatbot.py

That's it! No API keys, no complex setup.
Model is only 1.3GB and very fast.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

chat_sessions = {}

# ============================================
# CHATBOT WITH OLLAMA (FREE LOCAL LLM)
# ============================================

class OllamaChatbot:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.conversation_history = []
        self.message_count = 0
        self.ollama_url = "http://localhost:11434/api/chat"
        
        # System prompt for the AI
        self.system_prompt = """You are SaharaBot, a compassionate AI counselor helping people experiencing domestic violence in Nepal.

CRITICAL LANGUAGE RULES:
- When user writes in NEPALI (Devanagari script like: मलाई, छ, भएको), respond ONLY in NEPALI
- When user writes in English, respond in English
- When user writes in Roman Nepali (like: malai, chha, bhayeko), respond in NEPALI or English
- NEVER use HINDI language
- If you're unsure about the language, use English

Example:
User: "मलाई मेरो श्रीमान्ले कुट्छ" → Respond in NEPALI
User: "My husband beats me" → Respond in English
User: "malai help chahiyo" → Respond in Nepali or English

Your role:
- Listen with empathy and provide emotional support
- Take all concerns seriously, especially Domestic violence, Human rights, house conflict and child safety
- Suggest Nepal-specific resources when needed
- Be professional but warm and caring
- Remind users you're an AI (SaharaBot) if they ask
- Prioritize user safety above all

Nepal Emergency Numbers:
- Police: 100
- Women Commission: 1145
- Child Helpline: 1098
- Women & Children Service: 01-4411444

Remember: You're here to support, not replace professional help."""

    def analyze_content(self, message: str) -> dict:
        """Quick analysis for resource suggestions"""
        msg_lower = message.lower()
        
        critical_keywords = {
            "child_abuse": ["child sexual", "child abuse", "molest", "child rape"],
            "immediate_danger": ["kill me", "weapon", "gun", "knife", "right now"],
            "violence": ["hit", "beat", "slap", "hurt", "violence", "attack"],
            "legal": ["police", "lawyer", "court", "complaint"],
            "shelter": ["leave", "safe place", "escape", "shelter"],
            "counseling": ["therapy", "counseling", "mental health", "depressed"]
        }
        
        detected = []
        urgency = "normal"
        
        for category, keywords in critical_keywords.items():
            if any(kw in msg_lower for kw in keywords):
                detected.append(category)
                if category in ["child_abuse", "immediate_danger"]:
                    urgency = "critical"
                elif category == "violence":
                    urgency = "high"
        
        return {
            "categories": detected,
            "urgency": urgency,
            "suggest_resources": len(detected) > 0 or self.message_count >= 3
        }
    
    def chat_with_ollama(self, user_message: str) -> str:
        """Send message to Ollama and get AI response"""
        try:
            # Build conversation history for context
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history (last 5 messages for context)
            for msg in self.conversation_history[-5:]:
                messages.append({"role": "user", "content": msg["user"]})
                messages.append({"role": "assistant", "content": msg["bot"]})
            
            # Add current message
            messages.append({"role": "user", "content": user_message})
            
            # Call Ollama API
            response = requests.post(
                self.ollama_url,
                json={
                    "model": "llama3.2:3b",  # Larger model, better language support
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "num_predict": 150  # Limit response length
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["message"]["content"].strip()
            else:
                return self._get_fallback_response(user_message)
                
        except requests.exceptions.ConnectionError:
            return "⚠️ AI model not running. Please start Ollama: 'ollama serve' or install from ollama.ai"
        except Exception as e:
            print(f"Ollama error: {e}")
            return self._get_fallback_response(user_message)
    
    def _get_fallback_response(self, message: str) -> str:
        """Smart fallback if Ollama isn't available"""
        msg_lower = message.lower().strip()
        
        # Greetings
        if msg_lower in ["hi", "hello", "hey", "namaste"]:
            return "Namaste. I'm here to listen and support you. This is a safe, confidential space. How are you feeling today?"
        
        # Help seeking
        if any(word in msg_lower for word in ["help", "what should i do", "need support"]):
            return "I'm here to help you. Can you tell me what's been happening? I'll listen without judgment and we can figure out the best way to support you."
        
        # Violence mentioned
        if any(word in msg_lower for word in ["hit", "beat", "hurt", "violence", "abuse"]):
            return "I'm very concerned about your safety. What you're describing is serious, and no one deserves to be hurt. Are you in a safe place right now where we can talk?"
        
        # Children mentioned
        if any(word in msg_lower for word in ["child", "children", "kids", "daughter", "son"]):
            return "I understand there are children involved. Their safety, along with yours, is very important. Can you tell me more about the situation?"
        
        # Emotional
        if any(word in msg_lower for word in ["scared", "afraid", "sad", "depressed", "anxious"]):
            return "I hear you, and your feelings are completely valid. It takes courage to share this. You're not alone. Would you like to tell me more about what's been happening?"
        
        # Short responses
        if len(msg_lower.split()) <= 2:
            return "I'm listening. Take your time and share whatever you're comfortable with. What's been on your mind?"
        
        # Default empathetic response
        return "Thank you for sharing that with me. I want to understand your situation better so I can help. Can you tell me more about what's been happening?"
    
    def chat(self, user_message: str) -> dict:
        """Main chat function"""
        self.message_count += 1
        
        # Get AI response
        bot_response = self.chat_with_ollama(user_message)
        
        # Analyze for resource suggestions
        analysis = self.analyze_content(user_message)
        
        # Store conversation
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "bot": bot_response
        })
        
        return {
            "response": bot_response,
            "analysis": analysis,
            "suggest_help_centers": analysis["suggest_resources"],
            "help_categories": analysis["categories"],
            "conversation_length": self.message_count
        }


# ============================================
# FLASK API ROUTES
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Check if Ollama is running"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        ollama_status = "running" if response.status_code == 200 else "not responding"
    except:
        ollama_status = "not running"
    
    return jsonify({
        "status": "healthy",
        "ollama": ollama_status,
        "message": "Install Ollama from ollama.ai if not running" if ollama_status != "running" else "Ready",
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/chat/start', methods=['POST'])
def start_chat():
    """Start new chat session"""
    data = request.json or {}
    session_id = data.get('session_id', f"session_{datetime.now().timestamp()}")
    
    chat_sessions[session_id] = OllamaChatbot(session_id)
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "message": "Chat session started"
    })


@app.route('/api/chat/message', methods=['POST'])
def send_message():
    """Send message to chatbot"""
    try:
        data = request.json
        session_id = data.get('session_id')
        user_message = data.get('message', '').strip()
        
        if not session_id or not user_message:
            return jsonify({
                "success": False,
                "error": "session_id and message required"
            }), 400
        
        # Get or create session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = OllamaChatbot(session_id)
        
        chatbot = chat_sessions[session_id]
        result = chatbot.chat(user_message)
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "bot_response": result["response"],
            "suggest_help_centers": result["suggest_help_centers"],
            "help_categories": result["help_categories"],
            "urgency": result["analysis"]["urgency"],
            "conversation_length": result["conversation_length"],
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/chat/summary/<session_id>', methods=['GET'])
def get_summary(session_id):
    """Get conversation summary"""
    if session_id not in chat_sessions:
        return jsonify({"success": False, "error": "Session not found"}), 404
    
    chatbot = chat_sessions[session_id]
    return jsonify({
        "success": True,
        "total_messages": chatbot.message_count,
        "conversation_history": chatbot.conversation_history
    })


@app.route('/api/resources', methods=['GET'])
def get_resources():
    """Get Nepal resources"""
    return jsonify({
        "success": True,
        "emergency_numbers": {
            "Police": "100",
            "Child Helpline": "1098",
            "Women Commission": "1145",
            "Women & Children Service": "01-4411444"
        },
        "organizations": {
            "Maiti Nepal": {"phone": "01-4428818", "services": "Shelter, rehabilitation"},
            "Saathi": {"phone": "01-4420959", "services": "Counseling, shelter"},
            "WOREC": {"phone": "01-4429053", "services": "Legal aid, shelter"},
            "FWLD": {"phone": "01-4244339", "services": "Legal support"}
        }
    })


if __name__ == '__main__':
    print("=" * 70)
    print("🤖 AI Chatbot Server Starting...")
    print("=" * 70)
    print("\n📋 SETUP INSTRUCTIONS:")
    print("1. Install Ollama: https://ollama.ai/download")
    print("2. Run: ollama pull llama3.2:1b")
    print("3. That's it! The chatbot will work automatically.")
    print("\n💡 Ollama runs in background, no need to start manually")
    print("\nServer: http://localhost:3000")
    print("=" * 70 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=3000)
