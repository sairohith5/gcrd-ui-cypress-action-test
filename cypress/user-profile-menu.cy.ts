import { submitDialog, testIsDialogDisplayed } from "../utils/dialog-utils";
import { ToastMessage, ToastTitle, testToast } from "../utils/toast-utils";

/**
 * The following tests will test the user-profile menu functionality.
 */
describe("user profile menu", () => {
  beforeEach(() => {
    // just navigating somewhere other than the dashboard here, so the locked items on the dashboard don't clash with those displayed in the dialog
    cy.visit("/dashboard");
    cy.wait(1000);
  });

  it("displays the user profile menu", () => {
    cy.getByTestId("user-menu-btn").should("exist").contains("TU").click();
    cy.getByTestId("user-profile-menu").should("exist");
    cy.getByTestId("user-name").should("exist").contains("Test User");
    cy.getByTestId("user-email")
      .should("exist")
      .contains("testuser@healthedge.com");
    cy.getByTestId("help-documentation-menu-item")
      .should("exist")
      .contains("Help & Documentation");

    cy.getByTestId("signout-menu-item").should("exist").contains("Sign Out");
  });

  it("should not display the workspace action buttons in the user menu on the dashboard screen", () => {
    cy.getByTestId("user-menu-btn").should("exist").contains("TU").click();
    cy.getByTestId("user-tasks-menu-item").should("not.exist");
    cy.getByTestId("workspace-sync-menu-item").should("not.exist");
    cy.getByTestId("workspace-reset-menu-item").should("not.exist");
    cy.getByTestId("workspace-compile-menu-item").should("not.exist");
    cy.getByTestId("deployments-menu-item").should("not.exist");

    // Help & Documentation should always be visible
    cy.getByTestId("help-documentation-menu-item")
      .should("exist")
      .contains("Help & Documentation");
  });

  it("should display the help documentation", () => {
    cy.visit("/dashboard", {
      onBeforeLoad(win) {
        cy.spy(win.console, "log").as("consoleLog");
      },
    });
    cy.wait(1000);

    // click the Help & Documentation menu item
    cy.getByTestId("user-menu-btn").should("exist").contains("TU").click();
    cy.getByTestId("help-documentation-menu-item")
      .should("exist")
      .contains("Help & Documentation")
      .click();

    // we are not able to test the Doc URL that gets opened in a new tab, but we can check the console log to ensure the URL is constructed correctly
    cy.get("@consoleLog").should(
      "have.been.calledWith",
      "%cFull documentation URL: https://go.healthedge.com/rs/803-KIL-291/images/Rules%20Designer%20powered%20by%20HealthEdge_2025.08.00.pdf",
    );
  });

  describe("user tasks", () => {
    beforeEach(() => {
      cy.visit("/rule-designer/designer/functions");
      cy.wait(500);
    });

    it("should display the workspace action buttons in the user menu on other screens", () => {
      cy.getByTestId("user-menu-btn").should("exist").contains("TU").click();
      cy.getByTestId("user-tasks-menu-item")
        .should("exist")
        .contains("My Checked-out Items");
      cy.getByTestId("workspace-sync-menu-item")
        .should("exist")
        .contains("Sync from Remote");
      cy.getByTestId("workspace-reset-menu-item")
        .should("exist")
        .contains("Reset My Workspace");
      cy.getByTestId("workspace-compile-menu-item")
        .should("exist")
        .contains("Compile My Workspace");
      cy.getByTestId("deployments-menu-item")
        .should("exist")
        .contains("Deployments");

      // Help & Documentation should always be visible, even when workspace actions are present
      cy.getByTestId("help-documentation-menu-item")
        .should("exist")
        .contains("Help & Documentation");
    });

    it("syncs users workspace from user profile menu", () => {
      cy.getByTestId("user-menu-btn").click();
      cy.getByTestId("user-profile-menu").should("exist");
      cy.getByTestId("workspace-sync-menu-item").should("exist").click();
      cy.wait(500);
      testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_SYNC);
    });

    it("reset users workspace from user profile menu", () => {
      cy.getByTestId("user-menu-btn").click();
      cy.getByTestId("user-profile-menu").should("exist");
      cy.getByTestId("workspace-reset-menu-item").should("exist").click();
      testIsDialogDisplayed();
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
  });
});
