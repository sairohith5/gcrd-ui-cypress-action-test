import {
  testDialogIsNotDisplayed,
  testIsDialogDisplayed,
} from "../utils/dialog-utils";
import {
  clickGridRow,
  testFilterShouldNotExist,
  testRow,
  testTable,
} from "../utils/grid-utils";

describe("tagging a function", () => {
  beforeEach(() => {
    cy.visit("/rule-designer/designer/functions/CheckDecisionforEachLine");
    cy.wait(1000);
  });

  it("should display the function tags", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(3);
        expect(tags[0]).to.contain.text("BusinessLibrary");
        expect(tags[1]).to.contain.text("GCRE-123");
        expect(tags[2]).to.contain.text("GCRE-456");
      });
  });

  it("should search and add a tag to the function", () => {
    cy.getByTestId("tags-container").find("input").type("Technical");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find(".available-tag")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("TechnicalLibrary");
      });
    cy.getByTestId("available-tag-TechnicalLibrary").click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(4);
        expect(tags[3]).to.contain.text("TechnicalLibrary");
      });
  });

  it("should add a new tag to the function", () => {
    cy.getByTestId("tags-container").find("input").type('newtag"'); // testing with a double quote, which should get converted to a single quote
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(4);
        expect(tags[3]).to.contain.text("newtag");
      });
  });

  it("should remove a tag", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(3);
      });
    cy.getByTestId("remove-tag-GCRE-456").should("exist").click();
    testIsDialogDisplayed("delete-tag-dialog-GCRE-456-dialog-container");
    cy.getByTestId("delete-tag-dialog-GCRE-456-dialog-title").contains(
      "Delete Confirmation",
    );
    cy.getByTestId("delete-tag-dialog-GCRE-456-dialog-form-container")
      .should("exist")
      .should(
        "include.text",
        "Are you sure you want to remove the tag GCRE-456 from this item?",
      );

    cy.getByTestId("delete-tag-dialog-GCRE-456-dialog-cancel-button").click();
    testDialogIsNotDisplayed("delete-tag-dialog-GCRE-456-dialog-container");
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(3);
      });
    cy.getByTestId("remove-tag-GCRE-456").should("exist").click();
    cy.getByTestId(
      "delete-tag-dialog-GCRE-456-dialog-destructive-button",
    ).click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(2);
      });
    cy.getByTestId("remove-tag-GCRE-456").should("not.exist");
  });

  it("should filter out special characters when creating a tag", () => {
    // Type tag names with special characters - they should be filtered out automatically
    cy.getByTestId("tags-container").find("input").type("percent%");
    // Verify the input shows filtered value
    cy.getByTestId("tags-container")
      .find("input")
      .should("have.value", "percent");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();

    cy.getByTestId("tags-container").find("input").type("dot.");
    cy.getByTestId("tags-container").find("input").should("have.value", "dot");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();

    cy.getByTestId("tags-container").find("input").type("forwardslash/");
    cy.getByTestId("tags-container")
      .find("input")
      .should("have.value", "forwardslash");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();

    cy.getByTestId("tags-container").find("input").type("backwardslash\\");
    cy.getByTestId("tags-container")
      .find("input")
      .should("have.value", "backwardslash");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();

    // Verify all tags were created without special characters
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(7);
        expect(tags[3]).to.contain.text("percent");
        expect(tags[4]).to.contain.text("dot");
        expect(tags[5]).to.contain.text("forwardslash");
        expect(tags[6]).to.contain.text("backwardslash");
      });
  });

  it("should filter out special characters and only allow alphanumeric, hyphens, underscores, and spaces", () => {
    // Integration test: Type a string with various special characters
    // and verify that only valid characters remain (alphanumeric, -, _, and spaces)
    cy.getByTestId("tags-container").find("input").type("apple!1@./#-8_");

    cy.getByTestId("tags-container")
      .find("input")
      .should("have.value", "apple1-8_");

    // Create the tag and verify it's created with the filtered value
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();

    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(4);
        expect(tags[3]).to.contain.text("apple1-8_");
      });
  });

  it("should not permit tags longer than 50 characters", () => {
    cy.getByTestId("tags-container").find("input").type("a".repeat(51));
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();

    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(4);
        cy.wrap(tags[3]).should("have.text", "a".repeat(50));
      });
  });
});

