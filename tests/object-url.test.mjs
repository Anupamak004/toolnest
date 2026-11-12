import test from "node:test";
import assert from "node:assert/strict";
import { createObjectUrlLease } from "../lib/object-url.mjs";

test("object URL lease revokes replaced preview URL exactly once", () => {
  const created=[]; const revoked=[];
  const api={createObjectURL(value){created.push(value);return `blob:test-${created.length}`;},revokeObjectURL(url){revoked.push(url);}};
  const firstValue={name:"first"}; const first=createObjectUrlLease(firstValue,api);
  assert.equal(first.url,"blob:test-1");
  first.release(); first.release();
  const second=createObjectUrlLease({name:"replacement"},api);
  second.release();
  assert.deepEqual(created,[firstValue,{name:"replacement"}]);
  assert.deepEqual(revoked,["blob:test-1","blob:test-2"]);
});

test("no object URL is created for an empty preview", () => {
  let calls=0;
  const lease=createObjectUrlLease(null,{createObjectURL(){calls++;return "blob:unexpected";},revokeObjectURL(){calls++;}});
  assert.equal(lease.url,null); lease.release(); assert.equal(calls,0);
});
