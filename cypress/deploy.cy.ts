import { getRelativeDate } from "../utils/date-utils";
import {
  testDialogIsNotDisplayed,
  testIsDialogDisplayed,
} from "../utils/dialog-utils";
import {
  selectFormField,
  testFormField,
  testFormFieldValidation,
  typeFormField,
} from "../utils/form-utils";
import {
  clickGridRow,
  testFilter,
  testRow,
  testSort,
  testTable,
} from "../utils/grid-utils";
import { testTabs } from "../utils/tab-utils";
import { testToast, ToastMessage, ToastTitle } from "../utils/toast-utils";
import { verifyInfoTooltip } from "../utils/utils";

/**
 * The following test will test the deploy functionality that can be triggered directly from the dashboard
 * or from the user menu
 */
describe("deployments", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(500);
  });

  it("should launch deploy dialog from the dashbord", () => {
    testDialogIsNotDisplayed();

    openDeployDialog();
    cy.getByTestId("dialog-title").contains("Deployments");

    cy.getByTestId("dialog-cancel-button")
      .should("exist")
      .contains("Close")
      .click({ force: true });
    testDialogIsNotDisplayed();
  });

  it("should launch deploy dialog from the user menu", () => {
    cy.visit("/rule-designer/designer/functions");
    cy.wait(500);

    testDialogIsNotDisplayed();

    openDeployDialog();
    cy.getByTestId("dialog-title").contains("Deployments");

    cy.getByTestId("dialog-cancel-button")
      .should("exist")
      .contains("Close")
      .click({ force: true });
    testDialogIsNotDisplayed();
  });

  it("displays tabs", () => {
    openDeployDialog();

    testTabs(
      "deploymentTabs",
      ["Repository Versions", "Environments"],
      "Repository Versions",
      ["versioningTabPanel", "deploymentsTabPanel"],
    );
  });
});

