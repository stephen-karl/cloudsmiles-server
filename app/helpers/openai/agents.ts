import messageModel from "../../schemas/mongo/messages.schema"
import { openai } from '../../configs/openai.config'

export const patientChatAgent = async (
  message: string, 
  context:string, 
  patientId: string
) => {
  try {
    const chatLogs = await messageModel.find({ patientId: patientId,}).sort({createdAt: -1}).limit(2).select({ _id: 0, messageRole: 1 , messageText: 1,}) 
    const filteredChatLogs = chatLogs.map((message) => {
      return {
        text: message.messageText,
        role: message.messageRole
      }
    }) 


    // const chatResponse = await cohere.chat({
    //   message: message,
    //   chatHistory: filteredChatLogs,
    //   model: "command-r",
    //   preamble: patientChatPrompt(context),
    //   temperature: 0,
    // });

    // return chatResponse.text
  } catch (error) {
    throw error
  }
}
