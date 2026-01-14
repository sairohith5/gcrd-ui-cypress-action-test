import { openDialog, submitDialog, testDialog } from "../utils/dialog-utils";
import { selectFormField, testFormField } from "../utils/form-utils";
import { testToast, ToastMessage, ToastTitle } from "../utils/toast-utils";

describe("Home page", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
  });

  it("displays header and footer", () => {
    cy.testHeaderAndFooter();
    cy.testBrowserTitle("Home");
  });

  it("displays a configuration card tile", () => {
    cy.getByTestId("configurationCard")
      .find("div[data-testid='configuration-card'] a")
      .then((items) => {
        expect(items[0]).to.contain.text("Business Object Model");
        // expect(items[1]).to.contain.text("Data Mapping");  // Hiding temporarily until we decide if it will go in Phase 1
        expect(items[1]).to.contain.text("Custom Objects");
        expect(items[2]).to.contain.text("Global Variables");
      });
  });

  it("displays a designer card tile", () => {
    cy.getByTestId("designerCard")
      .find("div[data-testid='designer-card'] a")
      .then((items) => {
        expect(items[0]).to.contain.text("Main Flow");
        expect(items[1]).to.contain.text("Functions");
        expect(items[2]).to.contain.text("Rule Sets");
        expect(items[3]).to.contain.text("Decision Tables");
      });
  });

  it("displays a testing card tile", () => {
    cy.getByTestId("testingCard")
      .find("div[data-testid='testing-card'] a")
      .then((items) => {
        expect(items[0]).to.contain.text("Data Testing");
        expect(items[1]).to.contain.text("Graph Testing");
        expect(items[2]).to.contain.text("Test Cases");
      });
  });

  it("navigates to Business Object Model", () => {
    cy.getByTestId("botLink").click();
    cy.url().should("include", "/rule-designer/configuration/bot");
  });

  it.skip("navigates to Data Mapping", () => {
    cy.getByTestId("customObjectsLink").click();
    cy.url().should("include", "/rule-designer/configuration/data-mapping");
  });

  it("navigates to Custom Objects", () => {
    cy.getByTestId("customObjectsLink").click();
    cy.url().should("include", "/rule-designer/configuration/custom-objects");
  });

  it("navigates to Global Variables", () => {
    cy.getByTestId("globalVariablesLink").click();
    cy.url().should("include", "/rule-designer/configuration/global-variables");
  });

  it("navigates to Decision Tables", () => {
    cy.getByTestId("decisionTablesLink").click();
    cy.url().should("include", "/rule-designer/designer/decision-tables");
  });

  it("navigates to Main Flow", () => {
    cy.getByTestId("mainFlowLink").click();
    cy.url().should("include", "/rule-designer/designer/main-flow");
  });

  it("navigates to Functions", () => {
    cy.getByTestId("functionsLink").click();
    cy.url().should("include", "/rule-designer/designer/functions");
  });

  it("navigates to Rule Sets", () => {
    cy.getByTestId("ruleSetsLink").click();
    cy.url().should("include", "/rule-designer/designer/rule-sets");
  });

  it("navigates to Data Testing", () => {
    cy.getByTestId("dataTestingLink").click();
    cy.url().should("include", "/rule-designer/rule-testing/data");
  });

  // TODO: no mock data here, so test is failing
  it.skip("navigates to Graph Testing", () => {
    cy.getByTestId("graphTestingLink").click();
    cy.url().should("include", "/rule-designer/rule-testing/graph");
  });

  it("navigates to Test Cases", () => {
    cy.getByTestId("testCasesLink").click();
    cy.url().should("include", "/rule-designer/rule-testing/test-cases");
  });

  it("hide the tag search on the dashboard", () => {
    cy.getByTestId("header-tags-container").should("not.exist");
  });

  it("syncs users workspace", () => {
    cy.getByTestId("workspace-sync-btn")
      .should("exist")
      .contains("Sync from Remote")
      .click();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_SYNC);
  });

  it("resets users workspace", () => {
    cy.getByTestId("workspace-reset-btn")
      .should("exist")
      .contains("Reset Workspace");
    // test Reset User Workspace dialog
    testDialog(cy.getByTestId("workspace-reset-btn"), "Reset User Workspace");
    openDialog(cy.getByTestId("workspace-reset-btn"));
    testFormField(
      "resetTypeField",
      "Whose workspace would you like to reset?",
      false,
      {
        isRadioButton: true,
        expectedRadioButtonOptions: ["Mine", "Another User"],
        expectedRadioButtonSelected: "Mine",
      },
    );
    testFormField("userField", "Select User to Reset", true, {
      defaultValue: "testuser@healthedge.com",
      expectDisabled: true,
    });
    cy.getByTestId("userRadioBtn").click();
    testFormField("userField", "Select User to Reset", true, {
      expectDisabled: false,
    });
    selectFormField("userInput", "goofy@healthedge.com");
    cy.getByTestId("mineRadioBtn").click();
    testFormField("userField", "Select User to Reset", true, {
      defaultValue: "testuser@healthedge.com",
      expectDisabled: true,
    });

    // test Confirm Workspace Reset dialog for other user
    cy.getByTestId("userRadioBtn").click();
    selectFormField("userInput", "goofy@healthedge.com");
    submitDialog();
    cy.getByTestId("dialog-title").contains("Confirm Workspace Reset");
    cy.getByTestId("dialog-content")
      .should("exist")
      .contains(
        "Resetting another user's workspace will discard all of their changes that have not been checked-in, undo all checkouts, and sync their workspace with the remote repository.",
      );
    cy.getByTestId("dialog-content")
      .should("exist")
      .contains(
        "Do you want to proceed with resetting the workspace for goofy@healthedge.com?",
      );
    cy.getByTestId("dialog-destructive-button").click();
    cy.wait(500);
    cy.url().should("include", "/dashboard");
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_RESET);

    // test Confirm Workspace Reset dialog for logged-in user
    openDialog(cy.getByTestId("workspace-reset-btn"));
    submitDialog();
    cy.getByTestId("dialog-title").contains("Confirm Workspace Reset");
    cy.getByTestId("dialog-content")
      .should("exist")
      .contains(
        "Resetting your workspace will discard all changes that have not been checked-in, undo all checkouts, and sync your workspace with the remote repository.",
      );
    cy.getByTestId("dialog-content")
      .should("exist")
      .contains("Do you want to proceed?");
    cy.getByTestId("dialog-destructive-button").click();
    cy.wait(1000);
    cy.url().should("include", "/workspace-reset");
    cy.getByTestId("workspaceResetSpinner")
      .should("exist")
      .contains("Resetting your workspace, please wait...");
  });

  it("displays page not found and navigates back to dashboard", () => {
    cy.visit("/page-not-found");
    cy.getByTestId("page-not-found-header")
      .should("exist")
      .contains("Oops! Something went wrong.");
    cy.getByTestId("page-not-found-msg")
      .should("exist")
      .contains("This page does not exist.");
    cy.getByTestId("back-to-dashboard-btn")
      .should("exist")
      .contains("BACK TO HOME PAGE")
      .click();
    cy.url().should("include", "/dashboard");
  });
});
