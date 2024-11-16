import express from "express";

import { 
  ingestContext,
  ingestContextFromRequest,
  updateContext,
  deleteContext,
  deleteRequest,
  patientAskQuestion,
  guestAskQuestion,
  getAgentMessages,
  updateChainData,
  getContexts,
  getRequests,
  getKnowledgeCount
} from "../controllers/agent.controller"

const router = express.Router()

router.post('/ingest-context', ingestContext)
router.post('/ingest-context-from-request', ingestContextFromRequest)
router.put('/update-context', updateContext)
router.delete('/delete-context/:id', deleteContext)
router.delete('/delete-request/:id', deleteRequest)
router.post('/patient-chat', patientAskQuestion)
router.post('/guest-chat', guestAskQuestion)
router.get('/get-agent-messages/:id', getAgentMessages)
router.put('/update-chain-data', updateChainData)
router.get('/get-contexts', getContexts)
router.get('/get-requests', getRequests)
router.get('/get-knowledge-count', getKnowledgeCount)


export default router 