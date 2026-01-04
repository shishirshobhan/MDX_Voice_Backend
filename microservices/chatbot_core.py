
import sys
import json
import requests
from datetime import datetime

class OllamaChatbot:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.conversation_history = []
        self.message_count = 0
        self.ollama_url = "http://localhost:11434/api/chat"
        
        self.system_prompt = """You are SaharaBot, a compassionate AI counselor helping survivors of domestic violence and abuse in Nepal.

Your role:
- Provide empathetic, supportive responses
- Take ALL abuse seriously, especially child abuse
- Offer concrete help and resources
- Be professional but warm
- Keep responses clear and under 100 words

CRITICAL: If user mentions child abuse or sexual abuse by family members:
- Express serious concern immediately
- Emphasize this is a crime and child is in danger
- Provide emergency contacts: Police 100, Child Helpline 1098
- Urge immediate action

Nepal Resources:
- Police: 100
- Child Helpline: 1098  
- Women Commission: 1145
- Women & Children Service: 01-4411444

Remember: Prioritize safety. Never minimize abuse."""
    
    def detect_language(self, text: str) -> str:
        nepali_chars = sum(1 for char in text if '\u0900' <= char <= '\u097F')
        total_chars = len([c for c in text if c.isalpha()])
        if total_chars == 0:
            return "english"
        return "nepali" if nepali_chars / total_chars > 0.3 else "english"
    
    def translate_to_nepali(self, english_text: str) -> str:
        translations = {
            "I hear you": "म तपाईंलाई सुन्दैछु",
            "I'm listening": "म सुनिरहेको छु",
            "your safety": "तपाईंको सुरक्षा",
            "Are you safe": "के तपाईं सुरक्षित हुनुहुन्छ",
            "This is serious": "यो गम्भीर छ",
            "This is a crime": "यो अपराध हो",
            "Please call": "कृपया फोन गर्नुहोस्",
            "Police": "प्रहरी",
            "Child Helpline": "बाल हेल्पलाइन",
        }
        result = english_text
        for eng, nep in translations.items():
            result = result.replace(eng, nep)
        return result
    
    def analyze_content(self, message: str) -> dict:
        msg_lower = message.lower()
        critical_keywords = {
            "child_abuse": ["काका", "मामा", "छुनु", "child sexual", "child abuse", "molest"],
            "immediate_danger": ["kill me", "weapon", "gun", "knife"],
            "violence": ["कुट्छ", "hit", "beat", "hurt", "violence"],
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
        
        return {"categories": detected, "urgency": urgency}
    
    def chat_with_ollama(self, user_message: str) -> str:
        try:
            user_language = self.detect_language(user_message)
            
            messages = [{"role": "system", "content": self.system_prompt}]
            for msg in self.conversation_history[-5:]:
                messages.append({"role": "user", "content": msg["user"]})
                messages.append({"role": "assistant", "content": msg["bot"]})
            
            messages.append({"role": "user", "content": user_message})
            
            response = requests.post(
                self.ollama_url,
                json={
                    "model": "llama3.2:3b",
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 150}
                },
                timeout=30
            )
            
            if response.status_code == 200:
                english_response = response.json()["message"]["content"].strip()
                
                if user_language == "nepali":
                    nepali_response = self.translate_to_nepali(english_response)
                    return f"{nepali_response}\n\n---\n\n{english_response}"
                return english_response
            
        except Exception as e:
            return self.get_fallback_response(user_message)
    
    def get_fallback_response(self, message: str) -> str:
        msg_lower = message.lower()
        user_lang = self.detect_language(message)
        
        if any(word in msg_lower for word in ["काका", "मामा", "छुनु", "child sexual"]):
            if user_lang == "nepali":
                return "🚨 यो अत्यन्तै गम्भीर छ। तुरुन्त सम्पर्क: प्रहरी 100, बाल हेल्पलाइन 1098\n\n---\n\n🚨 This is critical. Contact: Police 100, Child Helpline 1098"
            return "🚨 This is critical. Contact: Police 100, Child Helpline 1098"
        
        if msg_lower in ["hi", "hello", "namaste", "नमस्ते"]:
            return "नमस्ते। म SaharaBot हुँ।\n\n---\n\nHello. I'm SaharaBot." if user_lang == "nepali" else "Hello. I'm SaharaBot."
        
        return "म सुनिरहेको छु।\n\n---\n\nI'm listening." if user_lang == "nepali" else "I'm listening."
    
    def chat(self, user_message: str) -> dict:
        self.message_count += 1
        bot_response = self.chat_with_ollama(user_message)
        analysis = self.analyze_content(user_message)
        
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "bot": bot_response
        })
        
        return {
            "response": bot_response,
            "urgency": analysis["urgency"],
            "categories": analysis["categories"],
            "suggest_help": len(analysis["categories"]) > 0,
            "conversation_length": self.message_count
        }

# Global session storage
sessions = {}

def main():
    command = sys.argv[1]
    data = json.loads(sys.argv[2])
    
    if command == "start":
        session_id = data.get("session_id", f"session_{datetime.now().timestamp()}")
        sessions[session_id] = OllamaChatbot(session_id)
        print(json.dumps({"success": True, "session_id": session_id}))
    
    elif command == "message":
        session_id = data["session_id"]
        message = data["message"]
        
        if session_id not in sessions:
            sessions[session_id] = OllamaChatbot(session_id)
        
        result = sessions[session_id].chat(message)
        print(json.dumps({
            "success": True,
            "bot_response": result["response"],
            "urgency": result["urgency"],
            "categories": result["categories"],
            "suggest_help_centers": result["suggest_help"],
            "conversation_length": result["conversation_length"]
        }))
    
    elif command == "resources":
        print(json.dumps({
            "success": True,
            "emergency_numbers": {
                "Police": "100",
                "Child Helpline": "1098",
                "Women Commission": "1145"
            }
        }))

if __name__ == "__main__":
    main()
