import { Request, Response } from "express";
import { imageUploader } from "../helpers/cloudinary/uploader";
import { getDay } from "app/utils/calendar.utils";
import { getStartAndEndOfDay, removeDateOffset } from "app/utils/date.utils";
import { imageDeleter } from "../helpers/cloudinary/deleter";
import { ISchedule } from "app/interfaces/schedules.types";
import { generateRandomPassword } from "app/utils/generators";
import { sendStaffWelcomeEmail } from '../helpers/resend/transporters'
import DentistModel from "../schemas/mongo/dentist.schema";
import ScheduleModel from "../schemas/mongo/schedule.schema";
import chainModel from "../schemas/mongo/chains.schema";
import AppointmentModel from "../schemas/mongo/appointment.schema";
import AssistantModel from "../schemas/mongo/assistant.schema";
import CredentialsModel from "../schemas/mongo/credential.schema";
import bcrypt from "bcrypt";

const saltRounds = 10;


export const createDentist = async (req: Request, res: Response) => {
  try {
    const { 
      dentistEmploymentType,
      dentistGender,
      dentistDateOfBirth,
      dentistFullName,
      dentistSpecialization,
      dentistPhoneNumber,
      dentistEmail,
      dentistAddress,
      dentistMedicalServices,
      dentistCosmeticServices,
      dentistSchedule,
      // dentistDaysOff,
    } = req.body



    const dentistResponse = await DentistModel.create({
      dentistEmploymentType,
      dentistGender,
      dentistDateOfBirth,
      dentistFullName,
      dentistSpecialization,
      dentistAddress,

      dentistMedicalServices: JSON.parse(dentistMedicalServices),
      dentistCosmeticServices: JSON.parse(dentistCosmeticServices),
    }) 

    

    const scheduleResponse = await ScheduleModel.create({
      dentistId: dentistResponse._id as string,
      schedules: JSON.parse(dentistSchedule)
    })

    if (req.file) {
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'dentists', 
        dentistResponse._id as string,
        300, 
        300
      );
      await DentistModel.findByIdAndUpdate(
        dentistResponse._id,
        {
          dentistAvatar: cloudinaryResponse.secure_url,
        },
        { new: true },
      );
    }


    const password = generateRandomPassword(16, {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
    })
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const credentialResult = await CredentialsModel.create({
      credentialProvider: "local",
      credentialEmail: dentistEmail,
      credentialPassword: hashedPassword,
      credentialPhoneNumber: dentistPhoneNumber,
      credentialRole: "dentist",
      credentialDentistId: dentistResponse._id,
    })

    const firstName = dentistFullName.split(" ")[0]

    await sendStaffWelcomeEmail(
      firstName,
      password,
      dentistEmail,
    )

    await DentistModel.findByIdAndUpdate(
      dentistResponse._id,
      {
        dentistScheduleId: scheduleResponse?._id as string,
        dentistCredentialId: credentialResult._id as string,
      },
      { new: true } 
    );


    res.status(200).json("Created");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const updateDentist = async (req: Request, res: Response) => {
  try {
    const { 
      dentistId,
      dentistEmploymentType,
      dentistGender,
      dentistDateOfBirth,
      dentistFullName,
      dentistSpecialization,
      dentistPhoneNumber,
      dentistEmail,
      dentistAddress,
      dentistMedicalServices,
      dentistCosmeticServices,
      dentistSchedule,
      // dentistDaysOff,
    } = req.body

    if (req.file) {
      await imageDeleter('dentists', dentistId as string);
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'dentists', 
        dentistId as string,
        300,
        300
      );
      await DentistModel.findByIdAndUpdate( dentistId,{ dentistAvatar: cloudinaryResponse.secure_url}, { new: true })
    }
    // Remove
    if (req.body.dentistAvatar === 'null') {
      await imageDeleter('dentists', dentistId as string);
      await DentistModel.findByIdAndUpdate(dentistId, { dentistAvatar: null }, { new: true });
    }


    await DentistModel.findByIdAndUpdate(
      dentistId,
      {
        dentistEmploymentType,
        dentistGender,
        dentistDateOfBirth,
        dentistFullName,
        dentistSpecialization,
        dentistPhoneNumber,
        dentistEmail,
        dentistAddress,
        dentistMedicalServices: JSON.parse(dentistMedicalServices),
        dentistCosmeticServices: JSON.parse(dentistCosmeticServices),
      },
      { new: true }
    ) 

  
    await ScheduleModel.findOneAndUpdate(
      {dentistId: dentistId},
      {
        schedules: JSON.parse(dentistSchedule)
      },
      { new: true }
    )

    res.status(200).json("GOODS")
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteDentist = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    await DentistModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true })
    res.status(200).json("Dentist Deleted")
  } catch (error) {
    res.status(500).json({ message: "Error deleting dentist" });
  }
}

