import { Request, Response } from "express";
import { imageUploader } from "../helpers/cloudinary/uploader";
import { generateTimeSlots, getDay } from "../utils/calendar.utils";
import { getStartAndEndOfDay } from "../utils/date.utils";
import { imageDeleter } from "../helpers/cloudinary/deleter";
import { ISchedule } from "../interfaces/schedules.types";
import { generateRandomPassword } from "../utils/generators";
import { sendStaffWelcomeEmail } from '../helpers/resend/transporters'
import DentistModel from "../schemas/mongo/dentist.schema";
import ScheduleModel from "../schemas/mongo/schedule.schema";
import chainModel from "../schemas/mongo/chains.schema";
import AppointmentModel from "../schemas/mongo/appointment.schema";
import AssistantModel from "../schemas/mongo/assistant.schema";
import CredentialsModel from "../schemas/mongo/credential.schema";
import bcrypt from "bcrypt";
import moment from 'moment';

const saltRounds = 10;
const closingTime = 19
const openingTime = 9

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
  const date = new Date(dateString); // Assuming TZDate is a valid custom class
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = daysOfWeek[date.getDay()];
  console.log(day);

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
    if (!chainData) {
      return res.status(404).json({ message: "No chain data found" });
    }

    const date = moment(chainData.chainDataProgress.date)


    const dentistId = chainData.chainDataProgress.dentist as string
    if (!dentistId) {
      return res.status(404).json({ message: "No dentist found"});
    }

      
    const scheduleResult = await ScheduleModel.findOne({
      dentistId: dentistId
    })

    if (!scheduleResult) {
      return res.status(404).json({ message: "No schedule found"});
    }


    const appointments = await AppointmentModel.find({
      appointmentDentistId: dentistId
    })


    const closingDate = moment(date).set('hour', closingTime).set('minute', 0).set('second', 0).set('millisecond', 0)
    const openingDate = moment(date).set('hour', openingTime).set('minute', 0).set('second', 0).set('millisecond', 0)

    const allTimeSlots = generateTimeSlots(openingDate, closingDate)

    const lunchDate = moment(date).set('hour', 13).set('minute', 0).set('second', 0).set('millisecond', 0)
    const lunchEnd = moment(date).set('hour', 14).set('minute', 0).set('second', 0).set('millisecond', 0)
    
    const lunchTimeSlots = generateTimeSlots(lunchDate, lunchEnd)

    const schedule = scheduleResult.schedules.find((schedule: ISchedule) => schedule.day === date.format('dddd')) as ISchedule;


    const scheduleStart = moment(schedule.start, 'HH:mm')
      .set('year', date.year())      // Set the current year
      .set('month', date.month())    // Set the current month
      .set('date', date.date());     // Set the current date

    const scheduleEnd = moment(schedule.end, 'HH:mm')
      .set('year', date.year())      // Set the current year
      .set('month', date.month())    // Set the current month
      .set('date', date.date());     // Set the current date

    const scheduleTimeSlots = generateTimeSlots(scheduleStart, scheduleEnd);

    const filteredScheduleTimeSlots = allTimeSlots.filter((timeSlot) => {
      return !scheduleTimeSlots.some((scheduleTimeSlot) => scheduleTimeSlot.time === timeSlot.time);
    })



    const appointmentsOnDay = appointments.filter((appointment) => {
      const appointmentStartDate = moment.utc(appointment.appointmentDate.start); 
      return (
        appointmentStartDate.date() === date.date() &&
        appointmentStartDate.month() === date.month()
      );
    });

    const appointmentTimeSlots = appointmentsOnDay.map((appointment) => {
      const start = moment(appointment.appointmentDate.start)
      start.subtract(8, 'hours')
      const end = moment(appointment.appointmentDate.end)
      end.subtract(8, 'hours')
      return generateTimeSlots(start, end);
    })
    const allUnavailableTimeSlots = [
      ...lunchTimeSlots, 
      ...filteredScheduleTimeSlots.flat(),  // Flatten to ensure no nested arrays
      ...appointmentTimeSlots.flat()        // Flatten to ensure no nested arrays
    ];


    const timeSlots = allTimeSlots.filter((timeSlot) => {
      return !allUnavailableTimeSlots.some((unavailableTimeSlot) => unavailableTimeSlot.time === timeSlot.time);
    })
    


    res.status(200).json({  
      timeSlots,
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

    if (!chainData) {
      return res.status(404).json({ message: "No chain data found" });
    }


    const dentistId = chainData.chainDataProgress.dentist as string

    if (!dentistId) {
      return res.status(404).json({ message: "No dentist found"});
    }

    const scheduleResult = await ScheduleModel.findOne({dentistId})

    if (!scheduleResult) {
      return res.status(404).json({ message: "No schedule found"});
    }

    const appointments = await AppointmentModel.find({
      appointmentDentistId: dentistId
    })

    const date = moment(); // Get the current date as a moment object
    const year = date.year();
    const month = date.month(); // Current month (0-based)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Calculate the number of days in the current month
    const daysInMonth = date.daysInMonth();
    
    const appointmentSlots = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = moment().year(year).month(month).date(day).startOf('day'); // Set the date to midnight
      
      return {
        day,
        date, // This is a moment object set to 00:00:00.000
      };
    });



    const availability = appointmentSlots.map((slot) => {

      const schedule = scheduleResult.schedules.find((schedule: ISchedule) => schedule.day === days[slot.date.day()]) as ISchedule;

      if (!schedule) {
        return {
          ...slot,
          timeslots: [],
        };
      }



      const scheduleStart = moment(schedule.start, 'HH:mm')
        .set('year', date.year())      // Set the current year
        .set('month', date.month())    // Set the current month
        .set('date', date.date());     // Set the current date
  
      const scheduleEnd = moment(schedule.end, 'HH:mm')
        .set('year', date.year())      // Set the current year
        .set('month', date.month())    // Set the current month
        .set('date', date.date());     // Set the current date
  
      const scheduleTimeSlots = generateTimeSlots(scheduleStart, scheduleEnd);


      const appointmentsOnDay = appointments.filter((appointment) => {
        const appointmentStartDate = moment(appointment.appointmentDate.start);
        return (
          appointmentStartDate.date() === slot.day &&
          appointmentStartDate.month() === moment().month()
        );
      });
    
      // Generate time slots for each appointment
      const appointmentTimeSlots = appointmentsOnDay.map((appointment) => {
        // Assuming start and end are predefined or can be extracted from the appointment
        const start = moment(appointment.appointmentDate.start)
        start.subtract(8, 'hours')
        const end = moment(appointment.appointmentDate.end)
        end.subtract(8, 'hours')
        return generateTimeSlots(start, end);
      });


      
      const lunchTimeSlotCount = 4 
      const totalTimeSlots = (closingTime - openingTime) * 4;
      const appointmentTimeSlotCount = appointmentTimeSlots.flat().length;
      const scheduleTimeSlotCount = totalTimeSlots - scheduleTimeSlots.length
      const finalTimeSlots = appointmentTimeSlotCount + lunchTimeSlotCount + scheduleTimeSlotCount

      const isAlmostFull = finalTimeSlots >= (totalTimeSlots - 4);
      const isFull = finalTimeSlots >= totalTimeSlots;
    



      return {
        ...slot,
        isAlmostFull,
        isFull
      };
    });
    
    


    res.status(200).json({
      schedule: scheduleResult.schedules,
      availability,
    })
    
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