describe("tagging a ruleset", () => {
  beforeEach(() => {
    cy.visit("/rule-designer/designer/rule-sets/Batch_Activity_RS");
    cy.wait(1000);
  });

  it("should display the ruleset tags", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("TechnicalLibrary");
      });
  });

  it("should search and add a tag to the ruleset", () => {
    cy.getByTestId("tags-container").find("input").type("Business");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find(".available-tag")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("BusinessLibrary");
      });
    cy.getByTestId("available-tag-BusinessLibrary").click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(2);
        expect(tags[1]).to.contain.text("BusinessLibrary");
      });
  });
});

describe("tagging a rule", () => {
  beforeEach(() => {
    cy.visit(
      "/rule-designer/designer/rule-sets/Batch_Activity_RS/rule/Apex_582",
    );
    cy.wait(1000);
  });

  it("should display the rule tags", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("GCRE-789");
      });
  });

  it("should search and add a tag to the rule", () => {
    cy.getByTestId("tags-container").find("input").type("GCRE");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find(".available-tag")
      .then((tags) => {
        expect(tags).to.have.length(2);
        expect(tags[0]).to.contain.text("GCRE-123");
      });
    cy.getByTestId("available-tag-GCRE-123").click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(2);
        expect(tags[1]).to.contain.text("GCRE-123");
      });
  });
});

describe("tagging a decision table", () => {
  beforeEach(() => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );
    cy.wait(1000);
  });

  it("should display the decision table tags", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(2);
        expect(tags[0]).to.contain.text("TechnicalLibrary");
        expect(tags[1]).to.contain.text("GCRE-123");
      });
  });

  it("should search and add a tag to the decision table", () => {
    cy.getByTestId("tags-container").find("input").type("BusinessLibrary");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("not.exist");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find(".available-tag")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("BusinessLibrary");
      });
    cy.getByTestId("available-tag-BusinessLibrary").click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(3);
        expect(tags[2]).to.contain.text("BusinessLibrary");
      });
  });
});

describe("tagging a decision table function", () => {
  beforeEach(() => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance/function/defaultRule",
    );
  });

  it("should display the table function tags", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(3);
        expect(tags[0]).to.contain.text("BusinessLibrary");
        expect(tags[1]).to.contain.text("GCRE-123");
        expect(tags[2]).to.contain.text("GCRE-456");
      });
  });

  it("should search and add a tag to the table function", () => {
    cy.getByTestId("tags-container").find("input").type("TechnicalLibrary");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("not.exist");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find(".available-tag")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("TechnicalLibrary");
      });
    cy.getByTestId("available-tag-TechnicalLibrary").click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(4);
        expect(tags[3]).to.contain.text("TechnicalLibrary");
      });
  });
});

describe("tagging a test case", () => {
  beforeEach(() => {
    cy.visit("/rule-designer/rule-testing/test-cases/TestFile1");
    cy.wait(2000);
  });

  it("should display the test case tags", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(3);
        expect(tags[0]).to.contain.text("BusinessLibrary");
        expect(tags[1]).to.contain.text("GCRE-123");
        expect(tags[2]).to.contain.text("GCRE-456");
      });
  });

  it("should search and add a tag to the test case", () => {
    cy.getByTestId("tags-container").find("input").type("TechnicalLibrary");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("not.exist");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find(".available-tag")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("TechnicalLibrary");
      });
    cy.getByTestId("available-tag-TechnicalLibrary").click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(4);
        expect(tags[3]).to.contain.text("TechnicalLibrary");
      });
  });
});

