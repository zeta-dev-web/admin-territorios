# Implementation Plan: Export Territory History to PDF

## Overview

This implementation plan breaks down the feature into discrete coding tasks. The implementation will create a PDF export system that replicates the official S-13-S format for territory assignment history. The system will use @react-pdf/renderer for PDF generation, Next.js Server Actions for backend processing, and React components for the UI.

## Tasks

- [ ] 1. Set up project structure and install dependencies
  - Install @react-pdf/renderer library (`npm install @react-pdf/renderer`)
  - Install fast-check for property-based testing (`npm install -D fast-check`)
  - Create directory structure: `server/`, `components/pdf/`, `components/admin/`
  - Set up TypeScript types file for export data models
  - _Requirements: 2.1, 2.2_

- [ ] 2. Implement data models and types
  - [ ] 2.1 Create TypeScript interfaces for export data structures
    - Define `TerritoryExportData` interface with territoryId, territoryNumber, territoryDescription, assignments
    - Define `AssignmentExportRecord` interface with id, type, assigneeName, assignedDate, returnedDate, createdAt
    - Define `TerritoryRange` interface with start, end, label, count
    - Define `PdfExportResult` interface with success, data, filename, message
    - Create types file at `lib/types/territoryExport.ts`
    - _Requirements: 2.1, 3.3, 1.3_

  - [ ]* 2.2 Write property test for data model type safety
    - **Property 1: Territory Range Calculation**
    - **Validates: Requirements 1.3**
    - Test that calculated ranges are consecutive groups of 10
    - Test that ranges start at multiples of 10 (1-10, 11-20, etc.)

- [ ] 3. Implement server-side data retrieval
  - [ ] 3.1 Create getAvailableTerritoryRanges function
    - Query all territory numbers from database using Prisma
    - Calculate ranges of 10 consecutive territories
    - Count territories in each range
    - Return array of TerritoryRange objects
    - Location: `server/territoryExport.ts`
    - _Requirements: 1.2, 1.3, 1.6_

  - [ ]* 3.2 Write property test for range count accuracy
    - **Property 2: Range Count Accuracy**
    - **Validates: Requirements 1.6**
    - Test that displayed count equals actual territories in range

  - [ ] 3.3 Create getTerritoryHistoryForExport function
    - Query territories in specified range with Prisma includes
    - Include both Assignment and PersonalAssignment records
    - Include related driver and member names
    - Sort assignments by assignedDate ASC, then createdAt ASC
    - Transform data into TerritoryExportData format
    - Handle territories with no assignments
    - Location: `server/territoryExport.ts`
    - _Requirements: 5.1, 5.2, 6.1, 6.2_

  - [ ]* 3.4 Write property test for chronological sorting
    - **Property 14: Chronological Sorting with Tie-Breaking**
    - **Validates: Requirements 5.4, 6.1, 6.2, 6.3**
    - Test that assignments are sorted by assignedDate ascending
    - Test tie-breaking with createdAt when assignedDate is same
    - Test with mix of CONDUCTOR and PERSONAL assignments

  - [ ]* 3.5 Write property test for unified assignment types
    - **Property 13: Unified Assignment Types**
    - **Validates: Requirements 5.2, 5.5**
    - Test that both conductor and personal assignments are included
    - Test that they're combined into single chronological list

