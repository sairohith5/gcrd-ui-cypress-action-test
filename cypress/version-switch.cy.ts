import { getRelativeDate } from "../utils/date-utils";
import { verifyDecisionTableIsReadonly } from "../utils/decision-table-utils";
import {
  cancelDialog,
  submitDialog,
  testDialogIsNotDisplayed,
  testIsDialogDisplayed,
} from "../utils/dialog-utils";
import { verifyGraphIsReadonly } from "../utils/graph-utils";
import { testTable } from "../utils/grid-utils";
import { testToast, ToastTitle } from "../utils/toast-utils";
import {
  verifyCustomObjectDetailIsReadonly,
  verifyCustomObjectsAreReadonly,
  verifyGlobalVarsAreReadonly,
  verifyTagsAreReadonly,
} from "../utils/utils";

describe("version switching", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(1000);
  });

  it("should display the version switch dropdown", () => {
    cy.getByTestId("version-switch").should("exist").contains("Version:");
    cy.getByTestId("version-switch-selected").contains("Main");

    cy.getByTestId("version-switch").click();
    const expectedOptions = [
      "Main",
      "2025.06.14.1-testVersion",
      "2025.06.03",
      "2025.06.03.1",
      "2025.06.03.2",
    ]; // adjust if more versions exist
    expectedOptions.forEach((opt) => {
      cy.getByTestId("version-switch-options").contains(opt).should("exist");
    });
  });

  it("should switch to a different version", () => {
    // still in Main version, version indicator should not be displayed yet:
    cy.getByTestId("versioned-workspace-indicator").should("not.exist");

    // choose version:
    cy.getByTestId("version-switch").click();
    cy.getByTestId("version-switch-options")
      .should("exist")
      .contains("2025.06.14.1-testVersion")
      .click();

    // verify confirmation prompt:
    testIsDialogDisplayed();
    cy.getByTestId("dialog-title").contains("Confirm Version Switch");
    cy.getByTestId("dialog-form-container").contains(
      "Are you sure you want to switch to the selected version (2025.06.14.1-testVersion)?",
    );

    // test cancel button:
    cancelDialog();
    testDialogIsNotDisplayed();
    cy.getByTestId("version-switch-selected").contains("Main"); // version should not have changed

    // test version switch:
    cy.getByTestId("version-switch").click();
    cy.getByTestId("version-switch-options")
      .should("exist")
      .contains("2025.06.14.1-testVersion")
      .click();
    testIsDialogDisplayed();
    submitDialog();
    testDialogIsNotDisplayed();
    cy.getByTestId("version-switch-selected").contains(
      "2025.06.14.1-testVersion",
    ); // version should have changed
    cy.getByTestId("versioned-workspace-indicator")
      .should("exist")
      .contains("Repo Version: 2025.06.14.1-testVersion");

    testToast(
      ToastTitle.SUCCESS,
      "Switched to version 2025.06.14.1-testVersion",
    );
  });

  it("should put the application into readonly mode when in a versioned workspace", () => {
    // switch to a version
    cy.wait(2000);
    cy.getByTestId("version-switch").should("exist").click();
    cy.wait(2000);
    cy.getByTestId("version-switch-options")
      .should("exist")
      .contains("2025.06.14.1-testVersion")
      .click();
    submitDialog();
    testDialogIsNotDisplayed();
    cy.getByTestId("version-switch-selected").contains(
      "2025.06.14.1-testVersion",
    );

    // verify elements are removed from home screen when version is switched
    cy.getByTestId("locked-records-container").should("not.exist");
    cy.getByTestId("workspace-sync-btn").should("not.exist");
    cy.getByTestId("workspace-reset-btn").should("not.exist");
    cy.getByTestId("deployments-btn").should("not.exist");

    // verify main flow is readonly:
    cy.visit("/rule-designer/designer/main-flow");
    cy.wait(2000);
    cy.getByTestId("lock-button").should("not.exist");
    verifyGraphIsReadonly("main");
    verifyTagsAreReadonly();

    // verify user profile menu actions are removed:
    cy.getByTestId("user-menu-btn").should("exist").contains("TU").click();
    cy.getByTestId("user-tasks-menu-item").should("not.exist");
    cy.getByTestId("workspace-sync-menu-item").should("not.exist");
    cy.getByTestId("workspace-reset-menu-item").should("not.exist");
    cy.getByTestId("deployments-menu-item").should("not.exist");
    // verify some actions are still available:
    cy.getByTestId("workspace-compile-menu-item").should("exist");
    cy.getByTestId("help-documentation-menu-item").should("exist");
    cy.getByTestId("signout-menu-item").should("exist");

    // verify functions are readonly:
    cy.visit("/rule-designer/designer/functions");
    cy.wait(1000);
    cy.getByTestId("addFunctionBtn").should("not.exist");
    cy.getByTestId("grid-clone-button-0").should("not.exist");
    cy.getByTestId("grid-delete-button-0").should("not.exist");
    testTable(
      ["Name", "Tags", "Last Committed", "Actions"],
      [
        "CheckDecisionforEachLine",
        { type: "tags", tags: ["BusinessLibrary", "GCRE-123", "GCRE-456"] },
        getRelativeDate("2024-05-03 13:13:33 -0400"),
        [
          {
            type: "button",
            value: "view revision history for CheckDecisionforEachLine",
          },
        ],
      ],
    );
    cy.visit("/rule-designer/designer/functions/CheckDecisionforEachLine");
    cy.wait(1000);
    cy.getByTestId("lock-button").should("not.exist");
    verifyGraphIsReadonly("function");
    verifyTagsAreReadonly();

    // verify rule sets are readonly:
    cy.visit("/rule-designer/designer/rule-sets");
    cy.wait(1000);
    cy.getByTestId("addRuleSetBtn").should("not.exist");
    cy.getByTestId("grid-delete-button-0").should("not.exist");
    testTable(
      ["Name", "Tags", "Last Committed", "Actions"],
      [
        "Batch_Activity_RS",
        { type: "tags", tags: ["TechnicalLibrary"] },
        getRelativeDate("2024-05-03 13:13:33 -0400"),
        [
          {
            type: "button",
            value: "view revision history for Batch_Activity_RS",
          },
        ],
      ],
    );
    cy.visit("/rule-designer/designer/rule-sets/Batch_Activity_RS?designer");
    cy.wait(1000);
    cy.getByTestId("lock-button").should("not.exist");
    verifyGraphIsReadonly("ruleset");
    verifyTagsAreReadonly();

    // verify rules are readonly:
    cy.visit("/rule-designer/designer/rule-sets/Batch_Activity_RS?rules");
    cy.wait(1000);
    cy.getByTestId("addRuleBtn").should("not.exist");
    cy.getByTestId("grid-clone-button-0").should("not.exist");
    cy.getByTestId("grid-delete-button-0").should("not.exist");
    testTable(
      ["Name", "Tags", "Last Committed", "Actions"],
      [
        "Apex_582",
        { type: "tags", tags: ["GCRE-789"] },
        getRelativeDate("2024-05-23 13:47:33 -0400"),
        [
          {
            type: "button",
            value: "view revision history for Apex_582",
          },
        ],
      ],
    );
    cy.visit(
      "/rule-designer/designer/rule-sets/Batch_Activity_RS/rule/Apex_582",
    );
    cy.wait(1000);
    cy.getByTestId("lock-button").should("not.exist");
    verifyGraphIsReadonly("rule");
    verifyTagsAreReadonly();

    // verify decision tables are readonly:
    cy.visit("/rule-designer/designer/decision-tables");
    cy.wait(1000);
    cy.getByTestId("btnDTAdd").should("not.exist");
    cy.getByTestId("grid-clone-button-0").should("not.exist");
    cy.getByTestId("grid-delete-button-0").should("not.exist");
    testTable(
      ["Name", "Tags", "Last Committed", "Actions"],
      [
        "DT_MasterTableForHierarchyRootPathInstance",
        { type: "tags", tags: ["TechnicalLibrary", "GCRE-123"] },
        getRelativeDate("2022-05-03 11:28:33 -0400"),
        [
          {
            type: "button",
            value:
              "view revision history for DT_MasterTableForHierarchyRootPathInstance",
          },

          {
            type: "button",
            value: "Export DT_MasterTableForHierarchyRootPathInstance",
          },
        ],
      ],
    );
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );
    cy.wait(1000);
    cy.getByTestId("lock-button").should("not.exist");
    verifyDecisionTableIsReadonly();
    verifyTagsAreReadonly();

    // verify defaultRule's are readonly:
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance?tableFunctions",
    );
    cy.wait(1000);
    testTable(
      ["Name", "Tags", "Last Committed", "Actions"],
      [
        "defaultRule",
        { type: "tags", tags: ["BusinessLibrary", "GCRE-123", "GCRE-456"] },
        getRelativeDate("2024-05-03 13:13:33 -0400"),
        [
          {
            type: "button",
            value: "view revision history for defaultRule",
          },
        ],
      ],
    );

    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance/function/defaultRule",
    );
    cy.wait(1000);
    cy.getByTestId("lock-button").should("not.exist");
    verifyGraphIsReadonly("defaultRule");
    verifyTagsAreReadonly();

    // verify global variables are readonly:
    cy.visit("/rule-designer/configuration/global-variables");
    cy.wait(1000);
    cy.getByTestId("lock-button").should("not.exist");
    verifyGlobalVarsAreReadonly();

    // verify rule management table is readonly:
    cy.visit("/rule-designer/configuration/rule-management");
    cy.wait(1000);
    cy.getByTestId("lock-button").should("not.exist");
    verifyDecisionTableIsReadonly(true);

    // verify test cases are readonly:
    cy.visit("/rule-designer/rule-testing/test-cases");
    cy.wait(1000);
    cy.getByTestId("addTestCaseBtn").should("not.exist");
    cy.getByTestId("grid-clone-button-0").should("not.exist");
    cy.getByTestId("grid-delete-button-0").should("not.exist");
    testTable(
      [
        { type: "checkbox", ariaLabel: "Select All" },
        "Name",
        "Tags",
        "Last Committed",
        "Results",
        "Actions",
      ],
      [
        {
          type: "checkbox",
          isChecked: false,
          value: "Select row for test execution",
        },
        "TestFile1",
        { type: "tags", tags: ["BusinessLibrary", "GCRE-123", "GCRE-456"] },
        getRelativeDate("2024-05-03 13:13:33 -0400"),
        "",
        [
          {
            type: "button",
            value: "execute test for TestFile1",
          },
          {
            type: "button",
            value: "open TestFile1 in graph testing",
          },
          {
            type: "button",
            value: "view revision history for TestFile1",
          },
        ],
      ],
    );
    cy.visit("/rule-designer/rule-testing/test-cases/TestFile1");
    cy.wait(1000);
    cy.getByTestId("lock-button").should("not.exist");
    cy.getByTestId("nav-menu-more").should("exist").click();
    cy.getByTestId("executeTestBtn").should("exist");
    cy.getByTestId("openGraphTestBtn").should("exist");
    cy.getByTestId("deleteArtifactBtn").should("not.exist");
    cy.getByTestId("inputEditor").find(".readonly").should("exist");
    cy.getByTestId("outputEditor").find(".readonly").should("exist");
    verifyTagsAreReadonly();
  });

  it("should switch back to the main workspace", () => {
    // switch to a version
    cy.getByTestId("version-switch").click();
    cy.getByTestId("version-switch-options")
      .should("exist")
      .contains("2025.06.14.1-testVersion")
      .click();
    submitDialog();
    testDialogIsNotDisplayed();

    // naviate away and then come back to the dashboard
    cy.getByTestId("functionsLink").click();
    cy.getByTestId("dataTableContainer").find("table").should("exist");
    cy.getByTestId("breadcrumbs").find("a").first().click();
    cy.getByTestId("version-selector-trigger")
      .should("exist")
      .and("be.enabled");

    // switch back to main
    cy.getByTestId("version-switch").click();
    cy.getByTestId("version-switch-options")
      .should("exist")
      .contains("Main")
      .click();
    cy.getByTestId("version-switch-selected").contains("Main");
    cy.getByTestId("versioned-workspace-indicator").should("not.exist");
    cy.getByTestId("locked-records-container").should("exist");
    cy.getByTestId("workspace-sync-btn").should("exist");
    cy.getByTestId("workspace-reset-btn").should("exist");
    cy.getByTestId("deployments-btn").should("exist");
    testToast(ToastTitle.SUCCESS, "Returned to main workspace");
  });

  it("should switch from one version to another version", () => {
    // switch to a version
    cy.getByTestId("version-switch").click();
    cy.getByTestId("version-switch-options")
      .should("exist")
      .contains("2025.06.14.1-testVersion")
      .click();
    submitDialog();
    testDialogIsNotDisplayed();

    // naviate away and then come back to the dashboard
    cy.getByTestId("functionsLink").click();
    cy.getByTestId("dataTableContainer").find("table").should("exist");
    cy.getByTestId("breadcrumbs").find("a").first().click();
    cy.getByTestId("version-selector-trigger")
      .should("exist")
      .and("be.enabled");

    // switch to a different version
    cy.getByTestId("version-switch").click();
    cy.getByTestId("version-switch-options").contains("2025.06.03.3").click();

    // confirmation dialog should not appear in this case, if it does the test will fail
    cy.getByTestId("versioned-workspace-indicator")
      .should("exist")
      .contains("Repo Version: 2025.06.03.3");

    testToast(ToastTitle.SUCCESS, "Switched to version 2025.06.03.3");
  });

  it("should display an error message if there is trouble switching to a version", () => {
    // switch to a version
    cy.getByTestId("version-switch").click();
    cy.getByTestId("version-switch-options")
      .should("exist")
      .contains("2025.06.03.1")
      .click();
    submitDialog();
    testDialogIsNotDisplayed();

    testToast(
      ToastTitle.ERROR,
      "There was a problem switching to the selected version",
    );

    // verify the app still shows the Main workspace
    cy.getByTestId("version-switch-selected").contains("Main");
    cy.getByTestId("versioned-workspace-indicator").should("not.exist");
  });

  it("should remain in read-only mode for Admin user when switched to different repository version", () => {
    // First, navigate to dashboard to access version switch
    cy.visit("/dashboard");
    cy.wait(1000);

    // Verify we're initially in Main version
    cy.getByTestId("version-switch-selected").contains("Main");
    cy.getByTestId("versioned-workspace-indicator").should("not.exist");

    // Switch to a different version
    cy.getByTestId("version-switch").click();
    cy.getByTestId("version-switch-options")
      .should("exist")
      .contains("2025.06.14.1-testVersion")
      .click();

    // Confirm the version switch
    submitDialog();
    cy.getByTestId("version-switch-selected").contains(
      "2025.06.14.1-testVersion",
    );
    cy.getByTestId("versioned-workspace-indicator")
      .should("exist")
      .contains("Repo Version: 2025.06.14.1-testVersion");

    // Navigate to custom objects page
    cy.visit("/rule-designer/configuration/custom-objects");
    cy.wait(1000);

    // Verify custom objects list is in read-only mode using utility function
    verifyCustomObjectsAreReadonly();

    cy.getGridRowButtonOrLink(1, 0).click();
    cy.wait(1000);

    cy.url().should(
      "include",
      "/rule-designer/configuration/custom-objects/test_123",
    );

    verifyCustomObjectDetailIsReadonly();
    verifyTagsAreReadonly();
    cy.getByTestId("scrollable-table").should("exist");
  });
});
