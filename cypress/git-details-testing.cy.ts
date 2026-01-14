import { getRelativeDate } from "../utils/date-utils";
import { testRevisionHistoryDialog } from "../utils/revision-history-utils";

/**
 * The following test will test the display of the GIT details in the upper right corner of the screen (last committed,
 * commit author, and commit messsage)
 */
describe("git details display", () => {
  it("should display the last committed date", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );

    cy.getByTestId("git-details")
      .should("exist")
      .contains(
        "Last Committed " + getRelativeDate("2022-05-03 11:28:33 -0400"),
      );

    // test the info icon tooltip
    cy.getByTestId("git-info-button").should("exist").click();
    cy.getByTestId("git-tooltip").contains("Last Committed:");
    cy.getByTestId("git-tooltip").contains("05/03/2022, 11:28 am");
    cy.getByTestId("git-tooltip").contains("Message:");
    cy.getByTestId("git-tooltip").contains("Initial commit");

    cy.getByTestId("view-revision-history-btn")
      .should("exist")
      .contains("View Revision History")
      .click();
    testRevisionHistoryDialog("DT_MasterTableForHierarchyRootPathInstance", [
      { type: "checkbox", isChecked: false },
      "b7f3b8f",
      getRelativeDate("2024-11-15 16:53:38 -0500"),
      { type: "email", value: "mdickson1@gmail.com" },
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
      { type: "button", value: "Rollback to this revision" },
    ]);
  });
  it("should display message when no commit history is available", () => {
    cy.visit("/rule-designer/designer/functions/fn_authEligibility");
    cy.getByTestId("git-details")
      .should("exist")
      .contains(
        "Last Committed " + getRelativeDate("2025-04-23 21:07:36 -05:00"),
      );
  });
});
