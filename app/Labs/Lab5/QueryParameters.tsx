"use client"
import { FormControl } from "react-bootstrap";
import React, {useState} from "react";
const HTTP_SERVER = process.env.NEXT_PUBLIC_HTTP_SERVER || "http://localhost:4000";

export default function QueryParameters() {
    const [a, setA] = useState(0);
    const [b, setB] = useState(0);
    return (
    <div id="wd-query-parameters">
  <h3>Query Parameters</h3>
  <FormControl id="wd-query-parameter-a"
         className="mb-2"
         defaultValue={a} type="number"
         onChange={(e) => setA(Number(e.target.value) || 0)} />
  <FormControl id="wd-query-parameter-b"
         className="mb-2"
         defaultValue={b} type="number"
         onChange={(e) => setB(Number(e.target.value) || 0)} />
  <a id="wd-query-parameter-add" className="btn btn-primary me-2"
     href={`${HTTP_SERVER}/lab5/calculator?operation=add&a=${a}&b=${b}`}>
    Add {a} + {b}
  </a>
  <a id="wd-query-parameter-subtract" className="btn btn-primary me-2"
     href={`${HTTP_SERVER}/lab5/calculator?operation=subtract&a=${a}&b=${b}`}>
    Substract {a} - {b}
  </a>
  <a id="wd-query-parameter-multiply" className="btn btn-primary me-2"
     href={`${HTTP_SERVER}/lab5/calculator?operation=multiply&a=${a}&b=${b}`}>
    Multiply {a} * {b}
  </a>
  <a id="wd-query-parameter-divide" className="btn btn-primary"
     href={`${HTTP_SERVER}/lab5/calculator?operation=divide&a=${a}&b=${b}`}>
    Divide {a} / {b}
  </a>
  <hr />
</div>

)
}