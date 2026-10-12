/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Container, Alert, Badge } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../../store";
import * as attemptClient from "../../../attemptClient";
import * as quizClient from "../../../client";

export default function QuizResultsPage() {
  const { cid, qid, attemptId } = useParams() as {
    cid: string;
    qid: string;
    attemptId: string;
  };
  const router = useRouter();
  const { currentUser } = useSelector((state: RootState) => state.accountReducer);

  const [attempt, setAttempt] = useState<any | null>(null);
  const [quiz, setQuiz] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);

        const attemptData = await attemptClient.getAttemptById(attemptId);
        setAttempt(attemptData);

        const quizData = await quizClient.findQuizById(qid);
        setQuiz(quizData);

        setLoading(false);
      } catch (error) {
        console.error("Error loading results:", error);
        alert("Error loading quiz results");
        router.push(`/Courses/${cid}/Quizzes/${qid}`);
      }
    };

    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const canShowCorrectAnswers = () => {
  if (!quiz) return false;

  // Be robust to casing / slightly different values
  const rawSetting = quiz.showCorrectAnswers || "Immediately";
  const setting = rawSetting.toString().toLowerCase();

  if (setting === "immediately") return true;
  if (setting === "never") return false;

  if (setting === "after due date" || setting === "afterduedate") {
    if (!quiz.dueDate) return false;
    return new Date() > new Date(quiz.dueDate);
  }

  // Fallback: be safe and don't show answers
  return false;
};


  const showAnswers = canShowCorrectAnswers();

  if (loading) {
    return (
      <Container className="mt-3">
        <p>Loading results...</p>
      </Container>
    );
  }

  if (!attempt || !quiz) {
    return (
      <Container className="mt-3">
        <Alert variant="warning">Quiz results not found.</Alert>
        <Button onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}`)}>
          Back to Quiz
        </Button>
      </Container>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = attempt.answers?.find(
    (a: any) => a.questionId === currentQuestionIndex.toString()
  );

  const getQuestionType = (q: any) => {
    if (Array.isArray(q.blanks) && q.blanks.length > 0) return "fill-in-blank";
    const t = (q.type || q.questionType || "").toString().toLowerCase();
    if (t.includes("blank") || t.includes("fill")) return "fill-in-blank";
    if (typeof q.correctAnswer === "boolean" || t.includes("true") || t.includes("false")) return "true-false";
    // Default to multiple choice
    return "multiple-choice";
  };

  const questionType = getQuestionType(currentQuestion);
  
  // For multiple choice - check if multiple answers allowed
  const isMultipleChoice = questionType === "multiple-choice";
  const allowMultipleAnswers = currentQuestion.allowMultipleAnswers || false;
  
  // // Get correct answers (could be array or single value)
  // const correctAnswers = isMultipleChoice && allowMultipleAnswers
  //   ? (Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer])
  //   : [currentQuestion.correctAnswer];
  
  // // Get student answers (could be array or single value)
  // const studentAnswers = currentAnswer?.answer
  //   ? (Array.isArray(currentAnswer.answer) ? currentAnswer.answer : [currentAnswer.answer])
  //   : [];

  // Get correct answers (could be array or single value)
const correctAnswers = isMultipleChoice && allowMultipleAnswers
  ? (Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer])
  : [currentQuestion.correctAnswer];

// Get student answers (could be array or single value)
const rawStudentAnswer = currentAnswer?.answer;
let studentAnswers = [];

if (rawStudentAnswer !== undefined && rawStudentAnswer !== null) {
  if (Array.isArray(rawStudentAnswer)) {
    studentAnswers = rawStudentAnswer;
  } else if (allowMultipleAnswers && typeof rawStudentAnswer === 'string') {
    // If it's a string but multiple answers are allowed, try to parse it
    studentAnswers = rawStudentAnswer.split(',').map(a => a.trim());
  } else {
    // Single answer
    studentAnswers = [rawStudentAnswer];
  }
}

  // Check if this is the last question
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <Container className="mt-4" style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div className="mb-4">
        <h3>{quiz.title}</h3>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="mb-1">
              <strong>Attempt {attempt.attemptNumber}</strong> - Submitted {formatDate(attempt.submittedAt)}
            </p>
            <p className="mb-1">This attempt took {formatTime(attempt.timeSpent || 0)}.</p>
          </div>
          <div className="text-end">
            <h4>
              Score: <strong>{attempt.score}</strong> out of {attempt.totalPoints}
            </h4>
            <Badge bg={attempt.percentage >= 70 ? "success" : "warning"} className="fs-6">
              {attempt.percentage?.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>

      {!showAnswers && (
        <Alert variant="info">
          <strong>ℹ️ Correct answers are not available yet.</strong>
          {quiz.showCorrectAnswers === "After Due Date" && quiz.dueDate && (
            <> They will be available after {formatDate(quiz.dueDate)}.</>
          )}
          {quiz.showCorrectAnswers === "Never" && <> Correct answers will not be shown for this quiz.</>}
        </Alert>
      )}

      <hr />

      {/* Question Display */}
      <div className="row">
        <div className="col-md-9">
          {/* Question Display */}
          <div className="border rounded p-4 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h5>Question {currentQuestionIndex + 1} of {quiz.questions.length}</h5>
              <div>
                {showAnswers ? (
                  <Badge bg={currentAnswer?.isCorrect ? "success" : "danger"} className="me-2">
                    {currentAnswer?.pointsEarned || 0} / {currentQuestion.points || 0} pts
                  </Badge>
                ) : (
                  <Badge bg="secondary" className="me-2">
                    {currentQuestion.points || 0} pts
                  </Badge>
                )}
              </div>
            </div>

            <div className="mb-4" dangerouslySetInnerHTML={{ __html: currentQuestion.question || "<p>No question text</p>" }} />

            {/* MULTIPLE CHOICE */}
            {questionType === "multiple-choice" && (
              <div>
                {(() => {
                  let choicesList: any[] = [];
                  
                  // Try multiple possible sources for choices
                  if (Array.isArray(currentQuestion.choices)) {
                    choicesList = currentQuestion.choices;
                  } else if (Array.isArray(currentQuestion.options)) {
                    choicesList = currentQuestion.options;
                  } else if (currentQuestion.answers && Array.isArray(currentQuestion.answers)) {
                    // Handle the structure from your screenshot
                    choicesList = currentQuestion.answers.map((ans: any) => {
                      if (typeof ans === 'string') return ans;
                      if (ans.text !== undefined) return ans.text;
                      if (ans.answerText !== undefined) return ans.answerText;
                      return JSON.stringify(ans);
                    });
                  } else {
                    // Fallback: check if there are any answer-like properties
                    for (const key in currentQuestion) {
                      if (key.includes('answer') && key !== 'correctAnswer' && 
                          Array.isArray(currentQuestion[key])) {
                        choicesList = currentQuestion[key];
                        break;
                      }
                    }
                  }

                  // If still no choices, create some default ones
                  if (choicesList.length === 0) {
                    choicesList = ["Option 1", "Option 2", "Option 3", "Option 4"];
                  }

                  return choicesList.map((choice: any, idx: number) => {
                    // Safely extract text
                    const choiceText = typeof choice === 'string' 
                      ? choice 
                      : (choice?.text || choice?.answerText || `Option ${idx + 1}`);
                    
                    // Convert choiceText to string for comparison
                    const choiceTextStr = String(choiceText);
                    
                    // Check if this choice is selected
                    const isSelected = studentAnswers.some((ans: any) => 
                      String(ans).trim() === choiceTextStr.trim()
                    );
                    
                    // Check if this choice is correct
                    const isCorrect = showAnswers && correctAnswers.some((ans: any) =>
                      String(ans).trim() === choiceTextStr.trim()
                    );

                    let className = "p-3 mb-2 border rounded";
                    
                    // When answers are shown
                    if (showAnswers) {
                      if (isCorrect && isSelected) {
                        // Correct and selected
                        className = "p-3 mb-2 border border-success border-3 rounded bg-success bg-opacity-10";
                      } else if (isCorrect && !isSelected) {
                        // Correct but not selected
                        className = "p-3 mb-2 border border-success border-3 rounded bg-success bg-opacity-10";
                      } else if (!isCorrect && isSelected) {
                        // Selected but incorrect
                        className = "p-3 mb-2 border border-danger border-3 rounded bg-danger bg-opacity-10";
                      } else {
                        // Not selected, not correct
                        className = "p-3 mb-2 border rounded bg-light";
                      }
                    } 
                    // When answers are NOT shown yet
                    else {
                      if (isSelected) {
                        // Student's selection
                        className = "p-3 mb-2 border border-primary border-3 rounded bg-primary bg-opacity-10";
                      } else {
                        // Other options
                        className = "p-3 mb-2 border rounded bg-light";
                      }
                    }

                    return (
                      <div key={idx} className={className}>
                        <div className="d-flex align-items-center">
                          {isSelected && <span className="me-2">▶️</span>}
                          <span className="text-dark">{choiceText}</span>
                          <div className="ms-auto">
                            {showAnswers && isCorrect && !isSelected && (
                              <Badge bg="success" className="ms-2">Correct Answer ✓</Badge>
                            )}
                            {showAnswers && isSelected && isCorrect && (
                              <Badge bg="success" className="ms-2">Your Answer ✓</Badge>
                            )}
                            {showAnswers && isSelected && !isCorrect && (
                              <Badge bg="danger" className="ms-2">Your Answer ✗</Badge>
                            )}
                            {!showAnswers && isSelected && (
                              <Badge bg="primary" className="ms-2">Your Answer</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
                {allowMultipleAnswers && (
                  <div className="mt-3 text-muted small">
                    <em>
                      {showAnswers 
                        ? "Note: Multiple correct answers were allowed for this question." 
                        : "Note: Multiple answers may be selected for this question."}
                    </em>
                  </div>
                )}
              </div>
            )}

            {/* TRUE/FALSE */}
            {questionType === "true-false" && (
              <div>
                {[true, false].map((value) => {
                  const isSelected = studentAnswers.includes(value);
                  const isCorrect = showAnswers && correctAnswers.includes(value);

                  let className = "p-3 mb-2 border rounded bg-light";
                  
                  // Only show colors when showAnswers is true
                  if (showAnswers) {
                    if (isSelected && isCorrect) {
                      className = "p-3 mb-2 border border-success border-3 rounded bg-success bg-opacity-10";
                    } else if (isSelected && !isCorrect) {
                      className = "p-3 mb-2 border border-danger border-3 rounded bg-danger bg-opacity-10";
                    } else if (!isSelected && isCorrect) {
                      className = "p-3 mb-2 border border-success border-3 rounded bg-success bg-opacity-10";
                    }
                  } else if (isSelected) {
                    className = "p-3 mb-2 border border-primary border-3 rounded bg-primary bg-opacity-10";
                  }

                  return (
                    <div key={value.toString()} className={className}>
                      <div className="d-flex align-items-center">
                        {isSelected && <span className="me-2">▶️</span>}
                        <span className="text-dark">{value ? "True" : "False"}</span>
                        <div className="ms-auto">
                          {showAnswers && isSelected && isCorrect && (
                            <Badge bg="success" className="ms-2">Your Answer ✓</Badge>
                          )}
                          {showAnswers && isSelected && !isCorrect && (
                            <Badge bg="danger" className="ms-2">Your Answer ✗</Badge>
                          )}
                          {showAnswers && !isSelected && isCorrect && (
                            <Badge bg="success" className="ms-2">Correct Answer ✓</Badge>
                          )}
                          {!showAnswers && isSelected && (
                            <Badge bg="primary" className="ms-2">Your Answer</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FILL IN BLANKS - Handle multiple blanks */}
            {questionType === "fill-in-blank" && (
              <div>
                {Array.isArray(currentQuestion.blanks) && currentQuestion.blanks.length > 1 ? (
                  // Multiple blanks - show each separately
                  <div>
                    <strong>Your Answers:</strong>
                    {currentQuestion.blanks.map((_: any, index: number) => {
                      const studentAnswer =
                        typeof currentAnswer?.answer === "object"
                          ? currentAnswer.answer[index]
                          : "";
                      const correctAnswer = currentQuestion.blanks[index];
                      // Safely compare strings by converting both to strings first
                      const studentAnswerStr = String(studentAnswer || "").toLowerCase().trim();
                      const correctAnswerStr = String(correctAnswer || "").toLowerCase().trim();
                      const isCorrect = studentAnswerStr === correctAnswerStr;

                      return (
                        <div key={index} className="mb-3">
                          <div className="small fw-semibold mb-1">Blank [{index + 1}]:</div>
                          <div className={`p-3 border rounded ${showAnswers && isCorrect ? 'border-success bg-success bg-opacity-10' : 'border-secondary bg-light'}`}>
                            <span className="text-dark">{studentAnswer || "(No answer)"}</span>
                          </div>
                          {showAnswers && (
                            <div className="mt-2">
                              <div className="small fw-semibold">Correct Answer:</div>
                              <div className="p-2 border border-success rounded bg-success bg-opacity-10">
                                <span className="text-dark">{correctAnswer}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Single blank
                  <div>
                    <strong>Your Answer:</strong>
                    <div className={`p-3 border rounded ${
                      showAnswers && 
                      String(studentAnswers[0] || "").toLowerCase().trim() === 
                      String(correctAnswers[0] || "").toLowerCase().trim() 
                        ? 'border-success bg-success bg-opacity-10' 
                        : 'border-secondary bg-light'
                    }`}>
                      <span className="text-dark">{studentAnswers[0] || "(No answer provided)"}</span>
                    </div>
                    {showAnswers && (
                      <div className="mt-3">
                        <strong>Correct Answer:</strong>
                        <div className="p-3 border border-success rounded bg-success bg-opacity-10">
                          <span className="text-dark">
                            {Array.isArray(correctAnswers)
                              ? correctAnswers.join(", ")
                              : String(correctAnswers[0] || "")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="d-flex justify-content-between mb-4">
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </Button>
            
            {/* Conditionally show Next or nothing on last question */}
            {!isLastQuestion ? (
              <Button
                variant="primary"
                onClick={() =>
                  setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))
                }
              >
                Next →
              </Button>
            ) : (
              <div></div>
            )}
          </div>

          <div className="text-center">
            <Button variant="primary" onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}`)}>
              Back to Quiz Details
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-md-3">
          <div className="border rounded p-3 bg-white position-sticky" style={{ top: "20px" }}>
            <h6 className="mb-3">Questions</h6>
            <div className="d-grid gap-2">
              {quiz.questions.map((q: any, idx: number) => {
                const ans = attempt.answers?.find((a: any) => a.questionId === idx.toString());
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <Button
                    key={idx}
                    size="sm"
                    variant={isCurrent ? "primary" : "outline-secondary"}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className="text-start"
                  >
                    {showAnswers ? (
                      ans?.isCorrect ? <span className="text-success">✓</span> : <span className="text-danger">✗</span>
                    ) : (
                      <span className="text-secondary">○</span>
                    )}{" "}
                    Q{idx + 1}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}