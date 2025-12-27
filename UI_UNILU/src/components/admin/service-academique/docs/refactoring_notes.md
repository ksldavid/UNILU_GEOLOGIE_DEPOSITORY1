
# Inscription Manager Refactoring

## Changes
- **Unified Academic Staff Roles**: "Professeur" and "Assistant" roles have been unified in the UI under the label "Corps Académique".
  - **Badges**: Both roles now display a "Corps Académique" badge.
  - **Filters**: The filter dropdown now shows "Corps Académique" instead of separate options, filtering for both roles.
  - **User Creation**: The "Add User" modal now presents a single "Corps Académique" option which leads to the staff creation form.

## Rationale
- Simplified the user management interface by grouping all academic staff under a single professional category while maintaining internal distinctions where necessary (e.g. tracking specific titles).

## Verification
- Check the filter dropdown for "Corps Académique".
- Verify that filtering selects both professors and assistants.
- Check the "Add User" modal for the unified button.
- Verify badges on the list view.
