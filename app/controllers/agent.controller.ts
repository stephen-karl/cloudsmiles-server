import { Request, Response } from 'express';
import { embedDocuments } from '../helpers/cohere/embedder'
import { rerankDocuments } from '../helpers/cohere/reranker';
import { 
  patientChatAgent,
  guestChatAgent,
  identifierAgent, 
  classifierAgent,
} from '../helpers/cohere/agents';
import { 
  extractAnswers,
  extractFeature,
} from '../utils/agent.utils';
import contextsModel from "../schemas/mongo/contexts.schema";
import messageModel from '../schemas/mongo/messages.schema';
import chainModel from '../schemas/mongo/chains.schema'
import requestsModel from '../schemas/mongo/requests.schema';
import { features } from '../constants/features';
import AppointmentModel from '../schemas/mongo/appointment.schema';


export const ingestContext = async (req: Request, res: Response) => {
  const { contextType, contextData, contextLabel, contextCategory } = req.body;

  const queryVector = await embedDocuments(contextData)

  try {
    const contextsResult = await contextsModel.create({
      contextType: contextType,
      contextData: contextData,
      contextLabel: contextLabel,
      contextCategory: contextCategory,
      contextEmbeddings: queryVector,
    });
    res.status(200).json(contextsResult);
  } catch (error) {
    res.status(500).json("Ingesting failed");
  }
}

export const updateContext = async (req: Request, res: Response) => {
  const { _id, contextType, contextData, contextLabel, contextCategory } = req.body;


  try {
    const queryVector = await embedDocuments(contextData)
    const contextsResult = await contextsModel.findByIdAndUpdate(
      _id,
      {
        contextType: contextType,
        contextData: contextData,
        contextLabel: contextLabel,
        contextCategory: contextCategory,
        contextEmbeddings: queryVector,
      },
      { new: true }
    );
    res.status(200).json(contextsResult);
  } catch (error) {
    res.status(500).json("Ingesting failed");
  }
}

export const deleteContext = async (req: Request, res: Response) => {
  const contextId = req.params.id

  try {
    const contextsResult = await contextsModel.findByIdAndDelete(contextId);
    res.status(200).json(contextsResult);
  } catch (error) {
    res.status(500).json("Ingesting failed");
  }
}

export const deleteRequest = async (req: Request, res: Response) => {
  const requestId = req.params.id

  try {
    const requestsResult = await requestsModel.findByIdAndDelete(requestId);
    res.status(200).json(requestsResult);
  } catch (error) {
    res.status(500).json("Ingesting failed");
  }
}

export const ingestContextFromRequest = async (req: Request, res: Response) => {
  const { _id, contextData, contextLabel, contextCategory } = req.body;

  console.log(_id)
  try {
    await requestsModel.findByIdAndDelete(_id)
    const queryVector = await embedDocuments(contextData)
    const contextsResult = await contextsModel.create({
      contextType: "question",
      contextData: contextData,
      contextLabel: contextLabel,
      contextCategory: contextCategory,
      contextEmbeddings: queryVector,
    });

    res.status(200).json(contextsResult);
  } catch (error) {
    res.status(500).json(error);
  }
}