// This is for staff page where the admin can view all the dentists in a data table.
export const getAllDentists = async (req: Request, res: Response) => {
  try {
    const dentistResponse = await DentistModel
    .find({ isDeleted: false })
    .populate('dentistScheduleId')
    .populate({
      path: 'dentistCredentialId',
      select: 'credentialEmail credentialPhoneNumber' // Only select email and phone number
    })
    .sort({ createdAt: -1 })

    res.status(200).json(dentistResponse)
  } catch (error) {
    res.status(500).json({ message: "Error fetching dentist" });
  }
}

// This is for the calendar page where the admin can view all the dentists in the header.
export const getDayDentists = async (req: Request, res: Response) => {
  const { date: dateString } = req.params
  // const date = isoDateConverter(dateString)
  const date = new Date(dateString)
  const day = getDay(date)

  try {
    const dentistResponse = await ScheduleModel.find({ 
      'schedules.day': day,
      dentistId: { $exists: true } // Ensures dentistId field exists
    })
    .populate('dentistId')

    if (!dentistResponse) {
      res.status(404).json({ message: "No dentist found" });
    }
    const formattedResponse = dentistResponse.map(item => {
      // const dentist = item.dentistId as IDen
      // if (item.dentistId.isDeleted) return null;
      const dentist = (item.dentistId as any ).toObject();
      return {
        ...dentist,
        startTime: item.schedules.find((schedule: ISchedule) => schedule.day === day)?.start,
        endTime: item.schedules.find((schedule: ISchedule) => schedule.day === day)?.end,
      };
    });
    res.status(200).json(formattedResponse)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error fetching dentist" });
  }
}

export const getWeekDentists = async (req: Request, res: Response) => {

  try {
    
    const dentistResponse = await ScheduleModel
    .find({
      dentistId: { $exists: true } 
    })
    .populate('dentistId')
    .exec();

    const response = dentistResponse.map((dentist) => {
      const dentistObject = (dentist.dentistId as any).toObject();
      return {
        ...dentistObject,
        dentistSchedule: dentist.schedules.map((schedule: ISchedule) => {
          return {
            day: schedule.day,
            start: schedule.start,
            end: schedule.end
          }
        })
      }
    })

    res.status(200).json(response)
  } catch (error) { 
    console.log(error)
    res.status(500).json(error);
  }
}

export const getMonthlyDentists = async (req: Request, res: Response) => {

  try {
    const dentistResponse = await ScheduleModel.find({
      dentistId: { $exists: true } 
    })
    .populate('dentistId')
    .exec();

    const response = dentistResponse.map((dentist) => {
      const dentistObject = (dentist.dentistId as any).toObject();
      return {
        ...dentistObject,
        dentistSchedule: dentist.schedules.map((schedule: ISchedule) => {
          return {
            day: schedule.day,
            start: schedule.start,
            end: schedule.end
          }
        })
      }
    })

    res.status(200).json(response)
  } catch (error) { 
    console.log(error)
    res.status(500).json(error);
  }
}

export const getScheduledDentists = async (req: Request, res: Response) => {
  const patientId = req.params.id
  const chainData = await chainModel.findOne({chainPatientId: patientId, chainIsActive: true})
  const chainId = chainData?._id as string  
  const chainResult = await chainModel.findById(chainId)
  const date = new Date(chainResult?.chainDataProgress?.date)
  const day = getDay(date)
  try {
    const dentistResponse = await ScheduleModel.find({ 
      'schedules.day': day,
      dentistId: { $exists: true } 
    }).populate('dentistId')
    res.status(200).json(dentistResponse)
  } catch (error) { 
    res.status(500).json({ message: "Error fetching dentist" });
  }
}

export const getDentistTimeAvailability = async (req: Request, res: Response) => {
  const patientId = req.params.id
  try {
    const chainData = await chainModel.findOne({chainPatientId: patientId, chainIsActive: true})
    const dentistId = chainData?.chainDataProgress?.dentist as string
    const schedule = await ScheduleModel.findOne({dentistId})
    const date = new Date(removeDateOffset(chainData?.chainDataProgress?.date))
    const day = getDay(date)
    const dentistSchedule = schedule?.schedules.find((schedule: ISchedule) => schedule.day === day)
    const { startOfDay, endOfDay } =getStartAndEndOfDay(chainData?.chainDataProgress?.date)

    console.log(startOfDay, endOfDay)

    const dentistAppointments = await AppointmentModel.aggregate([
      {
        $match: {
          appointmentDentistId: dentistId,
          'appointmentDate.start': { $gte: new Date(startOfDay) },
          'appointmentDate.end': { $lte: new Date(endOfDay) },
        },
      },
    ]);

    res.status(200).json({
      dentistSchedule: dentistSchedule,
      dentistAppointments:dentistAppointments
    })
    
  } catch (error) {
    console.log(error)
    res.status(500).json(error);
  }
}

export const getDentistDateAvailability = async (req: Request, res: Response) => {
  const patientId = req.params.id
  try {
    const chainData = await chainModel.findOne({chainPatientId: patientId, chainIsActive: true})
    const dentistId = chainData?.chainDataProgress?.dentist as string
    const schedule = await ScheduleModel.findOne({dentistId})

    res.status(200).json(schedule)
    
  } catch (error) {
    console.log(error)
    res.status(500).json(error);
  }
}