- [ ] 4. Checkpoint - Verify data retrieval logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement PDF document components
  - [ ] 5.1 Create S13SPdfDocument component
    - Import Document, Page from @react-pdf/renderer
    - Create component accepting territories and rangeLabel props
    - Implement 2-page structure (5 territories per page)
    - Render document header with title "Registro de asignación de territorio"
    - Render header fields for "Modelo: Nombre del publicador" and dates
    - Split territories array into two pages
    - Apply S-13-S styling with StyleSheet
    - Location: `components/pdf/S13SPdfDocument.tsx`
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

  - [ ]* 5.2 Write property test for two-page structure
    - **Property 6: Two-Page Structure**
    - **Validates: Requirements 2.4, 3.1**
    - Test that generated document has exactly 2 pages
    - Test that each page has 5 territory columns

  - [ ]* 5.3 Write property test for document title presence
    - **Property 4: Document Title Presence**
    - **Validates: Requirements 2.2**
    - Test that PDF contains "Registro de asignación de territorio"

  - [ ]* 5.4 Write property test for ten territory slots
    - **Property 5: Ten Territory Slots Per Document**
    - **Validates: Requirements 2.3, 2.5**
    - Test that document has exactly 10 territory column slots
    - Test with varying actual territory counts (0-10)

  - [ ] 5.5 Create TerritoryColumn component
    - Import View, Text from @react-pdf/renderer
    - Create component accepting territory prop
    - Render column header with "Núm. de terr. {number}"
    - Render assignment records in chronological order
    - Display assignee name at top of each record
    - Display assigned date (DD/MM/YYYY) at bottom-left
    - Display returned date (DD/MM/YYYY) at bottom-right if present
    - Apply column borders and spacing styles
    - Handle empty territories with empty row structures
    - Location: `components/pdf/TerritoryColumn.tsx`
    - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.5, 8.2_

  - [ ]* 5.6 Write property test for column header format
    - **Property 8: Territory Column Header Format**
    - **Validates: Requirements 3.2**
    - Test that each column header contains "Núm. de terr." + number

  - [ ]* 5.7 Write property test for all assignments included
    - **Property 9: All Assignments Included**
    - **Validates: Requirements 3.3**
    - Test that all assignment IDs appear in rendered output
    - Generate territories with random number of assignments (1-50)

  - [ ]* 5.8 Write property test for date format consistency
    - **Property 12: Date Format Consistency**
    - **Validates: Requirements 4.5**
    - Test that all dates match DD/MM/YYYY format
    - Test with random dates across wide range

  - [ ]* 5.9 Write property test for empty territory structure
    - **Property 18: Empty Territory Structure**
    - **Validates: Requirements 8.2**
    - Test that territories with no assignments have header and empty rows

- [ ] 6. Implement PDF styling
  - [ ] 6.1 Create StyleSheet for S-13-S format
    - Define page styles (A4 portrait, 10mm margins)
    - Define header styles (20mm height, title 16pt bold)
    - Define column styles (20% width, borders)
    - Define column header styles (10pt bold, centered, background)
    - Define assignment row styles (8pt name, 7pt dates)
    - Define border specifications (1pt columns, 0.5pt rows)
    - Set Helvetica font family throughout
    - Location: Within `components/pdf/S13SPdfDocument.tsx`
    - _Requirements: 2.7, 3.5, 3.6, 4.6_

- [ ] 7. Checkpoint - Verify PDF rendering logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement server action for PDF generation
  - [ ] 8.1 Create exportTerritoryHistoryPdf server action
    - Mark function with 'use server' directive
    - Accept startNumber and endNumber parameters
    - Validate range (1-10 territories, startNumber <= endNumber)
    - Call getTerritoryHistoryForExport to fetch data
    - Pad territories array to 10 if less than 10
    - Instantiate S13SPdfDocument with territory data
    - Use renderToBuffer from @react-pdf/renderer
    - Generate filename with format "S-13-S_Territorios_{start}-{end}.pdf"
    - Return PdfExportResult with success, data buffer, filename
    - Implement error handling with try-catch
    - Log errors to console with context
    - Location: `server/territoryExport.ts`
    - _Requirements: 2.1, 7.1, 7.2, 7.4, 10.2_

  - [ ]* 8.2 Write property test for PDF generation success
    - **Property 3: PDF Generation Success**
    - **Validates: Requirements 2.1**
    - Test that valid inputs produce valid PDF buffer
    - Check PDF magic bytes (%PDF)

  - [ ]* 8.3 Write property test for filename format
    - **Property 15: Filename Format**
    - **Validates: Requirements 7.2**
    - Test filename matches pattern "S-13-S_Territorios_\d+-\d+\.pdf"
    - Test with various range inputs

  - [ ]* 8.4 Write property test for MIME type
    - **Property 17: PDF MIME Type**
    - **Validates: Requirements 7.4**
    - Test that response has correct MIME type "application/pdf"

  - [ ]* 8.5 Write unit tests for validation logic
    - Test valid ranges pass validation
    - Test invalid ranges fail (reversed, too large, negative)
    - Test boundary conditions (exactly 10 territories)

  - [ ]* 8.6 Write unit tests for error handling
    - Test database query failure handling
    - Test PDF generation failure handling
    - Test that errors return appropriate error messages
    - Test that errors are logged

