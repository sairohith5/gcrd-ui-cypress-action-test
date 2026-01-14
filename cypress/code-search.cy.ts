import {
  selectFormField,
  testFormField,
  typeFormField,
} from "../utils/form-utils";
import {
  clickGridRow,
  testFilterShouldNotExist,
  testRow,
  testTable,
} from "../utils/grid-utils";

function searchCode(searchText: string) {
  selectFormField("searchTypeDropdown", "Code");

  cy.getByTestId("autocomplete-button")
    .contains("Find items with specific code")
    .click();
  cy.getByTestId("autocomplete-input-field").should("exist").type(searchText);
  cy.wait(1000);
}

function fullSearchCode(searchText: string) {
  searchCode(searchText);
  cy.getByTestId("autocomplete-full-search-button").click();
  cy.wait(500);
}

function clickQuickSearchResultItem(index: number) {
  cy.getByTestId(`autocomplete-item-${index}`)
    .should("exist")
    .find("a")
    .click();
  cy.wait(1500);
}

describe("quick searching for code from dashboard", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(1000);
  });

  it("should do a quick search for code", () => {
    const options = {
      numSelectOptionsToTest: 2,
      expectedSelectOptions: ["Select one", "Search Code", "Search Tags"],
    };
    cy.getByTestId("searchTypeDropdown")
      .find("option")
      .then((actualOptions) => {
        const numToValidate = options.numSelectOptionsToTest
          ? options.numSelectOptionsToTest
          : actualOptions.length;
        for (let x = 0; x < numToValidate; x++) {
          expect(actualOptions[x]).to.contain.text(
            // @ts-ignore
            options.expectedSelectOptions[x],
          );
        }
      });

    cy.getByTestId("autocomplete-button").contains("Find tagged items");
    searchCode("test");

    cy.getByTestId("autocomplete-group-header")
      .should("exist")
      .find("div[cmdk-group-items] div[cmdk-item]")
      .should("have.lengthOf", 10)
      .then((items) => {
        // just check the first 5 items
        expect(items[0]).to.contain.text("Batch_Activity_RS");
        expect(items[1]).to.contain.text("Apex_582 (Batch_Activity_RS)");
        expect(items[2]).to.contain.text("CheckDecisionforEachLine");
        expect(items[3]).to.contain.text(
          "DT_MasterTableForHierarchyRootPathInstance",
        );
        expect(items[4]).to.contain.text(
          "defaultRule (DT_MasterTableForHierarchyRootPathInstance)",
        );
        expect(items[5]).to.contain.text("main-flow");
      });
  });

  it("should navigate to a rule set from quick search results", () => {
    searchCode("test");
    clickQuickSearchResultItem(0);
    cy.url().should(
      "include",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS",
    );
  });

  it("should navigate to a rule from quick search results", () => {
    searchCode("test");
    clickQuickSearchResultItem(1);
    cy.url().should(
      "include",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS/rule/Apex_582",
    );
  });

  it("should navigate to a function from quick search results", () => {
    searchCode("test");
    clickQuickSearchResultItem(2);
    cy.url().should(
      "include",
      "/rule-designer/designer/functions/CheckDecisionforEachLine",
    );
  });

  it("should navigate to a decision table from quick search results", () => {
    searchCode("test");
    clickQuickSearchResultItem(3);
    cy.url().should(
      "include",
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );
  });

  it("should navigate to a decision table function from quick search results", () => {
    searchCode("test");
    clickQuickSearchResultItem(4);
    cy.url().should(
      "include",
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance/function/defaultRule",
    );
  });

  it("should navigate to the main flow from quick search results", () => {
    searchCode("test");
    clickQuickSearchResultItem(5);
    cy.url().should("include", "/rule-designer/designer/main-flow");
  });
});

