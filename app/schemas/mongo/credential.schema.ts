import { Schema, model, Document, Types } from 'mongoose';

export interface ICredential extends Document {
  credentialClientId?: string;
  credentialProvider: string;
  credentialEmail: string;
  credentialPassword: string;
  credentialPhoneNumber: string; 
  credentialRole?: string; 
  credentialPatientId?: Types.ObjectId;
  credentialDentistId?: Types.ObjectId;
  credentialAssistantId?: Types.ObjectId;
  credentialAdminId?: Types.ObjectId;
  credentialOTP?: number;
  isLoginTokenExpired?: boolean
  isRecoveryTokenExpired?: boolean;
  isDeleted?: boolean;
}

const credentialSchema = new Schema<ICredential>(
  {
    credentialClientId: { type: String, required: false },
    credentialProvider: { type: String, required: true },
    credentialEmail: { type: String, required: true },
    credentialPassword: { type: String, required: true },
    credentialPhoneNumber: { type: String, required: true, },
    credentialRole: {type:String, default: "patient"},
    credentialPatientId: { type: Schema.Types.ObjectId, ref: 'patients', required: false },
    credentialDentistId: { type: Schema.Types.ObjectId, ref: 'dentists', required: false },
    credentialAssistantId: { type: Schema.Types.ObjectId, ref: 'assistants', required: false },
    credentialAdminId: { type: Schema.Types.ObjectId, ref: 'admins', required: false },
    credentialOTP: { type: Number, required: false },
    isLoginTokenExpired: { type: Boolean, default: false },
    isRecoveryTokenExpired: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, 
  }
);

const CredentialsModel = model<ICredential>('credentials', credentialSchema);
export default CredentialsModel;
