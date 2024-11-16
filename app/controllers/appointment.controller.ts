import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
<<<<<<< HEAD
import { getStartAndEndOfDay, mergeTimeAndDate, removeDateOffset } from '../utils/date.utils';
=======
import { getStartAndEndOfDay, mergeTimeAndDate } from '../utils/date.utils';
>>>>>>> 2cebcec950a4164605d9f6ed7afb7007e521bf68
import { getDay } from '../utils/calendar.utils';
import { FileUploader } from '../helpers/cloudinary/uploader';
import { imageDeleter } from '../helpers/cloudinary/deleter';
import { DocumentResponseType } from '../interfaces/documents.types';
import { formatToDeleteDocument } from '../helpers/cloudinary/formatter';
import CheckupModel, { CheckupType } from '../schemas/mongo/checkup.schema';
import AppointmentModel from '../schemas/mongo/appointment.schema';
import PaymentModel from '../schemas/mongo/payment.schema';
import DentistModel from '../schemas/mongo/dentist.schema';
import PatientModel from '../schemas/mongo/patient.schema';
import ScheduleModel from '../schemas/mongo/schedule.schema';
import DocumentModel from '../schemas/mongo/documents.schema';
import CredentialsModel from '../schemas/mongo/credential.schema';
import RecordModel from '../schemas/mongo/record.schema';


export const createAppointment = async (req: Request, res: Response) => {
  const appointmentData = req.body.appointmentData
  const dentistData = req.body.dentistData
  const patientData = req.body.patientData
  const patientId = patientData.patientId;

  try {

    const patientResult = await PatientModel.findById(patientId);

    if (!patientResult) {
      return res.status(404).send({ message: 'Patient not found' });
    }

    const appointmentDate = new Date(appointmentData.appointmentDate);
    const appointmentStartTime = mergeTimeAndDate(appointmentDate, removeDateOffset(appointmentData.appointmentTime.start));
    const appointmentEndTime = mergeTimeAndDate(appointmentDate, removeDateOffset(appointmentData.appointmentTime.end));
    

    const appointmentResult = await AppointmentModel.create({
      appointmentPatientId: patientResult._id,
      appointmentDentistId: dentistData._id,
      appointmentReasonForVisit: appointmentData.appointmentReasonForVisit,
      appointmentDate: {
        start: appointmentStartTime,
        end: appointmentEndTime,
      },
    })

    const dentistResult = await DentistModel.findById(dentistData._id)

    const day = getDay(appointmentDate)
    const scheduleResult = await ScheduleModel.find({
      dentistId: dentistData._id,
      'schedules.day': day,
    });

    const schedule = scheduleResult[0].schedules.find(schedule => schedule.day === day);
    
    const paymentResult = await PaymentModel.create({
      paymentAppointmentId: appointmentResult._id,
    });


    await AppointmentModel.findByIdAndUpdate(appointmentResult._id, {
      appointmentPaymentId: paymentResult._id,
    }, { new: true });

    const credentialResult = await CredentialsModel.findById(patientResult.patientCredentialId);

    if (!credentialResult) {
      return res.status(404).send({ message: 'Credential not found' });
    }

    const record = await RecordModel.findOne({ recordPatientId: patientId });



    const response = {
      appointmentData: appointmentResult.toObject(),
      dentistData: dentistResult ? {
        ...dentistResult.toObject(),
        start: schedule ? schedule.start : null,
        end: schedule ? schedule.end : null
      } : null,
      patientData: patientResult.toObject(),
      paymentData: paymentResult.toObject(),
      credentialData: { 
        credentialEmail: credentialResult.credentialEmail, 
        credentialPhoneNumber: credentialResult.credentialPhoneNumber 
      },
      recordData: record,
    };

    res.status(200).json(response)
  } catch (error) {
    res.status(500).send(error);
  }
}

