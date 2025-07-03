describe('Inventory Screen', () => {
  it('Inventoryという文字が表示されること', () => {
    cy.visit('/inventory');
    cy.contains('Inventory').should('be.visible');
  });
});