describe("recently used tags", () => {
  it("should display the recently used tags", () => {
    // navigate to a function and search for a couple tags so they get put in the recently used tags
    cy.visit("/rule-designer/designer/functions/CheckDecisionforEachLine");

    cy.getByTestId("tags-container").find("input").type("TechnicalLibrary");
    cy.wait(500);
    cy.getByTestId("available-tag-TechnicalLibrary").click();

    cy.getByTestId("tags-container").find("input").type("GCRE-789");
    cy.wait(500);
    cy.getByTestId("available-tag-GCRE-789").click();

    // navigate to a different function and check if the recently used tags are displayed
    cy.visit("/rule-designer/designer/functions/fn_APEX_539_Rule");

    cy.getByTestId("tags-container").find("input").click();
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find(".available-tag")
      .then((tags) => {
        expect(tags).to.have.length(2);
        expect(tags[0]).to.contain.text("GCRE-789");
        expect(tags[1]).to.contain.text("TechnicalLibrary");
      });
  });
});

describe("tagged items component", () => {
  it("should open the tag sheet when clicking on a selected tag", () => {
    cy.visit("/rule-designer/designer/functions/CheckDecisionforEachLine");

    cy.getByTestId("tag-button-BusinessLibrary").click();
    cy.getByTestId("tagged-items-sheet")
      .should("exist")
      .find("[data-testid='tag-BusinessLibrary']")
      .should("exist")
      .contains("BusinessLibrary");
  });

  it("should open the tag sheet when clicking on a tag from the grid", () => {
    cy.visit("/rule-designer/designer/functions");
    cy.getGridCell(0, 2).find("[data-testid='tag-button-GCRE-123']").click();

    cy.getByTestId("tagged-items-sheet")
      .should("exist")
      .find("[data-testid='tag-GCRE-123']")
      .should("exist")
      .contains("GCRE-123");
  });

  it("should be able to open the same tag sheet after closing it", () => {
    cy.visit("/rule-designer/designer/functions");
    cy.getGridCell(0, 2)
      .find("[data-testid='tag-button-BusinessLibrary']")
      .click();

    cy.getByTestId("tagged-items-sheet")
      .should("exist")
      .find("[data-testid='tag-BusinessLibrary']")
      .should("exist")
      .contains("BusinessLibrary");

    cy.getByTestId("sheet-close-x-btn").click();

    cy.getByTestId("tagged-items-sheet").should("not.exist");

    cy.getGridCell(0, 2)
      .find("[data-testid='tag-button-BusinessLibrary']")
      .click();
    cy.getByTestId("tagged-items-sheet")
      .should("exist")
      .find("[data-testid='tag-BusinessLibrary']")
      .should("exist")
      .contains("BusinessLibrary");
  });

  it("should be able to open a different tag sheet after closing another", () => {
    cy.visit("/rule-designer/designer/functions");
    cy.getGridCell(0, 2)
      .find("[data-testid='tag-button-BusinessLibrary']")
      .click();

    cy.getByTestId("tagged-items-sheet")
      .should("exist")
      .find("[data-testid='tag-BusinessLibrary']")
      .should("exist")
      .contains("BusinessLibrary");

    cy.getByTestId("sheet-close-x-btn").click();

    cy.getGridCell(0, 2).find("[data-testid='tag-button-GCRE-123']").click();

    cy.getByTestId("tagged-items-sheet")
      .should("exist")
      .find("[data-testid='tag-GCRE-123']")
      .should("exist")
      .contains("GCRE-123");
  });

  it("should display a proper tagged items component", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );

    cy.getByTestId("tag-button-TechnicalLibrary").click();
    cy.getByTestId("tagged-items-sheet")
      .should("exist")
      .find("[data-testid='tag-TechnicalLibrary']")
      .should("exist")
      .contains("TechnicalLibrary");

    // test the grid
    testTable(
      ["Type", "Item"],
      [
        "Rule Set",
        {
          type: "link",
          value: "/rule-designer/designer/rule-sets/Batch_Activity_RS",
        },
      ],
      "taggedItemsTable",
    );
    testRow(
      1,
      ["Decision Table", "DT_MasterTableForHierarchyRootPathInstance"],
      "taggedItemsTable",
    );
    testRow(
      2,
      [
        "Table Function",
        {
          type: "link",
          value:
            "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance/function/defaultRule",
        },
      ],
      "taggedItemsTable",
    );
    testFilterShouldNotExist("taggedItemsTable");

    // test the current item is not hyperlinked
    cy.getGridCell(1, 1, "taggedItemsTable").find("a").should("not.exist");
  });

  it("should navigate to the tagged item", () => {
    cy.visit(
      "/rule-designer/designer/decision-tables/DT_MasterTableForHierarchyRootPathInstance",
    );

    cy.getByTestId("tag-button-TechnicalLibrary").click();
    clickGridRow(0, 1, 0, "taggedItemsTable");
    cy.url().should(
      "include",
      "/rule-designer/designer/rule-sets/Batch_Activity_RS",
    );
  });
});

