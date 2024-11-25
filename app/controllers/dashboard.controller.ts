import { Request, Response } from "express";
import ProductModel from "../schemas/mongo/products.schema";
import AppointmentModel from "../schemas/mongo/appointment.schema";
import PatientModel from "../schemas/mongo/patient.schema";
import PaymentModel from "../schemas/mongo/payment.schema";

const monthMap = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC"
]

export const getStocks = async (req: Request, res: Response) => {
  try {
    // Find the product with the lowest stock
    const products = await ProductModel.find().sort({ productQuantity: -1 })
    const lowestStock = await ProductModel.findOne().sort({ productQuantity: 1 });
    const inStockProducts = await ProductModel.countDocuments({ productQuantity: { $gt: 15 } });
    const lowStockProducts = await ProductModel.countDocuments({ productQuantity: { $gt: 0, $lte: 15 } });
    const outOfStockProducts = await ProductModel.countDocuments({ productQuantity: { $eq: 0 } });
    const totalProducts = await ProductModel.countDocuments();
    const totalValue = await ProductModel.aggregate([
      {
        $project: {
          totalCost: { $multiply: ["$productUnitPrice", "$productQuantity"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" }
        }
      }
    ]);

    const response = {
      products: products,
      lowStock: lowestStock,
      totalProducts: totalProducts,
      totalValue: totalValue[0].total,
      data: [
        {status: "In Stock", value: inStockProducts},
        {status: "Low Stock",  value: lowStockProducts},
        {status: "Out of Stock", value: outOfStockProducts},
      ]
    }

    res.status(200).json(response);

  } catch (error) {
    
  }
}

export const getAppointments = async (req: Request, res: Response) => {
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);

  try {
    // Initialize the filter object
    let dateFilter: { [key: string]: any } = {};
  

    if (year && month) {
      // Monthly filter if both year and month are provided
      const startOfMonth = new Date(year, month - 1, 1); // month is 0-indexed
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // Last moment of the month
      dateFilter["appointmentDate.start"] = { $gte: startOfMonth, $lt: endOfMonth };
    } else if (year) {
      // Yearly filter if only year is provided
      const startOfYear = new Date(year, 0, 1); // January 1st of the year
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the year
      dateFilter["appointmentDate.start"] = { $gte: startOfYear, $lt: endOfYear };
    }
  
    // Calculate appointment counts with the appropriate filters
    const totalAppointments = await AppointmentModel.countDocuments(dateFilter);

    const appointments = await AppointmentModel.find({
      ...dateFilter,
    })
    .populate("appointmentPatientId")
    .populate("appointmentDentistId")

  
    const finishedAppointments = await AppointmentModel.countDocuments({
      ...dateFilter,
      appointmentStatus: "Finished"
    });
  
    const cancelledAppointments = await AppointmentModel.countDocuments({
      ...dateFilter,
      appointmentStatus: "Cancelled"
    });
  
    const scheduledAppointments = await AppointmentModel.countDocuments({
      ...dateFilter,
      appointmentStatus: "Scheduled"
    });
  
    const confirmedAppointments = await AppointmentModel.countDocuments({
      ...dateFilter,
      appointmentStatus: "Confirmed"
    });
  

    const response = {
      appointments: appointments,
      totalAppointments: totalAppointments,
      data: [
        { name: "Finished", value: finishedAppointments },
        { name: "Cancelled", value: cancelledAppointments },
        { name: "Scheduled", value: scheduledAppointments },
        { name: "Confirmed", value: confirmedAppointments }
      ]
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getPatients = async (req: Request, res: Response) => {
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);

  try {
    let dateFilter: { [key: string]: any } = {};

    // Apply the date filter based on month and year
    if (year && month) {
      // Monthly filter if both year and month are provided
      const startOfMonth = new Date(year, month - 1, 1); // month is 0-indexed
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // Last moment of the month
      dateFilter["createdAt"] = { $gte: startOfMonth, $lt: endOfMonth };
    } else if (year) {
      // Yearly filter if only year is provided
      const startOfYear = new Date(year, 0, 1); // January 1st of the year
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the year
      dateFilter["createdAt"] = { $gte: startOfYear, $lt: endOfYear };
    }

    // Apply the dateFilter in the query
    const patients = await PatientModel.find(dateFilter);
    const totalPatients = await PatientModel.countDocuments(dateFilter);

    // Calculate new and old patients
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const newPatients = await PatientModel.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    const oldPatients = totalPatients - newPatients;

    // Prepare the response
    const response = {
      patients: patients,
      totalPatients: totalPatients,
      newPatients: {
        value: newPatients,
        percentage: (newPatients / totalPatients) * 100,
      },
      oldPatients: {
        value: oldPatients,
        percentage: (oldPatients / totalPatients) * 100,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getVisits = async (req: Request, res: Response) => {

  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);

  try {
    // Initialize the filter object
    let dateFilter: { [key: string]: any } = {};

    if (year && month) {
      // Monthly filter if both year and month are provided
      const startOfMonth = new Date(year, month - 1, 1); // month is 0-indexed
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // Last moment of the month
      dateFilter["appointmentDate.start"] = { $gte: startOfMonth, $lt: endOfMonth };
    } else if (year) {
      // Yearly filter if only year is provided
      const startOfYear = new Date(year, 0, 1); // January 1st of the year
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the year
      dateFilter["appointmentDate.start"] = { $gte: startOfYear, $lt: endOfYear };
    }

    // Get the appointments based on the filter
    const visits = await AppointmentModel.find({
      ...dateFilter,
    })
    .populate("appointmentPatientId")
    .populate("appointmentDentistId")



    // Initialize an empty array for month visit data
    const monthVisitData = monthMap.map(monthName => ({
      name: monthName,
      visit: 0
    }));

    // Aggregate the visits by month
    visits.forEach(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate.start);
      const appointmentMonth = appointmentDate.getMonth(); // Month is 0-indexed
      monthVisitData[appointmentMonth].visit += 1; // Increment visit count for the corresponding month
    });

    // Construct the response object
    const totalVisits = visits.length;  // Total number of visits (appointments)

    const response = {
      visits: visits,
      totalVisits: totalVisits,
      data: monthVisitData,  // Dynamically generated month visit data
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching the data.' });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);

  try {
    // Initialize the filter object
    let dateFilter: { [key: string]: any } = {};

    if (year && month) {
      // Monthly filter if both year and month are provided
      const startOfMonth = new Date(year, month - 1, 1); // month is 0-indexed
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // Last moment of the month
      dateFilter["createdAt"] = { $gte: startOfMonth, $lt: endOfMonth };
    } else if (year) {
      // Yearly filter if only year is provided
      const startOfYear = new Date(year, 0, 1); // January 1st of the year
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the year
      dateFilter["createdAt"] = { $gte: startOfYear, $lt: endOfYear };
    }

    // Get the payments based on the filter
    const payments = await PaymentModel.find({
      ...dateFilter,
      paymentStatus: { $in: ["paid", "partial"] },
    })
      .populate({
        path: "paymentAppointmentId",
        populate: {
          path: "appointmentPatientId",
          model: "patients", // Specify the model if needed
        }
      });
    
    const partialPayments = await PaymentModel.find({
      ...dateFilter,
      paymentStatus: "partial"
    })

    const paidPayments = await PaymentModel.find({
      ...dateFilter,
      paymentStatus: "paid"
    })

    // Initialize an empty array for month payment data
    const monthPaymentData = monthMap.map(monthName => ({
      name: monthName,
      paid: 0,
      partial: 0
    }));

    // Aggregate the payments by month
    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      const paymentMonth = paymentDate.getMonth(); // Month is 0-indexed
      if (payment.paymentStatus === "paid") {
        monthPaymentData[paymentMonth].paid += 1; // Increment completed payment count for the corresponding month
      } 

      if (payment.paymentStatus === "partial") {
        monthPaymentData[paymentMonth].partial += 1; // Increment partial payment count for the corresponding month
      }
    });

    const totalPayments = payments.length;

    // Construct the response object
    const response = {
      payments: payments,
      totalPayments: totalPayments,
      data: monthPaymentData, 
      partialPayments: partialPayments.length,
      paidPayments: paidPayments.length
    };


    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching the data.' });
  }
}