describe("quick searching for code from application screen", () => {
  // most of the testing of this component has already been done in the dashboard tests
  // so this test is just to smoke test that the component is working in the application screen
  beforeEach(() => {
    cy.visit("/rule-designer/designer/functions");
    cy.wait(1000);
  });

  it("should do a quick search for code", () => {
    const options = {
      numSelectOptionsToTest: 2,
      expectedSelectOptions: ["Select one", "Search Code", "Search Tags"],
    };
    cy.getByTestId("searchTypeDropdown")
      .find("option")
      .then((actualOptions) => {
        const numToValidate = options.numSelectOptionsToTest
          ? options.numSelectOptionsToTest
          : actualOptions.length;
        for (let x = 0; x < numToValidate; x++) {
          expect(actualOptions[x]).to.contain.text(
            // @ts-ignore
            options.expectedSelectOptions[x],
          );
        }
      });

    cy.getByTestId("autocomplete-button").contains("Find tagged items");
    searchCode("test");

    cy.getByTestId("autocomplete-group-header")
      .should("exist")
      .find("div[cmdk-group-items] div[cmdk-item]")
      .should("have.lengthOf", 10)
      .then((items) => {
        // just check the first 5 items
        expect(items[0]).to.contain.text("Batch_Activity_RS");
        expect(items[1]).to.contain.text("Apex_582 (Batch_Activity_RS)");
        expect(items[2]).to.contain.text("CheckDecisionforEachLine");
        expect(items[3]).to.contain.text(
          "DT_MasterTableForHierarchyRootPathInstance",
        );
        expect(items[4]).to.contain.text(
          "defaultRule (DT_MasterTableForHierarchyRootPathInstance)",
        );
        expect(items[5]).to.contain.text("main-flow");
      });
  });
});

describe("full search for code from dashboard", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    cy.wait(1000);
  });

  it("should open the full search sheet and show the full results from the quick search", () => {
    fullSearchCode("test");
    cy.getByTestId("searched-items-sheet").should("exist");
    cy.getByTestId("searched-items-sheet-title")
      .should("exist")
      .contains("Code Search Results");

    testFormField("searchTextField", "Search Text", false, {
      defaultValue: "test",
    });
    testTable(
      ["Type", "Item", "Node", "Matched Text"],
      ["Rule Set", "Batch_Activity_RS", "", "testRule"],
      "codeSearchResultsTable",
    );
    testRow(
      1,
      ["Rule", "Apex_582 (Batch_Activity_RS)", "IF", "test"],
      "codeSearchResultsTable",
    );
    testRow(
      2,
      ["Function", "CheckDecisionforEachLine", "", "testdecisionTable"],
      "codeSearchResultsTable",
    );
    testRow(
      3,
      [
        "Decision Table",
        "DT_MasterTableForHierarchyRootPathInstance",
        "",
        "test fragment",
      ],
      "codeSearchResultsTable",
    );
    testRow(
      4,
      [
        "Table Function",
        "defaultRule (DT_MasterTableForHierarchyRootPathInstance)",
        "",
        "test1243",
      ],
      "codeSearchResultsTable",
    );
    testRow(
      5,
      ["Main Flow", "main-flow", "", "test main flow"],
      "codeSearchResultsTable",
    );
    testFilterShouldNotExist("codeSearchResultsTable");
  });

  it("should search for code in the full search sheet", () => {
    fullSearchCode("test");
    cy.getByTestId("searched-items-sheet").should("exist");
    testFormField("searchTextField", "Search Text", false, {
      defaultValue: "test",
    });
    // result from "test" search:
    testRow(
      3,
      [
        "Decision Table",
        "DT_MasterTableForHierarchyRootPathInstance",
        "",
        "test fragment",
      ],
      "codeSearchResultsTable",
    );
    cy.getByTestId("searchTextInput").clear();
    typeFormField("searchTextInput", "tests");
    cy.getByTestId("codeSearchSubmitButton").should("exist").click();

    // result from "tests" search:
    testRow(
      3,
      ["Function", "testNewfn", "", "testNewfn"],
      "codeSearchResultsTable",
    );
  });

  it("should navigate to a rule set from full search results", () => {
    fullSearchCode("tests");
    clickGridRow(0, 1, 0, "codeSearchResultsTable");
    cy.wait(1000);
    cy.url().should(
      "include",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS",
    );
    cy.getByTestId("searched-items-sheet").should("not.exist");
  });

  it("should navigate to a rule from full search results", () => {
    fullSearchCode("tests");
    clickGridRow(1, 1, 0, "codeSearchResultsTable");
    cy.wait(1000);
    cy.url().should(
      "include",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS/rule/Apex_582",
    );
    cy.getByTestId("searched-items-sheet").should("not.exist");
  });

  it("should navigate to a function from full search results", () => {
    fullSearchCode("tests");
    clickGridRow(2, 1, 0, "codeSearchResultsTable");
    cy.wait(1000);
    cy.url().should(
      "include",
      "/rule-designer/designer/functions/CheckDecisionforEachLine",
    );
    cy.getByTestId("searched-items-sheet").should("not.exist");
  });

  it("should navigate to a decision table from full search results", () => {
    fullSearchCode("tests");
    clickGridRow(13, 1, 0, "codeSearchResultsTable");
    cy.wait(1000);
    cy.url().should(
      "include",
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );
    cy.getByTestId("searched-items-sheet").should("not.exist");
  });

  it("should navigate to a decision table function from full search results", () => {
    fullSearchCode("tests");
    clickGridRow(14, 1, 0, "codeSearchResultsTable");
    cy.wait(1000);
    cy.url().should(
      "include",
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance/function/defaultRule",
    );
    cy.getByTestId("searched-items-sheet").should("not.exist");
  });

  it("should close the full search sheet when clicking the close button", () => {
    fullSearchCode("test");
    cy.getByTestId("sheet-close-x-btn").click();
    cy.getByTestId("global-code-search-full-search-sheet").should("not.exist");
  });
});

