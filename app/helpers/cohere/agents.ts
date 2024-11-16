import { cohere } from '../../configs/cohere.config'
import { 
  patientChatPrompt,
  guestChatPrompt,
  identifyPrompt,
  classifyPrompt,
  appointmentPrompt,
 } from '@constants/prompts'
import messageModel from '@schemas/mongo/messages.schema';

import { convertChatHistory } from 'app/utils/agent.utils'
import { Message } from 'cohere-ai/api';

type MessageType = {
  messageText: string;
  messageRole: string;
}

interface IChatLog {
  text: string;
  role: "USER" | "CHATBOT";
}


export const patientChatAgent = async (
  message: string, 
  context:string, 
  patientId: string
) => {
  try {
    const chatLogs = await messageModel.find({ patientId: patientId,}).sort({createdAt: -1}).limit(2).select({ _id: 0, messageRole: 1 , messageText: 1,}) as MessageType[]
    const filteredChatLogs = chatLogs.map((message) => {
      return {
        text: message.messageText,
        role: message.messageRole
      }
    }) as Message[]


    const chatResponse = await cohere.chat({
      message: message,
      chatHistory: filteredChatLogs,
      model: "command-r-plus",
      preamble: patientChatPrompt(context),
      temperature: 0.5,
    });
    return chatResponse.text
  } catch (error) {
    throw error
  }
}

export const guestChatAgent = async (
  message: string, 
  context:string, 
  guestAskFeature: boolean, 
  chatLogs: IChatLog[] 
) => {

  try {
    const chatHistory = convertChatHistory(chatLogs)
    const chatResponse = await cohere.chat({
      message: message,
      chatHistory: chatHistory,
      model: "command-r-plus",
      preamble: guestChatPrompt(context, guestAskFeature),
      temperature: 0.5,
    });
    return chatResponse.text
  } catch (error) {
    console.log(error)
    return error
  }
}

export const classifierAgent = async (message: string) => {
  const prompt = classifyPrompt
  try {
    const response = await cohere.chat({
      preamble:  prompt,
      message: message,
      model:"command-r-plus",
      temperature:0.0
    });

    console.log("[!]Classifier Out")

    return response.text
  } catch (error) {
    console.log(error)
  }
}

export const identifierAgent = async (message: string) => {
  try {
    const identifyResponse = await cohere.chat({
      message: message,
      model: "command-r-plus",
      preamble: identifyPrompt,
      temperature: 0.0,
    });
    return identifyResponse.text
  } catch (error) {
    console.log(error)
    return error
  }
}

export const appointmentAgent = async (message: string ) => {
  console.log("[!]Extracing Appointment Details")  

  try {
    const response = await cohere.chat({
      preamble: appointmentPrompt,
      message: message,
      model:"command-r-plus",
      temperature: 0.3
    });
    console.log("[!]Done extracting")

    const results = JSON.parse(response.text); 
    return results
  } catch (error) {
    return []
  }
}