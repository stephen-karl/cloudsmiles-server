import { cohere } from '@configs/cohere.config'


interface IDocument {
  _id: string;
  type: string;
  data: string;
  label: string;
  score: number;
}



export const rerankDocuments = async (documents: IDocument[], context: string) => {

  const extractedDocuments = documents.map(doc => (
      doc.data
  ));
  

  try {
    const rerankResults = await cohere.rerank({
      model: 'rerank-english-v3.0',
      query: context,
      documents: extractedDocuments ,
      topN: 1,
    });

    // const highestScoringDocument = rerankResults.results.reduce((max, current) => {
    //   return (current.relevanceScore > max.relevanceScore) ? current : max;
    // }, rerankResults.results[0]);
    // console.log(rerankResults)

    // // Check if the highest score is below 0.7
    // const result = highestScoringDocument.relevanceScore < 0.7 ? false : highestScoringDocument.index;
    return rerankResults;

  } catch (error) { 
    console.log(error)
    return error
  }
}
