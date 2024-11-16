

interface IDocument {
  contextType: string;
  contextData: string;
  contextLabel: string;
}

interface IChatLog {
  text: string;
  role: "USER" | "CHATBOT";
}

export const extractAnswers = (documents: IDocument[]) => {
  const answers = documents
    .filter(item => item.contextType === "question")
    .map(item => item.contextData);
  return answers.join(" ");
}

export const extractFeature = (documents: IDocument[]) => {
  const feature = documents.find(item => item.contextType === "feature");
  return feature ? feature.contextLabel : "No feature found";
};

export const convertChatHistory = (chatLogs: IChatLog[]) => {
  return chatLogs.map(({ text, role }) => ({
    message: text,
    role: role
  }));
};