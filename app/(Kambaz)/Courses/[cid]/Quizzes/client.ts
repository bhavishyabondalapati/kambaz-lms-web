/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const axiosWithCredentials = axios.create({ withCredentials: true });
const httpServer = process.env.NEXT_PUBLIC_HTTP_SERVER || "http://localhost:4000";

const coursesApi = `${httpServer}/api/courses`;
const quizzesApi = `${httpServer}/api/quizzes`;

export const findQuizzesForCourse = async (courseId: string) => {
  const { data } = await axiosWithCredentials.get(
    `${coursesApi}/${courseId}/quizzes`
  );
  return data;
};

export const createQuizForCourse = async (courseId: string, quiz: any) => {
  const { data } = await axiosWithCredentials.post(
    `${coursesApi}/${courseId}/quizzes`,
    quiz
  );
  return data;
};

export const findQuizById = async (quizId: string) => {
  const { data } = await axiosWithCredentials.get(`${quizzesApi}/${quizId}`);
  return data;
};

export const updateQuiz = async (quiz: any) => {
  const { data } = await axiosWithCredentials.put(
    `${quizzesApi}/${quiz._id}`,
    quiz
  );
  return data;
};

export const deleteQuiz = async (quizId: string) => {
  const { data } = await axiosWithCredentials.delete(
    `${quizzesApi}/${quizId}`
  );
  return data;
};

export const startQuizAttempt = async (quizId: string) => {
  const { data } = await axiosWithCredentials.post(
    `${quizzesApi}/${quizId}/attempts`
  );
  return data;
};

export const getQuizAttemptsForCurrentUser = async (quizId: string) => {
  const { data } = await axiosWithCredentials.get(
    `${quizzesApi}/${quizId}/attempts`
  );
  return data;
};

export const getInProgressAttempt = async (quizId: string) => {
  const { data } = await axiosWithCredentials.get(
    `${quizzesApi}/${quizId}/attempts/current`
  );
  return data;
};

export const getAttemptById = async (attemptId: string) => {
  const { data } = await axiosWithCredentials.get(
    `${httpServer}/api/attempts/${attemptId}`
  );
  return data;
};

export const saveAttemptAnswer = async (
  attemptId: string,
  payload: { questionId: string; questionType: string; answer: any }
) => {
  const { data } = await axiosWithCredentials.post(
    `${httpServer}/api/attempts/${attemptId}/answers`,
    payload
  );
  return data;
};

export const submitAttempt = async (attemptId: string) => {
  const { data } = await axiosWithCredentials.post(
    `${httpServer}/api/attempts/${attemptId}/submit`
  );
  return data;
};
