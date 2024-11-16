

export const prescriptionBuilder = (
  prescriptionDosageAmount: number,
  prescriptionDosageType: string,
  prescriptionDuration: number,
  prescriptionTimeUnit: string,
  prescriptionTimeOfTheDay: string[],
  prescriptionIntakeSchedule: string[]
) => {
  const prescription = prescriptionDosageAmount + " " + prescriptionDosageType +  " for " + prescriptionDuration + prescriptionTimeUnit + " in "+ prescriptionTimeOfTheDay.join(" ") + ", " + prescriptionIntakeSchedule.join(" ")
  return prescription
}