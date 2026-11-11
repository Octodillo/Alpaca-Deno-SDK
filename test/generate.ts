// The generator itself: spec updates, the `deno task generate` command line, and that the committed
// output is what the generator produces today.
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { generate, update, verify } from "../scripts/generate.ts";
import { withStubbedFetch } from "./common.ts";

const root = new URL("../", import.meta.url);
const files = ["broker-api.json", "market-data-api.json", "trading-api.json"];

const tempDir = async () => new URL(`file://${await Deno.makeTempDir({ prefix: "alpaca-sdk-test-" })}/`);

const snapshot = async (dir: URL) => {
  const entries: Record<string, string> = {};
  for await (const entry of Deno.readDir(dir)) entries[entry.name] = await Deno.readTextFile(new URL(entry.name, dir));
  return entries;
};

/** A spec directory holding consistent "old" specs and checksums, written through `update` itself. */
const oldSpecDir = async () => {
  const dir = await tempDir();
  await withStubbedFetch((request) => new Response(`old ${request.url.pathname}`), () => update(dir));
  return dir;
};

Deno.test("update: writes every spec with matching checksums", async () => {
  const dir = await oldSpecDir();
  try {
    await verify(dir);
    const written = await snapshot(dir);
    assertEquals(Object.keys(written).sort(), ["SHA256SUMS", ...files]);
    assertEquals(written["trading-api.json"], "old /openapi/trading-api.json");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("update: a failed download leaves the specs and checksums untouched", async () => {
  const dir = await oldSpecDir();
  try {
    const before = await snapshot(dir);
    const respond = ({ url }: { url: URL }) =>
      url.pathname.endsWith("broker-api.json") ? new Response("down", { status: 503 }) : new Response("new");
    await withStubbedFetch(respond, async () => {
      await assertRejects(() => update(dir), Error, "broker-api.json: 503");
    });
    assertEquals(await snapshot(dir), before);
    await verify(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("deno task generate passes its arguments to the generator", async () => {
  // An unknown flag is the cheapest argument to trace: the generator must be the one to reject it,
  // before it downloads or writes anything
  const { code, stderr } = await new Deno.Command(Deno.execPath(), {
    args: ["task", "generate", "--no-such-flag"],
    cwd: root,
    stdout: "null",
    stderr: "piped",
  }).output();
  assertEquals(code, 1);
  assertStringIncludes(new TextDecoder().decode(stderr), "generate: unknown argument --no-such-flag");
});

Deno.test("src/generated is up to date with the specs, overrides and generator", async () => {
  const dir = await tempDir();
  try {
    await generate({ specDir: new URL("spec/", root), outDir: dir, log: () => {} });
    for (const api of ["trading", "market", "broker"]) {
      for (const file of ["schemas.ts", "endpoints.ts"]) {
        const committed = await Deno.readTextFile(new URL(`src/generated/${api}/${file}`, root));
        const fresh = await Deno.readTextFile(new URL(`${api}/${file}`, dir));
        // Not assertEquals: a diff of a 6000-line file helps nobody
        if (fresh !== committed) throw new Error(`src/generated/${api}/${file} is stale: run deno task generate`);
      }
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
