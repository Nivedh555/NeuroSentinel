import { Groq } from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an experienced medical doctor AI assistant for NeuroSentinel, a mental health and wellness platform. 

Analyze the patient's vitals and symptoms and provide a comprehensive assessment including:
1. **Possible Conditions**: List 2-3 most likely conditions based on the vitals and symptoms
2. **Severity Assessment**: Mild, Moderate, Severe, or Critical
3. **Recommendations**: Specific actionable steps the patient should take
4. **Emergency Care**: Clear statement on whether emergency care is needed

Be clear, concise, and helpful. Always remind the patient to consult a real doctor for proper diagnosis and treatment. 

Format your response clearly with these sections.`;

export const analyzeDiagnosis = async (req, res) => {
  try {
    const { vitals, symptoms, medicalHistory } = req.body;

    // Validate input
    if (!vitals || !vitals.heartRate || !vitals.bloodPressure || !vitals.temperature || !vitals.spo2) {
      return res.status(400).json({ message: 'All vitals are required' });
    }

    // Build user message
    const userMessage = `
Patient Vitals:
- Heart Rate: ${vitals.heartRate} BPM
- Blood Pressure: ${vitals.bloodPressure}
- Temperature: ${vitals.temperature}°F
- SpO₂ (Oxygen): ${vitals.spo2}%

Reported Symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'None'}

Medical History: ${medicalHistory || 'Not provided'}

Please analyze these vitals and symptoms and provide your professional assessment.
`;

    // Call Groq API
    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 1024,
      temperature: 0.7
    });

    const analysisText = completion.choices[0].message.content;

    // Check if emergency care is mentioned
    const emergencyKeywords = ['emergency', 'hospital', 'call 911', '911', 'critical', 'severe'];
    const needsEmergency = emergencyKeywords.some(keyword => 
      analysisText.toLowerCase().includes(keyword)
    );

    return res.status(200).json({
      analysis: analysisText,
      emergency: needsEmergency ? 'Seek immediate emergency medical care.' : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Diagnosis] Error:', error);
    return res.status(500).json({
      message: 'Failed to generate diagnosis',
      error: error.message
    });
  }
};
