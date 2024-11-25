import QRCode from 'qrcode';
import { Request, Response } from 'express';
import { 
  attachPaymentIntent, 
  createPaymentIntent, 
  getPaymentIntent
} from '../helpers/paymongo/payment.intent';
import { ComponentType } from '../interfaces/treatment.types';
import { createPaymentMethod } from '../helpers/paymongo/payment.method';
import AppointmentModel from '../schemas/mongo/appointment.schema';
import PaymentModel from '../schemas/mongo/payment.schema';
import BillModel from '../schemas/mongo/bill.schema';
import CheckupModel from '../schemas/mongo/checkup.schema';
import TreatmentModel from '../schemas/mongo/treatment.schema';
import ProductModel from '../schemas/mongo/products.schema';


const decrementSupplies = async (appointmentId: string) => {

  try {
    const paymentResult = await CheckupModel.find({
      checkupAppointmentId: appointmentId,
    })
    const treatmentIds = paymentResult.map((checkup) => checkup.checkupTreatmentId)

    treatmentIds.forEach( async (treatmentId) => {
      const componentResult = await TreatmentModel.aggregate([
        {
          $match: { _id: { $in: treatmentIds } }
        },
        {
          $unwind: "$treatmentComponents" // Flatten the treatmentComponents array
        },
        {
          $lookup: {
            from: "components", // Replace with your actual components collection name
            localField: "treatmentComponents.componentId",
            foreignField: "_id",
            as: "componentData"
          }
        },
        {
          $unwind: "$componentData" // Flatten componentDetails array
        },
        {
          $project: {
            componentAmount: "$componentData.componentAmount",
            componentProductId: "$componentData.componentProductId"
          }
        }
      ]);
  
      const medicineResult = await TreatmentModel.aggregate([
        {
          $match: { _id: { $in: treatmentIds } }
        },
        {
          $unwind: "$treatmentMedicines" // Flatten the treatmentMedicines array
        },
        {
          $lookup: {
            from: "medicines", // Replace with your actual medicines collection name
            localField: "treatmentMedicines.medicineId",
            foreignField: "_id",
            as: "medicineData"
          }
        },
        {
          $unwind: "$medicineData" // Flatten medicineDetails array
        },
        {
          $project: {
            medicineAmount: "$medicineData.medicineAmount",
            medicineProductId: "$medicineData.medicineProductId"
          }
        }
      ])
  
      for (const component of componentResult) {
        try {
          await ProductModel.findOneAndUpdate(
            { _id: component.componentProductId },
            { $inc: { productQuantity: -component.componentAmount } },
            { new: true }
          );
        } catch (error) {
          console.error(`Failed to update component product ID ${component.componentProductId}:`, error);
        }
      }
  
      for (const medicine of medicineResult) {
        try {
          await ProductModel.findOneAndUpdate(
            { _id: medicine.medicineProductId },
            { $inc: { productQuantity: -medicine.medicineAmount } },
            { new: true }
          );
        } catch (error) {
          console.error(`Failed to update medicine product ID ${medicine.medicineProductId}:`, error);
        }
      }
    })

    console.log("Successfully decremented supplies");
  } catch (error) {
    console.error("Failed to decrement supplies:", error);
    throw error;
  }
}

