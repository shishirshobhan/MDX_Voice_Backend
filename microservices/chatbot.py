# ============================================
# PROPER AI CHATBOT - Using FREE Hugging Face
# For Domestic Violence Support - Nepal
# ============================================

"""
INSTALLATION:
pip install flask flask-cors transformers torch sentencepiece accelerate

FIRST TIME SETUP (downloads ~2GB model):
This will download a free AI model that runs on your computer.
No API key needed, completely free.

⚠️ IMPORTANT: This is still a college project demo.
Real deployment needs professional review and crisis protocols.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from datetime import datetime
import json
import re

app = Flask(__name__)
CORS(app)

# Store sessions
chat_sessions = {}

# ============================================
# AI MODEL SETUP (FREE - Runs Locally)
# ============================================

class AIModel:
    """Wrapper for the AI model"""
    
    def __init__(self):
        print("Loading AI model... (first time takes 2-3 minutes)")
        
        # Using smaller model for faster download (~350MB instead of 863MB)
        # You can also try: "microsoft/DialoGPT-medium" (better quality, bigger)
        model_name = "microsoft/DialoGPT-small"
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)
        
        # Set padding token
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        print("✅ AI Model loaded successfully!")
    
    def generate_response(self, conversation_history: list, user_message: str, context: dict) -> str:
        """Generate AI response with safety context"""
        
        # Build context-aware prompt
        system_context = """You are a professional, empathetic counselor helping domestic violence survivors in Nepal.

CRITICAL RULES:
- ALWAYS take abuse seriously, especially child abuse
- Express immediate concern for safety
- Never minimize or dismiss their experience
- Offer concrete help and resources
- Be professional but warm
- If child abuse is mentioned, treat as CRITICAL emergency

Context about user: """
        
        if context.get('has_violence'):
            system_context += "Violence detected. "
        if context.get('children_mentioned'):
            system_context += "Children's safety at risk. "
        if context.get('emotional_distress'):
            system_context += "Person is in distress. "
        
        # Build conversation for the model
        prompt = f"{system_context}\n\nUser: {user_message}\nCounselor:"
        
        # Encode
        inputs = self.tokenizer.encode(prompt, return_tensors="pt", max_length=512, truncation=True)
        
        # Generate response
        with torch.no_grad():
            outputs = self.model.generate(
                inputs,
                max_length=inputs.shape[1] + 100,
                num_return_sequences=1,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
                no_repeat_ngram_size=3
            )
        
        # Decode response
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract just the counselor's response
        if "Counselor:" in response:
            response = response.split("Counselor:")[-1].strip()
        else:
            response = response[len(prompt):].strip()
        
        # Fallback if model gives poor response
        if len(response) < 10 or not response:
            return self._get_fallback_response(user_message, context)
        
        return response
    
    def _get_fallback_response(self, message: str, context: dict) -> str:
        """Fallback responses for critical situations"""
        msg_lower = message.lower()
        
        # CRITICAL: Child abuse
        if any(word in msg_lower for word in ["child sexual", "child abuse", "molest", "rape child"]):
            return """I need to tell you this is extremely serious and requires immediate action. What you're describing is a crime that puts a child in danger.

In Nepal:
• Police: 100 (ask for Women & Children Service Center)
• Child Helpline: 1098
• National Women Commission: 1145

A child's safety is at immediate risk. Please contact authorities or one of these organizations right away. I can also help you find local child protection services. Are you able to call for help right now?"""
        
        # Violence
        if context.get('has_violence'):
            return "I'm very concerned about your safety. What you're describing sounds serious. Are you in a safe place right now where we can talk? Your safety is the most important thing."
        
        # Children mentioned
        if context.get('children_mentioned'):
            return "I understand children are involved in this situation. Their safety, along with yours, is very important. Can you tell me more about what's happening so I can help you find the right support?"
        
        # Default
        return "I'm listening. This is a safe space. Can you tell me more about what's happening?"


# Initialize AI model globally (loads once when server starts)
print("Initializing AI model...")
ai_model = AIModel()
print("Server ready!")


# ============================================
# SMART CHATBOT WITH AI
# ============================================

