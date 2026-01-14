/**
 * The following test will test the display of the compile drawer that can be triggered directly from the dashboard
 * or from the user menu
 */
describe("compile from dashboard button", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(500);
  });

  it("should compile workspace from the dashbord", () => {
    cy.getByTestId("bottom-drawer").should("not.exist");
    cy.getByTestId("workspace-compile-btn")
      .should("exist")
      .contains("Compile My Workspace")
      .click();
    cy.getByTestId("bottom-drawer").should("exist");
    cy.getByTestId("bottom-drawer-title").contains("Compile Results");
    cy.getByTestId("bottom-drawer-refresh-btn").should("exist");
    cy.getByTestId("bottom-drawer-content")
      .should("exist")
      .should("contain", "Apex_582")
      .should("contain", "Incomplete parse on line 1:  null();");

    // test the accordion behavior
    cy.getByTestId("compile-result-group-0")
      .should("exist")
      .find("button")
      .contains("Apex_582 (Rule)")
      .as("accordion0");
    cy.get("@accordion0")
      .should("exist")
      .invoke("attr", "aria-expanded")
      .should("eq", "true");
    cy.get("@accordion0").click();
    cy.get("@accordion0").invoke("attr", "aria-expanded").should("eq", "false");
    cy.get("@accordion0").click();

    // test the compile results for the first accordion group
    cy.getByTestId("compile-result-group-0")
      .find("li[data-testid='compile-result-item-0']")
      .should("exist")
      .as("compileResultItem0");
    cy.get("@compileResultItem0")
      .find("svg[data-icon='circle-x']")
      .should("exist");
    cy.get("@compileResultItem0")
      .find("div[data-testid='compile-result-text']")
      .should("contain", "Incomplete parse on line 1:  null();");

    cy.getByTestId("compile-result-group-0")
      .find("li[data-testid='compile-result-item-1']")
      .as("compileResultItem1");
    cy.get("@compileResultItem1")
      .find("svg[data-icon='triangle-exclamation']")
      .should("exist");

    // briefly test the second accordion group
    cy.getByTestId("compile-result-group-1")
      .should("exist")
      .find("button")
      .contains("main (Main Flow)")
      .as("accordion1");
    cy.get("@accordion1")
      .should("exist")
      .invoke("attr", "aria-expanded")
      .should("eq", "true");

    // test the global variable error
    cy.getByTestId("compile-result-group-5")
      .should("exist")
      .find("button")
      .contains("literalStringCheck (Global Variable)")
      .as("accordion5");
    cy.get("@accordion5")
      .should("exist")
      .invoke("attr", "aria-expanded")
      .should("eq", "true");

    // test the close button
    cy.getByTestId("bottom-drawer-close-btn").should("exist").click();
    cy.getByTestId("bottom-drawer").should("not.exist");
  });
});

describe("compile from user menu", () => {
  beforeEach(() => {
    cy.visit("/rule-designer/designer/functions");
    cy.wait(500);
  });

  it("should compile workspace from the user menu", () => {
    cy.getByTestId("bottom-drawer").should("not.exist");
    cy.getByTestId("user-menu-btn").should("exist").click();
    cy.getByTestId("workspace-compile-menu-item").should("exist").click();
    cy.getByTestId("bottom-drawer").should("exist");
    cy.getByTestId("bottom-drawer-title").contains("Compile Results");

    // no need to test anything else... it is the same as the previous test
  });
});

describe("compile result hyperlinks", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(500);
    cy.getByTestId("workspace-compile-btn").click();
    cy.getByTestId("bottom-drawer").should("exist");
  });

  it("should navigate to a rule", () => {
    cy.getByTestId("compile-result-group-0")
      .find("li[data-testid='compile-result-item-0'] a")
      .click();
    cy.url().should(
      "contain",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS/rule/Apex_582",
    );
  });

  it("should navigate to a rule set", () => {
    cy.getByTestId("compile-result-group-6")
      .find("li[data-testid='compile-result-item-0'] a")
      .click();
    cy.url().should(
      "contain",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS?designer",
    );
  });

  it("should navigate to the main flow", () => {
    cy.getByTestId("compile-result-group-1")
      .find("li[data-testid='compile-result-item-0'] a")
      .click();
    cy.url().should("contain", "/rule-designer/designer/main-flow");
  });

  it("should navigate to a function", () => {
    cy.getByTestId("compile-result-group-2")
      .find("li[data-testid='compile-result-item-0'] a")
      .click();
    cy.url().should(
      "contain",
      "/rule-designer/designer/functions/entryPointFn",
    );
  });

  it("should navigate to global variables", () => {
    cy.getByTestId("compile-result-group-5")
      .find("li[data-testid='compile-result-item-0'] a")
      .click();
    cy.url().should("contain", "/rule-designer/configuration/global-variables");
  });

  it("should navigate to a decision table function", () => {
    cy.getByTestId("compile-result-group-7")
      .find("li[data-testid='compile-result-item-0'] a")
      .click();
    cy.url().should(
      "contain",
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance/function/defaultRule",
    );
    cy.wait(500);
    cy.getByTestId("viewCompileErrorsButton").should("exist").click();
    cy.get("div[data-testid*='compile-result-group']")
      .should("exist")
      .should("have.length", 1);
    cy.getByTestId("showAllResults").should("exist").click();
    cy.get("div[data-testid*='compile-result-group']")
      .should("exist")
      .should("have.length", 9);
  });
});
