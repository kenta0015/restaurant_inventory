describe('在庫登録の一連フロー', () => {
  it('新しい材料を追加できること', () => {
    cy.visit('/inventory');
    cy.contains('Inventory List').should('be.visible');

    cy.get('[data-testid="add-button"]').click();
    cy.get('[data-testid="ingredient-name"]').type('玉ねぎ');
    cy.get('[data-testid="ingredient-quantity"]').type('5');
    cy.get('[data-testid="submit-button"]').click();

    cy.contains('玉ねぎ').should('be.visible');
  });
});
