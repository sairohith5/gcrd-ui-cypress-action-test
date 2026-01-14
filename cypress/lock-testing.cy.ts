import { getRelativeDate, getRelativeDateFromEpoch } from "../utils/date-utils";
import {
  cancelDialog,
  testCommitDialog,
  testDialog,
  testDialogIsNotDisplayed,
  testIsDialogDisplayed,
} from "../utils/dialog-utils";
import { typeFormField } from "../utils/form-utils";
import { clickGridRow } from "../utils/grid-utils";
import { ToastMessage, ToastTitle, testToast } from "../utils/toast-utils";

/**
 * The following tests will test the lock functionality of the application. We are not able to test that
 * clicking the lock button actually unlocks/locks the item, but we can test that the correct icon is displayed,
 * and we can also test that the confirmation dialog appears when the item is locked/checked by another user.
 */
describe("item locking button", () => {
  it("displays item checked out by me icon", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );

    cy.getByTestId("lock-button")
      .find("svg[data-icon='user-lock'].text-he-green-1")
      .should("exist");

    // test the tooltip
    cy.getByTestId("lock-button").should("exist").focus(); // make the tooltip appear
    cy.getByTestId("lock-tooltip").contains("Item checked out by me");
    cy.getByTestId("lock-tooltip").contains("06/06/2024, 5:39 pm");
    cy.getByTestId("lock-tooltip").contains(
      "Click to commit or revert changes",
    );
  });

  it("displays item checked out by another user icon", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MessagePriorityInstance",
    );

    cy.getByTestId("lock-button")
      .should("be.disabled")
      .find("svg[data-icon='lock'].text-he-red-1")
      .should("exist");

    // TODO: unable to test the tooltip because the button is disabled and cypress cannot focus on it to make the tooltip appear;
    //       once we implement the admin role, we can test this by having an admin user test the tooltip via cypress
    // cy.getByTestId("lock-button").should("exist").focus(); // make the tooltip appear
    // cy.getByTestId("lock-tooltip").contains(
    //   "Item checked out by mdickson@healthedge.com",
    // );
    // cy.getByTestId("lock-tooltip").contains("06/06/2024, 5:39 pm");
  });

  it("displays unlocked item icon", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_RealTimeRulesConfiguration",
    );

    cy.getByTestId("lock-button")
      .find("svg[data-icon='lock'].text-he-gray-2")
      .should("exist");

    // test the tooltip
    cy.getByTestId("lock-button").should("exist").focus(); // make the tooltip appear
    cy.getByTestId("lock-tooltip").contains(
      "Click to check out item for editing (this will also sync your workspace)",
    );
  });

  it("displays the Commit Item dialog when lock button is clicked", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );

    testCommitDialog();
  });

  it("reverts a checkout", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );

    cy.wait(1000);
    cy.getByTestId("lock-button").should("exist").click();
    cy.getByTestId("dialog-destructive-button")
      .should("exist")
      .should("not.be.disabled")
      .contains("Revert Changes")
      .click();

    cy.getByTestId("dialog-content").contains(
      "You will lose all unsaved and uncommitted changes to this item if you revert changes.",
    );
    cy.getByTestId("dialog-content").contains("Do you want to proceed?");
    cy.getByTestId("dialog-submit-button").click();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_REVERT);
  });

  // Skipping this for now until we implement Admin roles which might be able to unlock items
  it.skip("displays confirmation dialog when item is locked by another user", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MessagePriorityInstance",
    );

    cy.wait(1000); // wait for the lock status to be fetched (this is a workaround for the test failing intermittently due to the lock status not being fetched in time)
    testDialog(cy.getByTestId("lock-button"), "Confirm Checkout");

    cy.getByTestId("lock-button").click();
    cy.getByTestId("dialog-content").contains(
      "Another user has this item checked out and may be editing it. Checking out it will prevent that user from making further edits.",
    );
    cy.getByTestId("dialog-content").contains(
      "Are you sure you want to check out this item?",
    );

    cy.getByTestId("dialog-submit-button").click();
    testDialogIsNotDisplayed();
  });
});

