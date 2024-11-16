import * as React from 'react';
import resend from "../../configs/resend.config,";
import PurchaseOrderEmail from '../../templates/PurchaseOrderEmail';
import StaffWelcomeEmail from '../../templates/StaffWelcomeEmail'
import PatientWelcomeEmail from '../../templates/PatientWelcomeEmail'
import RecoveryLinkEmail from '../../templates/RecoveryLinkEmail'
import VerificationCodeEmail from '../../templates/VerificationCodeEmail'
import { OrderResponseType } from '@schemas/mongo/order.schema';


export const sendRecoveryLink = async (email: string, firstName: string, link: string) => {
  try {
    const res = await resend.emails.send({
      from: "VSDental <contact@vsdentalpampanga.site>",
      to: [email],
      subject: "Reset Your Password",
      react: <RecoveryLinkEmail firstName={firstName} link={link} />,
    });
  } catch (error) {
    console.log(error);
  }
}


export const sendVerificationCode = async (email: string,firstName: string, otp: number) => {
  try {
    const res = await resend.emails.send({
      from: "VSDental <contact@vsdentalpampanga.site>",
      to: [email],
      subject: "Verification Code",
      react: <VerificationCodeEmail firstName={firstName} otp={otp} />,
    });

    console.log(res);
  } catch (error) {
    console.log(error);
  }
}


export const sendStaffWelcomeEmail = async (firstName: string, password: string, email: string) => {
  try {
    
    const res = await resend.emails.send({
      from: "VSDental <contact@vsdentalpampanga.site>",
      to: [email], 
      subject: "Your New Role at VS Dental - Congratulations!",
      react: <StaffWelcomeEmail firstName={firstName} email={email} password={password} />,
    });

    console.log(res);
  } catch (error) {
    console.log(error);
  }
}

export const sendPatientWelcomeEmail = async (firstName: string, password: string, email: string) => {
  try {
    
    const res = await resend.emails.send({
      from: "VSDental <contact@vsdentalpampanga.site>",
      to: [email], 
      subject: "Welcome to VS Dental! Your Account Details",
      react: <PatientWelcomeEmail firstName={firstName} email={email} password={password} />,
    });

    console.log(res);
  } catch (error) {
    console.log(error);
  }
}


export const sendPurchaseOrderEmail = async (order: OrderResponseType) => {

  const orderVendorId = order.orderVendorId;
  const orderProducts = order.orderProducts;
  const createdAt = order.createdAt;
  const orderSerialId = order.orderSerialId;
  
  const email = orderVendorId.vendorEmail


  try {
    const res = await resend.emails.send({
      from: "VSDental <contact@vsdentalpampanga.site>",
      to: [email], 
      subject: "VS Dental Purchase Order",
      react: <PurchaseOrderEmail 
        orderSerialId={orderSerialId}
        orderVendorId={orderVendorId}
        orderProducts={orderProducts}
        createdAt={createdAt}
      />,
    });

    console.log(res);
  } catch (error) {
    console.log(error);
  }
}