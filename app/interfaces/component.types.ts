import { Types } from 'mongoose';

// Request Interface (for creating/updating components)
export interface IComponentRequest {
  _id?: string;  // Make _id optional for creating new components
  componentProductId: string;
  componentName?: string;
  componentAmount: number;
  componentFreeAmount?: number;  // Make freeAmount optional if it might not always be present
  isComponentFree: "free" | "freeUpTo";
}

export interface IComponentResponse {
  componentProductId: Types.ObjectId;
  componentAmount: number;
  isComponentFree: "free" | "freeUpTo";  // Use exact string literals
  componentFreeAmount?: number;  // Optional field
  _id: Types.ObjectId;
  __v: number;
  createdAt: Date;
  updatedAt: Date;
}