export const patientAskQuestion = async (req: Request, res: Response) => {
  const { patientMessage, patientId } = req.body
  const chainData = await chainModel.findOne({chainPatientId: patientId, chainIsActive: true})

  try {
    let chatResponse = {
      _id: "",
      messageText: "",
      messageComponent: "message",
      messageData: {},
    }
    
    const featureManager = async (featureName: string) => {
      const featureResponse = await features[featureName](patientMessage, patientId, chainData);
      chatResponse.messageText += featureResponse.text + " "
      chatResponse.messageComponent = featureResponse.component ? featureResponse.component : "message"
      chatResponse.messageData = featureResponse.data
    }
  
    if (!chainData) {
      console.log("[1] - Embedding message...")
      const messageVector = await embedDocuments(patientMessage) as number[];
     
      console.log("[2] - Searching for contexts...")
      const contextResult = await contextsModel.aggregate([
        {
          "$vectorSearch": {
            "index": "contexts_index",
            "path": "contextEmbeddings",
            "queryVector": messageVector as number[],
            "numCandidates": 10,
            "limit": 5,
          }
        },
        {
          "$project": {
            "_id": 1, 
            "contextType":1,
            "contextData": 1,
            "contextLabel": 1,
            "score": { "$meta": "vectorSearchScore" }
          }
        },
        {
          "$match": {
            "score": { "$gt": 0.6 }
          }
        },
      ])
  
      console.log(contextResult )
    
      console.log("[2.1] - Identifying if its related to dental clinic...")
      const isRelatedToDentalClinic = await identifierAgent(patientMessage)
      console.log("is Related to clinic", isRelatedToDentalClinic)
      if ( isRelatedToDentalClinic === "true" ) {
        const requestsResult = await requestsModel.aggregate([
          {
            "$vectorSearch": {
              "index": "requests_index",
              "path": "requestEmbeddings",
              "queryVector": messageVector as number[],
              "numCandidates": 10,
              "limit": 5,
            }
          },
          {
            "$project": {
              "data": 1, 
              "score": { "$meta": "vectorSearchScore" }
            }
          },
          {
            "$match": {
              "score": { "$gt": 0.8 }
            }
          },
        ])
        console.log("[2.2] - Searching for similar requests...")
        if ( requestsResult.length < 1 ) {
          await requestsModel.create({
            requestLabel: patientMessage,
            requestEmbeddings: messageVector as number[],
            requestStatus: "Pending",
          });
          chatResponse.messageText = "Apologies, I lack the information requested. However, I have forwarded your inquiry to the administrator for further examination."    
        }
      }
      
      console.log("[3] - Classifying the message...")
      const classifierResult = await classifierAgent(patientMessage)
      
      if ( classifierResult === "feature"  || classifierResult === "mixed" ) {
        const featureName = extractFeature(contextResult)
        await featureManager(featureName)
      }
    
      if ( classifierResult === "question" || classifierResult === "mixed" ) {
        const answers = extractAnswers(contextResult)
        chatResponse.messageText += answers
      }
  
    } else {
      await featureManager(chainData.chainFeatureName)
    }
  
    
    const botResponse = chainData ? chatResponse.messageText : chatResponse.messageText = await patientChatAgent(patientMessage, chatResponse.messageText , patientId ) as string
    console.log("[5] - Feeding the contexts to Large Language Model...")
    
    await messageModel.create({
      messagePatientId: patientId,
      messageText: patientMessage,
      messageRole: "USER",
    })
  
  
    const botMessageResult = await messageModel.create({
      messagePatientId: patientId,
      messageText: botResponse,
      messageComponent: chatResponse.messageComponent,
      messageRole: "CHATBOT",
    });
  
    chatResponse._id = botMessageResult._id as string
  
    console.log("[6] - Finishing the response...")
    res.status(200).json(chatResponse)
    console.log("tapos ang boxing")
    
  } catch (error) {
    await messageModel.create({
      messagePatientId: patientId,
      messageText: patientMessage,
      messageRole: "USER",
    })
    await messageModel.create({
      messagePatientId: patientId,
      messageComponent: "error",
      messageText: "Something went wrong. Please try again.",
      messageRole: "CHATBOT",
    })
  }
}

export const guestAskQuestion = async (req: Request, res: Response) => {
  const { guestMessage, guestChatLogs } = req.body

  let chatResponse = {
    _id: "",
    messageText: "",
    messageComponent: "message",
    messageData: {},
    messageFeatureName: "",
  }
  
 let guestAskFeature = false
  
  console.log("[1] - Embedding message...")
  const messageVector = await embedDocuments(guestMessage) as number[];
  
  console.log("[2] - Searching for contexts...")
  const contextResult = await contextsModel.aggregate([
    {
      "$vectorSearch": {
        "index": "contexts_index",
        "path": "contextEmbeddings",
        "queryVector": messageVector as number[],
        "numCandidates": 10,
        "limit": 5,
      }
    },
    {
      "$project": {
        "_id": 1, 
        "contextType":1,
        "contextData": 1,
        "contextLabel": 1,
        "score": { "$meta": "vectorSearchScore" }
      }
    },
    {
      "$match": {
        "score": { "$gt": 0.7 }
      }
    },
  ])

  console.log(contextResult)

  // if no similar context found it will store the message to requests and the admin will review it
  if ( contextResult.length < 1) {
    console.log("[2.1] - Identifying if its related to dental clinic...")
    const isRelatedToDentalClinic = await identifierAgent(guestMessage)
    // if not related to dental clinic it will exit
    console.log(isRelatedToDentalClinic)
    if ( isRelatedToDentalClinic === "true" ) {
      const requestsResult = await requestsModel.aggregate([
        {
          "$vectorSearch": {
            "index": "requests_index",
            "path": "requestEmbeddings",
            "queryVector": messageVector as number[],
            "numCandidates": 10,
            "limit": 5,
          }
        },
        {
          "$project": {
            "requestLabel": 1, 
            "score": { "$meta": "vectorSearchScore" }
          }
        },
        {
          "$match": {
            "score": { "$gt": 0.7 }
          }
        },
      ])
      console.log("[2.2] - Searching for similar requests...")
      // if its related but already exist on request it will exit
      if ( requestsResult.length < 1 ) {
        await requestsModel.create({
          requestLabel: guestMessage,
          requestEmbeddings: messageVector as number[],
          requestStatus: "pending",
        });
        console.log("[2.3] - Saving the requests...")
      }
      chatResponse.messageText = "Apologies, I lack the information requested. However, I have forwarded your inquiry to the administrator for further examination."    
    }
  }

  

  console.log("[3] - Classifying the message...")
  const classifierResult = await classifierAgent(guestMessage)
  console.log(classifierResult)

  if ( classifierResult === "feature" || classifierResult === "mixed" ) {

    const featureName = extractFeature(contextResult)
    console.log(featureName)

    if (featureName === "getDentistSchedule") {
      chatResponse.messageFeatureName = featureName
    }else {
      chatResponse.messageComponent = "signInMessage"
      guestAskFeature = true
    }
  }

  if ( classifierResult === "question" || classifierResult === "mixed" ) {
    const answers = extractAnswers(contextResult)
    chatResponse.messageText += answers
  }

  console.log(contextResult)

  const botResponse = await guestChatAgent(guestMessage, chatResponse.messageText, guestAskFeature, guestChatLogs) as string
  chatResponse.messageText = botResponse

  console.log("[5] - Feeding the contexts to Large Language Model...")
  

  console.log("[6] - Finishing the response...")
  res.status(200).json(chatResponse)
  console.log("tapos ang boxing")
}

