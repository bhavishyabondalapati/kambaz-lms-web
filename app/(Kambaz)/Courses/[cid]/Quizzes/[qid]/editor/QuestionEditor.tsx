/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { FaTrash, FaCheck, FaCheckSquare } from "react-icons/fa";

interface QuestionEditorProps {
  question: any;
  onSave: (question: any) => void;
  onCancel: () => void;
  onDelete: () => void;
}

type QuestionType = "multiple-choice" | "true-false" | "fill-in-blank";

type Choice = {
  text: string;
  correct: boolean;
};

interface FormState {
  title: string;
  type: QuestionType;
  points: number;
  question: string;
  choices: Choice[];
  correctAnswer: any;
  blanks: string[];
  allowMultipleAnswers: boolean;
}

const defaultChoices: Choice[] = [
  { text: "", correct: true },
  { text: "", correct: false },
  { text: "", correct: false },
];

export default function QuestionEditor({
  question,
  onSave,
  onCancel,
  onDelete,
}: QuestionEditorProps) {
  const [formData, setFormData] = useState<FormState>({
    title: "Question",
    type: "multiple-choice",
    points: 4,
    question: "",
    choices: defaultChoices,
    correctAnswer: null,
    blanks: [""],
    allowMultipleAnswers: false,
  });

  // Initialize form from incoming question (both old and new formats)
  useEffect(() => {
    if (!question) return;

    const type: QuestionType =
      (question.type as QuestionType) || "multiple-choice";

    const points = typeof question.points === "number" ? question.points : 4;
    const title = question.title || "Question";
    const questionText = question.question || "";
    const rawCorrect = question.correctAnswer;
    const allowMultiple =
      Array.isArray(rawCorrect) || question.allowMultipleAnswers || false;

    let choices: Choice[] = [];
    let blanks: string[] = [];
    let correctAnswer: any = rawCorrect ?? null;

    if (type === "multiple-choice") {
      // Build choices from various possible shapes
      if (Array.isArray(question.choices) && question.choices.length > 0) {
        if (typeof question.choices[0] === "string") {
          // choices as strings
          choices = question.choices.map((text: string) => ({
            text,
            correct: allowMultiple
              ? Array.isArray(rawCorrect)
                ? rawCorrect.includes(text)
                : rawCorrect === text
              : rawCorrect === text,
          }));
        } else {
          // choices as { text, correct }
          choices = question.choices.map((c: any) => ({
            text: c.text ?? "",
            correct: !!c.correct,
          }));
        }
      } else if (Array.isArray(question.options) && question.options.length > 0) {
        choices = question.options.map((text: string) => ({
          text,
          correct: allowMultiple
            ? Array.isArray(rawCorrect)
              ? rawCorrect.includes(text)
              : rawCorrect === text
            : rawCorrect === text,
        }));
      } else {
        choices = defaultChoices;
      }
    }

    if (type === "true-false") {
      // Normalize to boolean; default to true
      correctAnswer =
        typeof rawCorrect === "boolean"
          ? rawCorrect
          : rawCorrect === "false"
          ? false
          : true;
    }

    if (type === "fill-in-blank") {
      if (Array.isArray(question.blanks) && question.blanks.length > 0) {
        blanks = question.blanks.map((b: any) => String(b ?? ""));
      } else if (Array.isArray(rawCorrect) && rawCorrect.length > 0) {
        blanks = rawCorrect.map((b: any) => String(b ?? ""));
      } else if (typeof rawCorrect === "string" && rawCorrect.trim() !== "") {
        blanks = [rawCorrect];
      } else {
        blanks = [""];
      }
      correctAnswer = blanks;
    }

    setFormData({
      title,
      type,
      points,
      question: questionText,
      choices: choices.length > 0 ? choices : defaultChoices,
      correctAnswer,
      blanks: blanks.length > 0 ? blanks : [""],
      allowMultipleAnswers: allowMultiple,
    });
  }, [question]);

  const handleChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (newType: QuestionType) => {
    setFormData((prev) => {
      const base: FormState = {
        ...prev,
        type: newType,
        allowMultipleAnswers: false,
      };

      if (newType === "multiple-choice") {
        return {
          ...base,
          choices: defaultChoices,
          correctAnswer: null,
          blanks: [""],
        };
      }

      if (newType === "true-false") {
        return {
          ...base,
          correctAnswer: true,
          choices: [],
          blanks: [""],
        };
      }

      // fill-in-blank
      return {
        ...base,
        blanks: [""],
        correctAnswer: [""],
        choices: [],
      };
    });
  };

  // MULTIPLE CHOICE handlers
  const handleAddChoice = () => {
    setFormData((prev) => ({
      ...prev,
      choices: [...prev.choices, { text: "", correct: false }],
    }));
  };

  const handleRemoveChoice = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index),
    }));
  };

  const handleChoiceTextChange = (index: number, text: string) => {
    setFormData((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, i) =>
        i === index ? { ...choice, text } : choice
      ),
    }));
  };

  const handleCorrectChoiceChange = (index: number) => {
    setFormData((prev) => {
      if (prev.allowMultipleAnswers) {
        return {
          ...prev,
          choices: prev.choices.map((choice, i) =>
            i === index ? { ...choice, correct: !choice.correct } : choice
          ),
        };
      }
      return {
        ...prev,
        choices: prev.choices.map((choice, i) => ({
          ...choice,
          correct: i === index,
        })),
      };
    });
  };

  // FILL-IN-BLANK handlers
  const handleAddBlank = () => {
    setFormData((prev) => ({
      ...prev,
      blanks: [...prev.blanks, ""],
    }));
  };

  const handleRemoveBlank = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      blanks: prev.blanks.filter((_, i) => i !== index),
    }));
  };

  const handleBlankChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      blanks: prev.blanks.map((blank, i) => (i === index ? value : blank)),
    }));
  };

  const buildPayload = (): any => {
    const payload: any = {
      ...question, // keep _id and any extra fields
      title: formData.title,
      type: formData.type,
      points: formData.points,
      question: formData.question,
      allowMultipleAnswers: formData.allowMultipleAnswers,
    };

    if (formData.type === "multiple-choice") {
      payload.choices = formData.choices.map((c) => ({
        text: c.text,
        correct: !!c.correct,
      }));

      if (formData.allowMultipleAnswers) {
        const correctTexts = formData.choices
          .filter((c) => c.correct)
          .map((c) => c.text || "");
        payload.correctAnswer = correctTexts;
      } else {
        const correctChoice = formData.choices.find((c) => c.correct);
        payload.correctAnswer = correctChoice ? correctChoice.text || "" : null;
      }
    }

    if (formData.type === "true-false") {
      payload.correctAnswer =
        formData.correctAnswer === false ? false : true; // default to true
      payload.choices = undefined;
      payload.blanks = undefined;
    }

    if (formData.type === "fill-in-blank") {
      const cleanedBlanks = formData.blanks.map((b) => b || "");
      payload.blanks = cleanedBlanks;
      payload.correctAnswer = cleanedBlanks;
      payload.choices = undefined;
    }

    return payload;
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    onSave(payload);
  };

  return (
    <div
      className="border rounded p-4 bg-white mb-3"
      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
    >
      {/* Header */}
      <div className="row mb-3">
        <div className="col-md-4">
          <Form.Control
            type="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Question Title"
          />
        </div>
        <div className="col-md-5">
          <Form.Select
            value={formData.type}
            onChange={(e) =>
              handleTypeChange(e.target.value as QuestionType)
            }
          >
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="fill-in-blank">Fill in the Blanks</option>
          </Form.Select>
        </div>
        <div className="col-md-3">
          <div className="d-flex align-items-center">
            <span className="me-2">pts:</span>
            <Form.Control
              type="number"
              value={formData.points}
              onChange={(e) =>
                handleChange("points", parseInt(e.target.value, 10) || 0)
              }
              min={0}
              style={{ width: "80px" }}
            />
          </div>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-muted small mb-3">
        {formData.type === "multiple-choice" &&
          "Enter the question and multiple answers, then mark which answers are correct."}
        {formData.type === "true-false" &&
          "Enter the question text, then choose whether True or False is correct."}
        {formData.type === "fill-in-blank" &&
          "Enter the question text and the correct answers for each blank."}
      </p>

      {/* Question text */}
      <Form.Group className="mb-4">
        <Form.Label className="fw-semibold">Question:</Form.Label>
        <div className="border rounded" style={{ backgroundColor: "#fafafa" }}>
          <Form.Control
            as="textarea"
            rows={4}
            value={formData.question}
            onChange={(e) => handleChange("question", e.target.value)}
            placeholder={
              formData.type === "fill-in-blank"
                ? 'Example: "The ___1___ is the largest planet, and ___2___ is the smallest."'
                : "Enter your question text"
            }
            style={{ border: "none", resize: "none" }}
            className="p-3"
          />
        </div>
      </Form.Group>

      {/* MULTIPLE CHOICE */}
      {formData.type === "multiple-choice" && (
        <div className="mb-4">
          <div className="mb-3">
            <Form.Check
              type="checkbox"
              id="allowMultipleAnswers"
              label="Allow multiple correct answers"
              checked={formData.allowMultipleAnswers}
              onChange={(e) =>
                handleChange("allowMultipleAnswers", e.target.checked)
              }
            />
          </div>

          <Form.Label className="fw-semibold">Answers:</Form.Label>
          {formData.choices.map((choice, index) => (
            <div key={index} className="mb-3">
              <div className="d-flex align-items-start gap-2">
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => handleCorrectChoiceChange(index)}
                    style={{ textDecoration: "none" }}
                  >
                    {formData.allowMultipleAnswers ? (
                      choice.correct ? (
                        <FaCheckSquare
                          className="text-success"
                          style={{ fontSize: "20px" }}
                        />
                      ) : (
                        <span style={{ color: "#ccc", fontSize: "20px" }}>
                          □
                        </span>
                      )
                    ) : choice.correct ? (
                      <FaCheck
                        className="text-success"
                        style={{ fontSize: "20px" }}
                      />
                    ) : (
                      <span style={{ color: "#ccc", fontSize: "20px" }}>○</span>
                    )}
                  </button>
                </div>
                <div className="flex-grow-1">
                  <div className="small text-muted mb-1">
                    {choice.correct ? "Correct Answer" : "Possible Answer"}
                    {formData.allowMultipleAnswers && choice.correct && " (Multiple allowed)"}
                  </div>
                  <Form.Control
                    type="text"
                    value={choice.text}
                    onChange={(e) =>
                      handleChoiceTextChange(index, e.target.value)
                    }
                    placeholder={`Answer ${index + 1}`}
                  />
                </div>
                <div className="d-flex gap-2 mt-4">
                  {formData.choices.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-link text-secondary p-0"
                      onClick={() => handleRemoveChoice(index)}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="text-center mt-3">
            <Button
              variant="link"
              onClick={handleAddChoice}
              className="text-danger text-decoration-none"
            >
              + Add Another Answer
            </Button>
          </div>
        </div>
      )}

      {/* TRUE/FALSE */}
      {formData.type === "true-false" && (
        <div className="mb-4">
          <Form.Label className="fw-semibold">Correct Answer:</Form.Label>
          <div className="mb-2 d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => handleChange("correctAnswer", true)}
              style={{ textDecoration: "none" }}
            >
              {formData.correctAnswer === true ? (
                <FaCheck
                  className="text-success"
                  style={{ fontSize: "20px" }}
                />
              ) : (
                <span style={{ color: "#ccc", fontSize: "20px" }}>○</span>
              )}
            </button>
            <span className="fw-semibold">True</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => handleChange("correctAnswer", false)}
              style={{ textDecoration: "none" }}
            >
              {formData.correctAnswer === false ? (
                <FaCheck
                  className="text-success"
                  style={{ fontSize: "20px" }}
                />
              ) : (
                <span style={{ color: "#ccc", fontSize: "20px" }}>○</span>
              )}
            </button>
            <span className="fw-semibold">False</span>
          </div>
        </div>
      )}

      {/* FILL-IN-BLANK */}
      {formData.type === "fill-in-blank" && (
        <div className="mb-4">
          <Form.Label className="fw-semibold">
            Correct Answers for Each Blank:
          </Form.Label>
          <p className="text-muted small">
            Define the correct answer for each blank. Answers are
            case-insensitive.
          </p>
          {formData.blanks.map((blank, index) => (
            <div key={index} className="mb-3 border rounded p-3 bg-light">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="fw-semibold">Blank {index + 1}</span>
                {formData.blanks.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-link text-secondary p-0 ms-auto"
                    onClick={() => handleRemoveBlank(index)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
              <Form.Control
                type="text"
                value={blank}
                onChange={(e) => handleBlankChange(index, e.target.value)}
                placeholder={`Correct answer for blank [${index + 1}]`}
              />
              <Form.Text className="text-muted">
                Worth{" "}
                {(
                  formData.points / Math.max(1, formData.blanks.length)
                ).toFixed(2)}{" "}
                points
              </Form.Text>
            </div>
          ))}
          <div className="text-center mt-3">
            <Button
              variant="link"
              onClick={handleAddBlank}
              className="text-danger text-decoration-none"
            >
              + Add Another Blank
            </Button>
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <div className="d-flex justify-content-between pt-3 border-top">
        <div className="d-flex gap-2">
          <Button
            variant="light"
            onClick={onCancel}
            style={{ border: "1px solid #ccc" }}
          >
            Cancel
          </Button>
          <Button variant="outline-danger" onClick={onDelete}>
            Delete Question
          </Button>
        </div>
        <Button variant="danger" onClick={handleSubmit}>
          Update Question
        </Button>
      </div>
    </div>
  );
}
