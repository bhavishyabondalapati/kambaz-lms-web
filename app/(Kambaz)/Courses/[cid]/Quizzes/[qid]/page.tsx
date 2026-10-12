/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Container, Alert, Badge, Table } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../store";
import * as client from "../client";
import * as attemptClient from "../attemptClient";
import { updateQuiz as updateQuizInStore } from "../reducer";
import { LuPencil } from "react-icons/lu";

const formatDateTime = (value?: string | Date) => {
  if (!value) return "Not set";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
};

export default function QuizDetailsPage() {
  const { cid, qid } = useParams() as { cid: string; qid: string };
  const router = useRouter();
  const dispatch = useDispatch();

  const [quiz, setQuiz] = useState<any | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { currentUser } = useSelector(
    (state: RootState) => state.accountReducer
  );
  const isFaculty = (currentUser as any)?.role === "FACULTY";
  const isStudent = !isFaculty;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await client.findQuizById(qid);
        setQuiz(data);

        // Load attempts for students
        if (isStudent) {
          try {
            const attemptsData = await attemptClient.getMyQuizAttempts(qid);
            setAttempts(attemptsData || []);
          } catch (error) {
            console.error("Error loading attempts:", error);
            setAttempts([]);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading quiz:", error);
        setLoading(false);
      }
    };
    load();
  }, [qid, isStudent]);

  const handleTogglePublish = async () => {
    if (!quiz) return;
    const updated = await client.updateQuiz({
      ...quiz,
      published: !quiz.published,
    });
    setQuiz(updated);
    dispatch(updateQuizInStore(updated));
  };

  // Check if quiz is available
  const isQuizAvailable = () => {
    if (!quiz) return false;
    if (!quiz.published && isStudent) return false;

    const now = new Date();

    if (quiz.availableDate) {
      const availableDate = new Date(quiz.availableDate);
      if (now < availableDate) return false;
    }

    if (quiz.untilDate) {
      const untilDate = new Date(quiz.untilDate);
      if (now > untilDate) return false;
    }

    return true;
  };

  const getAvailabilityMessage = () => {
    if (!quiz) return "";
    const now = new Date();

    if (quiz.availableDate && now < new Date(quiz.availableDate)) {
      return `This quiz is locked until ${formatDateTime(quiz.availableDate)}.`;
    }

    if (quiz.untilDate && now > new Date(quiz.untilDate)) {
      return `This quiz was locked ${formatDateTime(quiz.untilDate)}.`;
    }

    return "";
  };

  const canTakeQuiz = () => {
    if (!isQuizAvailable()) {
      return { can: false, reason: getAvailabilityMessage() as string };
    }

    // Check if there's an in-progress attempt
    const inProgress = attempts.find((a) => a.status === "IN_PROGRESS");
    if (inProgress) {
      return {
        can: true,
        reason: "Resume Quiz",
        attemptId: inProgress._id,
        isResume: true,
      };
    }

    // Check attempt limit
    const submittedAttempts = attempts.filter(
      (a) => a.status === "GRADED" || a.status === "SUBMITTED"
    ).length;

    if (!quiz.multipleAttempts && submittedAttempts >= 1) {
      return { can: false, reason: "You have already completed this quiz" };
    }

    if (
      quiz.multipleAttempts &&
      quiz.attemptsAllowed &&
      submittedAttempts >= quiz.attemptsAllowed
    ) {
      return {
        can: false,
        reason: `You have used all ${quiz.attemptsAllowed} attempts`,
      };
    }

    return { can: true, reason: "Take the Quiz", isResume: false as const };
  };

  const handleTakeQuiz = () => {
    if (!quiz) return;

    const status = canTakeQuiz();
    if (!status.can) return;

    // Navigate to the TAKE page (not results page)
    router.push(`/Courses/${cid}/Quizzes/${qid}/take`);
  };

  const quizStatus = canTakeQuiz();

  // Get the highest scoring attempt
  const getHighestAttempt = () => {
    if (attempts.length === 0) return null;
    
    const gradedAttempts = attempts.filter(
      (a) => a.status === "GRADED" || a.status === "SUBMITTED"
    );
    
    if (gradedAttempts.length === 0) return null;
    
    // Find the attempt with the highest score
    return gradedAttempts.reduce((highest, current) => {
      // Calculate percentage for comparison
      const highestPercentage = (highest.score / highest.totalPoints) * 100;
      const currentPercentage = (current.score / current.totalPoints) * 100;
      
      return currentPercentage > highestPercentage ? current : highest;
    }, gradedAttempts[0]);
  };

  // Get the latest attempt (most recent)
  const getLatestAttempt = () => {
    if (attempts.length === 0) return null;
    
    const gradedAttempts = attempts.filter(
      (a) => a.status === "GRADED" || a.status === "SUBMITTED"
    );
    
    if (gradedAttempts.length === 0) return null;
    
    // Sort by submittedAt date (most recent first)
    return [...gradedAttempts].sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )[0];
  };

  if (loading) {
    return (
      <Container className="mt-3">
        Loading quiz...
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="mt-3">
        <Alert variant="warning">Quiz not found.</Alert>
      </Container>
    );
  }

  const attemptsAllowed = quiz.attemptsAllowed ?? quiz.howManyAttempts ?? 1;
  const submittedAttempts = attempts.filter(
    (a) => a.status === "GRADED" || a.status === "SUBMITTED"
  );
  
  const highestAttempt = getHighestAttempt();
  const latestAttempt = getLatestAttempt();

  return (
    <Container className="mt-4" style={{ maxWidth: "1000px" }}>
      {/* Faculty Actions */}
      {isFaculty && (
        <div className="d-flex gap-2 mb-4">
          <Button
            variant={quiz.published ? "outline-secondary" : "success"}
            onClick={handleTogglePublish}
          >
            {quiz.published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="outline-primary"
            onClick={() =>
              router.push(`/Courses/${cid}/Quizzes/${qid}/preview`)
            }
          >
            Preview
          </Button>
          <Button
            variant="outline-danger"
            onClick={() =>
              router.push(`/Courses/${cid}/Quizzes/${qid}/editor`)
            }
            className="d-flex align-items-center"
          >
            <LuPencil /> Edit
          </Button>
        </div>
      )}

      {/* Quiz Title */}
      <h2 className="mb-4">{quiz.title}</h2>

      {/* Main Content Row */}
      <div className="row">
        {/* Left Column - Quiz Details */}
        <div className="col-md-8">
          {/* Quiz Meta Info */}
          <div className="mb-3">
            <strong>Due:</strong> {formatDateTime(quiz.dueDate)} |
            <strong className="ms-2">Points:</strong> {quiz.points || 0} |
            <strong className="ms-2">Questions:</strong>{" "}
            {quiz.questions?.length || 0}
          </div>

          {quiz.timeLimit && quiz.timeLimit > 0 && (
            <div className="mb-3">
              <strong>Time Limit:</strong> {quiz.timeLimit} Minutes
            </div>
          )}

          {/* Instructions */}
          {quiz.description && (
            <div className="mb-4">
              <h5>Instructions</h5>
              <div
                className="p-3 border rounded bg-light"
                dangerouslySetInnerHTML={{ __html: quiz.description }}
              />
            </div>
          )}

          {/* Locked Message for Students */}
          {isStudent && !isQuizAvailable() && (
            <Alert variant="warning">
              <strong>🔒 {quizStatus.reason}</strong>
            </Alert>
          )}

          {/* Take / Resume Quiz Button for Students */}
          {isStudent && quizStatus.can && (
            <div className="text-center my-4">
              <Button variant="danger" size="lg" onClick={handleTakeQuiz}>
                {quizStatus.reason}
              </Button>
            </div>
          )}

          {/* Cannot Take Quiz Message */}
          {isStudent && !quizStatus.can && isQuizAvailable() && (
            <Alert variant="info">
              <strong>ℹ️ {quizStatus.reason}</strong>
            </Alert>
          )}

          {/* Attempt History for Students */}
          {isStudent && submittedAttempts.length > 0 && (
            <div className="mt-4">
              <h5>Attempt History</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th></th>
                    <th>Attempt</th>
                    <th>Submitted</th>
                    <th>Time</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedAttempts
                    .sort((a, b) => b.attemptNumber - a.attemptNumber)
                    .map((attempt) => {
                      const isHighest = highestAttempt?._id === attempt._id;
                      const isLatest = latestAttempt?._id === attempt._id;
                      
                      return (
                        <tr key={attempt._id}>
                          <td>
                            {isLatest && <Badge bg="primary" className="me-1">LATEST</Badge>}
                            {isHighest && <Badge bg="success">HIGHEST</Badge>}
                          </td>
                          <td>
                            <Button
                              variant="link"
                              onClick={() =>
                                router.push(
                                  `/Courses/${cid}/Quizzes/${qid}/attempt/${attempt._id}`
                                )
                              }
                            >
                              Attempt {attempt.attemptNumber}
                            </Button>
                          </td>
                          <td>{formatDateTime(attempt.submittedAt)}</td>
                          <td>{formatTime(attempt.timeSpent || 0)}</td>
                          <td>
                            {attempt.score} out of {attempt.totalPoints} 
                            {isHighest && <span className="text-success ms-2">✓</span>}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </div>
          )}

          {/* Quiz Settings Details */}
          <div className="border rounded p-4 bg-white mt-4">
            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">Quiz Type</div>
              <div className="col-7">{quiz.quizType || "Graded Quiz"}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">Points</div>
              <div className="col-7">{quiz.points || 0}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">Assignment Group</div>
              <div className="col-7">{quiz.assignmentGroup || "QUIZZES"}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">Shuffle Answers</div>
              <div className="col-7">
                {quiz.shuffleAnswers ? "Yes" : "No"}
              </div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">Time Limit</div>
              <div className="col-7">
                {quiz.timeLimit && quiz.timeLimit > 0
                  ? `${quiz.timeLimit} Minutes`
                  : "No time limit"}
              </div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">
                Multiple Attempts
              </div>
              <div className="col-7">
                {quiz.multipleAttempts
                  ? `Yes (${attemptsAllowed} attempts)`
                  : "No"}
              </div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">View Responses</div>
              <div className="col-7">Always</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">
                Show Correct Answers
              </div>
              <div className="col-7">
                {quiz.showCorrectAnswers || "Immediately"}
              </div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">Access Code</div>
              <div className="col-7">
                {quiz.accessCode && quiz.accessCode.trim() !== ""
                  ? quiz.accessCode
                  : "None"}
              </div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">
                One Question at a Time
              </div>
              <div className="col-7">
                {quiz.oneQuestionAtATime ? "Yes" : "No"}
              </div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">
                Require Respondus LockDown Browser
              </div>
              <div className="col-7">No</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">
                Required to View Quiz Results
              </div>
              <div className="col-7">No</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 text-end fw-semibold">Webcam Required</div>
              <div className="col-7">
                {quiz.webcamRequired ? "Yes" : "No"}
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-5 text-end fw-semibold">
                Lock Questions After Answering
              </div>
              <div className="col-7">
                {quiz.lockQuestionsAfterAnswering ? "Yes" : "No"}
              </div>
            </div>

            {/* Due Date Table */}
            <Table bordered className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Due</th>
                  <th>For</th>
                  <th>Available from</th>
                  <th>Until</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatDateTime(quiz.dueDate)}</td>
                  <td>Everyone</td>
                  <td>{formatDateTime(quiz.availableDate)}</td>
                  <td>{formatDateTime(quiz.untilDate)}</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>

        {/* Right Column - Submission Details Sidebar (Students Only) */}
        {isStudent && (
          <div className="col-md-4">
            <div className="border rounded p-3 bg-light">
              <h6 className="fw-bold mb-3">Submission details:</h6>
              
              {latestAttempt && (
                <>
                  <div className="mb-2">
                    <strong>Time spent:</strong>{" "}
                    <span className="float-end">
                      {formatTime(latestAttempt.timeSpent || 0)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong>Latest score:</strong>{" "}
                    <span className="float-end">
                      {latestAttempt.score} out of {latestAttempt.totalPoints}
                    </span>
                  </div>
                </>
              )}
              
              {highestAttempt && (
                <div className="mb-2">
                  <strong>Kept score (highest):</strong>{" "}
                  <span className="float-end text-success fw-bold">
                    {highestAttempt.score} out of {highestAttempt.totalPoints}
                  </span>
                </div>
              )}
              
              {submittedAttempts.length > 0 && (
                <div className="mb-2">
                  <strong>Attempts used:</strong>{" "}
                  <span className="float-end">
                    {submittedAttempts.length} of {attemptsAllowed}
                  </span>
                </div>
              )}
              
              {!submittedAttempts.length && (
                <div className="text-center text-muted">
                  <small>No attempts submitted yet</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="d-flex justify-content-end gap-2 pt-3 mt-4">
        <Button
          variant="light"
          className="px-4"
          style={{ border: "1px solid #ccc" }}
          onClick={() => router.push(`/Courses/${cid}/Quizzes`)}
        >
          Back
        </Button>
      </div>
    </Container>
  );
}