describe("full search for code from application screen", () => {
  // only testing a couple things here since most of the testing of this component has already been done in the dashboard tests
  beforeEach(() => {
    cy.visit(
      "/rule-designer/designer/rule-sets/Batch_Activity_RS/rule/Apex_582",
    );
    cy.wait(1000);
  });

  it("should open the full search sheet and show the full results from the quick search", () => {
    fullSearchCode("test");
    cy.getByTestId("searched-items-sheet").should("exist");
    cy.getByTestId("searched-items-sheet-title")
      .should("exist")
      .contains("Code Search Results");

    testFormField("searchTextField", "Search Text", false, {
      defaultValue: "test",
    });
    testTable(
      ["Type", "Item", "Node", "Matched Text"],
      ["Rule Set", "Batch_Activity_RS", "", "testRule"],
      "codeSearchResultsTable",
    );
    testRow(
      1,
      ["Rule", "Apex_582 (Batch_Activity_RS)", "IF", "test"],
      "codeSearchResultsTable",
    );
    testRow(
      2,
      ["Function", "CheckDecisionforEachLine", "", "testdecisionTable"],
      "codeSearchResultsTable",
    );
    testRow(
      3,
      [
        "Decision Table",
        "DT_MasterTableForHierarchyRootPathInstance",
        "",
        "test fragment",
      ],
      "codeSearchResultsTable",
    );
    testRow(
      4,
      [
        "Table Function",
        "defaultRule (DT_MasterTableForHierarchyRootPathInstance)",
        "",
        "test1243",
      ],
      "codeSearchResultsTable",
    );
    testRow(
      5,
      ["Main Flow", "main-flow", "", "test main flow"],
      "codeSearchResultsTable",
    );
    testFilterShouldNotExist("codeSearchResultsTable");
  });

  it("should navigate to a rule set from full search results", () => {
    fullSearchCode("tests");
    clickGridRow(0, 1, 0, "codeSearchResultsTable");
    cy.wait(1000);
    cy.url().should(
      "include",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS",
    );
    cy.getByTestId("searched-items-sheet").should("not.exist");
  });
});
