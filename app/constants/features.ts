import chainModel from "../schemas/mongo/chains.schema";
import { appointmentAgent } from "../helpers/cohere/agents";
import { addMinutesToTime, combineDateAndTime } from "../utils/date.utils";
import AppointmentModel from "../schemas/mongo/appointment.schema";
import PaymentModel from "../schemas/mongo/payment.schema";
// Define IFeatureFunction as a function type interface
interface IFeatureFunction {
  (message: string, patientId: string, chainData: any): Promise<any>;
}



export const createAppointment: IFeatureFunction = async (message, patientId, chainData) => {


  if (!chainData) {
    await chainModel.create({
      chainPatientId: patientId,
      chainFeatureName: "createAppointment",
      chainIsActive: true,
      chainDataProgress: {
        previousDentist: "",
        time: "",
        date: "",
        dentist: "",
        notes: "",
        reason: "",
      }
    })
  }

  const newData = await appointmentAgent(message);

  // let newData;

  // switch (true) {
  //   case !chainData?.chainDataProgress?.time:
  //     newData = await appointmentAgent(message);
  //     break;
  //   case !chainData?.chainDataProgress?.reason:
  //     newData = await appointmentAgent(message);
  //     break;
  //   case !chainData?.chainDataProgress?.dentist:
  //     newData = await appointmentAgent(message);
  //     break;
  //   case !chainData?.chainDataProgress?.date:
  //     newData = await appointmentAgent(message);
  //     break;
  //   default:
  //     newData = await appointmentAgent(message);
  //     break;
  // }
  
  const oldData =  {
    previousDentist: chainData ? chainData.chainDataProgress.previousDentist : "",
    time: chainData ? chainData.chainDataProgress.time : "",
    date: chainData ? chainData.chainDataProgress.date : "",
    dentist: chainData ? chainData.chainDataProgress.dentist : "",
    notes: chainData ? chainData.chainDataProgress.notes : "",
    reason: chainData ? chainData.chainDataProgress.reason: "",  
  }


  const appointmentData = {
    previousDentist: oldData.previousDentist,
    reason: newData.reason ? newData.reason : oldData.reason,
    time: oldData.time ,
    date:  oldData.date,
    dentist:  oldData.dentist,
    notes: oldData.notes,
  }


  if (chainData){
    await chainModel.updateOne({_id: chainData._id}, {chainDataProgress: appointmentData})
  }

  let response = {
    text: "",
    component: "",
    chainId: chainData ? chainData._id : "",
    data: {},
  }


  const previousAppointmentResult = await AppointmentModel.find({
    appointmentPatientId: patientId,
    appointmentStatus: "Finished"
  })
  .sort({ appointmentDate: -1 })
  .limit(1)|| []


  if (appointmentData.time === '' && appointmentData.date === '' && appointmentData.dentist  === '' && appointmentData.reason === '') {
    response.text = "Before I can create an appointment, Can you please provide your reason for visit?."
    return response;
  }


  if (appointmentData.reason === '' || !appointmentData.reason) {
    response.text = "Before I can create an appointment, Can you please provide your reason for visit?."
    return response;
  }
  

  if (Array.isArray(previousAppointmentResult) && previousAppointmentResult.length > 0 && appointmentData.previousDentist === '') {
    response.text = "Do you want to book another appointment with your previous dentist?";
    response.component = "previousDentist"
    return response;
  }


  // if he said no then skip date and time it will be handled by the assistant
  if (appointmentData.dentist === '') {
    response.text = "Before I can create an appointment, Do you have any preferred dentists?"
    response.component = "dentists"
    return response;
  }

  if (appointmentData.date === '') {
    response.text = "Before I can create an appointment, Can you please provide me the date of your visit? "
    response.component = "date"
    return response;
  }


  if (appointmentData.time === '') {
    response.text = "Before I create an appointment, Can you please provide me the exact time of your visit?"
    response.component = "time"
    return response;
  }

  // if (appointmentData.time) is past time return error
  // if (appointmentData.time) is taken by the people around the world return error
  // if (appointmentData.time) is before 9am or after 5pm return error

  console.log("1")

  await chainModel.updateOne({_id: chainData._id}, {chainIsActive: false})

  // Sequence 3 - Store the SUPER DUPER CLEANED DATA in the database
  response.text = "Your appointment has been successfully scheduled. Please arrive on time to avoid losing your slot."
  response.component = "appointmentCreated"
  console.log("2")

  const endTime = addMinutesToTime(appointmentData.time, 15)
  const startDate = combineDateAndTime(appointmentData.date, appointmentData.time)
  const endDate = combineDateAndTime(appointmentData.date, endTime)
  
  console.log("3")


  const appointmentResult = await AppointmentModel.create({
    appointmentPatientId: patientId,
    appointmentDentistId: appointmentData.dentist,
    appointmentReasonForVisit: appointmentData.reason,
    appointmentDate: {
      start: startDate,
      end: endDate
    },
    appointmentStatus: "Scheduled",
  })

  const paymentResult = await PaymentModel.create({
    paymentAppointmentId: appointmentResult._id,
  });

  console.log("4")


  await AppointmentModel.findByIdAndUpdate(appointmentResult._id, {
    appointmentPaymentId: paymentResult._id,
  }, { new: true });

  return response
};

// Implement cancelAppointment according to the IFeatureFunction interface
export const cancelAppointment: IFeatureFunction = async (message, userId) => {
  // Implementation details...
};

// export const getDentistSchedule: IFeatureFunction = async (message, userId, chainData, isGuest,) => {
//    if (isGuest) {

//     let scheduleData = {
//       dentist: chainData ? chainData.chainDataProgress.dentist : "",
//       date: chainData ? chainData.chainDataProgress.date : "",
//       time: chainData ? chainData.chainDataProgress.time : "",
//     }

//     let response = {
//       text: "",
//       component: "",
//       chainData: scheduleData,
//       isMessageChained: true,
//     }

//     if (scheduleData.dentist === '') {
//       response.text = "Before I can check an schedule, Please select the dentist?"
//       response.component = "dentists"
//       return response;
//     }
  
//     if (scheduleData.date === '') {
//       response.text = "Before I can create an schedule, Please select the date ? "
//       response.component = "date"
//       return response;
//     }

//     response.isMessageChained = false
//     response.text = "Before I create an appointment, Can you please provide me the exact time of your visit?"
//     response.component = "time"
    
//     return response

    
//    }
// };

// Export all features as an object with an index signature
export const features: { [key: string]: IFeatureFunction } = {
  createAppointment,
  cancelAppointment,
  // getDentistSchedule,
};