export const getAgentMessages = async (req: Request, res: Response) => {
  const patientId  = req.params.id
  try {
    const messages = await messageModel.find({ messagePatientId: patientId }).sort({createdAt: -1})
    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json(error)
  }
}

export const updateChainData = async (req: Request, res: Response ) =>{
  const { 
    appointmentDate, 
    appointmentDentistId, 
    appointmentTime, 
    patientId,
    previousDentist,
  } = req.body

  
  try {
    console.log("prev dentuist" , previousDentist)
    console.log("appointmenet Data: ", appointmentDate)
    console.log("patientId: ", patientId)

    const chainData = await chainModel.findOne({chainPatientId: patientId, chainIsActive: true})
    const chainId = chainData?._id as string

    if (appointmentDate) {
      console.log(appointmentDate)
      const dateResult = await chainModel.findByIdAndUpdate(
        chainId,
        { $set: { "chainDataProgress.date": appointmentDate } },
        { new: true } // Use upsert to create the field if it doesn't exist
      );
    }
    
    if (appointmentDentistId) {
      console.log("updating dentist")
      const dentistResult = await chainModel.updateOne(
        { _id: chainId },
        { $set: { "chainDataProgress.dentist": appointmentDentistId } },
      );
    }

    if (appointmentTime) {
      console.log("updating time")
      const timeResult = await chainModel.updateOne(
        { _id: chainId },
        { $set: { "chainDataProgress.time": appointmentTime } },
      );
    }

    if (previousDentist) {
      const dentistResult = await AppointmentModel.findOne({appointmentPatientId: patientId, appointmentStatus: "Finished"}).sort({appointmentDate: -1})
      const dentistId = dentistResult?.appointmentDentistId.toString() as string 

      const newData ={
        ...(previousDentist === "Yes" && {"chainDataProgress.dentist": dentistId}),
        "chainDataProgress.previousDentist": previousDentist,
      }

      const timeResult = await chainModel.updateOne(
        { _id: chainId },
        { $set: newData },
      );
    }
    
    res.status(200).json("Updated")
  } catch (error) {
    res.status(500).json(error)
  }
}

export const getContexts = async (req: Request, res: Response) => {
  try {
    const contexts = await contextsModel.find({
      contextType: "question",
    })
    res.status(200).json(contexts)
  } catch (error) {
    res.status(500).json(error)
  }
}

export const getRequests = async (req: Request, res: Response) => {
  try {
    const requests = await requestsModel.find()
    res.status(200).json(requests)
  } catch (error) {
    res.status(500).json(error)
  }
}

export const getKnowledgeCount = async (req: Request, res: Response) => {
  try {
    const contextCount = await contextsModel.countDocuments()
    const requestCount = await requestsModel.countDocuments()
    res.status(200).json({
      contextCount,
      requestCount,
    })
  } catch (error) {
    res.status(500).json(error)
  }
}