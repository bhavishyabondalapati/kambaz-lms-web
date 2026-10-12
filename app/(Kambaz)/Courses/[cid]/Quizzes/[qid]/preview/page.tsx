/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Container, Form, Alert, Card } from "react-bootstrap";
import * as client from "../../client";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../store";

export default function QuizPreviewPage() {
  const { cid, qid } = useParams() as { cid: string; qid: string };
  const router = useRouter();
  const [quiz, setQuiz] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime] = useState(new Date());
  const { currentUser } = useSelector((state: RootState) => state.accountReducer);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await client.findQuizById(qid);
        setQuiz(data);
      } catch (error) {
        console.error("Error loading quiz:", error);
      }
    };
    load();
  }, [qid]);

  if (!quiz) {
    return (
      <Container className="mt-3">
        <p>Loading quiz...</p>
      </Container>
    );
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <Container className="mt-3" style={{ maxWidth: "900px" }}>
        <h3 className="mb-3">{quiz.title}</h3>
        <Alert variant="warning">
          This quiz has no questions yet. Add questions in the editor first.
        </Alert>
        <Button
          variant="primary"
          onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/editor`)}
        >
          Go to Editor
        </Button>
      </Container>
    );
  }

  const questions = quiz.questions;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  // ✅ Same question-type detection as QuizTakingPage
  const getQuestionType = (
    q: any
  ): "multiple-choice" | "true-false" | "fill-in-blank" => {
    // PRIORITY 1: explicit type
    const explicitType = (q.type || q.questionType || "")
      .toString()
      .toLowerCase()
      .trim();

    if (explicitType.includes("true") || explicitType.includes("false")) {
      return "true-false";
    }

    if (explicitType.includes("fill") || explicitType.includes("blank")) {
      return "fill-in-blank";
    }

    if (explicitType.includes("multiple") || explicitType.includes("choice")) {
      return "multiple-choice";
    }

    // PRIORITY 2: structure
    if (typeof q.correctAnswer === "boolean") {
      return "true-false";
    }

    // IMPORTANT: check for choices/options BEFORE blanks
    if (
      (Array.isArray(q.choices) && q.choices.length > 0) ||
      (Array.isArray(q.options) && q.options.length > 0)
    ) {
      return "multiple-choice";
    }

    if (Array.isArray(q.blanks) && q.blanks.length > 0) {
      return "fill-in-blank";
    }

    // DEFAULT
    return "multiple-choice";
  };

  const questionType = getQuestionType(currentQuestion);
  const allowMultipleAnswers = currentQuestion.allowMultipleAnswers || false;

  const handleAnswerChange = (value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: value,
    }));
  };

  const handleBlankAnswerChange = (blankIndex: number, value: string) => {
    const currentAnswers = answers[currentQuestion._id] || {};
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: {
        ...currentAnswers,
        [blankIndex]: value,
      },
    }));
  };

  const handleNext = () => {
    setCurrentQuestionIndex((idx) => Math.min(totalQuestions - 1, idx + 1));
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((idx) => Math.max(0, idx - 1));
  };

  const handleSubmit = () => {
    alert("Quiz submitted! (This is a preview; answers are not stored.)");
    router.push(`/Courses/${cid}/Quizzes/${qid}`);
  };

  const formatStartTime = () => {
    return startTime.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isAnswered = (q: any) => {
    const value = answers[q._id];
    if (value === undefined || value === null) return false;
    if (typeof value === "object" && !Array.isArray(value)) {
      return Object.values(value).some((v) => v !== "" && v !== undefined);
    }
    if (Array.isArray(value)) {
      return value.length > 0 && value.some((v) => v !== "" && v !== undefined);
    }
    return value !== "";
  };

  // Helper function to extract choices from question
  const getChoicesList = (question: any) => {
    let choicesList: any[] = [];

    if (Array.isArray(question.choices) && question.choices.length > 0) {
      choicesList = question.choices;
    } else if (Array.isArray(question.options) && question.options.length > 0) {
      choicesList = question.options;
    } else if (question.answers && Array.isArray(question.answers)) {
      // Handle possible "answers" structure
      choicesList = question.answers.map((ans: any) => {
        if (typeof ans === "string") return ans;
        if (ans.text) return ans.text;
        if (ans.answerText) return ans.answerText;
        return JSON.stringify(ans);
      });
    } else if (question.correctAnswer !== undefined && question.possibleAnswers) {
      choicesList = question.possibleAnswers;
    }

    if (choicesList.length === 0) {
      choicesList = ["Option 1", "Option 2", "Option 3"];
    }

    return choicesList;
  };

  return (
    <Container className="mt-4" style={{ maxWidth: "900px" }}>
      <div className="row">
        <div className="col-md-8">
          <h3 className="mb-3">{quiz.title}</h3>

          {/* Similar info banner to "take" page */}
          <Alert variant="warning" className="mb-3 d-flex align-items-center">
            <span className="me-2">ℹ️</span>
            <span>
              This is a preview. Your responses are not stored.
              {currentUser && " (Faculty view)"}
            </span>
          </Alert>

          {quiz.description && (
            <Alert variant="info" className="mb-4">
              <strong>Quiz Instructions:</strong>
              <div dangerouslySetInnerHTML={{ __html: quiz.description }} />
            </Alert>
          )}

          {/* Question Display - styled similar to take page */}
          <Card className="mb-4 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5>
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </h5>
                <span className="badge bg-secondary fs-6">
                  {currentQuestion.points || 0} pts
                </span>
              </div>

              <div
                className="mb-4"
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.question || "<p>No question text</p>",
                }}
              />

              {/* MULTIPLE CHOICE */}
              {questionType === "multiple-choice" && (
                <div>
                  {(() => {
                    const choicesList = getChoicesList(currentQuestion);

                    if (choicesList.length === 0) {
                      return (
                        <p className="text-muted">No answer choices available</p>
                      );
                    }

                    const currentAnswerValue = answers[currentQuestion._id];

                    return choicesList.map((choice: any, idx: number) => {
                      const choiceText =
                        typeof choice === "string"
                          ? choice
                          : choice?.text || `Option ${idx + 1}`;

                      let selected = false;
                      if (allowMultipleAnswers) {
                        selected = Array.isArray(currentAnswerValue)
                          ? currentAnswerValue.includes(choiceText)
                          : false;
                      } else {
                        selected = currentAnswerValue === choiceText;
                      }

                      const optionId = `choice-${currentQuestion._id}-${idx}`;
                      const name = `question-${currentQuestion._id}`;

                      return (
                        <div
                          key={idx}
                          className={`mb-3 p-3 border rounded ${
                            selected
                              ? "bg-primary bg-opacity-10 border-primary"
                              : ""
                          }`}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            if (allowMultipleAnswers) {
                              const currentAnswers = Array.isArray(
                                currentAnswerValue
                              )
                                ? [...currentAnswerValue]
                                : [];

                              if (currentAnswers.includes(choiceText)) {
                                handleAnswerChange(
                                  currentAnswers.filter(
                                    (a: string) => a !== choiceText
                                  )
                                );
                              } else {
                                handleAnswerChange([
                                  ...currentAnswers,
                                  choiceText,
                                ]);
                              }
                            } else {
                              handleAnswerChange(choiceText);
                            }
                          }}
                        >
                          <Form.Check
                            type={allowMultipleAnswers ? "checkbox" : "radio"}
                            id={optionId}
                            name={name}
                            checked={selected}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (allowMultipleAnswers) {
                                const currentAnswers = Array.isArray(
                                  currentAnswerValue
                                )
                                  ? [...currentAnswerValue]
                                  : [];

                                if (currentAnswers.includes(choiceText)) {
                                  handleAnswerChange(
                                    currentAnswers.filter(
                                      (a: string) => a !== choiceText
                                    )
                                  );
                                } else {
                                  handleAnswerChange([
                                    ...currentAnswers,
                                    choiceText,
                                  ]);
                                }
                              } else {
                                handleAnswerChange(choiceText);
                              }
                            }}
                            label={choiceText}
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

              {/* TRUE/FALSE – fixed double label issue */}
              {questionType === "true-false" && (
                <div>
                  {[true, false].map((value) => {
                    const selected = answers[currentQuestion._id] === value;
                    const optionId = `tf-${currentQuestion._id}-${value}`;
                    const name = `question-${currentQuestion._id}`;

                    return (
                      <div
                        key={value.toString()}
                        className={`mb-3 p-3 border rounded ${
                          selected ? "bg-primary bg-opacity-10 border-primary" : ""
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleAnswerChange(value)}
                      >
                        <Form.Check
                          type="radio"
                          id={optionId}
                          name={name}
                          label={value ? "True" : "False"}
                          checked={selected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleAnswerChange(value);
                          }}
                          className="fs-5"
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* FILL IN THE BLANKS */}
              {questionType === "fill-in-blank" && (
                <div>
                  {Array.isArray(currentQuestion.blanks) &&
                  currentQuestion.blanks.length > 1 ? (
                    <div>
                      <p className="text-muted small mb-3">
                        Fill in each blank below:
                      </p>
                      {currentQuestion.blanks.map(
                        (_: any, index: number) => {
                          const currentAnswers =
                            answers[currentQuestion._id] || {};
                          return (
                            <div key={index} className="mb-3">
                              <Form.Label className="fw-semibold">
                                Blank {index + 1}:
                              </Form.Label>
                              <Form.Control
                                type="text"
                                value={currentAnswers[index] || ""}
                                onChange={(e) =>
                                  handleBlankAnswerChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                placeholder={`Answer for blank ${index + 1}`}
                                style={{ maxWidth: "400px" }}
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted small mb-2">
                        Type your answer below:
                      </p>
                      <Form.Control
                        type="text"
                        value={answers[currentQuestion._id] ?? ""}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Type your answer here"
                        style={{ maxWidth: "400px" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Navigation Buttons - similar layout */}
          <div className="d-flex justify-content-between mb-4">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              size="lg"
            >
              ← Previous
            </Button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button variant="primary" onClick={handleNext} size="lg">
                Next →
              </Button>
            ) : (
              <Button variant="danger" onClick={handleSubmit} size="lg">
                Submit Preview
              </Button>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 mb-4">
            <Button
              variant="outline-secondary"
              onClick={() =>
                router.push(`/Courses/${cid}/Quizzes/${qid}/editor`)
              }
            >
              Edit Quiz
            </Button>
          </div>

          <div className="text-center text-muted mb-3">
            <small>Quiz preview started at {formatStartTime()}</small>
          </div>
        </div>

        {/* Sidebar - styled like take page */}
        <div className="col-md-4">
          <div
            className="border rounded p-3 bg-white position-sticky shadow-sm"
            style={{ top: "20px" }}
          >
            <h6 className="mb-3">Questions</h6>
            <div className="d-grid gap-2">
              {questions.map((q: any, idx: number) => (
                <Button
                  key={q._id || idx}
                  variant={
                    idx === currentQuestionIndex
                      ? "outline-primary"
                      : isAnswered(q)
                      ? "outline-success"
                      : "outline-secondary"
                  }
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className="text-start"
                >
                  {isAnswered(q) ? "✓ " : "○ "}Question {idx + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
