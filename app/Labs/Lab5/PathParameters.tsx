"use client"
import React from "react";
import { useState } from "react";
import { FormControl } from "react-bootstrap";
const HTTP_SERVER = process.env.NEXT_PUBLIC_HTTP_SERVER || "http://localhost:4000";
export default function PathParameters() {
  const [a, setA] = useState("34");
  const [b, setB] = useState("23");
  return (
    <div>
      <h3>Path Parameters</h3>
      <FormControl className="mb-2" id="wd-path-parameter-a" type="number" defaultValue={a}
             onChange={(e) => setA(e.target.value)}/>
      <FormControl className="mb-2" id="wd-path-parameter-b" type="number" defaultValue={b}
             onChange={(e) => setB(e.target.value)}/>
      <a className="btn btn-success me-2" id="wd-path-parameter-add"
         href={`${HTTP_SERVER}/lab5/add/${a}/${b}`}>
         Add {a} + {b}
      </a>
      <a className="btn btn-danger" id="wd-path-parameter-subtract" 
         href={`${HTTP_SERVER}/lab5/subtract/${a}/${b}`}>
         Substract {a} - {b}
      </a>
      <hr />
    </div>
  );
}

