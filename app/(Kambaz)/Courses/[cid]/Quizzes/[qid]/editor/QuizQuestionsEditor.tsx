/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import QuestionEditor from "./QuestionEditor";

interface QuizQuestionsEditorProps {
  quiz: any;
  onSave: (quiz: any) => void;
  onSaveAndPublish: (quiz: any) => void;
  onCancel: () => void;
  onChange?: (quiz: any) => void;
}

export default function QuizQuestionsEditor({
  quiz,
  onSave,
  onSaveAndPublish,
  onCancel,
  onChange,
}: QuizQuestionsEditorProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (quiz?.questions) {
      // Deep copy to avoid mutation
      setQuestions(JSON.parse(JSON.stringify(quiz.questions)));
    }
  }, [quiz]);

  const handleAddQuestion = () => {
    const newQuestion = {
      _id: `temp_${Date.now()}`,
      title: "Question",
      type: "multiple-choice",
      points: 4,
      question: "",
      choices: [
        { text: "", correct: false },
        { text: "", correct: false },
        { text: "", correct: false },
      ],
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setEditingQuestionId(newQuestion._id);
  };

  const handleUpdateQuestion = (questionId: string, updatedQuestion: any) => {
    const newQuestions = questions.map((q) =>
      q._id === questionId ? { ...q, ...updatedQuestion } : q
    );
    setQuestions(newQuestions);
    setEditingQuestionId(null);
    
    if (onChange) {
      onChange({
        ...quiz,
        questions: newQuestions,
        points: newQuestions.reduce((sum, q) => sum + (q.points || 0), 0),
      });
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this question?"
    );
    if (!confirmDelete) return;

    const newQuestions = questions.filter((q) => q._id !== questionId);
    setQuestions(newQuestions);
    setEditingQuestionId(null);
    
    if (onChange) {
      onChange({
        ...quiz,
        questions: newQuestions,
        points: newQuestions.reduce((sum, q) => sum + (q.points || 0), 0),
      });
    }
  };

  const handleCancelEdit = () => {
  // If it's a temp question (being created), remove it
  if (editingQuestionId?.startsWith("temp_")) {
    setQuestions((prev) => prev.filter((q) => q._id !== editingQuestionId));
  } else {
    // If it's an existing question, restore original data from quiz
    if (quiz?.questions) {
      const originalQuestion = quiz.questions.find((q: any) => q._id === editingQuestionId);
      if (originalQuestion) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === editingQuestionId ? { ...originalQuestion } : q))
        );
      }
    }
  }
  setEditingQuestionId(null);
};

  const handleSave = () => {
    const updatedQuiz = {
      ...quiz,
      questions,
      points: questions.reduce((sum, q) => sum + (q.points || 0), 0),
    };
    onSave(updatedQuiz);
  };

  const handleSaveAndPublish = () => {
    const updatedQuiz = {
      ...quiz,
      questions,
      points: questions.reduce((sum, q) => sum + (q.points || 0), 0),
    };
    onSaveAndPublish(updatedQuiz);
  };

  
  return (
    <div className="quiz-questions-editor">
      <div className="text-center mb-4">
        <Button variant="outline-secondary" onClick={handleAddQuestion} className="px-4 py-2">
          + New Question
        </Button>
      </div>

      {questions.length === 0 && editingQuestionId === null ? (
        <div className="alert alert-info text-center">
          No questions yet. Click &quot;+ New Question&quot; to add your first question.
        </div>
      ) : (
        <div className="questions-list mb-4">
          {questions.map((question, index) => (
            <div key={question._id} className="mb-3">
              {editingQuestionId === question._id ? (
                <QuestionEditor
                  question={question}
                  onSave={(updatedQuestion) =>
                    handleUpdateQuestion(question._id, updatedQuestion)
                  }
                  onCancel={handleCancelEdit}
                  onDelete={() => handleDeleteQuestion(question._id)}
                />
              ) : (
                <div className="border rounded p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="mb-0">
                          Question {index + 1}: {question.title}
                        </h6>
                        <span className="badge bg-secondary">
                          {question.type === "multiple-choice" && "Multiple Choice"}
                          {question.type === "true-false" && "True/False"}
                          {question.type === "fill-in-blank" && "Fill in the Blank"}
                        </span>
                        <span className="text-muted">({question.points} pts)</span>
                      </div>
                      <div
                        className="question-preview mt-2"
                        dangerouslySetInnerHTML={{
                          __html: question.question || "<em>No question text</em>",
                        }}
                        style={{ color: "#666" }}
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setEditingQuestionId(question._id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="d-flex justify-content-end gap-2 pt-3 border-top">
        <Button variant="light" onClick={onCancel} className="px-4" style={{ border: "1px solid #ccc" }}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleSave} className="px-4">
          Save
        </Button>
        <Button variant="outline-danger" onClick={handleSaveAndPublish} className="px-4">
          Save &amp; Publish
        </Button>
      </div>
    </div>
  );
}