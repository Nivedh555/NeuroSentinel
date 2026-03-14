import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    patientName: {
      type: String,
      required: true
    },
    doctorName: {
      type: String,
      required: true
    },
    specialty: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    patientSymptoms: {
      type: [String],
      default: []
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    diagnosis: {
      type: String,
      default: ''
    },
    triageLevel: {
      type: String,
      enum: ['EMERGENCY', 'URGENT', 'ROUTINE'],
      default: 'ROUTINE'
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Auto-calculate triage level based on risk score
appointmentSchema.pre('save', function() {
  if (this.riskScore > 70) {
    this.triageLevel = 'EMERGENCY';
  } else if (this.riskScore > 40) {
    this.triageLevel = 'URGENT';
  } else {
    this.triageLevel = 'ROUTINE';
  }
});

export default mongoose.model('Appointment', appointmentSchema);