describe("repository versions tab", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(500);
    openDeployDialog();
  });

  it("should display the versions grid", () => {
    testTable(
      [
        { type: "checkbox", ariaLabel: "Select all rows for deletion" },
        "Version Name",
        "Actions",
      ],
      [
        "",
        "2025.06.03.1",
        {
          type: "button",
          value: "version cannot be deleted because it is currently deployed",
        },
      ],
    );
    testRow(1, [
      { type: "checkbox", isChecked: false, value: "Select row for deletion" },
      "2025.06.03.2",
      { type: "button", value: "delete version 2025.06.03.2" },
    ]);

    // test sorting, but first put it in a known state of unsorted
    cy.getByTestId("dataTableHeader")
      .find("th:nth-child(2)")
      .as("columnHeader");
    cy.get("@columnHeader").find("button").click();
    cy.wait(500);
    cy.get("@columnHeader").find("button").click();

    testSort(
      1,
      [
        "",
        "2025.06.14.1-testVersion",
        {
          type: "button",
          value: "version cannot be deleted because it is currently deployed",
        },
      ],
      [
        "",
        "2025.06.03.1",
        {
          type: "button",
          value: "version cannot be deleted because it is currently deployed",
        },
      ],
    );

    // test filter
    testFilter("test", [
      "",
      "2025.06.14.1-testVersion",
      {
        type: "button",
        value: "version cannot be deleted because it is currently deployed",
      },
    ]);

    testFilter(".3", [
      { type: "checkbox", isChecked: false, value: "Select row for deletion" },
      "2025.06.03.3",
      { type: "button", value: "delete version 2025.06.03.3" },
    ]);
  });

  it.skip("should prevent user from creating version when there are remote repository compilation errors", () => {
    // WE CANNOT TEST THIS BECAUSE WE CANNOT INTERCEPT THE MOCKED /compile API CALL (currently it always returns zero compile errors)
  });

  it.skip("should prevent user from creating version when there are already 100 versions", () => {
    // WE CANNOT TEST THIS BECAUSE WE CANNOT INTERCEPT THE MOCKED /repoversions API CALL (currently it returns a static number of versions < 100, which
    // we don't want to change because we want to be able to test the create version dialog)
  });

  it.skip("should prevent user from creating version when user's workspace is behind", () => {
    // WE CANNOT TEST THIS BECAUSE WE CANNOT INTERCEPT THE MOCKED /commitsbehind API CALL (currently it always returns zero commits behind, which
    // we don't want to change because we want to be able to test the create version dialog)
  });

  it("should create a new version", () => {
    cy.getByTestId("create-version-btn").should("exist").click();
    testIsDialogDisplayed("create-version-dialog-container");
    cy.getByTestId("create-version-dialog-title").contains(
      "Create Repository Version",
    );

    cy.getByTestId("create-version-dialog-submit-button")
      .should("exist")
      .contains("Save");
    cy.getByTestId("create-version-dialog-cancel-button")
      .should("exist")
      .contains("Cancel");

    const today = new Date();
    const defaultValue = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}.1`;
    testFormField("versionNamePrefixField", "Prefix", false, {
      expectDisabled: true,
      defaultValue: defaultValue,
    });
    testFormField("versionNameField", "Optional Suffix", false, {
      expectDisabled: false,
      defaultValue: "",
    });
    testFormField("fullVersionNameField", "Full Version Name", false, {
      expectDisabled: true,
      defaultValue: defaultValue + "-TEST-FAILURES",
    });

    const versionNameFormat =
      "Field can only contain alphanumeric characters, periods, and hyphens. No spaces or other characters are allowed, nor a trailing period.";
    // test validation of the optional suffix field
    typeFormField("versionNameInput", "test spaces");
    cy.getByTestId("create-version-dialog-submit-button").click();
    testFormFieldValidation("versionNameField", versionNameFormat);
    cy.getByTestId("versionNameInput").clear();
    typeFormField("versionNameInput", "test@#$%^&*()_+");
    cy.getByTestId("create-version-dialog-submit-button").click();
    testFormFieldValidation("versionNameField", versionNameFormat);
    cy.getByTestId("versionNameInput").clear();
    typeFormField("versionNameInput", "test.");
    cy.getByTestId("create-version-dialog-submit-button").click();
    testFormFieldValidation("versionNameField", versionNameFormat);
    cy.getByTestId("versionNameInput").clear();
    typeFormField("versionNameInput", "test.version-with-hyphen");
    cy.getByTestId("fullVersionNameInput").should(
      "have.value",
      `${defaultValue}-TEST-FAILURES-test.version-with-hyphen`,
    );

    // verify user is warned there are test failures
    cy.getByTestId("failing-tests-warning")
      .should("exist")
      .contains(
        "There are failing test cases; version name will be labeled with TEST-FAILURES.",
      );
    verifyInfoTooltip(
      "There are failing test cases in the remote repository. You can continue to create a version, but it will be labeled to indicate that there were test failures at the time of creation. If you wish to fix the tests: sync your workspace, execute all tests to determine which are failing, fix the rule logic or adjust the expected test output accordingly, and then commit your changes.",
    );

    cy.getByTestId("create-version-dialog-submit-button").click();
    // we are not able to mock the repoversions POST API call because it requires a dynamic date in the file name, so we will just test the error toast
    testToast(ToastTitle.ERROR, ToastMessage.ERROR_CREATE_VERSION);
  });

  it("should create new version without optional suffix", () => {
    cy.getByTestId("create-version-btn").should("exist").click();
    testIsDialogDisplayed("create-version-dialog-container");
    cy.getByTestId("create-version-dialog-submit-button").click();

    // we are not able to mock the repoversions POST API call because it requires a dynamic date in the file name, so we will just test the error toast
    testToast(ToastTitle.ERROR, ToastMessage.ERROR_CREATE_VERSION);
  });

  it("should delete a version", () => {
    clickGridRow(1, 2);

    testIsDialogDisplayed("delete-confirmation-dialog-container");
    cy.getByTestId("delete-confirmation-dialog-title").contains(
      "Delete Confirmation",
    );
    cy.getByTestId("delete-confirmation-dialog-content").contains(
      "Are you sure you want to delete the repository version 2025.06.03.2? This action cannot be undone.",
    );

    cy.getByTestId("delete-confirmation-dialog-cancel-button")
      .should("exist")
      .contains("Cancel");

    cy.getByTestId("delete-confirmation-dialog-destructive-button")
      .should("exist")
      .contains("Delete")
      .click();

    // test Delete dialog is closed:
    testDialogIsNotDisplayed("delete-confirmation-dialog-container");
    // test Repository Versions dialog remains open:
    testIsDialogDisplayed();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_DELETE_VERSION);
  });

  it("should bulk delete versions", () => {
    cy.wait(500);
    cy.getByTestId("bulk-delete-btn").should("not.exist");
    clickGridRow(1, 0);
    clickGridRow(2, 0);
    cy.getByTestId("bulk-delete-btn")
      .should("exist")
      .should("be.visible")
      .click();
    testIsDialogDisplayed("delete-confirmation-dialog-container");
    cy.getByTestId("delete-confirmation-dialog-title").contains(
      "Delete Confirmation",
    );
    cy.getByTestId("delete-confirmation-dialog-content").contains(
      "Are you sure you want to delete the selected repository versions? This action cannot be undone.",
    );

    cy.getByTestId("delete-confirmation-dialog-submit-button")
      .should("exist")
      .contains("Delete")
      .click();
    // test Delete dialog is closed:
    testDialogIsNotDisplayed("delete-confirmation-dialog-container");
    // test Repository Versions dialog remains open:
    testIsDialogDisplayed();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_DELETE_VERSIONS);
  });
});

describe("environments tab", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(500);
    openDeployDialog();
    cy.clickTabByIndex(1, "deploymentTabs");
  });

  it("should display the environments grid", () => {
    testTable(
      [
        "Select",
        "Environment",
        "Version",
        "Last Deployed",
        "Last Deployed By",
        "Status",
        "Actions",
      ],
      [
        { type: "checkbox", isChecked: false, isDisabled: false },
        "dev",
        "2025.06.14.1-testVersion",
        getRelativeDate("2025-01-16 21:19:14 +0000"),
        { type: "email", value: "testuser@healthedge.com" },
        "Deployed",
        [
          {
            type: "button",
            value: "deploy",
          },
        ],
      ],
      null,
      "* data is refreshed every 30 seconds",
    );
    testRow(1, [
      { type: "checkbox", isChecked: false, isDisabled: true },
      "qa",
      "",
      getRelativeDate("2025-01-16 05:30:14 +0000"),
      "",
      "In Progress",
      "",
    ]);
    testRow(2, [
      { type: "checkbox", isChecked: false, isDisabled: false },
      "uat",
      "2025.06.03.1",
      getRelativeDate("2024-12-16 05:30:14 +0000"),
      { type: "email", value: "mdickson@healthedge.com" },
      "Failed",
      [
        {
          type: "button",
          value: "deploy",
        },
      ],
    ]);
    testRow(3, [
      { type: "checkbox", isChecked: false, isDisabled: false },
      "preprod",
      "",
      "Never",
      "",
      "Not Deployed",
      [
        {
          type: "button",
          value: "deploy",
        },
      ],
    ]);
    testRow(4, [
      { type: "checkbox", isChecked: false, isDisabled: true },
      "prod",
      "",
      getRelativeDate("2024-12-25 05:30:14 +0000"),
      { type: "email", value: "mdickson@healthedge.com" },
      "Deployed",
      "",
    ]);

    cy.getGridCell(4, 4).find("[data-testid='deploy-btn']").should("not.exist");
  });

  it("should prompt user to choose version to deploy", () => {
    clickGridRow(0, 6);

    testIsDialogDisplayed("deploy-choose-version-dialog-container");
    cy.getByTestId("deploy-choose-version-dialog-title").contains(
      "Choose Version to Deploy",
    );

    testFormField("versionNameField", "Version", true, {
      expectedSelectOptions: [
        "Select one",
        "2025.06.03.1",
        "2025.06.03.2",
        "2025.06.03.3",
        "2025.06.14.1-testVersion",
      ],
      numSelectOptionsToTest: 4,
    });

    cy.getByTestId("deploy-choose-version-dialog-submit-button")
      .should("exist")
      .should("be.disabled")
      .contains("Deploy");

    cy.getByTestId("deploy-choose-version-dialog-cancel-button")
      .should("exist")
      .contains("Cancel");

    selectFormField("versionNameInput", "2025.06.03.2");
    cy.getByTestId("deploy-choose-version-dialog-submit-button")
      .should("exist")
      .should("not.be.disabled");

    cy.getByTestId("deploy-choose-version-dialog-cancel-button").click();
    testDialogIsNotDisplayed("deploy-choose-version-dialog-container"); // Choose Version dialog is closed
    testIsDialogDisplayed(); // Deployments dialog remains open
  });

  it("should deploy to dev environment", () => {
    clickGridRow(0, 6);
    selectFormField("versionNameInput", "2025.06.03.2");
    cy.getByTestId("deploy-choose-version-dialog-submit-button")
      .should("exist")
      .should("not.be.disabled")
      .click();

    testDialogIsNotDisplayed("deploy-choose-version-dialog-container"); // Choose Version dialog is closed
    testIsDialogDisplayed("deploy-confirmation-dialog-container"); // test confirmation dialog is displayed
    cy.getByTestId("deploy-confirmation-dialog-title").contains(
      "Confirm Deployment",
    );
    cy.getByTestId("deploy-confirmation-dialog-content").contains(
      "Are you sure you want to deploy version 2025.06.03.2 to the dev environment?",
    );

    cy.getByTestId("deploy-confirmation-dialog-submit-button")
      .should("exist")
      .should("be.enabled")
      .contains("Deploy");
    cy.getByTestId("deploy-confirmation-dialog-cancel-button")
      .should("exist")
      .should("be.enabled")
      .contains("Cancel")
      .click();
    testDialogIsNotDisplayed("deploy-confirmation-dialog-container"); // test confirmation dialog is closed

    // open the deploy confirmation dialog again
    clickGridRow(0, 6);
    selectFormField("versionNameInput", "2025.06.03.2");
    cy.getByTestId("deploy-choose-version-dialog-submit-button")
      .should("exist")
      .should("not.be.disabled")
      .click();

    cy.getByTestId("deploy-confirmation-dialog-submit-button")
      .should("exist")
      .contains("Deploy")
      .click();

    testDialogIsNotDisplayed("deploy-confirmation-dialog-container"); // test Deploy dialog is closed
    testIsDialogDisplayed(); // test Deployments dialog remains open

    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_DEPLOYMENT);
  });

  it("should report an error deploying to the uat environment", () => {
    clickGridRow(2, 6);
    selectFormField("versionNameInput", "2025.06.14.1-testVersion");
    cy.getByTestId("deploy-choose-version-dialog-submit-button")
      .should("exist")
      .should("not.be.disabled")
      .click();

    testDialogIsNotDisplayed("deploy-choose-version-dialog-container"); // test Deploy dialog is closed
    testIsDialogDisplayed("deploy-confirmation-dialog-container"); // test confirmation dialog is displayed
    cy.getByTestId("deploy-confirmation-dialog-title").contains(
      "Confirm Deployment",
    );
    cy.getByTestId("deploy-confirmation-dialog-content").contains(
      "Are you sure you want to deploy version 2025.06.14.1-testVersion to the uat environment?",
    );
    cy.getByTestId("deploy-confirmation-dialog-submit-button")
      .should("exist")
      .contains("Deploy")
      .click();

    testDialogIsNotDisplayed("deploy-confirmation-dialog-container"); // test Deploy dialog is closed
    testIsDialogDisplayed(); // test Deployments dialog remains open

    testToast(
      "Failed deployment requests:",
      "dev: Customer tag not found, can not schedule deployment",
    );
  });

  it("should bulk deploy", () => {
    cy.getByTestId("bulk-deploy-btn")
      .should("exist")
      .should("be.disabled")
      .contains("Deploy to Selected Environments");
    clickGridRow(0, 0);
    cy.getByTestId("bulk-deploy-btn").should("not.be.disabled");
    clickGridRow(0, 0);
    cy.getByTestId("bulk-deploy-btn").should("be.disabled");
    clickGridRow(0, 0);
    clickGridRow(2, 0);
    clickGridRow(3, 0);
    cy.getByTestId("bulk-deploy-btn").should("not.be.disabled");
    cy.getByTestId("bulk-deploy-btn").click();
    testIsDialogDisplayed("deploy-choose-version-dialog-container");
    cy.getByTestId("deploy-choose-version-dialog-title").contains(
      "Choose Version to Deploy",
    );
    selectFormField("versionNameInput", "2025.06.03.1");
    cy.getByTestId("deploy-choose-version-dialog-submit-button")
      .should("exist")
      .should("not.be.disabled")
      .click();

    testIsDialogDisplayed("deploy-confirmation-dialog-container");
    cy.getByTestId("deploy-confirmation-dialog-title").contains(
      "Confirm Deployment",
    );
    cy.getByTestId("deploy-confirmation-dialog-content").contains(
      "Are you sure you want to deploy version 2025.06.03.1 to the following environments?",
    );
    cy.getByTestId("deploy-confirmation-dialog-content").contains("dev");
    cy.getByTestId("deploy-confirmation-dialog-content").contains("uat");
    cy.getByTestId("deploy-confirmation-dialog-content").contains("preprod");
    cy.getByTestId("deploy-confirmation-dialog-submit-button")
      .should("exist")
      .contains("Deploy")
      .click();

    testDialogIsNotDisplayed("deploy-confirmation-dialog-container"); // test Deploy dialog is closed:
    testIsDialogDisplayed(); // test Deployments dialog remains open:

    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_DEPLOYMENT);
  });

  it("should display errors when bulk deploying", () => {
    clickGridRow(0, 0);
    clickGridRow(2, 0);
    clickGridRow(3, 0);
    cy.getByTestId("bulk-deploy-btn").click();
    selectFormField("versionNameInput", "2025.06.03.3");
    cy.getByTestId("deploy-choose-version-dialog-submit-button")
      .should("exist")
      .should("not.be.disabled")
      .click();
    testIsDialogDisplayed("deploy-confirmation-dialog-container");
    cy.getByTestId("deploy-confirmation-dialog-submit-button")
      .should("exist")
      .click();

    // test Deploy dialog is closed:
    testDialogIsNotDisplayed("deploy-confirmation-dialog-container");
    // test Deployments dialog remains open:
    testIsDialogDisplayed();

    testToast(
      "Failed deployment requests:",
      "uat: Customer tag not found, can not schedule deployment",
    );
  });
});

function openDeployDialog() {
  cy.url().then(($url) => {
    if ($url.includes("/dashboard")) {
      cy.getByTestId("deployments-btn")
        .should("exist")
        .contains("Deployments")
        .click();
    } else {
      cy.getByTestId("user-menu-btn").should("exist").click();
      cy.getByTestId("deployments-menu-item").should("exist").click();
    }

    cy.wait(500);
    testIsDialogDisplayed();
  });
}
