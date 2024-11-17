import  { Schema, model,  Types} from 'mongoose';

type AgreementDocumentType = {
  documentAppoinmentId: Types.ObjectId;
  documentName: string;
  documentUrl: string;
  documentResourceType: string;
}

const documentsSchema = new Schema<AgreementDocumentType>(
  {
    documentAppoinmentId: { type: Schema.Types.ObjectId , required: true, ref: "appointments" },
    documentName: { type: String, required: true },
    documentUrl: { type: String, required: true },  
    documentResourceType: { type: String, required: true },
  },
  {
    timestamps: true, 
  }
);

const DocumentModel = model<AgreementDocumentType>('agreements', documentsSchema);
export default DocumentModel;
