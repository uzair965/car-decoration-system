# Walkthrough: Dynamic ERP Attribute System & Seeding 🚗

We have fully implemented the dynamic subcategory attributes templates, expanded the product types, and pre-seeded a clean testing environment for AutoERP:

## 1. Clean Testing Environment
*   **Database Cleanup**: Executed a script clearing all previous dummy sales history, purchases, expense logs, products, and customers.
*   **Default Main Categories Seeding**: Seeded the database with the exact 13 default categories requested:
    1. Interior Accessories
    2. Exterior Accessories
    3. Lighting
    4. Audio & Multimedia
    5. Electronics
    6. Car Care
    7. Security & Safety
    8. Wheels & Tyres
    9. Performance Parts
    10. Vehicle Protection
    11. Services
    12. General Accessories
    13. Others
*   **Settings Cleanup Trigger**: Added a **Clean System Data** button inside System Settings. Admins can click it at any time to wipe data back to this clean-seed state.

## 2. Subcategory & Attribute Template Builder
*   **Category Management Extension**: When editing any category (`CategoryFormPage`), a new tab/section is unlocked: **Subcategories & Attribute Templates**.
*   **Visual Attribute Builder**: Inside the subcategory editor, admins can define custom specifications. Attributes support:
    - Types: `Text`, `Number`, `Dropdown`, `Yes/No`, `Date`.
    - Dropdown Options: A simple comma-separated string for dynamic lists.
    - Drag-and-drop / ordering arrow controls to re-order attributes.
*   **Template Syncing Transaction**: Updates run in a single transaction that deletes, updates, or creates attributes depending on IDs, ensuring absolute integrity.

## 3. Dynamic Product Form Rendering
*   **Product Type Selection**: Added a **Product Type** selector in `ProductFormPage` with three options:
    - **Universal**: Hides vehicle details.
    - **Vehicle Specific**: Displays compatibility inputs (Vehicle Brand, Vehicle Model, Year From, Year To).
    - **Service**: Hides vehicle details, low stock alerts, current stock, and barcodes.
*   **Dynamic Specifications Render**: When a category and subcategory are chosen:
    - The form fetches the subcategory's attributes template and renders matching inputs in a dedicated **Specifications** section.
    - Standardizes unit values for currency to Pakistani Rupees (`Rs. `) to match POS/purchases layout.
