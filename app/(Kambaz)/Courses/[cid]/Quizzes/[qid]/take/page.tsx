/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Container, Form, Alert, Modal, Card } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../store";
import * as quizClient from "../../client";
import * as attemptClient from "../../attemptClient";

export default function QuizTakingPage() {
  const { cid, qid } = useParams() as { cid: string; qid: string };
  const router = useRouter();
  const { currentUser } = useSelector((state: RootState) => state.accountReducer);

  const [quiz, setQuiz] = useState<any | null>(null);
  const [attempt, setAttempt] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [accessCodeError, setAccessCodeError] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const getQuestionType = (q: any): "multiple-choice" | "true-false" | "fill-in-blank" => {
    // PRIORITY 1: Check explicit type field first
    const explicitType = (q.type || q.questionType || "").toString().toLowerCase().trim();
    
    if (explicitType.includes("true") || explicitType.includes("false")) {
      return "true-false";
    }
    
    if (explicitType.includes("fill") || explicitType.includes("blank")) {
      return "fill-in-blank";
    }
    
    if (explicitType.includes("multiple") || explicitType.includes("choice")) {
      return "multiple-choice";
    }
    
    // PRIORITY 2: Check by data structure (only if type is ambiguous)
    
    // Check for true/false by correctAnswer type
    if (typeof q.correctAnswer === "boolean") {
      return "true-false";
    }
    
    // Check for multiple choice by presence of choices/options
    // IMPORTANT: Check this BEFORE checking blanks
    if ((Array.isArray(q.choices) && q.choices.length > 0) ||
        (Array.isArray(q.options) && q.options.length > 0)) {
      return "multiple-choice";
    }
    
    // Check for fill-in-blank LAST
    if (Array.isArray(q.blanks) && q.blanks.length > 0) {
      return "fill-in-blank";
    }
    
    // DEFAULT: Return multiple-choice if nothing else matches
    return "multiple-choice";
  };

  const checkAvailability = (quizData: any) => {
    const now = new Date();
    if (!quizData.published) {
      setError("This quiz is not published yet");
      return false;
    }
    if (quizData.availableDate && new Date(quizData.availableDate) > now) {
      setError(`This quiz is not available until ${new Date(quizData.availableDate).toLocaleString()}`);
      return false;
    }
    if (quizData.untilDate && new Date(quizData.untilDate) < now) {
      setError("This quiz is no longer available (Closed)");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const loadQuizAndAttempt = async () => {
      try {
        setLoading(true);
        const quizData = await quizClient.findQuizById(qid);
        setQuiz(quizData);

        if (!checkAvailability(quizData)) {
          setLoading(false);
          return;
        }

        if (quizData.accessCode && quizData.accessCode.trim() !== "") {
          setShowAccessCodeModal(true);
          setLoading(false);
          return;
        }

        await initializeAttempt(quizData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading quiz:", error);
        setError("Error loading quiz. Please try again.");
        setLoading(false);
      }
    };

    loadQuizAndAttempt();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qid]);

  const initializeAttempt = async (quizData: any) => {
    try {
      let attemptData = await attemptClient.getInProgressAttempt(qid);

      if (!attemptData) {
        attemptData = await attemptClient.startQuizAttempt(qid);
      }

      setAttempt(attemptData);

      if (attemptData.answers && attemptData.answers.length > 0) {
        const answersMap: Record<string, any> = {};
        attemptData.answers.forEach((ans: any) => {
          answersMap[ans.questionId] = ans.answer;
        });
        setAnswers(answersMap);
      }

      if (quizData.timeLimit && quizData.timeLimit > 0) {
        const startTime = new Date(attemptData.startedAt).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        const limit = quizData.timeLimit * 60;
        const remaining = Math.max(0, limit - elapsed);
        setTimeRemaining(remaining);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Error starting quiz");
    }
  };

  const handleAccessCodeSubmit = async () => {
    if (!quiz) return;

    if (accessCodeInput.trim() === quiz.accessCode.trim()) {
      setShowAccessCodeModal(false);
      setAccessCodeError("");
      await initializeAttempt(quiz);
      setLoading(false);
    } else {
      setAccessCodeError("Incorrect access code. Please try again.");
    }
  };

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const saveAnswerDebounced = (questionId: string, questionType: string, answer: any) => {
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    autoSaveRef.current = setTimeout(async () => {
      if (attempt) {
        try {
          await attemptClient.saveQuestionAnswer(attempt._id, questionId, questionType, answer);
          console.log("Auto-saved answer:", questionId, answer);
        } catch (error) {
          console.error("Error auto-saving answer:", error);
        }
      }
    }, 1000);
  };

  const handleAnswerChange = (value: any) => {
    const questionId = currentQuestionIndex.toString();
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const questionType = currentQuestion.type || currentQuestion.questionType || "multiple-choice";

    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    saveAnswerDebounced(questionId, questionType, value);
  };

  const handleBlankAnswerChange = (blankIndex: number, value: string) => {
    const questionId = currentQuestionIndex.toString();
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const questionType = currentQuestion.type || currentQuestion.questionType || "fill-in-blank";

    const currentAnswers = answers[questionId] || {};
    const updatedAnswers = {
      ...currentAnswers,
      [blankIndex]: value,
    };

    setAnswers((prev) => ({
      ...prev,
      [questionId]: updatedAnswers,
    }));

    saveAnswerDebounced(questionId, questionType, updatedAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAutoSubmit = async () => {
    if (isSubmitting || !attempt) return;

    setIsSubmitting(true);

    try {
      const savePromises = Object.entries(answers).map(([questionId, answer]) => {
        const questionIndex = parseInt(questionId);
        const question = quiz.questions[questionIndex];
        const questionType = question?.type || question?.questionType || "multiple-choice";

        return attemptClient.saveQuestionAnswer(attempt._id, questionId, questionType, answer);
      });

      await Promise.all(savePromises);
      await attemptClient.submitQuiz(attempt._id);
      router.push(`/Courses/${cid}/Quizzes/${qid}/attempt/${attempt._id}`);
    } catch (error) {
      console.error("Error auto-submitting quiz:", error);
      setError("Time expired. Quiz has been submitted automatically.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const confirmSubmit = window.confirm(
      "Are you sure you want to submit this quiz? You cannot change your answers after submission."
    );

    if (!confirmSubmit) return;

    if (!attempt) {
      alert("No active attempt found. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const savePromises = Object.entries(answers).map(([questionId, answer]) => {
        const questionIndex = parseInt(questionId);
        const question = quiz.questions[questionIndex];
        const questionType = question?.type || question?.questionType || "multiple-choice";

        return attemptClient.saveQuestionAnswer(attempt._id, questionId, questionType, answer);
      });

      await Promise.all(savePromises);
      await attemptClient.submitQuiz(attempt._id);
      router.push(`/Courses/${cid}/Quizzes/${qid}/attempt/${attempt._id}`);
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      alert(`Error submitting quiz: ${error.response?.data?.message || error.message || "Unknown error"}`);
      setIsSubmitting(false);
    }
  };

  // Access Code Modal
  if (showAccessCodeModal) {
    return (
      <Container className="mt-5">
        <Modal show={showAccessCodeModal} centered backdrop="static" keyboard={false}>
          <Modal.Header>
            <Modal.Title>Access Code Required</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>This quiz requires an access code to begin.</p>
            <Form.Group>
              <Form.Label>Enter Access Code</Form.Label>
              <Form.Control
                type="password"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAccessCodeSubmit();
                }}
                placeholder="Enter passcode"
                autoFocus
              />
              {accessCodeError && (
                <div className="text-danger mt-2 small">{accessCodeError}</div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}`)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleAccessCodeSubmit}>
              Submit
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="mt-3">
        <p>Loading quiz...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-3">
        <Alert variant="danger">
          <Alert.Heading>Quiz Not Available</Alert.Heading>
          <p>{error}</p>
        </Alert>
        <Button variant="secondary" onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}`)}>
          Back to Quiz Details
        </Button>
      </Container>
    );
  }

  if (!quiz || !attempt || !quiz.questions || quiz.questions.length === 0) {
    return (
      <Container className="mt-3">
        <Alert variant="warning">Quiz not found or has no questions.</Alert>
        <Button onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}`)}>
          Back to Quiz Details
        </Button>
      </Container>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const questionId = currentQuestionIndex.toString();
  const questionType = getQuestionType(currentQuestion);
  const allowMultipleAnswers = currentQuestion.allowMultipleAnswers || false;

  const isAnswered = (qIdx: number) => {
    const value = answers[qIdx.toString()];
    if (value === undefined || value === null) return false;
    if (typeof value === "object" && !Array.isArray(value)) {
      return Object.values(value).some((v) => v !== "" && v !== undefined);
    }
    if (Array.isArray(value)) {
      return value.length > 0 && value.some(v => v !== "" && v !== undefined);
    }
    return value !== "";
  };

  return (
    <Container className="mt-4" style={{ maxWidth: "900px" }}>
      {/* Timer Warning */}
      {timeRemaining !== null && timeRemaining <= 600 && (
        <Card className={`mb-3 ${timeRemaining < 120 ? "border-danger" : "border-warning"}`} style={{ borderWidth: "3px" }}>
          <Card.Body className="p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h5 className={`mb-0 ${timeRemaining < 120 ? "text-danger" : "text-warning"}`}>
                  ⏰ TIME REMAINING
                </h5>
                {timeRemaining < 120 && (
                  <strong className="text-danger">⚠️ WARNING: Less than 2 minutes remaining!</strong>
                )}
              </div>
              <div className={`fs-1 fw-bold ${timeRemaining < 120 ? "text-danger" : "text-warning"}`} style={{ fontFamily: "monospace" }}>
                {formatTime(timeRemaining)}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <div className="row">
        <div className="col-md-8">
          <h3 className="mb-3">{quiz.title}</h3>

          <div className="mb-3">
            <small className="text-muted">
              Attempt {attempt.attemptNumber} • Started: {new Date(attempt.startedAt).toLocaleString()}
            </small>
          </div>

          {currentQuestionIndex === 0 && quiz.description && (
            <Alert variant="info" className="mb-4">
              <strong>Quiz Instructions:</strong>
              <div dangerouslySetInnerHTML={{ __html: quiz.description }} />
            </Alert>
          )}

          {/* Question Display */}
          <div className="border rounded p-4 bg-white mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h5>Question {currentQuestionIndex + 1} of {quiz.questions.length}</h5>
              <span className="badge bg-secondary fs-6">{currentQuestion.points || 0} pts</span>
            </div>

            <div className="mb-4" dangerouslySetInnerHTML={{ __html: currentQuestion.question || "<p>No question text</p>" }} />

            {/* MULTIPLE CHOICE - Clickable boxes */}
            {questionType === "multiple-choice" && (
              <div>
                {(() => {
                  let choicesList: any[] = [];
                  if (Array.isArray(currentQuestion.choices) && currentQuestion.choices.length > 0) {
                    choicesList = currentQuestion.choices;
                  } else if (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
                    choicesList = currentQuestion.options.map((opt: string) => ({ text: opt }));
                  }

                  return choicesList.map((choice: any, idx: number) => {
                    const choiceText = typeof choice === "string" ? choice : (choice?.text || `Option ${idx + 1}`);
                    
                    // Handle multiple answers vs single answer
                    const currentAnswerValue = answers[questionId];
                    let isSelected = false;
                    
                    if (allowMultipleAnswers) {
                      // For multiple answers, check if this choice is in the array
                      isSelected = Array.isArray(currentAnswerValue) 
                        ? currentAnswerValue.includes(choiceText)
                        : false;
                    } else {
                      // For single answer, check equality
                      isSelected = currentAnswerValue === choiceText;
                    }

                    return (
                      <div
                        key={idx}
                        className={`mb-3 p-3 border rounded`}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (allowMultipleAnswers) {
                            // Toggle this choice in the array
                            const currentAnswers = Array.isArray(answers[questionId]) 
                              ? [...answers[questionId]] 
                              : [];
                            
                            if (currentAnswers.includes(choiceText)) {
                              // Remove if already selected
                              handleAnswerChange(currentAnswers.filter(a => a !== choiceText));
                            } else {
                              // Add if not selected
                              handleAnswerChange([...currentAnswers, choiceText]);
                            }
                          } else {
                            // Single answer mode
                            handleAnswerChange(choiceText);
                          }
                        }}
                      >
                        <Form.Check
                          type={allowMultipleAnswers ? "checkbox" : "radio"}
                          id={`choice-${questionId}-${idx}`}
                          name={`question-${questionId}`}
                          label={choiceText}
                          checked={isSelected}
                          onChange={() => {
                            if (allowMultipleAnswers) {
                              // Toggle logic
                              const currentAnswers = Array.isArray(answers[questionId]) 
                                ? [...answers[questionId]] 
                                : [];
                              
                              if (currentAnswers.includes(choiceText)) {
                                handleAnswerChange(currentAnswers.filter(a => a !== choiceText));
                              } else {
                                handleAnswerChange([...currentAnswers, choiceText]);
                              }
                            } else {
                              handleAnswerChange(choiceText);
                            }
                          }}
                          className="fs-5"
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    );
                  });
                })()}
                {allowMultipleAnswers && (
                  <div className="mt-2 text-muted small">
                    <em>Select all that apply (multiple answers allowed)</em>
                  </div>
                )}
              </div>
            )}

            {/* TRUE/FALSE - Clickable boxes */}
            {questionType === "true-false" && (
              <div>
                {[true, false].map((value) => {
                  const selected = answers[questionId] === value;
                  return (
                    <div
                      key={value.toString()}
                      className={`mb-3 p-3 border rounded`}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleAnswerChange(value)}
                    >
                      <Form.Check
                        type="radio"
                        id={`tf-${questionId}-${value}`}
                        name={`question-${questionId}`}
                        label={value ? "True" : "False"}
                        className="fs-5"
                        checked={selected}
                        onChange={() => handleAnswerChange(value)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* FILL IN THE BLANKS - Multiple blanks support */}
            {questionType === "fill-in-blank" && (
              <div>
                {Array.isArray(currentQuestion.blanks) && currentQuestion.blanks.length > 1 ? (
                  // Multiple blanks - show separate input for each
                  <div>
                    <p className="text-muted small mb-3">Fill in each blank below (partial credit available):</p>
                    {currentQuestion.blanks.map((blank: any, index: number) => {
                      const currentAnswers = answers[questionId] || {};
                      return (
                        <div key={index} className="mb-3">
                          <Form.Label className="fw-semibold">Blank [{index + 1}]:</Form.Label>
                          <Form.Control
                            type="text"
                            value={currentAnswers[index] || ""}
                            onChange={(e) => handleBlankAnswerChange(index, e.target.value)}
                            placeholder={`Answer for blank ${index + 1}`}
                            style={{ maxWidth: "400px" }}
                            className="fs-5"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Single blank - show one input
                  <div>
                    <Form.Label className="fw-semibold">Your Answer:</Form.Label>
                    <Form.Control
                      type="text"
                      value={answers[questionId] ?? ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Type your answer here"
                      style={{ maxWidth: "400px" }}
                      className="fs-5"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mb-4">
            <Button variant="secondary" onClick={handlePrevious} disabled={currentQuestionIndex === 0} size="lg">
              ← Previous
            </Button>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <Button variant="primary" onClick={handleNext} size="lg">
                Next →
              </Button>
            ) : (
              <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting} size="lg">
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            )}
          </div>

          <div className="text-center text-muted mb-3">
            <small>✓ Your answers are being saved automatically</small>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-md-4">
          <div className="border rounded p-3 bg-white position-sticky shadow-sm" style={{ top: "20px" }}>
            {timeRemaining !== null && (
              <Card className={`mb-3 ${timeRemaining < 300 ? "border-danger" : "border-primary"}`}>
                <Card.Body className="text-center p-3">
                  <h6 className="mb-2">Time Remaining</h6>
                  <div className={`fs-2 fw-bold ${timeRemaining < 300 ? "text-danger" : "text-primary"}`} style={{ fontFamily: "monospace" }}>
                    {formatTime(timeRemaining)}
                  </div>
                  {timeRemaining < 120 && (
                    <small className="text-danger fw-bold">Time is running out!</small>
                  )}
                </Card.Body>
              </Card>
            )}

            <h6 className="mb-3">Questions</h6>
            <div className="d-grid gap-2">
              {quiz.questions.map((q: any, idx: number) => {
                const answered = isAnswered(idx);
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <Button
                    key={idx}
                    variant={isCurrent ? "outline-primary" : answered ? "outline-success" : "outline-secondary"}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className="text-start"
                  >
                    {answered ? "✓ " : "○ "}
                    Question {idx + 1}
                  </Button>
                );
              })}
            </div>

            <hr />

            <div className="text-center">
              <strong
                className={
                  Object.keys(answers).filter((key) => isAnswered(parseInt(key))).length ===
                  quiz.questions.length
                    ? "text-success"
                    : "text-muted"
                }
              >
                Answered: {Object.keys(answers).filter((key) => isAnswered(parseInt(key))).length} /{" "}
                {quiz.questions.length}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}