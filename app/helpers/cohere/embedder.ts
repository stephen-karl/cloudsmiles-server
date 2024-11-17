import { cohere } from '../../configs/cohere.config'

const preprocessor = (text: string): string => {
  return text.trim().replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase();
};

export const embedDocuments = async (context: string) => {
  try {
    const processedText = preprocessor(context);
    console.log(processedText)
    const queryVector = await cohere.embed({
      texts: [context],
      inputType: "search_document",
      model: "embed-english-v3.0",
    });
    if (Array.isArray(queryVector.embeddings)) {
      return queryVector.embeddings[0];
    } else {
      throw new Error("Handle the EmbedByTypeResponseEmbeddings case");   
    }
  } catch (error) {
    console.log(error)
    return error
  }
}
