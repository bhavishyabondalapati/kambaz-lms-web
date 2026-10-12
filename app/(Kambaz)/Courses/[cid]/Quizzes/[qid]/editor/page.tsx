/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../../store";
import QuizDetailsEditor from "./QuizDetailsEditor";
import QuizQuestionsEditor from "./QuizQuestionsEditor";
import * as client from "../../client";
import { updateQuiz } from "../../reducer";
import { Container, Button } from "react-bootstrap";
import { FaBan, FaCheckCircle } from "react-icons/fa";

export default function QuizEditorPage() {
  const { cid, qid } = useParams() as { cid: string; qid: string };
  const router = useRouter();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<"details" | "questions">("details");
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { currentUser } = useSelector((state: RootState) => state.accountReducer);
  const isFaculty = (currentUser as any)?.role === "FACULTY";

  useEffect(() => {
    if (!isFaculty) {
      router.push(`/Courses/${cid}/Quizzes`);
      return;
    }
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qid]);

  const fetchQuiz = async () => {
    try {
      const data = await client.findQuizById(qid);
      setQuiz(data);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: "details" | "questions") => {
    setActiveTab(newTab);
  };

  const handleQuizChange = (updatedQuiz: any) => {
    setQuiz(updatedQuiz);
  };

  const handleSave = async (updatedQuiz: any) => {
    try {
      const saved = await client.updateQuiz(updatedQuiz);
      setQuiz(saved);
      dispatch(updateQuiz(saved));
      router.push(`/Courses/${cid}/Quizzes/${qid}`);
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Error saving quiz. Please try again.");
    }
  };

  const handleSaveAndPublish = async (updatedQuiz: any) => {
    try {
      const saved = await client.updateQuiz({ ...updatedQuiz, published: true });
      setQuiz(saved);
      dispatch(updateQuiz(saved));
      router.push(`/Courses/${cid}/Quizzes`);
    } catch (error) {
      console.error("Error saving and publishing quiz:", error);
      alert("Error saving and publishing quiz. Please try again.");
    }
  };

  const handleCancel = () => {
    router.push(`/Courses/${cid}/Quizzes`);
  };

  // NEW: Publish / Unpublish buttons in header (stay on this page)
  const handlePublish = async () => {
    if (!quiz) return;
    try {
      const updatedQuiz = { ...quiz, published: true };
      const saved = await client.updateQuiz(updatedQuiz);
      setQuiz(saved);
      dispatch(updateQuiz(saved));
    } catch (error) {
      console.error("Error publishing quiz:", error);
      alert("Error publishing quiz. Please try again.");
    }
  };

  const handleUnpublish = async () => {
    if (!quiz) return;
    try {
      const updatedQuiz = { ...quiz, published: false };
      const saved = await client.updateQuiz(updatedQuiz);
      setQuiz(saved);
      dispatch(updateQuiz(saved));
    } catch (error) {
      console.error("Error unpublishing quiz:", error);
      alert("Error unpublishing quiz. Please try again.");
    }
  };

  if (loading) {
    return (
      <Container className="mt-3">
        <div>Loading quiz editor...</div>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="mt-3">
        <div>Quiz not found</div>
      </Container>
    );
  }

  const totalPoints =
    quiz.questions?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0;

  return (
    <div>
      <Container style={{ maxWidth: "900px" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Edit Quiz</h3>
          <div className="d-flex align-items-center gap-3">
            <span>
              <strong>Points:</strong> {totalPoints}
            </span>

            <div className="d-flex align-items-center gap-2">
              {/* <span
                className={`badge ${
                  quiz?.published ? "bg-success" : "bg-secondary"
                }`}
              >
                {quiz?.published ? "Published" : "Not Published"}
              </span> */}

              {quiz?.published ? (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleUnpublish}
                  className="d-flex align-items-center gap-2"
                >
                  <FaBan/>Unpublish
                </Button>
              ) : (
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={handlePublish}
                  className="d-flex align-items-center gap-2"
                >
                  <FaCheckCircle/>Publish
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-bottom mb-0">
          <div className="d-flex">
            <button
              className={`btn btn-link text-decoration-none px-4 py-3 ${
                activeTab === "details"
                  ? "text-danger fw-bold shadow-sm rounded-0"
                  : "text-secondary bg-light"
              }`}
              onClick={() => handleTabChange("details")}
              style={{
                borderRadius: 0,
              }}
            >
              Details
            </button>
            <button
              className={`btn btn-link text-decoration-none px-4 py-3 ${
                activeTab === "questions"
                  ? "text-danger fw-bold shadow-sm rounded-0"
                  : "text-secondary bg-light"
              }`}
              onClick={() => handleTabChange("questions")}
              style={{
                borderRadius: 0,
              }}
            >
              Questions
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white p-4">
          {activeTab === "details" ? (
            <QuizDetailsEditor
              quiz={quiz}
              onSave={handleSave}
              onSaveAndPublish={handleSaveAndPublish}
              onCancel={handleCancel}
              onChange={handleQuizChange}
            />
          ) : (
            <QuizQuestionsEditor
              quiz={quiz}
              onSave={handleSave}
              onSaveAndPublish={handleSaveAndPublish}
              onCancel={handleCancel}
              onChange={handleQuizChange}
            />
          )}
        </div>
      </Container>
    </div>
  );
}
