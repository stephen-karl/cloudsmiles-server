import { AppointmentResponseType } from '../interfaces/appointment.types';
import { generateRandomPassword } from '../utils/generators';
import { sendPatientWelcomeEmail } from '../helpers/resend/transporters';
import { imageDeleter } from '../helpers/cloudinary/deleter';
import { Request, Response } from 'express';
import { imageUploader } from '../helpers/cloudinary/uploader';
import PatientModel from '../schemas/mongo/patient.schema';
import CredentialsModel from '../schemas/mongo/credential.schema';
import RecordModel from '../schemas/mongo/record.schema';
import resend from '../configs/resend.config,';
import bcrypt from 'bcrypt';
import AppointmentModel from '../schemas/mongo/appointment.schema';
import CheckupModel from '../schemas/mongo/checkup.schema';
import DentistModel from '../schemas/mongo/dentist.schema';

const saltRounds = 10;

export const createPatient = async (req: Request, res: Response) => {

  const { patientFullName, patientAddress, patientDateOfBirth, patientGender, patientEmail, patientPhoneNumber } = req.body;

  try {
    const patientResult = await PatientModel.create({
      patientFullName: patientFullName,
      patientAddress: patientAddress,
      patientDateOfBirth: patientDateOfBirth,
      patientGender: patientGender,
      patientStatus: "Verified",
      patientAvatar: null,
    });

    const password = generateRandomPassword(12, {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
    });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let cloudinaryResponse = null

    if (req.file) {
      cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'patients', 
        patientResult._id as string,
        300, 
        300
      );
    }

    const credentialResult = await CredentialsModel.create({
      credentialProvider: "local",
      credentialRole: "patient",
      credentialPassword: hashedPassword,
      credentialPatientId: patientResult._id,
      credentialPhoneNumber: patientPhoneNumber,
      credentialEmail: patientEmail,
    })


    await PatientModel.findByIdAndUpdate(patientResult._id, 
      { 
        patientCredentialId: credentialResult._id,
        patientAvatar: cloudinaryResponse?.secure_url
      }, 
      { new: true }
    );

    const fullName = patientFullName;
    const firstName = fullName.split(' ')[0];
    
    sendPatientWelcomeEmail(firstName, patientEmail, password);

    res.status(200).json({ message: "Patient created successfully"})
  } catch (error) {
    res.status(500).json(error);
  }
}

export const updatePatient = async (req: Request, res: Response) => {
  const { patientId, patientFullName, patientAddress, patientDateOfBirth, patientGender, patientEmail, patientPhoneNumber } = req.body;

  try {

    if (req.file) {
      await imageDeleter('patients', patientId as string);
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'patients', 
        patientId as string,
        300,
        300
      );
      await PatientModel.findByIdAndUpdate( patientId,{ patientAvatar: cloudinaryResponse.secure_url}, { new: true })
    }
    // Remove
    if (req.body.patientAvatar === 'null') {
      await imageDeleter('patients', patientId as string);
      await PatientModel.findByIdAndUpdate(patientId, { patientAvatar: null }, { new: true });
    }


    const patientResult = await PatientModel.findByIdAndUpdate(
      patientId,
      {
        patientFullName: patientFullName,
        patientAddress: patientAddress,
        patientDateOfBirth: patientDateOfBirth,
        patientGender: patientGender,
      }
    )
    if (!patientResult) {
      return res.status(201).json({ message: "Patient not found" });
    }

    const credentialResult = await CredentialsModel.findByIdAndUpdate(
      patientResult.patientCredentialId,
      {
        credentialPhoneNumber: patientPhoneNumber,
        credentialEmail: patientEmail,
      }
    )

    console.log("3")
    res.status(200).json({ message: "Patient updated successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
  
}

export const deletePatient = async (req: Request, res: Response) => {
  const patientId = req.params.id as string;

  try {
    const patient = await PatientModel.findByIdAndUpdate(patientId, { isDeleted: true }, { new: true });
    if (!patient) {
      return res.status(201).json({ message: "Patient not found" });
    }

    const credential = await CredentialsModel.findByIdAndUpdate(patient.patientCredentialId, { isDeleted: true }, { new: true });
    if (!credential) {
      return res.status(201).json({ message: "Credential not found" });
    }
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
}

export const findPatients = async (req: Request, res: Response) => {
  try {
    const keywords = req.params.keywords as string;
    const patients = await PatientModel.find({
      $or: [
        { patientFullName: { $regex: keywords, $options: 'i' } },
      ]
    }).populate({
      path: 'patientCredentialId',
      select: 'credentialEmail credentialPhoneNumber'
    });
    
    if (!patients) {
      return res.status(201).json({ message: "No patients found" });
    }

    res.status(200).json(patients);

  } catch (error) {
    res.status(500).json(error);
  }
}

export const getPatients = async (req: Request, res: Response) => {
  try {
    const patients = await PatientModel.find({
      isDeleted: false,
    })
    .populate({
      path: 'patientCredentialId',
      select: 'credentialPhoneNumber credentialEmail'
    })
    .sort({ createdAt: -1 });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const addDentalRecord = async (req: Request, res: Response) => {
  const { recordPatientId, ...recordData } = req.body;  

  try {
    const updatedRecord = await RecordModel.findOneAndUpdate(
      { recordPatientId: recordPatientId },  // use patientId as the unique identifier
      { $set: recordData },            // ensure we’re setting specific fields
      { upsert: true, new: true }       // upsert to create if not exists, and return new document
    );

    res.status(200).json({ message: "Dental record added or updated successfully", record: updatedRecord });
  } catch (error) {
    res.status(500).json({ error: "An error occurred", details: error });
  }
};

export const getDentalRecord = async (req: Request, res: Response) => {
  const recordPatientId = req.params.id as string;

  try {
    const record = await RecordModel.findOne({ recordPatientId: recordPatientId });
    res.status(200).json(record);

  } catch (error) {
    res.status(500).json(error);
  }
}

export const getPatientProfile = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const patient = await PatientModel.findById(id)
    .populate({
      path: 'patientCredentialId',
      select: 'credentialEmail credentialPhoneNumber'
    });

    if (!patient) {
      return res.status(201).json({ message: "Patient not found" });
    }

    const patientId = patient._id as string;
    
    const record = await RecordModel.findOne({ recordPatientId: patientId });
    const appointments = await AppointmentModel.find({ appointmentPatientId: patientId });
    const checkups = await CheckupModel.find({ checkupPatientId: patientId })
      .populate('checkupAppointmentId')  // Populating the Appointment
      .populate('checkupTreatmentId')  // Populating Treatment
      .sort({ createdAt: -1 })
    
      const finishedCheckups = [];

      for (const checkup of checkups) {
        const appointment = checkup.checkupAppointmentId as unknown as AppointmentResponseType;
        const dentistId = appointment.appointmentDentistId as string;
      
        // Fetch the dentist data
        const dentistData = await DentistModel.findById(dentistId);
      
        // Append the updated checkup
        finishedCheckups.push({
          ...checkup.toObject(),
          checkupAppointmentId: {
            ...appointment,
            appointmentDentistId: dentistData 
          }
        });
      }
      
      

    const response = {
      patientData: patient,
      recordData: record,
      appointmentData: appointments,
      checkupData: finishedCheckups
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
}

export const getPatientCount = async (req: Request, res: Response) => {
  try {
    const patientCount = await PatientModel.countDocuments({ isDeleted: false });
    res.status(200).json({ patientCount });
  } catch (error) {
    res.status(500).json(error);
  }
}