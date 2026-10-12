/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const axiosWithCredentials = axios.create({ withCredentials: true });
const httpServer = process.env.NEXT_PUBLIC_HTTP_SERVER || "http://localhost:4000";

const quizzesApi = `${httpServer}/api/quizzes`;
const attemptsApi = `${httpServer}/api/attempts`;

// Start a new quiz attempt
export const startQuizAttempt = async (quizId: string) => {
  const { data } = await axiosWithCredentials.post(
    `${quizzesApi}/${quizId}/attempts`
  );
  return data;
}; 

// Get all attempts for a quiz by current user
export const getMyQuizAttempts = async (quizId: string) => {
  const { data } = await axiosWithCredentials.get(
    `${quizzesApi}/${quizId}/attempts`
  );
  return data;
};

// Get current in-progress attempt
export const getInProgressAttempt = async (quizId: string) => {
  const { data } = await axiosWithCredentials.get(
    `${quizzesApi}/${quizId}/attempts/current`
  );
  return data;
};

// Get a specific attempt by ID
export const getAttemptById = async (attemptId: string) => {
  const { data } = await axiosWithCredentials.get(
    `${attemptsApi}/${attemptId}`
  );
  return data;
};

// Save an answer for a question
export const saveQuestionAnswer = async (
  attemptId: string,
  questionId: string,
  questionType: string,
  answer: any
) => {
  const { data } = await axiosWithCredentials.post(
    `${attemptsApi}/${attemptId}/answers`,
    { questionId, questionType, answer }
  );
  return data;
};

// Submit quiz and get graded results
export const submitQuiz = async (attemptId: string) => {
  const { data } = await axiosWithCredentials.post(
    `${attemptsApi}/${attemptId}/submit`
  );
  return data;
};