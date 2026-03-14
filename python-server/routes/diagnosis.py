from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.diagnosis_service import get_diagnosis

router = APIRouter()

class VitalsInput(BaseModel):
    heartRate: float
    systolicBP: float
    diastolicBP: float
    temperature: float
    oxygenSaturation: float

class DiagnosisRequest(BaseModel):
    vitals: VitalsInput
    symptoms: List[str]
    medicalHistory: Optional[str] = None
    userId: Optional[str] = None

@router.post("/diagnosis")
async def diagnosis(request: DiagnosisRequest):
    """
    Endpoint to get AI-powered health diagnosis based on vitals and symptoms
    """
    try:
        # Get diagnosis from service
        diagnosis_result = get_diagnosis(
            request.vitals.dict(),
            request.symptoms,
            request.medicalHistory or ""
        )
        
        return {
            'success': True,
            'analysis': diagnosis_result.get('analysis'),
            'recommendations': diagnosis_result.get('recommendations'),
            'timestamp': diagnosis_result.get('timestamp'),
            'user_id': request.userId
        }
        
    except Exception as e:
        print(f"Error in diagnosis endpoint: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