describe("my checked out items on dashboard", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(1000);
  });

  it("displays locked items", () => {
    cy.getByTestId("lock-records-dashboard")
      .should("exist")
      .contains("My Checked-out Items");

    // test display of the refresh button
    cy.getByTestId("locked-records-refresh-button").should("exist").focus(); // make the tooltip appear
    cy.getByTestId("tooltip-content").contains("Refresh");

    // test display of each of the lock items in the list (this will also test the ordering and the relative date calculation)
    cy.getByTestId("locked-records-list")
      .find("ul li")
      .then((items) => {
        expect(items[0]).to.contain.text("CheckDecisionforEachLine");
        expect(items[0]).to.contain.text(
          getRelativeDateFromEpoch(1673546716000), // comes from the getlocks.json file
        );

        expect(items[1]).to.contain.text(
          "DT_MasterTableForHierarchyRootPathInstance",
        );
        expect(items[1]).to.contain.text(
          getRelativeDateFromEpoch(1712945116000), // comes from the getlocks.com.json file
        );

        expect(items[2]).to.contain.text("Batch_Activity_RS");
        expect(items[2]).to.contain.text(
          getRelativeDateFromEpoch(1718137696312), // comes from the getlocks.com.json file
        );

        expect(items[3]).to.contain.text("defaultRule");
        expect(items[3]).to.contain.text(
          "DT_MasterTableForHierarchyRootPathInstance",
        );
        expect(items[3]).to.contain.text(
          getRelativeDateFromEpoch(1718137696312), // comes from the getlocks.com.json file
        );

        expect(items[4]).to.contain.text("Apex_582");
        expect(items[4]).to.contain.text("Batch_Activity_RS");
        expect(items[4]).to.contain.text(
          getRelativeDateFromEpoch(1718210903357), // comes from the getlocks.json file
        );

        expect(items[5]).to.contain.text("main");
        expect(items[5]).to.contain.text(
          getRelativeDateFromEpoch(1718301916000), // comes from the getlocks.json file
        );

        expect(items[6]).to.contain.text("globalVariables");
        expect(items[6]).to.contain.text(
          getRelativeDateFromEpoch(1738137499912), // comes from the getlocks.json file
        );

        expect(items[7]).to.contain.text("rule1");
        expect(items[7]).to.contain.text("Batch_AG_Letter_RS");
        expect(items[7]).to.contain.text(
          getRelativeDateFromEpoch(1738137499912), // comes from the getlocks.json file
        );

        expect(items[8]).to.contain.text("rule1");
        expect(items[8]).to.contain.text("Batch_AG_RealTime_RS");
        expect(items[8]).to.contain.text(
          getRelativeDateFromEpoch(1738137499912), // comes from the getlocks.json file
        );

        expect(items[9]).to.contain.text("fnWithInvokeNode");
        expect(items[9]).to.contain.text(
          getRelativeDateFromEpoch(1755083182302), // comes from the getlocks.json file
        );

        expect(items[10]).to.contain.text("TestFile1");
        expect(items[10]).to.contain.text(
          getRelativeDateFromEpoch(1755083182302), // comes from the getlocks.json file
        );

        expect(items[11]).to.contain.text("test_123");
        expect(items[11]).to.contain.text(
          getRelativeDateFromEpoch(1755083182302), // comes from the getlocks.json file
        );

        expect(items[13]).to.contain.text("delete-ReferencedObject");
        expect(items[13]).to.contain.text(
          getRelativeDateFromEpoch(1755083182302), // comes from the getlocks.json file
        );
      });
  });

  it("commits a single item from the dashboard", () => {
    cy.wait(1000); // wait for the lock items to be fetched (they come in a bit later after page load)
    cy.getByTestId("locked-records-list")
      .find("ul li")
      .eq(0)
      .as("firstLockedRecord");

    // check that the unlock button is displayed and then click it
    cy.get("@firstLockedRecord")
      .find(
        "[aria-label='Unlock CheckDecisionforEachLine'] svg[data-icon='user-lock']",
      )
      .should("exist")
      .click();

    cy.getByTestId("dialog-title").contains("Commit/Revert Item");
  });

  it("commits multiple items from the dashboard", () => {
    cy.wait(1000); // wait for the lock items to be fetched (they come in a bit later after page load)

    // expect all items to be checked by default
    cy.getByTestId("locked-records-list")
      .find("ul li")
      .each((item) => {
        cy.wrap(item)
          .find("button[role='checkbox']")
          .should("have.attr", "data-state", "checked");
      });

    cy.getByTestId("commitRevertBtn")
      .should("exist")
      .contains("Commit/Revert 14 Items");
    cy.getByTestId("commitRevertCheckbox-2").click();
    cy.getByTestId("commitRevertBtn")
      .should("exist")
      .contains("Commit/Revert 13 Items");
    cy.getByTestId("commitRevertBtn").click();
    cy.getByTestId("dialog-title").contains("Commit/Revert Selected Items");
    typeFormField("gitMessageInput", "test");
    cy.getByTestId("dialog-submit-button").click();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_COMMIT);
  });

  it("reverts a single item using the checkbox from dashboard", () => {
    cy.wait(1000); // wait for the lock items to be fetched (they come in a bit later after page load)

    // expect all items to be checked by default
    cy.getByTestId("locked-records-list")
      .find("ul li")
      .each((item) => {
        cy.wrap(item)
          .find("button[role='checkbox']")
          .should("have.attr", "data-state", "checked")
          .click();
      });

    cy.getByTestId("commitRevertBtn")
      .should("exist")
      .should("be.disabled")
      .contains("Commit/Revert Selected Items");
    cy.getByTestId("commitRevertCheckbox-2").click();
    cy.wait(500);
    cy.getByTestId("commitRevertBtn")
      .should("exist")
      .should("not.be.disabled")
      .contains("Commit/Revert 1 Item")
      .click();
    cy.getByTestId("dialog-title").contains("Commit/Revert Item");
    cy.getByTestId("dialog-destructive-button").click();
    cy.getByTestId("dialog-content").contains(
      "You will lose all unsaved and uncommitted changes to this item if you revert changes.",
    );
    cy.getByTestId("dialog-content").contains("Do you want to proceed?");
    cy.getByTestId("dialog-submit-button").click();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_REVERT);
  });

  it("allows user to individualy check/uncheck items with duplicate names", () => {
    cy.getByTestId("commitRevertCheckbox-7").should(
      "have.attr",
      "data-state",
      "checked",
    );
    cy.getByTestId("commitRevertCheckbox-8").should(
      "have.attr",
      "data-state",
      "checked",
    );

    cy.getByTestId("commitRevertCheckbox-7").click();
    cy.getByTestId("commitRevertCheckbox-7").should(
      "have.attr",
      "data-state",
      "unchecked",
    );
    cy.getByTestId("commitRevertCheckbox-8").should(
      "have.attr",
      "data-state",
      "checked",
    );
    cy.getByTestId("commitRevertCheckbox-8").click();
    cy.getByTestId("commitRevertCheckbox-8").should(
      "have.attr",
      "data-state",
      "unchecked",
    );
  });

  it("navigates to function page", () => {
    cy.getByTestId("locked-records-list").find("ul li").eq(0).find("a").click();
    cy.wait(1000);
    cy.url().should(
      "include",
      "/rule-designer/designer/functions/CheckDecisionforEachLine",
    );
  });

  it("navigates to decision table page", () => {
    cy.getByTestId("locked-records-list").find("ul li").eq(1).find("a").click();
    cy.url().should(
      "include",
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );
  });

  it("navigates to ruleset page", () => {
    cy.getByTestId("locked-records-list").find("ul li").eq(2).find("a").click();
    cy.url().should(
      "include",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS",
    );
  });

  it("navigates to decision table function page", () => {
    cy.getByTestId("locked-records-list").find("ul li").eq(3).find("a").click();
    cy.url().should(
      "include",
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance/function/defaultRule",
    );
  });

  it("navigates to rule page", () => {
    cy.getByTestId("locked-records-list").find("ul li").eq(4).find("a").click();
    cy.url().should(
      "include",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS/rule/Apex_582",
    );
  });

  it("navigates to global variables page", () => {
    cy.getByTestId("locked-records-list").find("ul li").eq(5).find("a").click();
    cy.url().should("include", "/rule-designer/designer/main-flow");
  });

  it("navigates to main flow page", () => {
    cy.getByTestId("locked-records-list").find("ul li").eq(6).find("a").click();
    cy.url().should("include", "/rule-designer/configuration/global-variables");
  });

  it("navigates to test case page", () => {
    cy.getByTestId("locked-records-list")
      .find("ul li")
      .eq(10)
      .find("a")
      .click();
    cy.url().should(
      "include",
      "/rule-designer/rule-testing/test-cases/TestFile1",
    );
  });

  it("navigates to custom object", () => {
    // Verify the My Checked-out Items section is visible
    cy.contains("My Checked-out Items").should("be.visible");

    // Locate the locked records list and click on test_123 item
    cy.getByTestId("locked-records-list")
      .should("be.visible")
      .find("ul li")
      .contains("test_123")
      .click();

    cy.wait(500);

    cy.url().should(
      "include",
      "/rule-designer/configuration/custom-objects/test_123",
    );
    cy.testHeaderAndFooter("test_123");
    cy.testBreadcrumbs(["Home", "Custom Objects"]);
    cy.testBrowserTitle("[test_123] BOM Type");
  });
});

