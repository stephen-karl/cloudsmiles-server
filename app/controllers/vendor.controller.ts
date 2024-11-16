import { Request, Response } from "express";
import VendorModel from "@schemas/mongo/vendors.schema";
import { imageUploader } from "@helpers/cloudinary/uploader";
import { imageDeleter } from "@helpers/cloudinary/deleter";

export const createVendor = async (req: Request, res: Response) => {
  try {
    req.body.vendorAvatar = "";
    const vendorResult = await VendorModel.create(req.body);;
    if (req.file) {
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'vendors', 
        vendorResult._id as string,
        300, 
        300
      );
      req.body.vendorAvatar = cloudinaryResponse.secure_url;
      const vendorAvatar = req.body.vendorAvatar;
      await VendorModel.findByIdAndUpdate(vendorResult._id, { vendorAvatar }, { new: true });
    }

    res.status(201).json(vendorResult);
  } catch (error) {
    res.status(400).json(error)
  }
}

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await VendorModel.find({
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    res.status(200).json(vendors);
  } catch (error) {
    res.status(400).json(error)
  }
}

export const editVendor = async (req: Request, res: Response) => {
  try {
    // Replace
    if (req.file) {
      await imageDeleter('vendors', req.body._id as string);
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'vendors', 
        req.body._id as string,
        300,
        300
      );
      req.body.vendorAvatar = cloudinaryResponse.secure_url;
    }
    // Remove
    if (req.body.vendorAvatar === 'null') {
      await imageDeleter('vendors', req.body._id as string);
      req.body.vendorAvatar = ""
    }

    const vendorResult = await VendorModel.findByIdAndUpdate(req.body._id, req.body, { new: true });
    res.status(200).json(vendorResult);
  } catch (error) {
    res.status(400).json(error)
  }
}

export const deleteVendor = async (req: Request, res: Response) => {
  const _id = req.params.id;
  try {
    const vendorResult = await VendorModel.findByIdAndUpdate(_id, { isDeleted: true }, { new: true });
    res.status(200).json(vendorResult);
  } catch (error) {
    res.status(400).json(error)
  }
}

export const getVendorCount = async (req: Request, res: Response) => {
  try {
    const vendorCount = await VendorModel.countDocuments();
    res.status(200).json(vendorCount);
  } catch (error) {
    res.status(400).json(error)
  }
}