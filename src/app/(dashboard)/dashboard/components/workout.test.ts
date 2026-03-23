import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Body } from "./workout";

describe("Body workout widget", () => {
  it("renders Arabic labels with RTL direction and tomorrow workout section", () => {
    const html = renderToStaticMarkup(React.createElement(Body));

    expect(html).toContain("تمرين اليوم");
    expect(html).toContain("تمرين بكرة");
    expect(html).toContain("تمرين علوي");
    expect(html).toContain("راحة");
    expect(html).toContain('dir="rtl"');
  });
});
