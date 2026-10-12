"use client"
import React, { useState } from "react";
import { FormCheck, FormControl } from "react-bootstrap";
const HTTP_SERVER = process.env.NEXT_PUBLIC_HTTP_SERVER || "http://localhost:4000";
export default function WorkingWithObjects() {
    const [assignment, setAssignment] = useState({
    id: 1, title: "NodeJS Assignment",
    description: "Create a NodeJS server with ExpressJS",
    due: "2021-10-10", completed: false, score: 0,
  });

  const [module, setModule] = useState({    
    id: 1, name: "NodeJS Module",
    description: "Learn about NodeJS and ExpressJS",
    course: "Web Development",
});

  const ASSIGNMENT_API_URL = `${HTTP_SERVER}/lab5/assignment`
  const MODULE_API_URL = `${HTTP_SERVER}/lab5/module`

  return (
    <div id="wd-working-with-objects">
      <h3>Working With Objects</h3>
      <h4>Modifying Properties</h4>
      <h5>Assignment Title</h5>
      <div className="d-flex gap-2 mb-3">
      <FormControl className="w-50" id="wd-assignment-title"
        defaultValue={assignment.title} onChange={(e) =>
          setAssignment({ ...assignment, title: e.target.value })}/>
         <a id="wd-update-assignment-title"
         className="btn btn-primary float-end"
         href={`${ASSIGNMENT_API_URL}/title/${assignment.title}`}>
        Update Title </a>
      </div>

      <h5>Assignment Score</h5>
      <div className="d-flex gap-2 mb-3">
      <FormControl className="w-50" id="wd-assignment-score"
        defaultValue={assignment.score} type="number" onChange={(e) =>
          setAssignment({ ...assignment, score: Number(e.target.value) })}/>
         <a id="wd-update-assignment-score"
         className="btn btn-primary float-end"
         href={`${ASSIGNMENT_API_URL}/score/${assignment.score}`}>
        Update Score </a>
      </div>

       <h5>Assignment Completed</h5>
<div className="d-flex gap-2 mb-3 align-items-center">
  <FormCheck  type="checkbox"
    id="wd-assignment-completed"
    checked={assignment.completed} 
    onChange={(e) => setAssignment({ ...assignment, completed: e.target.checked })}
  />
  <label htmlFor="wd-assignment-completed" className="mb-0 me-2">
    {assignment.completed ? "Completed" : "Not Completed"}
  </label>
  <a 
    id="wd-update-assignment-completed"
    className="btn btn-primary"
    href={`${ASSIGNMENT_API_URL}/completed/${assignment.completed}`}
  >
    Update Completed 
  </a>
</div>

       <h5>Module Name</h5>
        <div className="d-flex gap-2 mb-3">
            <FormControl className="w-50" id="wd-module-name"
        defaultValue={module.name} onChange={(e) =>
          setModule({ ...module, name: e.target.value })}/>
        <a id="wd-update-module-name"
         className="btn btn-primary float-end"
         href={`${MODULE_API_URL}/name/${module.name}`}>
        Update Name </a>
    </div>

    <h5>Module Description</h5>
    <div className="d-flex gap-2 mb-3">
    <FormControl className="w-100" id="wd-module-description"
        value={module.description} onChange={(e) =>
        setModule({ ...module, description: e.target.value })}/>
    <a id="wd-update-module-description"
        className="btn btn-primary"
        href={`${MODULE_API_URL}/description/${module.description}`}>
        Update Description 
    </a>
    </div>
      <hr />

      <h4>Retrieving Objects</h4>
      <a id="wd-retrieve-assignments" className="btn btn-primary"
      style={{ margin: "1px" }}
         href={`${ASSIGNMENT_API_URL}`}>
        Get Assignment
      </a>
      <a id="wd-retrieve-modules" className="btn btn-primary"
      style={{ margin: "1px" }}
         href={`${MODULE_API_URL}`}>
        Get Module
      </a>
      <a id="wd-retrieve-assignment-title" className="btn btn-primary"
      style={{ margin: "1px" }}
         href={`${ASSIGNMENT_API_URL}/title`}>
        Get Assignment Title
      </a>
      <a id="wd-retrieve-module-name" className="btn btn-primary"
      style={{ margin: "1px" }}
         href={`${MODULE_API_URL}/name`}>
        Get Module Name
      </a>
       <a id="wd-retrieve-assignment-score" className="btn btn-primary"
      style={{ margin: "1px" }}
         href={`${ASSIGNMENT_API_URL}/score`}>
        Get Assignment Score
      </a>
       <a id="wd-retrieve-assignment-completed" className="btn btn-primary"
      style={{ margin: "1px" }}
         href={`${ASSIGNMENT_API_URL}/completed`}>
        Get Assignment Completed
      </a>

      <a id="wd-retrieve-module-description" className="btn btn-primary me-2"
        href={`${MODULE_API_URL}/description`}>
        Get Module Description
        </a>
      <hr/>
      

    </div>
);}

