/**
 * We are really only able to test the provisioning page redirects to the dashboard. Since we are
 * not able to mock the session object, we are unable to fully test the provisioning process itself.
 */
//skipping this test as it is there is no implementation for provisioning prompt
describe.skip("provisioning", () => {
  it("should redirect to the dashboard after provisioning", () => {
    cy.visit("/provisioning");
    cy.getByTestId("provisionSuccess")
      .should("exist")
      .contains("Your environment is ready");
    cy.url({ timeout: 10000 }).should("include", "/dashboard");
  });
});
