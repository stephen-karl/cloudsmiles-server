import { Request, Response } from 'express';
import { IComponentRequest } from '../interfaces/component.types';
import { CheckupResponse, ComponentType, MedicineResponseType, MedicineType, TreatmentRequestType } from '../interfaces/treatment.types';
import ProductModel, { ProductType } from "../schemas/mongo/products.schema";
import MedicineModel from '../schemas/mongo/medicine.schema';
import ComponentModel from "../schemas/mongo/component.schema";
import TreatmentModel from '../schemas/mongo/treatment.schema';
import CheckupModel from '../schemas/mongo/checkup.schema';


export const getAvailableComponents = async (req: Request, res: Response) => {
  try {
    const componentsResult = await ProductModel.find({
      productCategory: "Component",
    })

    const components = componentsResult.map(product => ({
      id: product._id,
      name: product.productName + " - ₱" + (product.productUnitPrice).toLocaleString('en-US'),
    }));

    res.status(200).json(components);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
export const getAvailableMedicines = async (req: Request, res: Response) => {
  try {
    const medicinesResult = await ProductModel.find({
      productCategory: "Medicine",
    })

    const medicines = medicinesResult.map(product => ({
      id: product._id,
      name: product.productName + " - ₱" + (product.productUnitPrice).toLocaleString('en-US'),
    }));

    res.status(200).json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
export const createTreatment = async (req: Request, res: Response) => {
  const { 
    treatmentName,
    treatmentCategory,
    treatmentDescription,
    treatmentChargeType,
    treatmentCost,
    treatmentDuration,
    treatmentComponents,
    treatmentMedicines,
  } = req.body;

  try {


    
    let filteredTreatmentMedicines: MedicineResponseType[] = [];

    if (treatmentMedicines && treatmentMedicines.length > 0) {
      filteredTreatmentMedicines = treatmentMedicines.map(
        (medicine: MedicineType) => {
          const medicineData = {
            ...medicine,
            ...(medicine.medicineFreeAmount !== undefined && medicine.isMedicineFree === "freeUpTo" && { medicineFreeAmount: medicine.medicineFreeAmount }),
          };
          return medicineData;
        }
      );
    }

    let filteredTreatmentComponents: IComponentRequest[] = [];

    if (treatmentComponents && treatmentComponents.length > 0 ) {    
     filteredTreatmentComponents = treatmentComponents.map(
        (component: IComponentRequest) => {
          const componentData = {
            ...component,
            ...(component.componentFreeAmount !== undefined && component.isComponentFree === "freeUpTo" && { componentFreeAmount: component.componentFreeAmount }),
          };
  
          return componentData;
        }
      );

    }

    let medicineIds: {} = []
    if (filteredTreatmentMedicines.length > 0) {    
      const medicineResponse = await MedicineModel.insertMany(filteredTreatmentMedicines) 
      medicineIds = medicineResponse.map((medicine) => ({
        medicineId: medicine._id,
      }))
    }
    


    let componentIds: {} = []
    if (filteredTreatmentComponents.length > 0) {    
      const componentResult = await ComponentModel.insertMany(filteredTreatmentComponents)
      componentIds = componentResult.map((component) => ({
        componentId: component._id,
      }));
    }


    const treatmentResult = await TreatmentModel.create({ 
      treatmentName: treatmentName,
      treatmentCategory: treatmentCategory,
      treatmentDescription: treatmentDescription,
      treatmentChargeType: treatmentChargeType,
      treatmentCost:treatmentCost,
      treatmentDuration: treatmentDuration,
      ...(filteredTreatmentComponents.length > 0 && { treatmentComponents: componentIds }),
      ...(filteredTreatmentMedicines.length > 0 && { treatmentMedicines: medicineIds }),
    });
    console.log("6")

    res.status(200).json(treatmentResult);
  } catch (error) {
    res.status(500).json(error)
  }
}
export const getTreatments = async (req: Request, res: Response) => {
  const type = req.query.type as string;

  try {
    const query = type ? { treatmentChargeType: type } : {};
    console.log(1)
    const treatmentResults = await TreatmentModel.find({
      ...query,
      isDeleted: false,
    })
    .populate('treatmentComponents.componentId')
    .populate('treatmentMedicines.medicineId')
    .sort({ createdAt: -1 });

    const response = [];

    for (const treatment of treatmentResults) {
      try {
        const components = [];
        
        // Process components for the current treatment
        for (const component of treatment.treatmentComponents) {
          try {
            const componentData = component.componentId as unknown as ComponentType;
            const productId = componentData.componentProductId;
            const productData = await ProductModel.findById(productId) as ProductType;
            
            components.push({
              _id: component._id,
              componentProductId: productData._id,
              componentName: productData.productName + " - ₱" + productData.productUnitPrice,
              componentAmount: String(componentData.componentAmount),
              isComponentFree: componentData.isComponentFree,
              componentFreeAmount: componentData?.componentFreeAmount ? String(componentData.componentFreeAmount) : "",
            });
          } catch (error) {
            console.error(`Error processing component ${component._id} in treatment ${treatment._id}:`, error);
          }
        }
    
        const medicines = [];
        
        // Process medicines for the current treatment
        for (const medicine of treatment.treatmentMedicines) {
          try {
            const medicineData = medicine.medicineId as unknown as MedicineResponseType;
            const productId = medicineData.medicineProductId;
            const productData = await ProductModel.findById(productId) as ProductType;
            
            medicines.push({
              _id: medicine._id,
              medicineProductId: productData._id,
              medicineName: productData.productName + " - ₱" + productData.productUnitPrice,
              medicineAmount: String(medicineData.medicineAmount),
              isMedicineFree: medicineData.isMedicineFree,
              medicineFreeAmount: medicineData?.medicineFreeAmount ? String(medicineData.medicineFreeAmount) : "",
              prescriptionDosageAmount: medicineData.prescriptionDosageAmount,
              prescriptionDosageType: medicineData.prescriptionDosageType,
              prescriptionRepeatition: medicineData.prescriptionRepeatition,
              prescriptionTimeDuration: medicineData.prescriptionTimeDuration,
              prescriptionTimeUnit: medicineData.prescriptionTimeUnit,
              prescriptionTimeOfTheDay: medicineData.prescriptionTimeOfTheDay,
              prescriptionIntakeSchedule: medicineData.prescriptionIntakeSchedule,
            });
          } catch (error) {
            console.error(`Error processing medicine ${medicine._id} in treatment ${treatment._id}:`, error);
          }
        }
    
        response.push({
          _id: treatment._id,
          treatmentId: treatment._id,
          treatmentName: treatment.treatmentName,
          treatmentCategory: treatment.treatmentCategory,
          treatmentDescription: treatment.treatmentDescription,
          treatmentChargeType: treatment.treatmentChargeType,
          treatmentCost: treatment.treatmentCost,
          treatmentDuration: treatment.treatmentDuration,
          treatmentComponents: components.length > 0 ? components : [],
          treatmentMedicines: medicines.length > 0 ? medicines : [],
          treatmentSerialId: treatment.treatmentSerialId,
        });
    
      } catch (error) {
        console.error(`Error processing treatment ${treatment._id}:`, error);
      }
    }
    
    

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
};
export const deleteTreatment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const response = await TreatmentModel.findByIdAndUpdate(
      id, 
      {isDeleted: true},
      { new: true },
    );
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Error deleting Treatment" });
  }
}
export const editTreatment = async (req: Request, res: Response) => {
  const { 
    _id,
    treatmentName,
    treatmentCategory,
    treatmentDescription,
    treatmentChargeType,
    treatmentCost,
    treatmentDuration,
    treatmentComponents,
    treatmentMedicines,
  } = req.body;

  try {
    // Prepare filtered components and medicines
    const filteredTreatmentMedicines = treatmentMedicines?.map((medicine: MedicineType) => ({
      ...medicine,
      ...(medicine.medicineFreeAmount !== undefined && medicine.isMedicineFree === "freeUpTo" && { medicineFreeAmount: medicine.medicineFreeAmount }),
    })) || [];

    const filteredTreatmentComponents = treatmentComponents?.map((component: IComponentRequest) => ({
      ...component,
      ...(component.componentFreeAmount !== undefined && component.isComponentFree === "freeUpTo" && { componentFreeAmount: component.componentFreeAmount }),
    })) || [];

    console.log(treatmentComponents)
    console.log(treatmentMedicines)
    console.log("-----------------")
    console.log(filteredTreatmentComponents)
    console.log(filteredTreatmentMedicines)

    
    // Fetch the existing treatment document
    const oldTreatment = await TreatmentModel.findById(_id);

    // If no treatment is found, return an error response
    if (!oldTreatment) {
      return res.status(404).json({ message: "Treatment not found" });
    }

    // Extract IDs of old medicines and components to delete
    const oldMedicineIds = oldTreatment.treatmentMedicines.map((medicine: any) => medicine.medicineId);
    const oldComponentIds = oldTreatment.treatmentComponents.map((component: any) => component.componentId);

    // Delete old medicines and components from the database
    await MedicineModel.deleteMany({ _id: { $in: oldMedicineIds } });
    await ComponentModel.deleteMany({ _id: { $in: oldComponentIds } });

    let medicineIds: {} = []
    if (filteredTreatmentMedicines.length > 0) {    
      const medicineResponse = await MedicineModel.insertMany(filteredTreatmentMedicines) 
      medicineIds = medicineResponse.map((medicine) => ({
        medicineId: medicine._id,
      }))
    }
    
    let componentIds: {} = []
    if (filteredTreatmentComponents.length > 0) {    
      const componentResult = await ComponentModel.insertMany(filteredTreatmentComponents)
      componentIds = componentResult.map((component) => ({
        componentId: component._id,
      }));
    }

    // Update the treatment document with new data and references to components and medicines

    await TreatmentModel.findByIdAndUpdate(
      _id,
      { 
        treatmentComponents: [],  
        treatmentMedicines: [],   
      },
      { new: true }
    )

    const treatmentResult = await TreatmentModel.findByIdAndUpdate(
      _id,
      { 
        treatmentName,
        treatmentCategory,
        treatmentDescription,
        treatmentChargeType,
        treatmentCost,
        treatmentDuration,
        treatmentComponents: componentIds,
        treatmentMedicines: medicineIds
      },
      { new: true }
    );

    res.status(200).json("OK");
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
export const getTreatmentCost = async (req: Request, res: Response) => {
  const appointmentId = req.params.id;
  try {
    const checkups = await CheckupModel
    .find({ checkupAppointmentId: appointmentId})
    .populate<{ checkupTreatmentId: TreatmentRequestType }>('checkupTreatmentId') as CheckupResponse[];

    const groupedCheckups = checkups.reduce((acc, checkup) => {
      const chargeType = checkup.checkupTreatmentId.treatmentChargeType.toLowerCase();
      const treatmentId = checkup.checkupTreatmentId._id;
    
      let treatmentGroup = acc.find((group: any) => group.treatmentId === treatmentId);
    
      if (!treatmentGroup) {
        treatmentGroup = {
          treatmentId,
          treatmentName: checkup.checkupTreatmentId.treatmentName,
          treatmentCategory: checkup.checkupTreatmentId.treatmentCategory,
          treatmentChargeType: checkup.checkupTreatmentId.treatmentChargeType,
          treatmentDescription: checkup.checkupTreatmentId.treatmentDescription,
          treatmentCost: checkup.checkupTreatmentId.treatmentCost,
          treatmentDuration: checkup.checkupTreatmentId.treatmentDuration,
          treatmentComponents: checkup.checkupTreatmentId.treatmentComponents,
          treatmentMedicines: checkup.checkupTreatmentId.treatmentMedicines,
          tooths: [],
          sections: []
        };
        acc.push(treatmentGroup);
      }
    
      if (checkup.checkupStatus === 'Approved') {
        if (chargeType === 'tooth') {
          if (!treatmentGroup.tooths.includes(checkup.checkupToothNumber)) {
            treatmentGroup.tooths.push(checkup.checkupToothNumber);
          }
        } else if (chargeType === 'section') {
          if (!treatmentGroup.sections.includes(checkup.checkupSection)) {
            treatmentGroup.sections.push(checkup.checkupSection);
          }
        }
      }
    
      return acc;
    }, [] as any[]);
    // Remove unnecessary fields if sections or tooth are empty then it will be cleaned
    const cleanUpTreatmentGroup = (group: any): any => {
      const chargeType = group.treatmentChargeType.toLowerCase();
      if (chargeType !== 'tooth') {
        delete group.tooths;
      }
      if (chargeType !== 'section') {
        delete group.sections;
      }
      if (chargeType !== 'general') {
        delete group.checkupNotes;
      }
      return group;
    };
    // basically group the checkups by treatmentChargeType 
    const filteredGroupedCheckups = groupedCheckups
      .map(cleanUpTreatmentGroup)
      .filter(group => {
        const chargeType = group.treatmentChargeType.toLowerCase();
        if (chargeType === 'general') return true;
        if ((group.tooths?.length ?? 0) === 0 && (group.sections?.length ?? 0) === 0) return false;
        return true;
      }
    );
    

    const response = {
      tooth: filteredGroupedCheckups.filter(group => group.treatmentChargeType.toLowerCase() === 'tooth'),
      section: filteredGroupedCheckups.filter(group => group.treatmentChargeType.toLowerCase() === 'section'),
      general: filteredGroupedCheckups.filter(group => group.treatmentChargeType.toLowerCase() === 'general'),
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Error fetching treatment"});
  }
}

export const getTreatmentCount = async (req: Request, res: Response) => {
  try {
    const treatmentCount = await TreatmentModel.countDocuments();
    res.status(200).json(treatmentCount);
  } catch (error) {
    res.status(500).json({ message: "Error fetching treatment count" });
  }
}