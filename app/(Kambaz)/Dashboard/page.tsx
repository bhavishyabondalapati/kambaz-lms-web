/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as client from "../Courses/client";
import { addNewCourse, deleteCourse, updateCourse, setCourses,} from "../Courses/reducer";
import {setEnrollments, addEnrollment, removeEnrollment,} from "../Courses/enrollmentsReducer";
import { redirect } from "next/navigation";
import { Button, Card, CardBody, CardImg, CardText, CardTitle, Col, Container, FormControl, Row } from "react-bootstrap";
import { current } from "@reduxjs/toolkit";

export default function Dashboard() {
  const { courses } = useSelector((state: any) => state.coursesReducer);
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const dispatch = useDispatch();
  const [course, setCourse] = useState<any>({
    _id: "0",
    name: "New Course",
    number: "New Number",
    startDate: "2023-09-10",
    endDate: "2023-12-15",
    image: "/images/blankimage.jpg",
    description: "New Description",
  });
  const fetchCourses = async () => {
    try {
      const courses = await client.findMyCourses();
      dispatch(setCourses(courses || []));
      const enrollments = await client.findEnrollmentsForUser(currentUser._id);
      dispatch(setEnrollments(enrollments));
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchCourses();
  }, [currentUser]);

  if (!currentUser) {
    redirect("/Account/Signin");
  }
  const studentView = currentUser.role === "STUDENT";
  const facultyView = currentUser.role === "FACULTY";

  const [showEnrollments, setShowEnrollments] = useState(false);

  const { enrollments } = useSelector((state: any) => state.enrollmentsReducer);

  const onAddNewCourse = async () => {
    const newCourse = await client.createCourse(course);
    dispatch(setCourses([...courses, newCourse]));
  };
  const onDeleteCourse = async (courseId: string) => {
    const status = await client.deleteCourse(courseId);
    dispatch(
      setCourses(courses.filter((course: any) => course._id !== courseId))
    );
  };
  const onUpdateCourse = async () => {
    await client.updateCourse(course);
    dispatch(
      setCourses(
        courses?.map((c: any) => {
          if (c._id === course._id) {
            return course;
          } else {
            return c;
          }
        })
      )
    );
  };

  const onShowEnrollments = async () => {
    setShowEnrollments(!showEnrollments);
    if (!showEnrollments) {
      const allcourses = await client.fetchAllCourses();
      dispatch(setCourses(allcourses));
    } else {
      const mycourses = await client.findMyCourses();
      dispatch(setCourses(mycourses));
    }
  };

  const onAddEnrollment = async (courseId: string) => {
    const newEnrollment = await client.enrollIntoCourse(
      currentUser._id,
      courseId
    );
    dispatch(addEnrollment(newEnrollment));
    console.log(enrollments);
  };

  const onRemoveEnrollment = async (courseId: string) => {
  await client.unenrollFromCourse(currentUser._id, courseId);

  const enrollment = enrollments.find(
    (e: any) => e.user === currentUser._id && e.course === courseId
  );
  if (enrollment) {
    dispatch(removeEnrollment(enrollment));
  }
};
  return (
    <Container id="wd-dashboard">
      <h1 id="wd-dashboard-title">Dashboard</h1>
      <hr />
      {!studentView && (
        <>
          <h5>
            New Course
            <button
              className="btn btn-success float-end"
              id="wd-add-new-course-click"
              onClick={onAddNewCourse}
            >
              Add
            </button>
            <button
              className="btn btn-warning float-end me-2"
              onClick={onUpdateCourse}
              id="wd-update-course-click"
            >
              Update
            </button>
          </h5>
          <br />
          <FormControl
            value={course.name}
            className="mb-2"
            onChange={(e) => setCourse({ ...course, name: e.target.value })}
          />
          <FormControl
            as="textarea"
            value={course.description}
            rows={3}
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
          />
          <hr />
        </>
      )}
      <h2 id="wd-dashboard-published">
        Published Courses (
        {
          courses.length
        }
        )
        {studentView && (
          <Button
            variant="primary"
            className="float-end"
            style={{ marginTop: "-4px" }}
            onClick={onShowEnrollments}
          >
            {showEnrollments ? "My Courses" : "Enrollments"}
          </Button>
        )}
      </h2>
      <hr />
      <div id="wd-dashboard-courses">
        <Row xs={1} md={5} className="g-4">
          {courses
            .map((course: any) => (
              <Col
                className="wd-dashboard-course"
                key={course._id}
                style={{ width: "300px" }}
              >
                <Card>
                  <Link
                    href={`/Courses/${course._id}/Home`}
                    className="wd-dashboard-course-link text-decoration-none text-dark"
                    onClick={(e) => {
                      if (
                        !enrollments?.some(
                          (enrollment: any) =>
                            enrollment?.user === currentUser?._id &&
                            enrollment?.course === course?._id
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <CardImg
                      src={course.image}
                      variant="top"
                      width="100%"
                      height={160}
                    />
                    <CardBody className="card-body">
                      <CardTitle className="wd-dashboard-course-title text-nowrap overflow-hidden">
                        {course.name}
                      </CardTitle>
                      <CardText
                        className="wd-dashboard-course-description overflow-hidden"
                        style={{ height: "100px" }}
                      >
                        {course.description}
                      </CardText>
                     
                      <Button variant="success" style = {{marginRight: "5px"}}> Go </Button>
                     
                      {showEnrollments &&
                        !enrollments.some(
                          (enrollment: any) =>
                            enrollment.user === currentUser._id &&
                            enrollment.course === course._id
                        ) && (
                          <Button
                            variant="success"
                            onClick={() => onAddEnrollment(course._id)}
                          >
                            Enroll
                          </Button>
                        )}
                      {showEnrollments &&
                        enrollments.some(
                          (enrollment: any) =>
                            enrollment.user === currentUser._id &&
                            enrollment.course === course._id
                        ) && (
                          <Button
                            variant="danger"
                            onClick={(e) => {
                              e.preventDefault();
                              onRemoveEnrollment(
                                course._id
                              );
                            }}
                          >
                            Unenroll
                          </Button>
                        )}
                      {facultyView && (
                        <>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              onDeleteCourse(course._id);
                            }}
                            className="btn btn-danger float-end"
                            id="wd-delete-course-click"
                          >
                            Delete
                          </button>
                          <button
                            id="wd-edit-course-click"
                            onClick={(event) => {
                              event.preventDefault();
                              setCourse(course);
                            }}
                            className="btn btn-warning me-2 float-end"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </CardBody>
                  </Link>
                </Card>
              </Col>
            ))}
        </Row>
      </div>
    </Container>
  );
}