describe("global search for tagged items", () => {
  it("should display the global search component on all screens", () => {
    cy.visit("/dashboard");
    cy.getByTestId("global-tag-search")
      .should("exist")
      .getByTestId("autocomplete-button")
      .should("exist");

    cy.visit("/rule-designer/designer/decision-tables");
    cy.getByTestId("global-tag-search")
      .should("exist")
      .getByTestId("autocomplete-button")
      .should("exist");

    cy.visit("/rule-designer/designer/main-flow");
    cy.getByTestId("global-tag-search")
      .should("exist")
      .getByTestId("autocomplete-button")
      .should("exist");

    cy.visit("/rule-designer/rule-testing/data");
    cy.getByTestId("global-tag-search")
      .should("exist")
      .getByTestId("autocomplete-button")
      .should("exist")
      .contains("Find tagged items");
  });

  it("should not display the global search component on the login screen", () => {
    cy.visit("/login");
    cy.getByTestId("global-tag-search").should("not.exist");
  });

  it("should list the recently used tags", () => {
    // initially there will be no recently used tags, so verify the empty results message is displayed
    cy.visit("/dashboard");
    cy.getByTestId("autocomplete-button").click();
    cy.getByTestId("autocomplete-scroll-area")
      .should("exist")
      .getByTestId("autocomplete-group-header")
      .should("not.exist");

    cy.getByTestId("autocomplete-no-results")
      .should("exist")
      .contains("No tags found");

    // navigate to a function and search for a couple tags so they get put in the recently used tags
    cy.visit("/rule-designer/designer/functions/CheckDecisionforEachLine");
    cy.getByTestId("tags-container").find("input").type("TechnicalLibrary");
    cy.wait(750);
    cy.getByTestId("available-tag-TechnicalLibrary").click();

    cy.getByTestId("tags-container").find("input").type("GCRE-789");
    cy.wait(750);
    cy.getByTestId("available-tag-GCRE-789").click();

    // now verify that the recently used tags show up in the global tag search
    cy.getByTestId("autocomplete-button").click();
    cy.getByTestId("autocomplete-scroll-area")
      .should("exist")
      .getByTestId("autocomplete-group-header")
      .should("exist")
      .contains("Recently Used");

    cy.getByTestId("autocomplete-item-0").should("exist").contains("GCRE-789");
    cy.getByTestId("autocomplete-item-1")
      .should("exist")
      .contains("TechnicalLibrary");
  });

  it("should search for tags", () => {
    cy.visit("/dashboard");
    cy.getByTestId("autocomplete-button").click();
    // do a partial search:
    cy.getByTestId("autocomplete-input-field").should("exist").type("Tech");
    cy.getByTestId("autocomplete-item-0")
      .should("exist")
      .contains("TechnicalLibrary");
    cy.get("body").click(0, 0, { force: true });
    cy.wait(500);

    // do a full search:
    cy.getByTestId("autocomplete-button").click();
    cy.getByTestId("autocomplete-input-field")
      .should("exist")
      .type("TechnicalLibrary");
    cy.getByTestId("autocomplete-item-0")
      .should("exist")
      .contains("TechnicalLibrary");
    cy.get("body").click(0, 0, { force: true }); // reset the search by clicking the button again
    cy.wait(500);

    // do a case-insensitive search:
    cy.getByTestId("autocomplete-button").click();
    cy.getByTestId("autocomplete-input-field")
      .should("exist")
      .type("technical");
    cy.getByTestId("autocomplete-item-0")
      .should("exist")
      .contains("TechnicalLibrary");
  });

  it("open the tagged items sheet", () => {
    cy.visit("/dashboard");
    cy.getByTestId("autocomplete-button").click();
    cy.getByTestId("autocomplete-input-field")
      .should("exist")
      .type("TechnicalLibrary");
    cy.getByTestId("autocomplete-item-0").click();

    cy.getByTestId("tagged-items-sheet")
      .should("exist")
      .find("[data-testid='tag-TechnicalLibrary']")
      .should("exist")
      .contains("TechnicalLibrary");
  });
});