export const getDayAppointments = async (req: Request, res: Response) => {
  const date = req.params.date;
  const { startOfDay, endOfDay } = getStartAndEndOfDay(date);


  try {
    const appointments = await AppointmentModel.aggregate([
      {
        $match: {
          'appointmentDate.start': { $gte: new Date(startOfDay) },
          'appointmentDate.end': { $lte: new Date(endOfDay) },
        },
      },
      {
        $lookup: {
          from: 'credentials',
          localField: 'appointmentPatientId',
          foreignField: 'credentialPatientId',
          as: 'credentialData',
        },
      },
      {
        $unwind: '$credentialData',
      },
      {
        $lookup: {
          from: 'patients', // the collection name for PatientModel
          localField: 'appointmentPatientId',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      {
        $unwind: '$patientData',
      },
      {
        $lookup: {
          from: 'dentists', // the collection name for DentistModel
          localField: 'appointmentDentistId',
          foreignField: '_id',
          as: 'dentistData',
        },
      },
      {
        $unwind: '$dentistData',
      },
      {
        $lookup: {
          from: 'payments', // the collection name for PaymentModel
          localField: 'appointmentPaymentId',
          foreignField: '_id',
          as: 'paymentData',
        },
      },
      {
        $unwind: "$paymentData"
      },
      {
        $lookup:{
          from: 'records',
          localField: 'appointmentPatientId',
          foreignField: 'recordPatientId',
          as: 'recordData'
        }
      },
      {
        $unwind: {
          path: "$recordData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          appointmentData: {
            _id: '$_id',
            appointmentReasonForVisit: '$appointmentReasonForVisit',
            appointmentDate: '$appointmentDate',
            appointmentStatus: '$appointmentStatus',
            appointmentSerialId: '$appointmentSerialId',
          },
          credentialData: {
            credentialEmail: '$credentialData.credentialEmail',
            credentialPhoneNumber: '$credentialData.credentialPhoneNumber',
          },
          patientData: {
            _id: '$patientData._id',
            patientAvatar: '$patientData.patientAvatar',
            patientFullName: '$patientData.patientFullName',
            patientDateOfBirth: '$patientData.patientDateOfBirth',
            patientGender: '$patientData.patientGender',
            patientAddress: '$patientData.patientAddress',
            patientSerialId: '$patientData.patientSerialId',
            patientStatus: '$patientData.patientStatus',
          },
          dentistData: {
            _id: '$dentistData._id',
            dentistAddress: '$dentistData.dentistAddress',
            dentistAvatar: '$dentistData.dentistAvatar',
            dentistCosmeticServices: '$dentistData.dentistCosmeticServices',
            dentistEmail: '$dentistData.dentistEmail',
            dentistEmploymentType: '$dentistData.dentistEmploymentType',
            dentistFullName: '$dentistData.dentistFullName',
            dentistMedicalServices: '$dentistData.dentistMedicalServices',
            dentistPhoneNumber: '$dentistData.dentistPhoneNumber',
            dentistSpecialization: '$dentistData.dentistSpecialization',
            unAvailableDates: '$dentistData.unAvailableDates',
            startTime: '$dentistData.startTime',
            endTime: '$dentistData.endTime',
          },
          recordData: {
            recordBloodPressure: '$recordData.recordBloodPressure',
            recordSickness: '$recordData.recordSickness',
            recordAllergies: '$recordData.recordAllergies',
            recordOralData: '$recordData.recordOralData',
            recordHygieneData: '$recordData.recordHygieneData',
          },
          paymentData: {
            _id: '$paymentData._id',
            paymentStatus: '$paymentData.paymentStatus',
            paymentSerialId: '$paymentData.paymentSerialId',
          }
        },
      },
    ]);
    res.status(200).json(appointments)
  } catch (error) {
    console.log(error)
    res.status(500).send({message: "An error occurred while fetching appointments"});
  }
}
export const getWeekAppointments = async (req: Request, res: Response) => {
  const startDate = String(req.query.start)
  const endDate = String(req.query.end)

  try {
    const appointments = await AppointmentModel.aggregate([
      {
        $match: {
          'appointmentDate.start': { $gte: new Date(startDate) },
          'appointmentDate.end': { $lte: new Date(endDate) },
        },
      },
      {
        $lookup: {
          from: 'credentials',
          localField: 'appointmentPatientId',
          foreignField: 'credentialPatientId',
          as: 'credentialData',
        },
      },
      {
        $unwind: '$credentialData',
      },
      {
        $lookup: {
          from: 'patients', // the collection name for PatientModel
          localField: 'appointmentPatientId',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      {
        $unwind: '$patientData',
      },
      {
        $lookup: {
          from: 'dentists', // the collection name for DentistModel
          localField: 'appointmentDentistId',
          foreignField: '_id',
          as: 'dentistData',
        },
      },
      {
        $unwind: '$dentistData',
      },
      {
        $lookup: {
          from: 'payments', // the collection name for PaymentModel
          localField: 'appointmentPaymentId',
          foreignField: '_id',
          as: 'paymentData',
        },
      },
      {
        $unwind: "$paymentData"
      },
      {
        $lookup:{
          from: 'records',
          localField: 'appointmentPatientId',
          foreignField: 'recordPatientId',
          as: 'recordData'
        }
      },
      {
        $unwind: {
          path: "$recordData",
          preserveNullAndEmptyArrays: true
        }
      },      
      {
        $project: {
          appointmentData: {
            _id: '$_id',
            appointmentReasonForVisit: '$appointmentReasonForVisit',
            appointmentDate: '$appointmentDate',
            appointmentStatus: '$appointmentStatus',
            appointmentSerialId: '$appointmentSerialId',
          },
          credentialData: {
            credentialEmail: '$credentialData.credentialEmail',
            credentialPhoneNumber: '$credentialData.credentialPhoneNumber',
          },
          patientData: {
            _id: '$patientData._id',
            patientAvatar: '$patientData.patientAvatar',
            patientFullName: '$patientData.patientFullName',
            patientDateOfBirth: '$patientData.patientDateOfBirth',
            patientGender: '$patientData.patientGender',
            patientAddress: '$patientData.patientAddress',
            patientSerialId: '$patientData.patientSerialId',
            patientStatus: '$patientData.patientStatus',
          },
          dentistData: {
            _id: '$dentistData._id',
            dentistAddress: '$dentistData.dentistAddress',
            dentistAvatar: '$dentistData.dentistAvatar',
            dentistCosmeticServices: '$dentistData.dentistCosmeticServices',
            dentistEmail: '$dentistData.dentistEmail',
            dentistEmploymentType: '$dentistData.dentistEmploymentType',
            dentistFullName: '$dentistData.dentistFullName',
            dentistMedicalServices: '$dentistData.dentistMedicalServices',
            dentistPhoneNumber: '$dentistData.dentistPhoneNumber',
            dentistSpecialization: '$dentistData.dentistSpecialization',
            unAvailableDates: '$dentistData.unAvailableDates',
            startTime: '$dentistData.startTime',
            endTime: '$dentistData.endTime',
          },
          recordData: {     
            recordBloodPressure: '$recordData.recordBloodPressure',
            recordSickness: '$recordData.recordSickness',
            recordAllergies: '$recordData.recordAllergies',
            recordOralData: '$recordData.recordOralData',
            recordHygieneData: '$recordData.recordHygieneData',
          },
          paymentData: {
            _id: '$paymentData._id',
            paymentStatus: '$paymentData.paymentStatus',
            paymentSerialId: '$paymentData.paymentSerialId',
          }
        },
      },
    ]);
    res.status(200).json(appointments)
  } catch (error) {
    res.status(500).send({message: "An error occurred while fetching appointments"});
  }
}
export const getMonthlyAppointments = async (req: Request, res: Response) => {

  const date = req.params.date;

  const startDate = new Date(date);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);

  try {
    const appointments = await AppointmentModel.aggregate([
      {
        $match: {
          'appointmentDate.start': { $gte: new Date(startDate) },
          'appointmentDate.end': { $lte: new Date(endDate) },
        },
      },
      {
        $lookup: {
          from: 'credentials',
          localField: 'appointmentPatientId',
          foreignField: 'credentialPatientId',
          as: 'credentialData',
        },
      },
      {
        $unwind: '$credentialData',
      },
      {
        $lookup: {
          from: 'patients', // the collection name for PatientModel
          localField: 'appointmentPatientId',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      {
        $unwind: '$patientData',
      },
      {
        $lookup: {
          from: 'dentists', // the collection name for DentistModel
          localField: 'appointmentDentistId',
          foreignField: '_id',
          as: 'dentistData',
        },
      },
      {
        $unwind: '$dentistData',
      },
      {
        $lookup: {
          from: 'payments', // the collection name for PaymentModel
          localField: 'appointmentPaymentId',
          foreignField: '_id',
          as: 'paymentData',
        },
      },
      {
        $unwind: "$paymentData"
      },
      {
        $lookup:{
          from: 'records',
          localField: 'appointmentPatientId',
          foreignField: 'recordPatientId',
          as: 'recordData'
        }
      },
      {
        $unwind: {
          path: "$recordData",
          preserveNullAndEmptyArrays: true
        }
      },   
      {
        $project: {
          appointmentData: {
            _id: '$_id',
            appointmentReasonForVisit: '$appointmentReasonForVisit',
            appointmentDate: '$appointmentDate',
            appointmentStatus: '$appointmentStatus',
            appointmentSerialId: '$appointmentSerialId',
          },
          credentialData: {
            credentialEmail: '$credentialData.credentialEmail',
            credentialPhoneNumber: '$credentialData.credentialPhoneNumber',
          },
          patientData: {
            _id: '$patientData._id',
            patientAvatar: '$patientData.patientAvatar',
            patientFullName: '$patientData.patientFullName',
            patientDateOfBirth: '$patientData.patientDateOfBirth',
            patientGender: '$patientData.patientGender',
            patientAddress: '$patientData.patientAddress',
            patientSerialId: '$patientData.patientSerialId',
            patientStatus: '$patientData.patientStatus',
          },
          dentistData: {
            _id: '$dentistData._id',
            dentistAddress: '$dentistData.dentistAddress',
            dentistAvatar: '$dentistData.dentistAvatar',
            dentistCosmeticServices: '$dentistData.dentistCosmeticServices',
            dentistEmail: '$dentistData.dentistEmail',
            dentistEmploymentType: '$dentistData.dentistEmploymentType',
            dentistFullName: '$dentistData.dentistFullName',
            dentistMedicalServices: '$dentistData.dentistMedicalServices',
            dentistPhoneNumber: '$dentistData.dentistPhoneNumber',
            dentistSpecialization: '$dentistData.dentistSpecialization',
            unAvailableDates: '$dentistData.unAvailableDates',
            startTime: '$dentistData.startTime',
            endTime: '$dentistData.endTime',
          },
          recordData: {
            recordBloodPressure: '$recordData.recordBloodPressure',
            recordSickness: '$recordData.recordSickness',
            recordAllergies: '$recordData.recordAllergies',
            recordOralData: '$recordData.recordOralData',
            recordHygieneData: '$recordData.recordHygieneData',
          },
          paymentData: {
            _id: '$paymentData._id',
            paymentStatus: '$paymentData.paymentStatus',
            paymentSerialId: '$paymentData.paymentSerialId',
          }
        },
      },
    ]);
    res.status(200).json(appointments)
  } catch (error) {
    res.status(500).send({message: "An error occurred while fetching appointments"});
  }
}

export const updateAppointmentSize = async (req: Request, res: Response) => {
  const { _id, appointmentTime} = req.body;

  try {
    const appointmentResult = await AppointmentModel.findByIdAndUpdate(
      _id, 
      {
        appointmentDate: {
          start: appointmentTime.start,
          end: appointmentTime.end,
        },
      },
      { new: true }
    );
    res.status(200).json(appointmentResult);
  } catch (error) { 
    res.status(500).send({message: "An error occurred while updating the appointment time"});
  }
}

export const updateAppointmentPosition = async (req: Request, res: Response) => {
  const { _id, appointmentTime, appointmentDentistId } = req.body;

  try {
    const appointmentResult = await AppointmentModel.findByIdAndUpdate(
      _id, 
      {
        appointmentDentistId: appointmentDentistId,
        appointmentDate: {
          start: appointmentTime.start,
          end: appointmentTime.end,
        },
      },
      { new: true }
    );
    res.status(200).json(appointmentResult);
  } catch (error) { 
    res.status(500).send({message: "An error occurred while updating the appointment position"});
  }
}


export const updateAppointmentCheckup = async (req: Request, res: Response) => {
  try {

    const { 
      checkupData,
      checkupPatientId, 
      checkupAppointmentId, 
      agreementDocuments  
    }
     = req.body


    const parsedCheckupData = JSON.parse(checkupData);
    const parsedToothCheckup = parsedCheckupData.toothCheckup ? JSON.parse(parsedCheckupData.toothCheckup) : undefined;
    const parsedSectionCheckup = parsedCheckupData.sectionCheckup ? JSON.parse(parsedCheckupData.sectionCheckup) : undefined;
    const parsedGeneralCheckup = parsedCheckupData.generalCheckup ? parsedCheckupData.generalCheckup : undefined;
    const parsedAgreementDocuments = JSON.parse(agreementDocuments) as { _id: string }[];
    const existingCheckups = await CheckupModel.find({ checkupAppointmentId: checkupAppointmentId }) as CheckupType[];
  

    const isUpsert = existingCheckups.length > 0;

    if (isUpsert) {
      // Checkups
      const checkupsToKeep = [...parsedToothCheckup, ...parsedSectionCheckup, ...parsedGeneralCheckup].map((checkup) => checkup._id);
      const checkupsToDelete = existingCheckups.filter((checkup) => !checkupsToKeep.includes(checkup._id));
      
      console.log(checkupsToKeep)
      console.log(checkupsToDelete)
      // Delete old documents
      await CheckupModel.deleteMany({ 
        checkupAppointmentId: checkupAppointmentId, 
        _id: { $in: checkupsToDelete.map((checkup) => checkup._id) } 
      });

      
      // Agreement Documents
      const documentsToKeep = parsedAgreementDocuments.map((document: any) => ObjectId.createFromHexString(document._id));
      const documentsToDelete = await DocumentModel.find({ documentAppoinmentId: checkupAppointmentId, _id: { $nin: documentsToKeep } }) as DocumentResponseType[]
      const formattedDocumentsToDelete = documentsToDelete.map((document: DocumentResponseType) => formatToDeleteDocument(document.documentUrl, document.documentResourceType));

      await DocumentModel.deleteMany({ 
        _id: { $nin: documentsToKeep },
        documentAppoinmentId: checkupAppointmentId
      });


      if (formattedDocumentsToDelete.length > 0){
        formattedDocumentsToDelete.map(async (document) => {
          await imageDeleter('agreements', document.publicId, document.resourceType)
        })
      }
    }

    const newAgreementDocuments = req.files as any[];
    const agreementDocumentResult = await Promise.all(
      newAgreementDocuments.map(async (document: any) => {
        const cloudinaryResponse = await FileUploader(
          document.buffer,
          document.mimetype,
          'agreements',
          uuidv4(),
        );
        console.log(cloudinaryResponse)
        return {
          documentName: document.originalname,
          documentUrl: cloudinaryResponse.secure_url,
          documentResourceType: cloudinaryResponse.resource_type,
        };
      })
    );

    await DocumentModel.insertMany(
      agreementDocumentResult.map((document) => ({
        documentAppoinmentId: checkupAppointmentId,
        documentName: document.documentName,
        documentUrl: document.documentUrl,
        documentResourceType: document.documentResourceType,
      }))
    );
    
    // End of Agreement Documents
    // Start of Checkups
  
    const toothCheckups = parsedToothCheckup.flatMap((checkup: any) => {
      return checkup.toothTreatmentPlans.map((plan: any) => {
        return {
          checkupPatientId: checkupPatientId,
          checkupAppointmentId: checkupAppointmentId,
          checkupTreatmentId: plan.toothTreatmentId,
          checkupToothNumber: checkup.toothNumber, 
          checkupCondition: plan.toothCondition,
          checkupStatus: plan.toothStatus,
          checkupType: "Tooth",
        };
      });
    });

    const sectionCheckups = parsedSectionCheckup.flatMap((checkup: any) => {
      return checkup.sectionTreatmentPlans.map((plan: any) => {
        return {
          checkupPatientId: checkupPatientId,
          checkupAppointmentId: checkupAppointmentId,
          checkupTreatmentId: plan.sectionTreatmentId,
          checkupSection: checkup.sectionName, 
          checkupCondition: plan.sectionCondition,
          checkupStatus: plan.sectionStatus,
          checkupType: "Section",
        };
      });
    });


    const generalCheckups = parsedGeneralCheckup.map((checkup: any) => {
      return {
        checkupPatientId: checkupPatientId,
        checkupAppointmentId: checkupAppointmentId,
        checkupTreatmentId: checkup.generalTreatmentId,
        checkupStatus: checkup.generalStatus,
        checkupNotes: checkup.generalNotes,
        checkupType: "General",
      };
    })

    const checkupResult = await CheckupModel.insertMany([
      ...toothCheckups, 
      ...sectionCheckups,
      ...generalCheckups,
    ]);



    res.status(200).send(checkupResult);
  } catch (error) {
    res.status(500).send(error);
  }
}

export const getAppointmentCheckup = async (req: Request, res: Response) => {
  try {
    
    const appointmentId = req.params.appointmentId;
    const DocumentResult = await DocumentModel.find({ documentAppoinmentId: appointmentId });
    const checkupResult = await CheckupModel.find({ checkupAppointmentId: appointmentId })
    .populate('checkupTreatmentId')
    .populate('checkupPatientId')
    .populate('checkupAppointmentId');

    const response = {
      agreementDocuments: DocumentResult,
      checkupData: checkupResult,
    }
    
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({message: error});
  }
}

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { appointmentId, appointmentStatus } = req.body;
    const appointmentResult = await AppointmentModel.findByIdAndUpdate(appointmentId, { appointmentStatus: appointmentStatus }, { new: true });
    res.status(200).json(appointmentResult);
  } catch (error) {
    res.status(500).send({message: error});
  }
}

export const getPatientMonthlyAppointments = async (req: Request, res: Response) => {
  const date = req.params.date;
  const patientId = req.params.id

  try {

    const startDate = new Date(date);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    endDate.setHours(23, 59, 59, 999);

    const appointments = await AppointmentModel.aggregate([
      {
        $match: {
          'appointmentDate.start': { $gte: new Date(startDate) },
          'appointmentDate.end': { $lte: new Date(endDate) },
          'appointmentPatientId': ObjectId.createFromHexString(patientId),
        },
      },
      {
        $lookup: {
          from: 'credentials',
          localField: 'appointmentPatientId',
          foreignField: 'credentialPatientId',
          as: 'credentialData',
        },
      },
      {
        $unwind: '$credentialData',
      },
      {
        $lookup: {
          from: 'patients', // the collection name for PatientModel
          localField: 'appointmentPatientId',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      {
        $unwind: '$patientData',
      },
      {
        $lookup: {
          from: 'dentists', // the collection name for DentistModel
          localField: 'appointmentDentistId',
          foreignField: '_id',
          as: 'dentistData',
        },
      },
      {
        $unwind: '$dentistData',
      },
      {
        $lookup: {
          from: 'payments', // the collection name for PaymentModel
          localField: 'appointmentPaymentId',
          foreignField: '_id',
          as: 'paymentData',
        },
      },
      {
        $unwind: "$paymentData"
      },
      {
        $lookup:{
          from: 'records',
          localField: 'appointmentPatientId',
          foreignField: 'recordPatientId',
          as: 'recordData'
        }
      },
      {
        $unwind: {
          path: "$recordData",
          preserveNullAndEmptyArrays: true
        }
      },   
      {
        $project: {
          appointmentData: {
            _id: '$_id',
            appointmentReasonForVisit: '$appointmentReasonForVisit',
            appointmentDate: '$appointmentDate',
            appointmentStatus: '$appointmentStatus',
            appointmentSerialId: '$appointmentSerialId',
          },
          credentialData: {
            credentialEmail: '$credentialData.credentialEmail',
            credentialPhoneNumber: '$credentialData.credentialPhoneNumber',
          },
          patientData: {
            _id: '$patientData._id',
            patientAvatar: '$patientData.patientAvatar',
            patientFullName: '$patientData.patientFullName',
            patientDateOfBirth: '$patientData.patientDateOfBirth',
            patientGender: '$patientData.patientGender',
            patientAddress: '$patientData.patientAddress',
            patientSerialId: '$patientData.patientSerialId',
            patientStatus: '$patientData.patientStatus',
          },
          dentistData: {
            _id: '$dentistData._id',
            dentistAddress: '$dentistData.dentistAddress',
            dentistAvatar: '$dentistData.dentistAvatar',
            dentistCosmeticServices: '$dentistData.dentistCosmeticServices',
            dentistEmail: '$dentistData.dentistEmail',
            dentistEmploymentType: '$dentistData.dentistEmploymentType',
            dentistFullName: '$dentistData.dentistFullName',
            dentistMedicalServices: '$dentistData.dentistMedicalServices',
            dentistPhoneNumber: '$dentistData.dentistPhoneNumber',
            dentistSpecialization: '$dentistData.dentistSpecialization',
            unAvailableDates: '$dentistData.unAvailableDates',
            startTime: '$dentistData.startTime',
            endTime: '$dentistData.endTime',
          },
          recordData: {
            recordBloodPressure: '$recordData.recordBloodPressure',
            recordSickness: '$recordData.recordSickness',
            recordAllergies: '$recordData.recordAllergies',
            recordOralData: '$recordData.recordOralData',
            recordHygieneData: '$recordData.recordHygieneData',
          },
          paymentData: {
            _id: '$paymentData._id',
            paymentStatus: '$paymentData.paymentStatus',
            paymentSerialId: '$paymentData.paymentSerialId',
          }
        },
      },
    ]);
    res.status(200).json(appointments)
  } catch (error) {
    res.status(500).send({message: error});
  }
}

export const getDentistMonthlyAppointments = async (req: Request, res: Response) => {

  const date = req.params.date;
  const dentistId = req.params.id

  const startDate = new Date(date);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);

  try {
    const appointments = await AppointmentModel.aggregate([
      {
        $match: {
          'appointmentDate.start': { $gte: new Date(startDate) },
          'appointmentDate.end': { $lte: new Date(endDate) },
          'appointmentDentistId': ObjectId.createFromHexString(dentistId),
        },
      },
      {
        $lookup: {
          from: 'credentials',
          localField: 'appointmentPatientId',
          foreignField: 'credentialPatientId',
          as: 'credentialData',
        },
      },
      {
        $unwind: '$credentialData',
      },
      {
        $lookup: {
          from: 'patients', // the collection name for PatientModel
          localField: 'appointmentPatientId',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      {
        $unwind: '$patientData',
      },
      {
        $lookup: {
          from: 'dentists', // the collection name for DentistModel
          localField: 'appointmentDentistId',
          foreignField: '_id',
          as: 'dentistData',
        },
      },
      {
        $unwind: '$dentistData',
      },
      {
        $lookup: {
          from: 'payments', // the collection name for PaymentModel
          localField: 'appointmentPaymentId',
          foreignField: '_id',
          as: 'paymentData',
        },
      },
      {
        $unwind: "$paymentData"
      },
      {
        $lookup:{
          from: 'records',
          localField: 'appointmentPatientId',
          foreignField: 'recordPatientId',
          as: 'recordData'
        }
      },
      {
        $unwind: {
          path: "$recordData",
          preserveNullAndEmptyArrays: true
        }
      },   
      {
        $project: {
          appointmentData: {
            _id: '$_id',
            appointmentReasonForVisit: '$appointmentReasonForVisit',
            appointmentDate: '$appointmentDate',
            appointmentStatus: '$appointmentStatus',
            appointmentSerialId: '$appointmentSerialId',
          },
          credentialData: {
            credentialEmail: '$credentialData.credentialEmail',
            credentialPhoneNumber: '$credentialData.credentialPhoneNumber',
          },
          patientData: {
            _id: '$patientData._id',
            patientAvatar: '$patientData.patientAvatar',
            patientFullName: '$patientData.patientFullName',
            patientDateOfBirth: '$patientData.patientDateOfBirth',
            patientGender: '$patientData.patientGender',
            patientAddress: '$patientData.patientAddress',
            patientSerialId: '$patientData.patientSerialId',
            patientStatus: '$patientData.patientStatus',
          },
          dentistData: {
            _id: '$dentistData._id',
            dentistAddress: '$dentistData.dentistAddress',
            dentistAvatar: '$dentistData.dentistAvatar',
            dentistCosmeticServices: '$dentistData.dentistCosmeticServices',
            dentistEmail: '$dentistData.dentistEmail',
            dentistEmploymentType: '$dentistData.dentistEmploymentType',
            dentistFullName: '$dentistData.dentistFullName',
            dentistMedicalServices: '$dentistData.dentistMedicalServices',
            dentistPhoneNumber: '$dentistData.dentistPhoneNumber',
            dentistSpecialization: '$dentistData.dentistSpecialization',
            unAvailableDates: '$dentistData.unAvailableDates',
            startTime: '$dentistData.startTime',
            endTime: '$dentistData.endTime',
          },
          recordData: {
            recordBloodPressure: '$recordData.recordBloodPressure',
            recordSickness: '$recordData.recordSickness',
            recordAllergies: '$recordData.recordAllergies',
            recordOralData: '$recordData.recordOralData',
            recordHygieneData: '$recordData.recordHygieneData',
          },
          paymentData: {
            _id: '$paymentData._id',
            paymentStatus: '$paymentData.paymentStatus',
            paymentSerialId: '$paymentData.paymentSerialId',
          }
        },
      },
    ]);
    res.status(200).json(appointments)
  } catch (error) {
    res.status(500).send({message: "An error occurred while fetching appointments"});
  }
}

