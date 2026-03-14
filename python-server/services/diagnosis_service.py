from groq import Groq
from datetime import datetime
import os

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

DIAGNOSIS_SYSTEM_PROMPT = """You are a professional health assessment AI. Based on the patient's vital signs, symptoms, and medical history, provide a comprehensive health assessment.

IMPORTANT: You are providing an informational assessment only, NOT a medical diagnosis. Always remind the user to consult a healthcare provider.

Format your response as:
1. A brief assessment of the vital signs (normal/elevated/concerning)
2. Analysis of reported symptoms
3. Potential conditions that could explain the symptoms (with disclaimers)
4. General wellness recommendations
5. Strong advice to see a healthcare provider

Be professional, thorough, but always emphasize that this is NOT medical diagnosis."""

def get_diagnosis(vitals, symptoms, medical_history):
    """
    Get AI diagnosis based on vitals, symptoms, and medical history
    """
    try:
        # Build symptom list
        symptom_text = ', '.join(symptoms) if symptoms else 'No symptoms reported'
        
        # Build vitals summary
        vitals_text = f"""
Heart Rate: {vitals.get('heartRate', 'N/A')} BPM
Blood Pressure: {vitals.get('systolicBP', 'N/A')}/{vitals.get('diastolicBP', 'N/A')} mmHg
Temperature: {vitals.get('temperature', 'N/A')}°C
Oxygen Saturation: {vitals.get('oxygenSaturation', 'N/A')}%
        """
        
        # Build user message
        user_message = f"""
Please provide a health assessment based on the following information:

VITAL SIGNS:
{vitals_text}

SYMPTOMS:
{symptom_text}

MEDICAL HISTORY:
{medical_history if medical_history else 'No medical history provided'}

Please analyze this information and provide a comprehensive health assessment.
"""
        
        # Call Groq API
        message = client.messages.create(
            model="llama-3.3-70b-versatile",
            max_tokens=1024,
            system=DIAGNOSIS_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        
        # Extract response
        response_text = message.content[0].text
        
        # Parse the response into analysis and recommendations
        analysis = response_text
        recommendations = "Consult a healthcare provider for accurate diagnosis and personalized medical advice."
        
        # Try to split response for better formatting
        if "recommendation" in response_text.lower():
            parts = response_text.split("recommendation")
            analysis = parts[0]
            recommendations = parts[1] if len(parts) > 1 else recommendations
        
        return {
            'analysis': analysis.strip(),
            'recommendations': recommendations.strip(),
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error in diagnosis service: {str(e)}")
        return {
            'analysis': f"Error generating analysis: {str(e)}",
            'recommendations': "Please try again or consult a healthcare provider.",
            'timestamp': datetime.now().isoformat()
        }
