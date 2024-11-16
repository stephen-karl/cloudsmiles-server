
export type AgreementDocumentType = {
  _id: string;
  documentName: string;
  documentUrl: string;
}

export type AppointmentResponseType = {
  _id: string;
  appointmentSerialId: string;
  appointmentReasonForVisit: string;
  appointmentStatus: string;
  appointmentAgreementDocuments: AgreementDocumentType[] | []
  appointmentDentistId:  string
}