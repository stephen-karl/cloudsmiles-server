import { ICredential } from "../schemas/mongo/credential.schema";
import AdminModel from "../schemas/mongo/admin.schema";
import AssistantModel from "../schemas/mongo/assistant.schema";
import DentistModel from "../schemas/mongo/dentist.schema";
import PatientModel from "../schemas/mongo/patient.schema";


export const getFullName = async (existingUser: ICredential) => {
  let fullName = "";

  if (existingUser.credentialRole === "patient") {
    const patient = await PatientModel.findById(existingUser.credentialPatientId);

    if (!patient) {
      throw new Error("Patient does not exist!");
    }

    fullName = patient.patientFullName 
  }

  if (existingUser.credentialRole === "dentist") {
    const dentist = await DentistModel.findById(existingUser.credentialDentistId);

    if (!dentist) {
      throw new Error("Dentist does not exist!");
    }

    fullName = dentist.dentistFullName 
  }

  if (existingUser.credentialRole === "assistant") {
    const assistant = await AssistantModel.findById(existingUser.credentialAssistantId);

    if (!assistant) {
      throw new Error("Assistant does not exist!");
    }

    fullName = assistant.assistantFullName 
  }

  if (existingUser.credentialRole === "admin") {
    const admin = await AdminModel.findById(existingUser.credentialAdminId);

    if (!admin) {
      throw new Error("Admin does not exist!");
    }

    fullName = admin.adminFullName 
  }

  return fullName;
}