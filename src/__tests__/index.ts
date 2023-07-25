import "expect-even-more-jest";
import { newerVersion, listReleases, fetchLatestRelease } from "../"
import { Sandbox } from "filesystem-sandbox";
import { ls } from "yafs";

describe(`newerVersion`, () => {
  it("should compare versions", () => {
    expect(newerVersion("0.1.0", "0.0.1")).toBe(true)
    expect(newerVersion("v0.1.0", "v0.0.1")).toBe(true)
    expect(newerVersion("v0.0.1", "")).toBe(true)

    expect(newerVersion("0.0.1", "0.0.1")).toBe(false)
    expect(newerVersion("v0.0.1", "v0.0.1")).toBe(false)
    expect(newerVersion("", "0.0.1")).toBe(false)
  });
});

describe(`listReleases`, () => {
  it(`should find releases`, async () => {
    // Arrange
    // Act
    const result = await listReleases({ owner: "fluffynuts", repo: "NExpect" });
    // Assert
    expect(result)
      .not.toBeEmptyArray();
  });
});

describe(`fetchLatestRelease`, () => {
  it(`should fetch and unpack`, async () => {
    // Arrange
    const
      os = require("os"),
      isWindows = os.platform() === "win32",
      sandbox = await Sandbox.create();
    // Act
    await fetchLatestRelease({
      destination: sandbox.path,
      owner: "axllent",
      repo: "mailpit"
    });
    // Assert
    const contents = await ls(sandbox.path);
    expect(contents)
      .toContain(
        isWindows
          ? "mailpit.exe"
          : "mailpit"
      );
  });
});