export const createAssistant = async (req: Request, res: Response) => {
  try {
    const { 
      assistantPhoneNumber,
      assistantEmail,
      
      
      assistantFullName,
      assistantRole,
      assistantAddress,
      assistantGender,
      assistantDateOfBirth,
      assistantEmploymentType,

      assistantSchedule,
      
    } = req.body

    const assistantResponse = await AssistantModel.create({
      assistantFullName,
      assistantRole,
      assistantAddress,
      assistantEmploymentType,
      assistantGender,
      assistantDateOfBirth,
    }) 

    
    const scheduleResponse = await ScheduleModel.create({
      assistantId: assistantResponse._id as string,
      schedules: JSON.parse(assistantSchedule)
    })


    if (req.file) {
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'assistants', 
        assistantResponse._id as string,
        300, 
        300
      );
      await AssistantModel.findByIdAndUpdate(
        assistantResponse._id,
        {
          assistantAvatar: cloudinaryResponse.secure_url,
        },
        { new: true } 
      );
    }


    const password = generateRandomPassword(16, {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
    });
    const hashedPassword = await bcrypt.hash(password, saltRounds)

  
    const credentialResult = await CredentialsModel.create({
      credentialProvider: "local",
      credentialEmail: assistantEmail,
      credentialPassword: hashedPassword,
      credentialPhoneNumber: assistantPhoneNumber,
      credentialRole: "assistant",
      credentialAssistantId: assistantResponse._id,
    })

    const firstName = assistantFullName.split(" ")[0]

    await sendStaffWelcomeEmail(
      firstName,
      password,
      assistantEmail,
    )

    await AssistantModel.findByIdAndUpdate(
      assistantResponse._id,
      {
        assistantScheduleId: scheduleResponse._id as string,
        assistantCredentialId: credentialResult._id as string
      },
      { new: true } 
    )

    res.status(200).json("Created");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const updateAssistant = async (req: Request, res: Response) => {
  try {
    const { 
      assistantId,
      assistantPhoneNumber,
      assistantEmail,
      
      assistantFullName,
      assistantRole,
      assistantAddress,
      assistantGender,
      assistantDateOfBirth,
      assistantEmploymentType,
      
      assistantSchedule 

    } = req.body

    if (req.file) {
      await imageDeleter('assistants', assistantId as string);
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'assistants', 
        assistantId as string,
        300,
        300
      );
      await AssistantModel.findByIdAndUpdate( assistantId,{ assistantAvatar: cloudinaryResponse.secure_url}, { new: true })
    }
    // Remove
    if (req.body.assistantAvatar === 'null') {
      await imageDeleter('assistants', assistantId as string);
      await AssistantModel.findByIdAndUpdate(assistantId, { assistantAvatar: null }, { new: true });
    }


    await AssistantModel.findByIdAndUpdate
      (
        assistantId, 
        {
          assistantFullName,
          assistantRole,
          assistantAddress,
          assistantEmploymentType,
          assistantGender,
          assistantDateOfBirth,
        }
      ,
      { new: true }) 

  
    await ScheduleModel.findOneAndUpdate(
      { assistantId: assistantId},
      {
        schedules: JSON.parse(assistantSchedule)
      },
      { new: true }
    )

    await CredentialsModel.findOneAndUpdate(
      { credentialAssistantId: assistantId},
      {
        credentialEmail: assistantEmail,
        credentialPhoneNumber: assistantPhoneNumber
      },
      { new: true }
    )

    res.status(200).json("GOODS")
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteAssistant = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    await AssistantModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true })
    res.status(200).json("Assistant Deleted")
  } catch (error) {
    res.status(500).json({ message: "Error deleting assistant" });
  }
}

export const getAllAssistants = async (req: Request, res: Response) => {
  try {
    const assistantResponse = await AssistantModel
    .find({ isDeleted: false })
    .populate('assistantScheduleId')
    .populate({
      path: 'assistantCredentialId',
      select: 'credentialEmail credentialPhoneNumber' // Only select email and phone number
    })
    .sort({ createdAt: -1 })

    res.status(200).json(assistantResponse)
  } catch (error) {
    res.status(500).json({ message: "Error fetching dentist" });
  }
}

export const getDentist = async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const dentistResponse = await DentistModel
    .findById(id)
    .populate('dentistScheduleId')

    res.status(200).json(dentistResponse)

  } catch (error) {
    res.status(500).json({ message: "Error fetching dentist" });
  }
}

export const getStaffCount = async (req: Request, res: Response) => {
  try {
    const dentistCount = await DentistModel.countDocuments({ isDeleted: false })
    const assistantCount = await AssistantModel.countDocuments({ isDeleted: false })
    res.status(200).json({ dentistCount, assistantCount })
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff count" });
  }
}