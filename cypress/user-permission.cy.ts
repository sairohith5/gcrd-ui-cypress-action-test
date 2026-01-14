/* Test the capability of the logged in user against the role permissions */

import {
  testDialog,
  openDialog,
  submitDialog,
  testDialogIsNotDisplayed,
} from "../utils/dialog-utils";
import { testFormField, typeFormField } from "../utils/form-utils";
import { testToast, ToastTitle, ToastMessage } from "../utils/toast-utils";

describe("Admin user permissions", () => {
  beforeEach(() => {
    // Mock localStorage
    cy.window().then((win) => {
      win.localStorage.setItem("role", "Admin");
    });
    cy.visit("dashboard");
  });

  it("should display the role in the user menu", () => {
    cy.getByTestId("user-menu-btn").click();
    cy.getByTestId("user-role")
      .should("exist")
      .should("have.text", "Role: Admin");
  });
});

// SKIPPING THE STANDARD USER PERMISSIONS TESTS BECAUSE OF THE HYDRATION ERROR RELATED TO
// SETTING ROLE: STANDARD USER IN LOCAL STORAGE, CAUSING THE TESTS TO FAIL
describe.skip("standard user permissions", () => {
  beforeEach(() => {
    // Mock localStorage
    cy.window().then((win) => {
      win.localStorage.setItem("role", "Standard User");
    });
    cy.visit("dashboard");
  });

  it("should display the role in the user menu", () => {
    cy.getByTestId("user-menu-btn").click();
    cy.getByTestId("user-role")
      .should("exist")
      .should("have.text", "Role: Standard User");
  });

  it("should not display my checked out items", () => {
    cy.visit("/rule-designer/designer/decision-tables");
    cy.getByTestId("user-menu-btn").click();
    cy.getByTestId("user-tasks-menu-item").should("not.exist");
  });

  it("should not allow standard user to edit a graph", () => {
    cy.visit("/rule-designer/designer/functions/CheckDecisionforEachLine");
    cy.getByTestId("resetGraphBtn").should("not.exist");
    cy.getByTestId("saveGraphBtn").should("not.exist");
    cy.getByTestId("lock-button").should("exist").should("be.disabled");
  });

  it("should not be able to add a new decision table as a standard user", () => {
    cy.visit("/rule-designer/designer/decision-tables");
    cy.getByTestId("btnDTAdd").should("not.exist");
  });

  // this test is failing due to hydration error related to setting role: Standard User in local storage
  it.skip("should disable the modifications in designer", () => {
    cy.visit(
      "rule-designer/designer/decision-tables/DT_RealTimeRulesConfiguration",
    );
    cy.getByTestId("lock-button").should("be.disabled");
    cy.getByTestId("lock-button").invoke("attr", "tabindex", "0").focus(); // make the tooltip appear
    cy.getByTestId("lock-tooltip").contains(
      "You do not have permission to check out items",
    );
    cy.getByTestId("tag-input").should("be.disabled");
  });
  it("global variables should be read only", () => {
    cy.visit("/rule-designer/configuration/global-variables");
    cy.getByTestId("addGlobalVariableBtn").should("not.exist");
    cy.getGridRowButtonOrLink(0, 0).as("triggerBtn");
    cy.get("@triggerBtn").should("be.disabled");
    cy.get("@deleteBtn").should("be.disabled");
  });
});

// SKIPPING THE STANDARD USER PERMISSIONS TESTS BECAUSE OF THE HYDRATION ERROR RELATED TO
// SETTING ROLE: TECHNICAL USER IN LOCAL STORAGE, CAUSING THE TESTS TO FAIL
describe.skip("Technical user permissions", () => {
  beforeEach(() => {
    // Mock localStorage
    cy.window().then((win) => {
      win.localStorage.setItem("role", "Technical User");
    });
    cy.visit("dashboard");
  });

  it("should display the role in the user menu", () => {
    cy.getByTestId("user-menu-btn").click();
    cy.getByTestId("user-role")
      .should("exist")
      .should("have.text", "Role: Technical User");
  });

  it("should display my checked out items", () => {
    cy.visit("/rule-designer/designer/decision-tables");
    cy.getByTestId("user-menu-btn").click();
    cy.getByTestId("user-tasks-menu-item")
      .should("exist")
      .contains("My Checked-out Items");
  });

  it("should be able to add a new decision table as a technical user", () => {
    cy.visit("/rule-designer/designer/decision-tables");
    cy.getByTestId("btnDTAdd").should("exist");
    cy.getByTestId("btnDTAdd").click();
    cy.url().should("include", "/rule-designer/designer/decision-tables/_new");
  });

  it("should display the checked out items grid on dashboard", () => {
    cy.getByTestId("locked-records-container").should("exist");
  });

  it("should enable the modifications in designer", () => {
    cy.visit(
      "rule-designer/designer/decision-tables/DT_RealTimeRulesConfiguration",
    );
    cy.getByTestId("lock-button").should("not.be.disabled");
    cy.getByTestId("saveBtn").should("exist").should("be.disabled");
    cy.getByTestId("importFileBtn").should("exist").should("be.disabled");
  });

  it("global variables should be editable", () => {
    cy.visit("/rule-designer/configuration/global-variables");
    testDialog(cy.getGridRowButtonOrLink(0, 0), "Edit Global Variable");

    openDialog(cy.getGridRowButtonOrLink(0, 0));
    cy.getByTestId("dialog-submit-button")
      .should("exist")
      .should("be.disabled")
      .contains("Save");

    testFormField("varNameField", "Name", true, { expectDisabled: true });
    testFormField("varTypeField", "Type", true, { expectDisabled: false });
    testFormField("varArrayField", "Is Array?", false, {
      isCheckbox: true,
      expectDisabled: false,
    });
    testFormField("initExprField", "Value", false);
    testFormField("gitMessageField", "Save Message", false, {
      defaultValue: "Updated variable.",
    });

    typeFormField("initExprInput", "editValue");
    cy.getByTestId("dialog-submit-button")
      .should("exist")
      .should("not.be.disabled")
      .contains("Save");
    submitDialog();
    testDialogIsNotDisplayed();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_SAVE);
  });

  it("should be able to delete a variable", () => {
    cy.visit("/rule-designer/configuration/global-variables");
    testDialog(cy.getGridRowButtonOrLink(0, 6), "Delete Confirmation");
    openDialog(cy.getGridRowButtonOrLink(0, 6));
    cy.getByTestId("dialog-submit-button")
      .should("exist")
      .should("not.be.disabled")
      .contains("Confirm");
    submitDialog();
    testDialogIsNotDisplayed();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_DELETE);
  });
});
