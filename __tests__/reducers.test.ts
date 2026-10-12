// Unit tests for the Redux reducers. A reducer is a pure function
// (state, action) => newState, so we can test it without a browser or server.
//
//   npm test
import { describe, it, expect } from "vitest";
import accountReducer, { setCurrentUser } from "../app/(Kambaz)/Account/reducer";
import coursesReducer, {
  addNewCourse,
  deleteCourse,
  updateCourse,
  setCourses,
} from "../app/(Kambaz)/Courses/reducer";
import enrollmentsReducer, {
  addEnrollment,
  removeEnrollment,
} from "../app/(Kambaz)/Courses/enrollmentsReducer";
import quizzesReducer, {
  setQuizzes,
  addQuiz,
  updateQuiz,
  deleteQuiz,
} from "../app/(Kambaz)/Courses/[cid]/Quizzes/reducer";

describe("account reducer", () => {
  it("starts signed out and stores the user on sign-in", () => {
    const initial = accountReducer(undefined, { type: "@@init" });
    expect(initial.currentUser).toBeNull();

    const user = { _id: "2", username: "dark_knight" };
    expect(accountReducer(initial, setCurrentUser(user)).currentUser).toEqual(user);
  });
});

describe("courses reducer", () => {
  const react = { _id: "CS101", name: "React JS" };
  const python = { _id: "CS103", name: "Python" };

  it("keeps a server-assigned _id and generates one when missing", () => {
    let state = coursesReducer(undefined, addNewCourse(react));
    state = coursesReducer(state, addNewCourse({ name: "Draft" }));

    const courses = state.courses as { _id: string; name: string }[];
    expect(courses[0]._id).toBe("CS101");
    expect(courses[1]._id).toEqual(expect.any(String));
    expect(courses[1]._id).not.toBe("");
  });

  it("updates and deletes by _id without touching other courses", () => {
    let state = coursesReducer(undefined, setCourses([react, python]));
    state = coursesReducer(state, updateCourse({ ...react, name: "React 19" }));
    state = coursesReducer(state, deleteCourse("CS103"));

    expect(state.courses).toEqual([{ _id: "CS101", name: "React 19" }]);
  });
});

describe("enrollments reducer", () => {
  it("adds and removes an enrollment", () => {
    const e = { _id: "2-CS101", user: "2", course: "CS101" };
    let state = enrollmentsReducer(undefined, addEnrollment(e));
    expect(state.enrollments).toHaveLength(1);

    state = enrollmentsReducer(state, removeEnrollment(e));
    expect(state.enrollments).toHaveLength(0);
  });
});

describe("quizzes reducer", () => {
  it("supports the full create/update/delete cycle", () => {
    let state = quizzesReducer(undefined, setQuizzes([]));
    state = quizzesReducer(state, addQuiz({ _id: "Q1", title: "Draft", published: false }));
    state = quizzesReducer(state, updateQuiz({ _id: "Q1", title: "Final", published: true }));
    expect(state.quizzes).toEqual([{ _id: "Q1", title: "Final", published: true }]);

    state = quizzesReducer(state, deleteQuiz({ _id: "Q1" }));
    expect(state.quizzes).toEqual([]);
  });
});
