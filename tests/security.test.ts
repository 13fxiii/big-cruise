import test from "node:test";
import assert from "node:assert/strict";
import { authenticateBearer } from "../src/server/auth.js";
import { validateOrigin } from "../src/server/origin.js";
import { assertToolAllowed } from "../src/security/permissions.js";
import { redactSecrets } from "../src/middleware/logging.js";

test("rejects missing bearer token", () => assert.throws(() => authenticateBearer(new Headers(), "secret"), /Authentication required/));
test("accepts exact bearer token", () => assert.doesNotThrow(() => authenticateBearer(new Headers({ authorization: "Bearer secret" }), "secret")));
test("rejects unapproved origin", () => assert.throws(() => validateOrigin(new Headers({ origin: "https://evil.test" }), ["https://genspark.ai"]), /Origin is not allowed/));
test("allows only explicit tools", () => {
  assert.doesNotThrow(() => assertToolAllowed("github.read_file", ["github.read_file"]));
  assert.throws(() => assertToolAllowed("github.delete_repository", ["github.read_file"]));
});
test("redacts secret fields", () => {
  const value = redactSecrets({ authorization: "secret", apiKey: "secret", token: "secret", nested: { password: "secret" }, ok: "safe" });
  assert.equal(JSON.stringify(value).includes("secret"), false);
});