- [ ] 9. Implement client-side UI components
  - [ ] 9.1 Create ExportPdfButton component
    - Mark with 'use client' directive
    - Accept availableRanges prop
    - Render button with FileDown icon and "Exportar a PDF" text
    - Manage modal open/close state
    - Handle loading state during PDF generation
    - Display error messages if generation fails
    - Location: `components/admin/ExportPdfButton.tsx`
    - _Requirements: 1.1, 9.1_

  - [ ] 9.2 Create ExportRangeModal component
    - Mark with 'use client' directive
    - Accept isOpen, onClose, availableRanges, onExport props
    - Render modal dialog with range selection UI
    - Display checkboxes for each available range with counts
    - Implement multi-select functionality
    - Show validation error if no ranges selected
    - Display "Generar PDF" confirmation button
    - Show progress indicator during generation
    - Auto-close modal on successful export
    - Location: `components/admin/ExportRangeModal.tsx`
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ] 9.3 Implement PDF download logic in modal
    - Create downloadPdf helper function
    - Convert Uint8Array to Blob with type "application/pdf"
    - Create object URL from blob
    - Create temporary anchor element with download attribute
    - Trigger click to download
    - Clean up: remove element and revoke URL
    - Handle multiple range downloads sequentially
    - Location: Within `components/admin/ExportRangeModal.tsx`
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ]* 9.4 Write property test for multiple range separation
    - **Property 16: Multiple Range Separation**
    - **Validates: Requirements 7.3**
    - Test that number of generated PDFs equals number of selected ranges
    - Generate 2-5 random range selections

  - [ ]* 9.5 Write unit tests for UI validation
    - Test that no selection shows validation error
    - Test that valid selection enables generate button
    - Test that modal closes after successful export

- [ ] 10. Integrate export UI into History page
  - [ ] 10.1 Add ExportPdfButton to History page
    - Import ExportPdfButton component
    - Call getAvailableTerritoryRanges in server component
    - Pass availableRanges as prop to ExportPdfButton
    - Position button prominently in page header
    - Handle case when no territories exist (show informative message)
    - Location: `app/admin/history/page.tsx`
    - _Requirements: 1.1, 1.5, 10.1_

  - [ ]* 10.2 Write property test for complete range inclusion
    - **Property 19: Complete Range Inclusion**
    - **Validates: Requirements 8.3**
    - Test that all territory numbers in range appear in output
    - Test with ranges where some territories have no data

- [ ] 11. Implement comprehensive error handling
  - [ ] 11.1 Add client-side error handling
    - Wrap server action calls in try-catch
    - Display user-friendly error messages in modal
    - Handle network timeouts gracefully
    - Allow retry after errors
    - Location: `components/admin/ExportRangeModal.tsx`
    - _Requirements: 10.2, 10.5_

  - [ ] 11.2 Add server-side error handling and logging
    - Catch database query errors with specific messages
    - Catch PDF generation errors with context logging
    - Log all errors to console with timestamps and input data
    - Return generic error messages to client (no stack traces)
    - Location: `server/territoryExport.ts`
    - _Requirements: 10.2, 10.3, 10.4_

  - [ ]* 11.3 Write integration tests for error scenarios
    - Test behavior when database query fails
    - Test behavior when PDF generation fails
    - Test behavior with invalid range parameters
    - Verify error messages are appropriate

- [ ] 12. Final checkpoint - Integration testing and verification
  - [ ] 12.1 Manual testing checklist
    - Test export with single range selection
    - Test export with multiple range selections
    - Test with territories that have no assignments
    - Test with territories that have many assignments (50+)
    - Test with special characters in names (accents, ñ)
    - Verify PDF downloads correctly in browser
    - Print PDF to verify physical layout matches S-13-S format
    - Test error handling with no territories in system
    - Test validation when no ranges selected
    - Verify all dates display in DD/MM/YYYY format
    - _Requirements: All_

  - [ ] 12.2 Run all property-based tests
    - Execute all property tests with 100 iterations minimum
    - Verify all 19 properties pass
    - Document any edge cases discovered
    - Fix any issues found

  - [ ] 12.3 Visual comparison with S-13-S format
    - Generate sample PDF with test data
    - Compare layout with official S-13-S form
    - Verify typography (fonts, sizes, weights)
    - Verify spacing and margins
    - Verify borders and column widths
    - Verify header content and positioning

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key stages
- Property tests validate universal correctness properties from design
- Unit tests validate specific examples and edge cases
- The PDF library @react-pdf/renderer uses JSX syntax similar to React
- Server actions provide secure server-side processing with automatic CSRF protection
- All property tests should use fast-check with minimum 100 iterations
- Date formatting must consistently use DD/MM/YYYY format throughout
- PDF generation is synchronous and happens in memory (no file storage)
- Multiple range exports are processed sequentially to avoid memory issues

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["5.1", "5.5", "6.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.6", "5.7", "5.8", "5.9"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 8, "tasks": ["9.1", "9.2"] },
    { "id": 9, "tasks": ["9.3", "9.4", "9.5"] },
    { "id": 10, "tasks": ["10.1", "10.2"] },
    { "id": 11, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 12, "tasks": ["12.1", "12.2", "12.3"] }
  ]
}
```