export const createBill = async (req: Request, res: Response) => {
  const { 
    appointmentId, 
    paymentAmount, 
    paymentMethod, 
    paymentNotes, 
    paymentTotalCost,
    paymentType,
    paymentDueDate,
  } = req.body;

  const formattedAmount = `${paymentAmount}00`
  const parsedAmount = parseInt(formattedAmount, 10);

  
  if (isNaN(parsedAmount)) {
    return res.status(400).json({ message: "Amount must be a valid integer" });
  }
  console.log(parsedAmount)
  console.log(req.body.paymentMethod)

  try {
    // Create Payment Intent
    const paymentIntentId = await createPaymentIntent(parsedAmount)
    const paymentMethodId = await createPaymentMethod(paymentMethod)
    const redirectUrl = await attachPaymentIntent(paymentIntentId, paymentMethodId)
    const appointmentResult = await AppointmentModel.findById(appointmentId)

    if (!appointmentResult) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await BillModel.create({
      billAppointmentId: appointmentId,
      billMethod: paymentMethod,
      billType: paymentType,
      billAmount: parsedAmount * .01,
      billNotes: paymentNotes,
      billTotalCost: paymentTotalCost,
      billRedirectUrl: redirectUrl,
      billIntentId: paymentIntentId,
      billDueDate: paymentDueDate,
    })

    res.status(200).send("Success");
  } catch (error) {
    res.status(500).json(error);
  }
}
export const cancelBill = async (req: Request, res: Response) => {
  const appointmentId = req.params.id;
  const billMethod = req.query.method as string;

  try {
    const billResult = await BillModel.findOne({
      billAppointmentId: appointmentId,
      billMethod: billMethod,
      billStatus: 'pending',
    })

    if (!billResult) {
      return res.status(404).json({ message: "Bill not found" });
    }

    await BillModel.findOneAndUpdate(
      {
        billAppointmentId: appointmentId,
        billMethod: billMethod,
        billStatus: 'pending',
      },
      { billStatus: 'cancelled' },
      { new: true }
    )

    res.status(200).json("Bill cancelled");
  } catch (error) {
    res.status(500).json({ message: "Failed cancelling bill" });
  }
}
export const getBills = async (req: Request, res: Response) => {
  const appointmentId = req.params.id;

  try {
    const billResult = await BillModel.find({
      billAppointmentId: appointmentId,
    }).select('-billIntentId')
    res.status(200).json(billResult);
  } catch (error) {
    res.status(500).json({ message: "Failed retrieving bill" });
  }
}
export const checkBillStatus = async (req: Request, res: Response) => {
  const appointmentId  = req.params.id
  const billMethod = req.query.method as string
  try {
    const appointmentResult = await AppointmentModel.findById(appointmentId)
    if (!appointmentResult) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    const billResult = await BillModel.findOne({
      billAppointmentId: appointmentResult._id,
      billMethod: billMethod,
      billStatus: 'pending',
    })

    if (!billResult) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    const billIntentId = billResult.billIntentId

    const billIntentStatus = await getPaymentIntent(billIntentId)


    switch (billIntentStatus) {
      case 'succeeded':

        await AppointmentModel.findByIdAndUpdate(
          appointmentId,
          {
            appointmentStatus: 'Finished',
          },
          { new: true }
        )

        const billResult = await BillModel.findOneAndUpdate(
          {
            billAppointmentId: appointmentId,
            billMethod: billMethod,
            billStatus: 'pending',
          },
          { billStatus: 'success' },
          { new: true } // This option returns the modified document
        );

        if (!billResult) {
          return res.status(404).json({ message: "Bill not found" });
        }

        const isFullyPaid = billResult.billAmount >= billResult.billTotalCost
        const paymentStatus = isFullyPaid ? 'paid' : 'partial' 
        
        await PaymentModel.findOneAndUpdate(
          {
            paymentAppointmentId: appointmentId,
            paymentStatus: 'notPaid',
            isLastPayment: true,
          },
          {
            paymentAmount: billResult.billAmount,
            paymentMethod: billResult.billMethod,
            paymentNotes: billResult.billNotes,
            paymentTotalCost: billResult.billTotalCost,
            paymentType: billResult.billType,
            paymentDueDate: billResult.billDueDate,
            paymentStatus: paymentStatus,
          },
          { new: true }
        )
        
        await decrementSupplies(appointmentId);
    
        res.status(200).json({ status: billIntentStatus });
        break;
      case 'awaiting_next_action' :
        res.status(202).json({ status: billIntentStatus, message: "Payment requires further action" });
        break;
      default:
        res.status(400).json({ status: billIntentStatus, message: "Unknown payment status" });
        break;
    }
  } catch (error) {
    res.status(500).json({message: "Failed retrieving payment status"})
  }
}
export const getQRCode = async (req: Request, res: Response) => {
  const appointmentId = req.params.id;
  const billMethod = req.query.method as string;
  try {
    const billResult = await BillModel.findOne({
      billAppointmentId: appointmentId,
      billMethod: billMethod,
      billStatus: 'pending',
    })

    if (!billResult) {
      return res.status(204).json(null);
    }

    const redirectUrl = billResult.billRedirectUrl;
    
    const qrCodeImage = await QRCode.toBuffer(redirectUrl, { type: 'png' });
    const qrCodeBase64 = qrCodeImage.toString('base64');
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(qrCodeBase64);
  } catch (error) {
    res.status(500).json({message: "Failed retrieving QR code"})
  }
}
export const payWithCash = async (req: Request, res: Response) => {
  const { 
    appointmentId, 
    paymentAmount, 
    paymentMethod, 
    paymentNotes, 
    paymentTotalCost,
    paymentType,
    paymentDueDate
  } = req.body;

  try {
    console.log(0)

    const appointmentResult = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        appointmentStatus: 'Finished',
      },
      { new: true }
    )

    console.log(1)
    console.log(appointmentResult)

    if (!appointmentResult) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    console.log(2)

    const paymentId = appointmentResult.appointmentPaymentId;
    console.log(3)

    const paymentStatus = paymentAmount >= paymentTotalCost ? 'paid' : 'partial';

    const paymentResult = await PaymentModel.findOneAndUpdate(
      paymentId,
      {
        paymentAmount,
        paymentMethod,
        paymentNotes,
        paymentTotalCost,
        paymentType,
        paymentStatus,
        paymentDueDate,
        paymentIntentId: null,
      },
      { new: true }
    )
    console.log(4)
    await decrementSupplies(appointmentId);
    res.status(200).json("Payment successful");

  } catch (error) {
    res.status(500).json(error);
  }
  // TODO: For now sa client muna manggagaling yung total dahil no time na defense na kasub
}
export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.find({
      isLastPayment: true,
    })
      .populate({
        path: 'paymentAppointmentId',
        populate: [
          { path: 'appointmentDentistId', model: 'dentists' },
          { path: 'appointmentPatientId', model: 'patients' },
          { path: 'appointmentPaymentId', model: 'payments' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

      // Fetch payment history for each payment
      for (const payment of payments) {
        const paymentHistory = await PaymentModel.find({
          paymentAppointmentId: payment.paymentAppointmentId,
          isLastPayment: false,
        }).sort({ createdAt: -1 });
          payment.paymentHistory = paymentHistory;
      }
  
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json(error);
  }
}
export const getPaymentCount = async (req: Request, res: Response) => {
  try {
    const paymentCount = await PaymentModel.countDocuments();
    res.status(200).json(paymentCount);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
export const partiallyPayWithCash = async (req: Request, res: Response) => {
  const { 
    appointmentId, 
    paymentAmount, 
    paymentMethod, 
    paymentNotes, 
    paymentTotalCost,
    paymentStatus,
    paymentType,
  } = req.body;

  try {

    const oldPaymentResult = await PaymentModel.findOne(
      {
        paymentAppointmentId: appointmentId,
        isLastPayment: true,
      },
    )

    if (!oldPaymentResult) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Our goal is to save the old payment as a history and create a new payment document 
     await PaymentModel.create({
      paymentAppointmentId: appointmentId,
      paymentAmount: oldPaymentResult.paymentAmount,
      paymentMethod: oldPaymentResult.paymentMethod,
      paymentNotes: oldPaymentResult.paymentNotes,
      paymentTotalCost: oldPaymentResult.paymentTotalCost,
      paymentType: oldPaymentResult.paymentType,
      paymentStatus: oldPaymentResult.paymentStatus,
      isLastPayment: false,
    })

    // Update the old payment to reflect the new payment
    await PaymentModel.findByIdAndUpdate(
       oldPaymentResult._id,
      {
        paymentAppointmentId: appointmentId,
        paymentAmount,
        paymentMethod,
        paymentNotes,
        paymentTotalCost,
        paymentType,
        paymentStatus,
        isLastPayment: true,
      },

    )

    console.log(4)
    res.status(200).json("Payment successful");

  } catch (error) {
    res.status(500).json(error);
  }
}
export const partiallyCheckBillStatus = async (req: Request, res: Response) => {
  const appointmentId  = req.params.id
  const billMethod = req.query.method as string
  try {
    const appointmentResult = await AppointmentModel.findById(appointmentId)
    if (!appointmentResult) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    const billResult = await BillModel.findOne({
      billAppointmentId: appointmentResult._id,
      billMethod: billMethod,
      billStatus: 'pending',
    })

    if (!billResult) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    const billIntentId = billResult.billIntentId

    const billIntentStatus = await getPaymentIntent(billIntentId)


    switch (billIntentStatus) {
      case 'succeeded':
        await BillModel.findOneAndUpdate(
          {
            billAppointmentId: appointmentId,
            billMethod: billMethod,
            billStatus: 'pending',
          },
          { billStatus: 'success' },
          { new: true } // This option returns the modified document
        );
        
        const oldPaymentResult = await PaymentModel.findOne(
          {
            paymentAppointmentId: appointmentId,
            isLastPayment: true,
          },
        )
    
        if (!oldPaymentResult) {
          return res.status(404).json({ message: "Payment not found" });
        }


        await PaymentModel.create({
          paymentAppointmentId: appointmentId,
          paymentAmount: oldPaymentResult.paymentAmount,
          paymentMethod: oldPaymentResult.paymentMethod,
          paymentNotes: oldPaymentResult.paymentNotes,
          paymentTotalCost: oldPaymentResult.paymentTotalCost,
          paymentType: oldPaymentResult.paymentType,
          paymentStatus: oldPaymentResult.paymentStatus,
          isLastPayment: false,
        })
    
        const payments = await PaymentModel.find({
          paymentAppointmentId: appointmentId,
          isLastPayment: false,
        })

        const totalPaid = payments.reduce((acc, payment) => acc + payment.paymentAmount, 0) 
        const isFullyPaid = totalPaid + billResult.billAmount >= billResult.billTotalCost 
        const paymentStatus = isFullyPaid ? 'paid' : 'partial'     

        console.log(payments)
        console.log(totalPaid)
        
        
        await PaymentModel.findByIdAndUpdate(
          oldPaymentResult._id,
          {
            paymentAppointmentId: appointmentId,
            paymentAmount: billResult.billAmount,
            paymentMethod: billResult.billMethod,
            paymentNotes: billResult.billNotes,
            paymentTotalCost: billResult.billTotalCost,
            paymentType: billResult.billType,
            paymentStatus: paymentStatus,
            isLastPayment: true,
          },
          {
            new: true,
          }
        )

        res.status(200).json({ status: billIntentStatus });
        break;
      case 'awaiting_next_action' :
        res.status(202).json({ status: billIntentStatus, message: "Payment requires further action" });
        break;
      default:
        res.status(400).json({ status: billIntentStatus, message: "Unknown payment status" });
        break;
    }
  } catch (error) {
    res.status(500).json({message: "Failed retrieving payment status"})
  }
}
