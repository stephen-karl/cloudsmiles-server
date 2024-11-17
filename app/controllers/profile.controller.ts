import { Request, Response } from 'express';
import { imageUploader } from '../helpers/cloudinary/uploader';
import { imageDeleter } from '../helpers/cloudinary/deleter';
import { Model } from 'mongoose';
import AdminModel, { AdminType } from '../schemas/mongo/admin.schema';
import AssistantModel, { IAssistant } from '../schemas/mongo/assistant.schema';
import PatientModel, { IPatient } from '../schemas/mongo/patient.schema';
import DentistModel, { IDentist } from '../schemas/mongo/dentist.schema';
import CredentialsModel from '../schemas/mongo/credential.schema';


// Define the type for modelMap
type Role = 'dentist' | 'patient' | 'assistant' | 'admin';

interface ModelMap {
  dentist: Model<IDentist>
  patient: Model<IPatient>
  assistant: Model<IAssistant>
  admin: Model<AdminType>
}

// Define model and profile field mappings
const modelMap: ModelMap = {
  dentist: DentistModel,
  patient: PatientModel,
  assistant: AssistantModel,
  admin: AdminModel,
};

const updateUserData = async (req: Request) => {
  const userId = req.body.userId;
  const role: Role = req.body.role;

  let user = {
    _id: "",
    avatar: "",
    fullName: "",
    gender: "",
    dateOfBirth: new Date(),
    address: "",
    email: "",
    phoneNumber: "",
    role: role,
  };

  // Define profile field mappings
  const profileFields = {
    avatar: "profileAvatar",
    fullName: "profileFullName",
    gender: "profileGender",
    dateOfBirth: "profileDateOfBirth",
    address: "profileAddress",
    email: "profileEmail",
    phoneNumber: "profilePhoneNumber",
  };

  
  if (!req.body.profileAvatar) {
    await imageDeleter(`${role}s`, userId);
    req.body.profileAvatar = "";
  }

  // Map request fields to update object
  const mapProfileData = () => ({
    [`${role}Avatar`]: req.body[profileFields.avatar],
    [`${role}FullName`]: req.body[profileFields.fullName],
    [`${role}Gender`]: req.body[profileFields.gender],
    [`${role}DateOfBirth`]: req.body[profileFields.dateOfBirth],
    [`${role}Address`]: req.body[profileFields.address],
  });

  

  // Update main profile
  const updatedProfile = await (modelMap[role] as Model<any>).findByIdAndUpdate(
    userId,
    mapProfileData(),
    { new: true }
  );

  if (!updatedProfile) {
    console.log(`${role.charAt(0).toUpperCase() + role.slice(1)} not found`);
    return null;
  }

  // Update credentials
  const credentialIdField = `${role}CredentialId` as keyof typeof updatedProfile;
  const credentialUpdate = {
    credentialEmail: req.body[profileFields.email],
    credentialPhoneNumber: req.body[profileFields.phoneNumber],
  };

  const updatedCredential = await CredentialsModel.findByIdAndUpdate(
    updatedProfile[credentialIdField],
    credentialUpdate,
    { new: true }
  );

  if (!updatedCredential) {
    console.log(`${role.charAt(0).toUpperCase() + role.slice(1)} Credential not found`);
    return null;
  }

  // Populate the user object
  user = {
    _id: String(updatedProfile._id),
    avatar: updatedProfile[`${role}Avatar`],
    fullName: updatedProfile[`${role}FullName`],
    gender: updatedProfile[`${role}Gender`],
    dateOfBirth: updatedProfile[`${role}DateOfBirth`],
    address: updatedProfile[`${role}Address`],
    email: updatedCredential.credentialEmail,
    phoneNumber: updatedCredential.credentialPhoneNumber,
    role: updatedCredential.credentialRole as Role,
  };

  return user;
};


export const editProfile = async (req: Request, res: Response) => {
  const { role, userId } = req.body;


  try {


    if (req.file) {
      await imageDeleter(`${role}s`, userId);
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, req.file.mimetype, `${role}s`, userId, 300, 300
      );
      req.body.profileAvatar = cloudinaryResponse.secure_url;
    }

    const updatedUser = await updateUserData(req);

    if (!updatedUser) {
      return res.status(404).json({ status: 'error', message: `${role} not found` });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error editing profile:", error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