class SmartDVChatbot:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.conversation_history = []
        self.detected_needs = set()
        self.message_count = 0
        
        # Critical keywords for safety detection
        self.safety_keywords = {
            "child_abuse": ["child sexual", "child abuse", "molest child", "rape child", "sexually abuse child"],
            "immediate_danger": ["kill me", "weapon", "gun", "knife", "tonight", "right now", "emergency"],
            "violence": ["hit", "beat", "slap", "kick", "hurt", "punch", "attack", "violence"],
            "sexual_violence": ["rape", "sexual assault", "forced sex", "sexually abuse"],
            "children": ["child", "children", "kids", "son", "daughter", "baby"],
            "distress": ["suicide", "kill myself", "want to die", "can't live", "hopeless"],
            "help_seeking": ["help", "what should i do", "need support", "save me"]
        }
    
    def analyze_safety(self, message: str) -> dict:
        """Critical safety analysis"""
        msg_lower = message.lower()
        
        analysis = {
            "urgency": "low",
            "categories": [],
            "child_abuse": False,
            "immediate_danger": False,
            "has_violence": False,
            "sexual_violence": False,
            "children_mentioned": False,
            "emotional_distress": False,
            "needs_help": False
        }
        
        # Check each category
        for category, keywords in self.safety_keywords.items():
            if any(keyword in msg_lower for keyword in keywords):
                analysis[category] = True
                analysis["categories"].append(category)
        
        # Set urgency
        if analysis["child_abuse"] or analysis["immediate_danger"]:
            analysis["urgency"] = "CRITICAL"
            analysis["needs_help"] = True
        elif analysis["sexual_violence"] or analysis["distress"]:
            analysis["urgency"] = "high"
            analysis["needs_help"] = True
        elif analysis["has_violence"]:
            analysis["urgency"] = "high"
            analysis["needs_help"] = True
        elif len(analysis["categories"]) >= 2:
            analysis["urgency"] = "medium"
            analysis["needs_help"] = True
        
        return analysis
    
    def get_emergency_response(self, analysis: dict) -> str:
        """Override AI for critical emergencies"""
        
        # CHILD ABUSE - Highest priority
        if analysis["child_abuse"]:
            return """⚠️ CRITICAL: This involves a child's safety, which is an emergency.

In Nepal, contact immediately:
• Police: 100 (Women & Children Service Center)
• Child Helpline: 1098
• National Women Commission: 1145
• Central Child Welfare Board: 01-4488090

If a child is in immediate danger, please:
1. Contact police immediately (100)
2. If you can, take the child to a safe location
3. Call Child Helpline 1098 for guidance

Organizations that help:
• Voice of Children: 01-4780033
• Child Workers in Nepal (CWIN): 01-4278064

Are you able to call for help right now? A child's life may depend on quick action."""
        
        # Immediate danger to adult
        if analysis["immediate_danger"]:
            return """🚨 IMMEDIATE DANGER - Please act now:

Emergency Contacts Nepal:
• Police: 100
• Women Commission: 1145
• Women & Children Service: 01-4411444

If you're in danger RIGHT NOW:
1. Leave the location if possible
2. Go to a neighbor, public place, or police station
3. Call 100 for immediate help

If you can't call safely, text "HELP" with your location to a trusted person.

Are you safe enough to talk right now?"""
        
        return None  # Let AI handle non-critical cases
    
    def chat(self, user_message: str) -> dict:
        """Process message with AI"""
        self.message_count += 1
        
        # Safety analysis
        analysis = self.analyze_safety(user_message)
        
        # Check for critical emergency (override AI)
        emergency_response = self.get_emergency_response(analysis)
        
        if emergency_response:
            bot_response = emergency_response
        else:
            # Use AI to generate response
            bot_response = ai_model.generate_response(
                self.conversation_history,
                user_message,
                analysis
            )
        
        # Store conversation
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "bot": bot_response,
            "analysis": analysis
        })
        
        # Update detected needs
        self.detected_needs.update(analysis["categories"])
        
        # Suggest help centers
        suggest_help = (
            analysis["needs_help"] or
            self.message_count >= 3 and len(self.detected_needs) > 0
        )
        
        return {
            "response": bot_response,
            "needs_assessment": analysis,
            "suggest_help_centers": suggest_help,
            "help_categories": list(self.detected_needs),
            "conversation_length": self.message_count
        }


# ============================================
# FLASK API ROUTES
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "ai_model": "loaded",
        "service": "DV Chatbot with AI",
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/chat/start', methods=['POST'])
def start_chat():
    data = request.json
    session_id = data.get('session_id') or f"session_{datetime.now().timestamp()}"
    
    chat_sessions[session_id] = SmartDVChatbot(session_id)
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "message": "AI chat session started"
    })


@app.route('/api/chat/message', methods=['POST'])
def send_message():
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
            chat_sessions[session_id] = SmartDVChatbot(session_id)
        
        chatbot = chat_sessions[session_id]
        
        # Process with AI
        result = chatbot.chat(user_message)
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "bot_response": result["response"],
            "needs_assessment": result["needs_assessment"],
            "suggest_help_centers": result["suggest_help_centers"],
            "help_categories": result["help_categories"],
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/resources', methods=['GET'])
def get_resources():
    return jsonify({
        "success": True,
        "emergency_numbers": {
            "Police": "100",
            "Child Helpline": "1098",
            "National Women Commission": "1145",
            "Women & Children Service": "01-4411444"
        },
        "child_protection": {
            "Voice of Children": "01-4780033",
            "CWIN": "01-4278064",
            "Central Child Welfare Board": "01-4488090"
        },
        "organizations": {
            "Maiti Nepal": "01-4428818",
            "Saathi": "01-4420959",
            "WOREC": "01-4429053"
        }
    })


if __name__ == '__main__':
    print("=" * 70)
    print("🤖 AI-Powered DV Chatbot Starting...")
    print("=" * 70)
    print("\n✅ Server ready with AI model")
    print("Running on: http://localhost:5000")
    print("=" * 70 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=4000)