describe("tagging a custom object", () => {
  beforeEach(() => {
    cy.visit("/rule-designer/configuration/custom-objects/test_123");
    cy.wait(1000);
  });

  it("should display the custom object tags", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("test1");
      });
  });

  it("should search and add a tag to the custom object", () => {
    cy.getByTestId("tags-container").find("input").type("TechnicalLibrary");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("not.exist");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find(".available-tag")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("TechnicalLibrary");
      });
    cy.getByTestId("available-tag-TechnicalLibrary").click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(2);
        expect(tags[1]).to.contain.text("TechnicalLibrary");
      });
  });

  it("should add a new tag to the custom object", () => {
    cy.getByTestId("tags-container").find("input").type('newtag"'); // testing with a double quote, which should get converted to a single quote
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(2);
        expect(tags[1]).to.contain.text("newtag");
      });
  });

  it("should remove a tag", () => {
    cy.getByTestId("tags-container").find("input").type("newtag123");
    cy.getByTestId("search-tags-list")
      .should("exist")
      .find("[data-testid='create-tag']")
      .should("exist")
      .click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(2);
      });
    cy.getByTestId("remove-tag-test1").should("exist").click();
    testIsDialogDisplayed("delete-tag-dialog-test1-dialog-container");
    cy.getByTestId("delete-tag-dialog-test1-dialog-title").contains(
      "Delete Confirmation",
    );
    cy.getByTestId("delete-tag-dialog-test1-dialog-form-container")
      .should("exist")
      .should(
        "include.text",
        "Are you sure you want to remove the tag test1 from this item?",
      );

    cy.getByTestId("delete-tag-dialog-test1-dialog-cancel-button").click();
    testDialogIsNotDisplayed("delete-tag-dialog-test1-dialog-container");
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(2);
      });
    cy.getByTestId("remove-tag-test1").should("exist").click();
    cy.getByTestId("delete-tag-dialog-test1-dialog-destructive-button").click();
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(1);
      });
    cy.getByTestId("remove-tag-test1").should("not.exist");
  });
});

