import { Types } from "mongoose";


export type ComponentType = {
  _id: Types.ObjectId;
  componentProductId: string;
  componentName: string;
  componentFreeAmount?: number;
  componentAmount: number;
  isComponentFree: string;
};

export type MedicineType = {
  _id: Types.ObjectId;
  medicineProductId: string;
  medicineName: string;
  medicineAmount: number;
  medicineFreeAmount: number;
  isMedicineFree: string;
  prescriptionDosageAmount: number;
  prescriptionDosageType: string;
  prescriptionDuration: number;
  prescriptionTimeUnit: string;
  prescriptionTimeOfTheDay: string[];
  prescriptionIntakeSchedule: string[];
};


export type TreatmentRequestType = {
  _id: Types.ObjectId;
  treatmentName: string;
  treatmentCategory: string;
  treatmentType: string;
  treatmentDescription: string;
  treatmentCost: string;
  treatmentDuration: string;
  treatmentChargeType: string;
  treatmentComponents: ComponentType[];
  treatmentMedicines: MedicineType[];
};


export type MedicineResponseType = {
  medicinePrescription: string;
  medicineProductId: Types.ObjectId;
  medicineAmount: number;
  medicineFreeAmount?: number; 
  isMedicineFree: "free" | "freeUpTo";  
  prescriptionDosageAmount: number;
  prescriptionDosageType: string;
  prescriptionDuration: number;
  prescriptionTimeUnit: string;
  prescriptionTimeDuration: string;
  prescriptionRepeatition: string;
  prescriptionTimeOfTheDay: string[];
  prescriptionIntakeSchedule: string[];
  _id: Types.ObjectId;
  __v: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CheckupResponse = {
  _id: Types.ObjectId;
  checkupPatientId: Types.ObjectId;
  checkupAppointmentId: Types.ObjectId;
  checkupTreatmentId: TreatmentRequestType
  checkupType: string;
  checkupToothNumber: number;
  checkupSection: string;
  checkupCondition: string;
  checkupStatus: string;
}