describe("my checked-out items in dialog", () => {
  beforeEach(() => {
    // just navigating somewhere other than the dashboard here, so the locked items on the dashboard don't clash with those displayed in the dialog
    cy.visit("/rule-designer/configuration/bot");
    cy.wait(1000);
  });

  it("displays the locked items dialog from the user profile menu", () => {
    cy.getByTestId("user-menu-btn").click();
    cy.getByTestId("user-tasks-menu-item")
      .should("exist")
      .contains("My Checked-out Items")
      .click();
    cy.getByTestId("dialog-title").contains("My Checked-out Items");
    cy.getByTestId("dialog-cancel-button").should("exist").contains("Close");
    cy.getByTestId("dialog-submit-button").should("not.exist");

    // just testing some basic things here... everything else is already tested in the dashboard tests
    cy.getByTestId("locked-records-container").should("exist");

    cy.getByTestId("locked-records-list")
      .find("ul li")
      .then((items) => {
        expect(items[0]).to.contain.text("CheckDecisionforEachLine");
        expect(items[0]).to.contain.text(
          getRelativeDateFromEpoch(1673546716000), // comes from the getlocks-testuser_healthedge.com.json file
        );
      });
    cancelDialog();
  });

  it("reverts a single item from the user profile menu", () => {
    cy.getByTestId("user-menu-btn").click();
    cy.getByTestId("user-tasks-menu-item").should("exist").click();

    cy.getByTestId("locked-records-list")
      .find("ul li")
      .eq(0)
      .as("firstLockedRecord");

    // check that the unlock button is displayed and then click it
    cy.get("@firstLockedRecord")
      .find(
        "[aria-label='Unlock CheckDecisionforEachLine'] svg[data-icon='user-lock']",
      )
      .should("exist")
      .click();

    cy.getByTestId("dialog-title").contains("Commit/Revert Item");

    cy.getByTestId("dialog-destructive-button").click();
    cy.getByTestId("dialog-content").contains(
      "You will lose all unsaved and uncommitted changes to this item if you revert changes.",
    );
    cy.getByTestId("dialog-content").contains("Do you want to proceed?");
    cy.getByTestId("dialog-submit-button").click();
    testToast(ToastTitle.SUCCESS, ToastMessage.SUCCESSFUL_REVERT);
  });
});

describe("deleting locked items", () => {
  /*
   * With mock data, we can test that the confirmation dialog appears when deleting a locked item, but we can't test that the lock is actually removed
   */
  beforeEach(() => {
    cy.visit("/rule-designer/designer/decision-tables");
  });

  it("does not display lock confirmation when deleting an item checked out by current user", () => {
    clickGridRow(0, 4, 3);
    testIsDialogDisplayed();

    cy.getByTestId("dialog-content")
      .contains("Item is currently checked out by")
      .should("not.exist");
    cy.getByTestId("dialog-content").contains(
      "This item will be deleted immediately and is not recoverable.",
    );
  });
});

describe.skip("saving locked items", () => {
  // we are not able to test this use case with mock data, because we need another user to lock the item after we have locked it
});
