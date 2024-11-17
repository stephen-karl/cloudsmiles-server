import { Request, Response } from "express"
import ReviewModel from "../schemas/mongo/reviews.schema"
import AppointmentModel from "../schemas/mongo/appointment.schema"
import CheckupModel from "../schemas/mongo/checkup.schema"

export const createReview = async (req: Request, res: Response) => {

  const { 
    reviewAppointmentId,
    reviewRating,
    reviewComment,
  } = req.body


  const appointment = await AppointmentModel.findById(reviewAppointmentId)

  if (!appointment) {
    return res.status(400).send("Appointment ID is required")
  }

  const reviewDentistId = appointment.appointmentDentistId
  const reviewPatientId = appointment.appointmentPatientId

  const checkup = await CheckupModel.find({ checkupAppointmentId: reviewAppointmentId })

  if (!checkup) {
    return res.status(400).send("Checkup ID is required")
  }

  const reviewTreatments = checkup.map((checkup) => checkup.checkupTreatmentId)

  try {
    const reviewResult = await ReviewModel.create({
      reviewAppointmentId,
      reviewTreatments,
      reviewRating,
      reviewComment,
      reviewPatientId,
      reviewDentistId,
    })
    res.status(201).send(reviewResult)
  } catch (error) {
    res.status(400).send(error)
  }
}