describe("should not allow duplicate tags", () => {
  beforeEach(() => {
    cy.visit("/rule-designer/designer/decision-tables/TestTypes_DT");
    cy.wait(1000);
  });
  it("should not allow creating duplicate tags with different case", () => {
    cy.getByTestId("tags-list")
      .find(".tag-badge")
      .then((tags) => {
        expect(tags).to.have.length(1);
        expect(tags[0]).to.contain.text("testingtag");
      });

    // In same item, try to create tag with same name (exact match)
    cy.getByTestId("tags-container").find("input").type("testingtag");
    cy.getByTestId("search-tags-list").should("exist");
    // Should not show "Create" option since it's already selected
    cy.getByTestId("search-tags-list")
      .find("[data-testid='create-tag']")
      .should("not.exist");

    cy.getByTestId("search-tags-list")
      .should("exist")
      .should(
        "contain.text",
        "Tag already exists. Please search or add a different tag.",
      );

    // Clear the input
    cy.getByTestId("tags-container").find("input").clear();

    // In same item, try to create tag with UPPERCASE
    cy.getByTestId("tags-container").find("input").type("TESTINGTAG");
    cy.getByTestId("search-tags-list").should("exist");
    // Should not show "Create" option because it's a case-insensitive duplicate
    cy.getByTestId("search-tags-list")
      .find("[data-testid='create-tag']")
      .should("not.exist");

    // Clear the input
    cy.getByTestId("tags-container").find("input").clear();

    // In same item, try to create tag with lowercase
    cy.getByTestId("tags-container").find("input").type("testingtag");
    cy.getByTestId("search-tags-list").should("exist");
    // Should not show "Create" option because it's a duplicate
    cy.getByTestId("search-tags-list")
      .find("[data-testid='create-tag']")
      .should("not.exist");

    // Clear the input
    cy.getByTestId("tags-container").find("input").clear();

    // In same item, try to create tag with mix of Upper Case and lower Case
    cy.getByTestId("tags-container").find("input").type("testingTAG");
    cy.getByTestId("search-tags-list").should("exist");
    // Should not show "Create" option because it's a case-insensitive duplicate
    cy.getByTestId("search-tags-list")
      .find("[data-testid='create-tag']")
      .should("not.exist");

    // Now navigate to a different item (ruleset)
    cy.visit("/rule-designer/designer/rule-sets/Batch_Activity_RS");
    cy.wait(1000);

    //User trying to create tag with name all in UPPERCASE - "TESTINGTAG"
    cy.getByTestId("tags-container").find("input").type("TESTINGTAG");
    cy.getByTestId("search-tags-list").should("exist");
    // Should NOT show "Create TESTINGTAG" option
    cy.getByTestId("search-tags-list")
      .find("[data-testid='create-tag']")
      .should("not.exist");
    // Should show "testingtag" in the available tags dropdown
    cy.getByTestId("search-tags-list")
      .find(".available-tag")
      .should("exist")
      .contains("testingtag");

    // Clear the input
    cy.getByTestId("tags-container").find("input").clear();

    // User trying to create tag with name in mix of Upper Case and lower Case - "testingTAG"
    cy.getByTestId("tags-container").find("input").type("testingTAG");
    cy.getByTestId("search-tags-list").should("exist");
    // Should NOT show "Create testingTAG" option
    cy.getByTestId("search-tags-list")
      .find("[data-testid='create-tag']")
      .should("not.exist");
    // Should show "testingtag" in the available tags dropdown
    cy.getByTestId("search-tags-list")
      .find(".available-tag")
      .should("exist")
      .contains("testingtag");

    // Clear the input
    cy.getByTestId("tags-container").find("input").clear();

    // User trying to create tag with exactly same name as tag exists - "testingtag"
    cy.getByTestId("tags-container").find("input").type("testingtag");
    cy.getByTestId("search-tags-list").should("exist");
    // Should NOT show "Create testingtag" option
    cy.getByTestId("search-tags-list")
      .find("[data-testid='create-tag']")
      .should("not.exist");
    // Should show "testingtag" in the available tags dropdown
    cy.getByTestId("search-tags-list")
      .find(".available-tag")
      .should("exist")
      .contains("testingtag");
  });
});
